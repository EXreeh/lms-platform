# Setup Guide — Cognitiax AI LMS

## Prerequisites

- Node.js 20+
- PostgreSQL (local or Docker)
- npm 10+

## Database

Create the database:

```bash
createdb lms_platform
```

Set `DATABASE_URL` in `database/.env` and `backend/.env`:

```
DATABASE_URL="postgresql://aster@localhost:5432/lms_platform"
```

## Install & migrate

```bash
npm install
npm run db:generate
npm run db:migrate
```

If you have an older schema, reset the dev database:

```bash
cd database && npx prisma migrate reset
```

## Environment files

```bash
cp database/.env.example database/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Set `JWT_SECRET` in `backend/.env` (minimum 32 characters).

## Gmail SMTP (OTP emails)

In `backend/.env`:

```env
MAIL_DEV_LOG=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # 16-char App Password (no spaces in .env)
EMAIL_FROM="Cognitiax AI <your@gmail.com>"
```

1. Enable [2-Step Verification](https://myaccount.google.com/security) on the Google account.
2. Create an [App Password](https://myaccount.google.com/apppasswords) for “Mail”.
3. Paste the 16-character password into `SMTP_PASS` **without spaces**.
4. Set `EMAIL_FROM` to the same address as `SMTP_USER`.
5. Restart the backend — you should see `✉️ Email ready` in the console.

On localhost, register or use forgot-password; OTP emails are sent via Gmail (not console) when SMTP verifies successfully.

## Run

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API (direct): http://localhost:4000/api/health
- API (via proxy): http://localhost:3000/api/health

## Create an admin

```bash
npm run db:studio
```

Update a user's `role` to `ADMIN`, or:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```
