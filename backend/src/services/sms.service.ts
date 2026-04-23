/**
 * SMS Service — sends messages via the sms-gate.app Android app.
 *
 * Setup:
 *   1. Open the SMS Gateway app on your phone
 *   2. Note the local IP address shown (e.g. http://192.168.1.12:8080)
 *   3. Set your login + password inside the app settings
 *   4. Ensure your phone and laptop are on the same WiFi network
 *   5. Fill in .env: SMS_GATEWAY_URL, SMS_GATEWAY_LOGIN, SMS_GATEWAY_PASSWORD
 *
 * API docs: https://sms-gate.app/api/
 */

interface SmsGateResponse {
  id: string;
  state: string;
}

/**
 * Sends an SMS to the given phone number via the sms-gate.app local REST API.
 *
 * @param phone   E.164 format (e.g. "+919876543210")
 * @param message SMS body text
 */
export async function sendSMS(phone: string, message: string): Promise<void> {
  const url      = process.env.SMS_GATEWAY_URL;
  const login    = process.env.SMS_GATEWAY_LOGIN;
  const password = process.env.SMS_GATEWAY_PASSWORD;

  if (!url || !login || !password) {
    throw new Error(
      'Missing SMS gateway config. Set SMS_GATEWAY_URL, SMS_GATEWAY_LOGIN and SMS_GATEWAY_PASSWORD in .env'
    );
  }

  const authHeader = `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;

  let response: Response;
  try {
    response = await fetch(`${url}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  authHeader,
      },
      body: JSON.stringify({
        message,
        phoneNumbers: [phone],
      }),
    });
  } catch (err) {
    // Network-level failure — phone unreachable, wrong IP, app not running, etc.
    throw new Error(
      `Cannot reach SMS gateway at ${url}. ` +
      `Make sure the app is open on your phone and both devices are on the same WiFi. ` +
      `Original error: ${String(err)}`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    throw new Error(`SMS gateway returned HTTP ${response.status}: ${body}`);
  }

  const result = await response.json() as SmsGateResponse;
  console.log(`[SMS] ✓ Delivered to ${phone.slice(0, 6)}***  |  message_id=${result.id}  state=${result.state}`);
}

/**
 * Builds the OTP SMS message body.
 */
export function buildOtpMessage(otp: string): string {
  return `Your Medical App OTP is: ${otp}\n\nValid for 2 minutes. Do not share this code with anyone.`;
}
