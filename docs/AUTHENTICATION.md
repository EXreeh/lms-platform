# Authentication — CognitiaX AI LMS

## Account creation (admin only — private institute portal)

Public self-registration is **disabled**. Only administrators can create accounts:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/users/students` | Create student (optional batch, course, fee plan) |
| POST | `/api/admin/users/teachers` | Create teacher (optional batch assignment, salary) |

Credentials are delivered via internal message and email when the email provider is configured.

Legacy register endpoints (`/api/auth/register/*`) return `403 SELF_REGISTRATION_DISABLED`.

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
