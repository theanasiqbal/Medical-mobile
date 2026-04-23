import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { validate } from '../middleware/validate';
import { deriveOTP, verifyOTP, getCurrentWindow } from '../services/otp.service';
import { sendSMS, buildOtpMessage } from '../services/sms.service';

export const authRouter = Router();

// ─── Supabase Admin Client (bypasses RLS — only for auth ops) ───────────────
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────
const phoneSchema = z.object({
  // Accepts +91XXXXXXXXXX (Indian) — extend the regex for international numbers later
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Phone must be a valid Indian number in E.164 format (+91XXXXXXXXXX)'),
});

const verifySchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'Invalid phone number'),
  otp: z
    .string()
    .length(4, 'OTP must be exactly 4 digits')
    .regex(/^\d{4}$/, 'OTP must contain only digits'),
});

// ─── POST /auth/send-otp ─────────────────────────────────────────────────────
authRouter.post('/send-otp', validate(phoneSchema), async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body as z.infer<typeof phoneSchema>;
  const supabase = getSupabase();

  try {
    // 1. Fetch existing patient for rate-limit check
    const { data: existing } = await supabase
      .from('patients')
      .select('id, last_otp_sent_at')
      .eq('phone', phone)
      .maybeSingle();

    // 2. Rate limit — block if OTP sent within last 60 seconds
    if (existing?.last_otp_sent_at) {
      const lastSent = new Date(existing.last_otp_sent_at).getTime();
      const secondsElapsed = (Date.now() - lastSent) / 1000;
      if (secondsElapsed < 60) {
        const retryAfter = Math.ceil(60 - secondsElapsed);
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: `Please wait ${retryAfter}s before requesting another OTP`,
          retryAfter,
        });
        return;
      }
    }

    // 3. Upsert patient row — creates record if first time, updates timestamp otherwise
    const { error: upsertError } = await supabase
      .from('patients')
      .upsert(
        { phone, last_otp_sent_at: new Date().toISOString() },
        { onConflict: 'phone' }
      );

    if (upsertError) {
      console.error('[send-otp] Supabase upsert error:', upsertError);
      res.status(500).json({ success: false, error: 'Database error' });
      return;
    }

    // 4. Derive OTP (never stored — purely computed from phone + time window)
    const otp = deriveOTP(phone);

    // 5. Send SMS
    await sendSMS(phone, buildOtpMessage(otp));

    console.log(`[send-otp] OTP sent to ${phone.slice(0, 6)}*** (OTP: ${otp})`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    console.error('[send-otp] Unexpected error:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// ─── POST /auth/verify-otp ───────────────────────────────────────────────────
authRouter.post('/verify-otp', validate(verifySchema), async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body as z.infer<typeof verifySchema>;
  const supabase = getSupabase();

  try {
    // 1. Verify OTP against current time window (timing-safe comparison)
    const isValid = verifyOTP(phone, otp);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid OTP',
        message: 'The code you entered is incorrect. Please try again.',
      });
      return;
    }

    // 2. Fetch patient row for replay check
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('id, name, otp_used_window, created_at')
      .eq('phone', phone)
      .maybeSingle();

    if (fetchError || !patient) {
      console.error('[verify-otp] Patient not found after OTP check:', fetchError);
      res.status(404).json({
        success: false,
        error: 'Patient record not found. Please request a new OTP.',
      });
      return;
    }

    // 3. Replay attack check — reject if this exact time window was already used
    const currentWindow = getCurrentWindow();
    if (patient.otp_used_window !== null && patient.otp_used_window === currentWindow) {
      res.status(409).json({
        success: false,
        error: 'OTP already used',
        message: 'This code has already been used. Please request a new OTP.',
      });
      return;
    }

    // 4. Mark this window as used (one-time flag — prevents replay)
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        otp_used_window: currentWindow,
        otp_used_at: new Date().toISOString(),
      })
      .eq('id', patient.id);

    if (updateError) {
      console.error('[verify-otp] Failed to update otp_used_window:', updateError);
      res.status(500).json({ success: false, error: 'Database error' });
      return;
    }

    // 5. Determine if this is a new user
    // A user is "New" if they have never used an OTP window OR haven't filled их name yet
    const isNewUser = patient.otp_used_window === null || !patient.name;

    console.log(`[verify-otp] Processing ${phone} | isNewUser: ${isNewUser} (window: ${patient.otp_used_window}, name: ${patient.name})`);

    // 6. Issue JWT (30-day expiry)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

    const token = jwt.sign(
      { sub: patient.id, phone },
      jwtSecret,
      { expiresIn: '30d', issuer: 'medical-app' }
    );

    console.log(`[verify-otp] Login success for ${phone.slice(0, 6)}***. New user: ${isNewUser}`);

    res.status(200).json({
      success: true,
      token,
      isNewUser,
    });
  } catch (err) {
    console.error('[verify-otp] Unexpected error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});
