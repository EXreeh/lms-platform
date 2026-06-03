# Setup Guide — CognitiaX AI LMS

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or Docker)
- npm 10+

## 1. Clone and install

```bash
npm install
```

## 2. Database

Create the database:

```bash
createdb lms_platform
```

Copy environment files:

```bash
cp database/.env.example database/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Set `DATABASE_URL` in `database/.env` and `backend/.env`:

```env
DATABASE_URL="postgresql://USER@localhost:5432/lms_platform"
```

Generate client and run migrations:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed    # optional: demo users & courses
```

If migrations fail with advisory lock errors, apply SQL manually from `database/prisma/migrations/` and record in `_prisma_migrations`.

## 3. Backend environment

Required in `backend/.env`:

```env
JWT_SECRET=change-me-to-a-secure-cognitiax-jwt-secret-min-32-chars
CORS_ORIGIN=http://localhost:3000
```

Optional Gmail SMTP for OTP emails:

```env
MAIL_DEV_LOG=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@cognitiaxai.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="CognitiaX AI <admin@cognitiaxai.com>"
```

Use a [Google App Password](https://myaccount.google.com/apppasswords) with 2FA enabled.

## 4. File uploads (local)

In `backend/.env`:

```env
STORAGE_PROVIDER=local
UPLOADS_DIR=uploads
STORAGE_PUBLIC_URL=/uploads
```

Uploaded files are stored in `backend/uploads/{videos,resources,thumbnails}/` and served at `http://localhost:4000/uploads/...`. The Next.js dev server proxies `/uploads/*` to the backend.

Apply the file-upload migration:

```bash
npm run db:migrate
```

## 5. Frontend environment

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_PROXY_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Run development servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| API (direct) | http://localhost:4000/api/health |
| API (proxy) | http://localhost:3000/api/health |

## 6. Create an admin user

After seed, `admin@cognitiax.ai` is already admin. To promote another user:

```bash
npm run db:studio
```

Or SQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## 7. Site branding & footer

- Brand name: **CognitiaX AI** (`frontend/src/lib/design-tokens.ts`)
- Footer contact placeholders: `frontend/src/lib/site-config.ts`
  - Official: info@cognitiax.ai
  - Technical support: support@cognitiax.ai
  - Sales: sales@cognitiax.ai
  - Phone: +91-XXXXXXXXXX
  - Address: Coming soon
  - Social links
  - Privacy / Terms URLs

## 8. Verify installation

1. Open http://localhost:3000 — landing page with CognitiaX AI footer
2. Log in as `student@cognitiax.ai` / `Password123!`
3. Browse `/courses`, open profile at `/dashboard/profile`
4. See [TESTING.md](./TESTING.md) for full QA checklist

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 401 on dashboard | Clear cookies; log in again |
| OTP not received | Check SMTP vars; set `MAIL_DEV_LOG=true` to log OTP in console |
| Prisma migrate lock | Apply migration SQL manually |
| Empty course catalog | Run `npm run db:seed` or approve courses as admin |
