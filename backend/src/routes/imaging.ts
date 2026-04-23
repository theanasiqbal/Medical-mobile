import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const imagingRouter = Router();

// Configure multer to read files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed for imaging.`));
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
 * GET /imaging
 * Fetch all imaging studies for the current patient
 */
imagingRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const patientId = req.patientId;
  if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const supabase = getSupabase();
  try {
    const { data: studyList, error } = await supabase
      .from('imagingstudies')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const studies = studyList || [];

    // 1. Identify paths that need signing (e.g., patients/userId/filename.png)
    const pathsToSign = studies
      .filter(s => s.thumbnail && s.thumbnail.startsWith('/api/storage/uploads/'))
      .map(s => s.thumbnail.replace('/api/storage/uploads/', ''));

    let signedUrlMap: Record<string, string> = {};

    if (pathsToSign.length > 0) {
      // 2. Batch request signed URLs (7 days expiry)
      const { data: signedData, error: signError } = await supabase.storage
        .from('uploads')
        .createSignedUrls(pathsToSign, 3600 * 24 * 7);

      if (!signError && signedData) {
        signedData.forEach(item => {
          if (item.signedUrl) {
            const dbPath = `/api/storage/uploads/${item.path}`;
            signedUrlMap[dbPath] = item.signedUrl;
          }
        });
      }
    }

    // 3. Map signed URLs back to studies
    const transformedStudies = studies.map(s => {
      if (s.thumbnail && signedUrlMap[s.thumbnail]) {
        return { ...s, thumbnail: signedUrlMap[s.thumbnail] };
      }
      return s;
    });

    res.json({ success: true, studies: transformedStudies });
  } catch (err: any) {
    console.error('[GET /imaging] error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch imaging studies' });
  }
});

/**
 * POST /imaging/upload
 * Handle imaging study upload
 */
imagingRouter.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const patientId = req.patientId;
  const { body_part, modality, report_id, study_type } = req.body;
  const file = req.file;

  if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!file) return res.status(400).json({ success: false, error: 'No file provided' });

  const supabase = getSupabase();
  const timestamp = Date.now();
  const sanitizedFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
  const fileName = `${timestamp}-${sanitizedFileName}`;
  const storagePath = `patients/${patientId}/${fileName}`;

  try {
    // 1. Upload to Supabase Storage Bucket 'uploads' (as per opd.ts reference)
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2. Construct the thumbnail path as requested
    // Format: /api/storage/uploads/patients/8787/1776335073677-474739505-images.jfif
    const thumbnailPath = `/api/storage/uploads/${storagePath}`;

    // 3. Fetch patient info for optional fields
    const { data: patient } = await supabase
      .from('patients')
      .select('name')
      .eq('id', patientId)
      .single();

    const now = new Date();
    const insertData = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      patient_name: patient?.name || null,
      study_type: study_type || 'X-Ray',
      body_part: body_part || null,
      modality: modality || null,
      date: now.toISOString().split('T')[0],
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear().toString(),
      thumbnail: thumbnailPath,
      report_id: report_id || null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data, error: dbError } = await supabase
      .from('imagingstudies')
      .insert(insertData)
      .select()
      .single();

    if (dbError) throw dbError;

    // Get a signed URL for the immediate response
    const { data: signedData } = await supabase.storage
      .from('uploads')
      .createSignedUrl(storagePath, 3600 * 24 * 7);

    res.status(201).json({ 
      success: true, 
      study: { 
        ...data, 
        thumbnail: signedData?.signedUrl || data.thumbnail 
      } 
    });
  } catch (err: any) {
    console.error('[POST /imaging/upload] error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to upload imaging study' });
  }
});

/**
 * POST /imaging/attach
 * Attach an existing study to a report
 */
imagingRouter.post('/attach', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { studyId, reportId } = req.body;
  if (!studyId || !reportId) return res.status(400).json({ success: false, error: 'Study ID and Report ID are required' });

  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('imagingstudies')
      .update({ report_id: reportId, updated_at: new Date().toISOString() })
      .eq('id', studyId)
      .select()
      .single();

    if (error) throw error;

    // Get signed URL for the updated study
    let thumbnail = data.thumbnail;
    if (thumbnail && thumbnail.startsWith('/api/storage/uploads/')) {
      const path = thumbnail.replace('/api/storage/uploads/', '');
      const { data: signedData } = await supabase.storage
        .from('uploads')
        .createSignedUrl(path, 3600 * 24 * 7);
      if (signedData?.signedUrl) thumbnail = signedData.signedUrl;
    }

    res.json({ success: true, study: { ...data, thumbnail } });
  } catch (err: any) {
    console.error('[POST /imaging/attach] error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to attach study to report' });
  }
});

/**
 * POST /imaging/:id/summarize
 * Get AI summary for an imaging study using MedGemma
 */
imagingRouter.post('/:id/summarize', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const patientId = req.patientId;
  const modalUrl = process.env.MEDGEMMA_URL;

  if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!modalUrl) return res.status(500).json({ success: false, error: 'AI Service (MedGemma) not configured' });

  const supabase = getSupabase();
  try {
    // 1. Fetch study from DB
    const { data: study, error: studyError } = await supabase
      .from('imagingstudies')
      .select('*')
      .eq('id', id)
      .eq('patient_id', patientId)
      .single();

    if (studyError || !study) throw new Error('Imaging study not found');

    // 2. Fetch image from Supabase Storage
    // Path in DB: /api/storage/uploads/patients/userId/filename
    const storagePath = study.thumbnail.replace('/api/storage/uploads/', '');
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(storagePath);

    if (downloadError || !fileData) throw new Error('Failed to download image from storage');

    // 3. Convert to Base64
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // 4. Call MedGemma Modal API
    const prompt = `You are an expert diagnostic radiologist. Analyze this medical image (${study.study_type} of ${study.body_part || 'unknown body part'}). 
    
    OUTPUT FORMAT (Markdown):
    # FINDINGS
    - [Use simple, clear bullet points for observations]
    - [Avoid overly complex jargon where possible]
    
    # IMPRESSION
    - [Clear, easy-to-understand summary of results]
    
    RULES:
    1. Output strictly the sections above in points.
    2. USE BULLET POINTS for every finding and impression.
    3. Be concise and use plain language for the patient.
    4. DO NOT use surrounding quotes or preambles.`;

    const aiRes = await fetch(modalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        prompt: prompt
      })
    });

    if (!aiRes.ok) throw new Error('AI Service returned an error');

    const result = await aiRes.json() as { success: boolean; analysis?: string; error?: string };

    if (!result.success) throw new Error(result.error || 'AI Analysis failed');

    // 5. Clean and format the result
    let cleanedAnalysis = (result.analysis || '')
      .trim()
      .replace(/^["']/, '') // Remove leading quotes
      .replace(/["']$/, ''); // Remove trailing quotes

    // 6. Persist to DB
    await supabase
      .from('imagingstudies')
      .update({ ai_analysis: cleanedAnalysis, updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({
      success: true,
      analysis: cleanedAnalysis
    });
  } catch (err: any) {
    console.error(`[POST /imaging/${id}/summarize] error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
