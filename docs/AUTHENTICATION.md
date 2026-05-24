# Authentication — Cognitiax AI LMS

## Registration (students only)

1. `POST /api/auth/register/request-otp` — validate form, store pending registration, send OTP
2. `POST /api/auth/register/verify` — verify OTP, create **STUDENT** account
3. `POST /api/auth/register/resend-otp` — resend code (rate limited)

Teacher accounts are created by administrators only.

## Login / session

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/check-email?email=` | Email availability |

## Password reset

1. `POST /api/auth/password/forgot` — send OTP (no email enumeration)
2. `POST /api/auth/password/verify-otp` — returns short-lived `resetToken`
3. `POST /api/auth/password/reset` — set new password
4. `POST /api/auth/password/resend-otp` — resend OTP

## OTP security

- 6-digit code, HMAC-SHA256 hashed at rest
- Expires in 5 minutes (configurable)
- Max 5 verify attempts per challenge
- 60s resend cooldown, 5 sends/hour per email

## Password rules

- Min 8 characters
- 1 uppercase, 1 lowercase, 1 number, 1 special character

## Email

Nodemailer with branded HTML templates. In development without SMTP, OTP is logged to the console when `MAIL_DEV_LOG=true`.

## Environment

See `backend/.env.example` for `SMTP_*`, `OTP_*`, and `JWT_*` variables.
