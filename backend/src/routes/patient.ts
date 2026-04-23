import { Router, Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';

export const patientRouter = Router();

// ─── Supabase Admin Client ──────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Validation Schema ───────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(5, 'Address is too short').max(500),
});

/**
 * PUT /patient/profile
 * Updates the basic profile information for the authenticated patient.
 */
patientRouter.put(
  '/profile',
  authMiddleware,
  validate(profileSchema),
  async (req: AuthRequest, res: Response) => {
    const { name, age, gender, address } = req.body;
    const patientId = req.patientId;

    if (!patientId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const supabase = getSupabase();

    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name,
          age,
          gender,
          address,
          updated_at: new Date().toISOString(),
          diagnosis: 'OPD Consultation',
        })
        .eq('id', patientId);

      if (error) {
        console.error('[profileUpdate] Supabase error:', error);
        return res.status(500).json({ success: false, error: 'Database update failed' });
      }

      console.log(`[profileUpdate] Success for patient ID: ${patientId}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (err) {
      console.error('[profileUpdate] Unexpected error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * GET /patient/profile
 * Retrieves the basic profile information for the authenticated patient.
 */
patientRouter.get(
  '/profile',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const patientId = req.patientId;

    if (!patientId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, age, gender, address, phone')
        .eq('id', patientId)
        .maybeSingle();

      if (error || !data) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      res.status(200).json({
        success: true,
        profile: data,
      });
    } catch (err) {
      console.error('[profileGet] Unexpected error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * PATCH /patient/push-token
 * Updates the expo push notification token for the authenticated patient.
 */
patientRouter.patch(
  '/push-token',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { expo_push_token } = req.body;
    const patientId = req.patientId;

    if (!patientId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    if (!expo_push_token) {
      return res.status(400).json({ success: false, error: 'Push token required' });
    }

    const supabase = getSupabase();

    try {
      const { error } = await supabase
        .from('patients')
        .update({ expo_push_token })
        .eq('id', patientId);

      if (error) {
        console.error('[push-token] Supabase error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update push token' });
      }

      res.status(200).json({ success: true, message: 'Push token updated' });
    } catch (err) {
      console.error('[push-token] Unexpected error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

