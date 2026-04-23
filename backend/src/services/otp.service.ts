import { createHmac, timingSafeEqual } from 'crypto';

/** Time window duration in milliseconds (2 minutes) */
const OTP_WINDOW_MS = 120_000;

/**
 * Returns the current time-window bucket.
 * Changes every 2 minutes — same window for both sender and verifier.
 */
export function getCurrentWindow(): number {
  return Math.floor(Date.now() / OTP_WINDOW_MS);
}

/**
 * Derives a 4-digit OTP for a given phone number and time window.
 *
 * Algorithm:
 *   message = "<phone>:<window>"
 *   hmac    = HMAC-SHA256(OTP_HMAC_SECRET, message)
 *   otp     = parseInt(last 8 hex chars of hmac, 16) % 10000, zero-padded to 4 digits
 *
 * @param phone   E.164 phone number (e.g. "+919876543210")
 * @param window  Optional time window; defaults to current window
 */
export function deriveOTP(phone: string, window?: number): string {
  const secret = process.env.OTP_HMAC_SECRET;
  if (!secret) throw new Error('OTP_HMAC_SECRET is not configured');

  const w = window ?? getCurrentWindow();
  const message = `${phone}:${w}`;

  const hmac = createHmac('sha256', secret).update(message).digest('hex');

  // Take last 8 hex chars → 32-bit integer → % 10000 → 4-digit code
  const code = parseInt(hmac.slice(-8), 16) % 10000;
  return String(code).padStart(4, '0');
}

/**
 * Verifies a submitted OTP against the current time window.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @returns true if OTP is correct for the current window
 */
export function verifyOTP(phone: string, submittedOTP: string): boolean {
  const expected = deriveOTP(phone);

  // Pad both to same length before comparing
  const expectedBuf = Buffer.from(expected.padEnd(6, ' '));
  const submittedBuf = Buffer.from(submittedOTP.padEnd(6, ' '));

  if (expectedBuf.length !== submittedBuf.length) return false;

  // Constant-time comparison — prevents timing oracle attacks
  return timingSafeEqual(expectedBuf, submittedBuf);
}
