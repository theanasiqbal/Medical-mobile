import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const reportsRouter = Router();

// Configure multer to read files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    console.log(`[Multer] Received file: ${file.originalname}, mimetype: ${file.mimetype}`);
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`));
    }
  },
});

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * GET /reports
 * Fetch all reports for the current auth'd patient
 */
reportsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const patientId = req.patientId;
  if (!patientId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, reports: data });
  } catch (err: any) {
    console.error('[GET /reports] error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

/**
 * POST /reports/upload
 * Handle file upload, push to Storage, write to DB
 */
reportsRouter.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const patientId = req.patientId;
  const { category, type, date } = req.body;
  const file = req.file;

  if (!patientId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  if (!file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }
  if (!category || !type) {
    return res.status(400).json({ success: false, error: 'Category and type are required' });
  }

  const supabase = getSupabase();
  const fileExt = file.originalname.split('.').pop() || '';
  const newFileName = `${patientId}/${crypto.randomUUID()}.${fileExt}`;

  try {
    // 1. Upload to Supabase Storage Bucket 'reports'
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(newFileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('reports')
      .getPublicUrl(newFileName);

    // 3. Save to `reports` table
    const id = crypto.randomUUID();
    const finalDate = date || new Date().toISOString().split('T')[0];

    // Using mapping for DB -> the app calls category "type" and uses "path".
    // According to table: id, patient_id, type, name, date, path
    const { data, error: dbError } = await supabase
      .from('reports')
      .insert({
        id,
        patient_id: patientId,
        type: category, // Restoring this line to fix NOT NULL constraint
        name: type,     // mapping 'type' from frontend to 'name' in DB (e.g., "Full Blood Work")
        date: finalDate,
        path: publicUrlData.publicUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json({ success: true, report: data });
  } catch (err: any) {
    console.error('[POST /reports/upload] error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to upload report' });
  }
});
