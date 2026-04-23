import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { patientRouter } from './routes/patient.js';
import { opdRouter } from './routes/opd.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

import { doctorsRouter } from './routes/doctors.js';
import { reportsRouter } from './routes/reports.js';
import { summaryRouter } from './routes/summary.js';
import { imagingRouter } from './routes/imaging.js';

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/patient', patientRouter);
app.use('/doctors', doctorsRouter);
app.use('/opd', opdRouter);
app.use('/reports', reportsRouter);
app.use('/summary', summaryRouter);
app.use('/imaging', imagingRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏥 Medical App Backend`);
  console.log(`   Running on   → http://localhost:${PORT}`);
  console.log(`   Health check → http://localhost:${PORT}/health`);
  console.log(`   Environment  → ${process.env.NODE_ENV ?? 'development'}\n`);
});
