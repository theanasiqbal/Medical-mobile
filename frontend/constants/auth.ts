/**
 * Auth constants for the Medical mobile app.
 *
 * BACKEND_URL: Your laptop's local IP on the WiFi network.
 * Find it by running `ipconfig` in PowerShell and copying the
 * IPv4 address under your WiFi adapter (e.g. 192.168.1.x).
 *
 * ⚠️  Do NOT use `localhost` — the phone won't reach the laptop that way.
 */

// Replace with your laptop's WiFi IP (run `ipconfig` in PowerShell)
export const BACKEND_URL = 'http://192.168.1.12:3000'; // Correct IP from ipconfig

/** AsyncStorage key for the JWT session token */
export const TOKEN_STORAGE_KEY = '@medical_app/auth_token';

/** AsyncStorage key for the cached patient profile */
export const PROFILE_STORAGE_KEY = '@medical_app/patient_profile';

/** OTP expiry in seconds (matches the 2-minute server window) */
export const OTP_EXPIRY_SECONDS = 120;

/** Minimum seconds between OTP resend requests */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
