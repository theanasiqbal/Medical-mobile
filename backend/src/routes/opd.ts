import { Router, Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { createClient } from '@supabase/supabase-js';

export const opdRouter = Router();

function getConfig() {
  const baseURL = process.env.OPD_BASE_URL ?? 'https://doctor-appointment-portal-omega.vercel.app';
  const apiKey = process.env.OPD_API_KEY ?? 'pdoctor-portal-secure-2026';
  return { baseURL, apiKey };
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// We accept uploads from the mobile app and forward them.
const upload = multer({ storage: multer.memoryStorage() });

// GET /opd/doctors -> proxies /api/doctors
opdRouter.get('/doctors', async (_req: Request, res: Response) => {
  const { baseURL } = getConfig();
  try {
    const r = await fetch(`${baseURL}/api/doctors`);
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      res.status(r.status).json({ success: false, error: data?.error ?? 'Failed to fetch doctors' });
      return;
    }
    res.json(data);
  } catch (e) {
    console.error('[opd/doctors] error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
  }
});

// POST /opd/opd-online -> proxies /api/opd-online
opdRouter.post('/opd-online', async (req: Request, res: Response) => {
  const { baseURL, apiKey } = getConfig();
  try {
    const r = await fetch(`${baseURL}/api/opd-online`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(req.body ?? {}),
    });
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    console.error('[opd/opd-online] error', e);
    res.status(500).json({ success: false, error: 'Failed to book appointment' });
  }
});

// POST /opd/upload -> proxies /api/opd-online/upload
opdRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const { baseURL, apiKey } = getConfig();
  try {
    const file = (req as any).file as any;
    if (!file) {
      res.status(400).json({ success: false, error: 'Missing file' });
      return;
    }

    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    if (req.body?.patientId) form.append('patientId', String(req.body.patientId));
    if (req.body?.bucket) form.append('bucket', String(req.body.bucket));

    const r = await fetch(`${baseURL}/api/opd-online/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        ...form.getHeaders(),
      },
      body: form as any,
    });

    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    console.error('[opd/upload] error', e);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

// Optional passthroughs used by the old client:
opdRouter.get('/opd-online', async (req: Request, res: Response) => {
  const { baseURL, apiKey } = getConfig();
  try {
    const params = new URLSearchParams(req.query as any).toString();
    const r = await fetch(`${baseURL}/api/opd-online${params ? `?${params}` : ''}`, {
      headers: { 'x-api-key': apiKey },
    });
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    console.error('[opd/opd-online GET] error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

opdRouter.get('/appointments/uccn/:citizenId', async (req: Request, res: Response) => {
  const { baseURL, apiKey } = getConfig();
  try {
    const r = await fetch(`${baseURL}/api/appointments/uccn/${encodeURIComponent(req.params.citizenId)}`, {
      headers: { 'x-api-key': apiKey },
    });
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    console.error('[opd/appointments uccn] error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

opdRouter.get('/imaging/uccn/:citizenId', async (req: Request, res: Response) => {
  const { baseURL } = getConfig();
  try {
    const r = await fetch(`${baseURL}/api/imaging/uccn/${encodeURIComponent(req.params.citizenId)}`);
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    console.error('[opd/imaging uccn] error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch imaging' });
  }
});

opdRouter.get('/medical-records/uccn/:citizenId', async (req: Request, res: Response) => {
  const { baseURL } = getConfig();
  try {
    const r = await fetch(`${baseURL}/api/medical-records/uccn/${encodeURIComponent(req.params.citizenId)}`);
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    console.error('[opd/medical-records uccn] error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch medical records' });
  }
});

opdRouter.get('/prescriptions/uccn/:citizenId', async (req: Request, res: Response) => {
  const { baseURL } = getConfig();
  try {
    const r = await fetch(`${baseURL}/api/prescriptions/uccn/${encodeURIComponent(req.params.citizenId)}`);
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    console.error('[opd/prescriptions uccn] error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch prescriptions' });
  }
});

// ─── NEW: POST /opd/appointments/emergency ────────────────────────────────────
// Creates an emergency appointment with status 'Pending' awaiting doctor approval.
opdRouter.post('/appointments/emergency', async (req: Request, res: Response) => {
  const {
    patientName, citizenId, phone, age, gender, address,
    doctorId, doctorName, specialty, hospitalId, notes,
    medicalReports, prescriptions, imaging
  } = req.body;

  if (!citizenId || !doctorId) {
    return res.status(400).json({ success: false, error: 'citizenId and doctorId are required' });
  }

  try {
    const supabase = getSupabaseClient();

    // Generate simple ID like the portal does
    const id = Date.now().toString();

    // Format today's date YYYY-MM-DD in IST
    const now = new Date();
    const istNow = new Date(now.getTime() + 5.5 * 3600000);
    const dateStr = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, "0")}-${String(istNow.getUTCDate()).padStart(2, "0")}`;

    const appointment = {
      id,
      patient_name: patientName,
      patient_id: citizenId,
      date: dateStr,
      time: null, // No time slot for emergency until doctor accepts/or immediate
      doctor: doctorName,
      specialty: specialty,
      type: 'Emergency',
      status: 'Pending',
      phone: phone,
      notes: (notes || '') + ' [Booked From MOBILE APP]',
      unique_citizen_card_number: citizenId,
      hospital_id: hospitalId || null,
      doctor_id: String(doctorId),
    };

    const { data, error } = await supabase.from('appointments').insert([appointment]).select().single();

    if (error) {
      console.error('[opd/emergency] Supabase insert error:', error);
      return res.status(500).json({ success: false, error: 'Database insert failed' });
    }

    res.json({ success: true, message: 'Emergency request sent', appointment: data });
  } catch (e) {
    console.error('[opd/emergency] error', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

import { sendPushNotification } from '../utils/notifications.js';

// ─── NEW: PATCH /opd/appointments/:id/approve-emergency ───────────────────────
// Doctor approves the emergency request. Sends a push notification to the patient.
opdRouter.patch('/appointments/:id/approve-emergency', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseClient();

    // 1. Get appointment and patient's push token
    const { data: appt, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(expo_push_token)')
      .eq('id', id)
      .single();

    if (fetchError || !appt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // 2. Update status to 'Awaiting Payment'
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'Awaiting Payment',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[opd/approve] Supabase update error:', error);
      return res.status(500).json({ success: false, error: 'Update failed' });
    }

    // 3. Send notification if token exists
    const patientToken = (appt.patients as any)?.expo_push_token;
    console.log(`[Push] Attempting to send to patient token: ${patientToken || 'NOT FOUND'}`);

    if (patientToken) {
      const sent = await sendPushNotification(
        patientToken,
        'Emergency Approved! 🏥',
        `Doctor ${appt.doctor} has accepted your request. Please proceed to payment.`,
        { appointmentId: id, screen: 'appointments' }
      );
      console.log(`[Push] Notification sent status: ${sent}`);
    }

    res.json({ success: true, appointment: data });
  } catch (e) {
    console.error('[opd/approve] error', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── NEW: PATCH /opd/appointments/:id/pay ─────────────────────────────────────
// Called from the frontend after the patient successfully processes payment.
opdRouter.patch('/appointments/:id/pay', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { patientId, feePaid, paymentMethod } = req.body;

  if (!patientId) {
    return res.status(400).json({ success: false, error: 'Missing patientId' });
  }

  try {
    const supabase = getSupabaseClient();

    // Ownership check
    const { data: appt, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !appt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    if (appt.patient_id !== patientId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // We only expect 'Approved' emergency appointments to be paid, but we allow 'Scheduled' just in case.
    if (appt.status?.toLowerCase() === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Appointment is cancelled' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'Scheduled',
        updated_at: new Date().toISOString()
        // Here you would also log feePaid and paymentMethod into an transactions table or add columns to appointments!
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[opd/pay] Supabase error:', error);
      return res.status(500).json({ success: false, error: 'Failed to process payment status' });
    }

    // NEW: Store notification for the doctor
    const notificationTitle = "Payment Received! 💰";
    const notificationBody = `Emergency payment confirmed for ${data.patient_name || 'Patient'}. You can now start the session.`;
    
    await supabase.from('notifications').insert([{
        user_id: String(data.doctor_id),
        target_type: 'doctor',
        title: notificationTitle,
        body: notificationBody,
        data: { appointmentId: id, patientName: data.patient_name }
    }]);

    res.json({ success: true, appointment: data });
  } catch (e) {
    console.error('[opd/pay] error', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── NEW: GET /opd/booked-slots?doctorId=xxx&date=2026-04-22 ──────────────────
// Returns the list of already-booked time strings for a doctor on a given date.
// Cancelled appointments are excluded so their slots become available again.
opdRouter.get('/booked-slots', async (req: Request, res: Response) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    res.status(400).json({ success: false, error: 'Missing doctorId or date query params' });
    return;
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('time')
      .eq('doctor_id', String(doctorId))
      .eq('date', String(date))
      .not('status', 'ilike', 'cancelled');

    if (error) {
      console.error('[opd/booked-slots] Supabase error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch booked slots' });
      return;
    }

    const bookedSlots: string[] = (data ?? [])
      .map((r: any) => r.time)
      .filter(Boolean);

    res.json({ success: true, bookedSlots });
  } catch (e) {
    console.error('[opd/booked-slots] error', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── NEW: PATCH /opd/appointments/:id/cancel ──────────────────────────────────
// Allows a patient to cancel their own appointment.
// Verifies patient ownership before updating.
opdRouter.patch('/appointments/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { patientId } = req.body;

  if (!patientId) {
    res.status(400).json({ success: false, error: 'Missing patientId' });
    return;
  }

  try {
    const supabase = getSupabaseClient();

    // Ownership check
    const { data: appt, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !appt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    if (appt.patient_id !== patientId) {
      res.status(403).json({ success: false, error: 'Not authorized to cancel this appointment' });
      return;
    }
    if (appt.status?.toLowerCase() === 'cancelled') {
      res.status(400).json({ success: false, error: 'Appointment is already cancelled' });
      return;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[opd/cancel] Supabase error:', error);
      res.status(500).json({ success: false, error: 'Failed to cancel appointment' });
      return;
    }

    res.json({ success: true, appointment: data });
  } catch (e) {
    console.error('[opd/cancel] error', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── NEW: POST /opd/appointments/:id/reschedule ───────────────────────────────
// Patient requests a reschedule. Stores requested date/time and sets
// reschedule_status to 'pending' for the doctor to approve/reject.
opdRouter.post('/appointments/:id/reschedule', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { patientId, newDate, newTime } = req.body;

  if (!patientId || !newDate || !newTime) {
    res.status(400).json({ success: false, error: 'Missing patientId, newDate, or newTime' });
    return;
  }

  try {
    const supabase = getSupabaseClient();

    // Ownership + state check
    const { data: appt, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id, status, reschedule_status, reschedule_used')
      .eq('id', id)
      .single();

    if (fetchError || !appt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    if (appt.patient_id !== patientId) {
      res.status(403).json({ success: false, error: 'Not authorized to reschedule this appointment' });
      return;
    }
    if (appt.status?.toLowerCase() === 'cancelled') {
      res.status(400).json({ success: false, error: 'Cannot reschedule a cancelled appointment' });
      return;
    }
    if (appt.reschedule_used === true) {
      res.status(400).json({ success: false, error: 'You have already used your one-time reschedule for this appointment' });
      return;
    }
    if (appt.reschedule_status === 'pending') {
      res.status(400).json({ success: false, error: 'A reschedule request is already pending for this appointment' });
      return;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        reschedule_requested_date: newDate,
        reschedule_requested_time: newTime,
        reschedule_status: 'pending',
        reschedule_used: true,          // permanently mark: one-time limit consumed
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[opd/reschedule] Supabase error:', error);
      res.status(500).json({ success: false, error: 'Failed to submit reschedule request' });
      return;
    }

    res.json({
      success: true,
      message: 'Reschedule request sent to your doctor for approval',
      appointment: data,
    });
  } catch (e) {
    console.error('[opd/reschedule] error', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
