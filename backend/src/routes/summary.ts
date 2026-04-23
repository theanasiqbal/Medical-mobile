import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

export const summaryRouter = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * GET /summary/generate
 * Generates an AI health summary based on reports from the last 6 months.
 */
summaryRouter.get('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  const patientId = req.patientId;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!apiKey) return res.status(500).json({ success: false, error: 'AI Service not configured' });

  const supabase = getSupabase();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  try {
    console.log(`[Summary] >>> START: Generating for patient: ${patientId}, since: ${sixMonthsAgo.toISOString()}`);

    // 1. Fetch reports from last 6 months (limit 10 for performance)
    console.log(`[Summary] >>> STEP 1: Querying Supabase 'reports' table...`);

    const queryStartTime = Date.now();
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('patient_id', patientId)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    const queryEndTime = Date.now();

    console.log(`[Summary] >>> STEP 1 DONE: Query took ${queryEndTime - queryStartTime}ms`);

    if (error) {
      console.error('[Summary] !!! Supabase fetch error:', error);
      throw error;
    }
    console.log(`[Summary] Query finished. Found ${reports?.length || 0} reports`);

    if (!reports || reports.length === 0) {
      console.log(`[Summary] No reports found. Returning empty summary.`);
      return res.json({
        success: true,
        summary: {
          healthScore: 0,
          statusMessage: "No reports found in the last 6 months. Upload your medical reports to generate a summary.",
          keyFindings: [],
          deficiencies: [],
          lifestyleSuggestions: [],
          recommendedTests: []
        }
      });
    }

    console.log(`[Summary] Processing ${reports.length} reports into parts...`);
    // 2. Prepare files for Gemini
    const rawParts = await Promise.all(
      reports.map(async (report) => {
        try {
          console.log(`[Summary] Fetching report file: ${report.path}`);
          const response = await fetch(report.path);
          if (!response.ok) throw new Error(`Failed to fetch ${report.path}`);

          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');

          let mimeType = 'application/pdf';
          if (report.path.toLowerCase().endsWith('.png')) mimeType = 'image/png';
          else if (report.path.toLowerCase().endsWith('.jpg') || report.path.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
          else if (report.path.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

          console.log(`[Summary] Report ${report.id} processed. MimeType: ${mimeType}`);
          return {
            inlineData: {
              data: base64,
              mimeType
            }
          } as Part;
        } catch (e) {
          console.error(`[Summary] Error processing report ${report.id}:`, e);
          return null;
        }
      })
    );

    const fileParts: Part[] = rawParts.filter((p): p is Part => p !== null);
    console.log(`[Summary] Successfully prepared ${fileParts.length} file parts for AI`);

    if (fileParts.length === 0) {
      throw new Error('Could not process any reports for AI analysis.');
    }

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log(`[Summary] Calling Gemini model: gemini-2.0-flash`);

    const prompt = `
      You are a professional medical analysis assistant. I am providing you with up to 10 medical reports (PDFs, Images, scans) for a single patient from the last 6 months.
      
      TASK:
      1. Analyze all provided documents.
      2. Generate a comprehensive but concise health summary.
      3. Calculate a "Health Score" (0-100) based on the findings (higher is better).
      4. Identify key findings (e.g., Blood Pressure, Cholesterol, Glucose levels).
      5. Identify any potential deficiencies or areas of concern.
      6. Provide lifestyle and diet suggestions.
      7. Recommend any follow-up tests if necessary.

      OUTPUT FORMAT:
      You MUST respond ONLY with a valid JSON object in the following structure:
      {
        "healthScore": number,
        "statusMessage": "string summary status (e.g., Good, Requires Attention)",
        "keyFindings": [{"title": "string", "value": "string"}],
        "deficiencies": [{"title": "string", "value": "string"}],
        "lifestyleSuggestions": ["string"],
        "recommendedTests": ["string"]
      }

      IMPORTANT:
      - Be accurate based on the documents.
      - If a value is within normal range, state "Normal".
      - Use professional but accessible language.
      - Return ONLY the JSON object. No extra text or markdown code blocks.
    `;

    // 4. Generate Content
    console.log(`[Summary] Sending prompt...`);
    const result = await model.generateContent([prompt, ...fileParts]);
    const responseText = result.response.text();
    console.log(`[Summary] Gemini response received. Length: ${responseText.length}`);

    // Clean potential markdown formatting
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log(`[Summary] Cleaned JSON: ${cleanedJson.substring(0, 100)}...`);
    const summary = JSON.parse(cleanedJson);

    console.log(`[Summary] Success! Health Score: ${summary.healthScore}`);
    
    // 5. Persist to DB (upsert)
    await supabase
      .from('patient_health_summaries')
      .upsert({ 
        patient_id: patientId, 
        summary_data: summary,
        updated_at: new Date().toISOString()
      }, { onConflict: 'patient_id' });

    res.json({ success: true, summary });

  } catch (err: any) {
    console.error('[GET /summary/generate] error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate health summary' });
  }
});

/**
 * GET /summary/latest
 * Returns the most recently saved summary for the patient.
 */
summaryRouter.get('/latest', authMiddleware, async (req: AuthRequest, res: Response) => {
  const patientId = req.patientId;
  if (!patientId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('patient_health_summaries')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (error) throw error;

    res.json({ 
      success: true, 
      summary: data ? data.summary_data : null,
      lastUpdated: data ? data.updated_at : null
    });
  } catch (err: any) {
    console.error('[GET /summary/latest] error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch latest summary' });
  }
});
