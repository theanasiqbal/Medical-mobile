import { Router, Response, Request } from 'express';
import { createClient } from '@supabase/supabase-js';

export const doctorsRouter = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /doctors
 * Fetches all doctors along with their specialty name.
 */
doctorsRouter.get('/', async (req: Request, res: Response) => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, image, hospital_id, specialty_id, specialties(name), fee, emergency_fee')
      .eq('is_active', true);

    if (error) {
      console.error('[doctorsGet] Supabase error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
    }

    const doctorList = data || [];

    // 1. Identify paths that need signing (e.g., doctors/filename.png)
    const pathsToSign = doctorList
      .filter(doc => doc.image && doc.image.startsWith('/api/storage/uploads/'))
      .map(doc => doc.image.replace('/api/storage/uploads/', ''));

    let signedUrlMap: Record<string, string> = {};

    if (pathsToSign.length > 0) {
      // 2. Batch request signed URLs (7 days expiry)
      const { data: signedData, error: signError } = await supabase.storage
        .from('uploads')
        .createSignedUrls(pathsToSign, 3600 * 24 * 7);

      if (!signError && signedData) {
        signedData.forEach(item => {
          if (item.signedUrl) {
            // Map the identifier (folder/file) to the new signed URL
            const dbPath = `/api/storage/uploads/${item.path}`;
            signedUrlMap[dbPath] = item.signedUrl;
          }
        });
      }
    }

    // 3. Map signed URLs back to doctors
    const transformedDoctors = doctorList.map(doc => {
      if (doc.image && signedUrlMap[doc.image]) {
        return { ...doc, image: signedUrlMap[doc.image] };
      }
      return doc;
    });

    res.status(200).json({
      success: true,
      doctors: transformedDoctors,
    });
  } catch (err) {
    console.error('[doctorsGet] Unexpected error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
