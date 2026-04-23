# Medical App — Backend

Node.js + Express + Supabase backend for OTP-based phone authentication.

## Prerequisites

- Node.js 20+
- A running [Supabase](https://supabase.com) project
- [SMS Gateway for Android](https://sms-gate.app/) app installed on your phone (same WiFi as laptop)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in all values:

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API → service_role key |
| `OTP_HMAC_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `SMS_GATEWAY_URL` | Shown in the Android app (e.g. `http://192.168.1.12:8080`) |
| `SMS_GATEWAY_LOGIN` | Set in the Android app settings |
| `SMS_GATEWAY_PASSWORD` | Set in the Android app settings |

### 3. Run Supabase migration
Go to your Supabase project → **SQL Editor** → paste and run:
```
supabase/migrations/001_patients.sql
```

### 4. Update mobile app backend URL
Open `constants/auth.ts` in the mobile app and set `BACKEND_URL` to your laptop's local WiFi IP:
```
ipconfig   ← run this in PowerShell, look for IPv4 under Wi-Fi adapter
```

---

## Running

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

Server starts at `http://localhost:3000`

---

## API

### `POST /auth/send-otp`
```json
{ "phone": "+919876543210" }
```
Sends a 4-digit OTP via SMS. Rate limited to 1 request per 60 seconds.

### `POST /auth/verify-otp`
```json
{ "phone": "+919876543210", "otp": "4829" }
```
Verifies OTP, issues a 30-day JWT. Replay attacks blocked via `otp_used_window`.

### `GET /health`
Returns server status. Useful to test connectivity from the phone.

---

## OTP Algorithm

```
counter  = Math.floor(Date.now() / 120_000)   // changes every 2 min
message  = phone + ":" + counter
hmac     = HMAC-SHA256(OTP_HMAC_SECRET, message)
otp      = parseInt(hmac.slice(-8), 16) % 10000  // 4-digit code
```

Completely stateless — no OTP is stored in the database.
