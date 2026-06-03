# CognitiaX AI LMS — Deployment Guide

This guide covers deploying the CognitiaX AI LMS monorepo to production using **Vercel** (frontend), **Railway** or **Render** (backend), and **Neon** (PostgreSQL).

## Architecture

| Component | Stack | Default port |
|-----------|-------|--------------|
| Frontend | Next.js 15 | 3000 |
| Backend | Express + Prisma | `PORT` (4000) |
| Database | PostgreSQL (Neon) | 5432 |

## Prerequisites

- Node.js 20+
- npm workspaces (monorepo root)
- Neon PostgreSQL database
- Vercel account (frontend)
- Railway or Render account (backend)

## 1. Database (Neon PostgreSQL)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string (include `?sslmode=require`).
3. Set `DATABASE_URL` in `database/.env` and on the backend host.

### Migrate and seed

From the repository root:

```bash
npm install
npm run db:migrate
npm run db:seed
```

For production deploy pipelines, use:

```bash
npx prisma migrate deploy --schema=database/prisma/schema.prisma
npm run db:seed
```

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cognitiax.ai | Password123! |
| Teacher | teacher@cognitiax.ai | Password123! |
| Student | student@cognitiax.ai | Password123! |

Change these passwords before going live with real users.

## 2. Backend (Railway / Render)

### Build settings

- **Root directory:** repository root (or `backend` if your host supports monorepo subpaths)
- **Build command:** `npm run build -w backend`
- **Start command:** `npm run start -w backend`

The server listens on `process.env.PORT`.

### Environment variables

Copy from `backend/.env.example`. Required in production:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `PORT` | Set by host (Railway/Render inject this) |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Strong random string (min 32 characters) |
| `FRONTEND_URL` | Production frontend URL, e.g. `https://your-app.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAME_SITE` | `lax` (same domain) or `none` (cross-subdomain; requires HTTPS) |
| `COOKIE_DOMAIN` | Optional, e.g. `.yourdomain.com` |
| `CORS_ORIGIN` | Optional override; defaults to `FRONTEND_URL` |

Optional:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` — OTP and password reset (required in production; set `MAIL_DEV_LOG=false`)
- `STORAGE_PROVIDER=local` — file uploads (ensure persistent volume for `uploads/`)
- `UPLOADS_DIR`, `STORAGE_PUBLIC_URL`

### Health check

Configure your host to probe:

```
GET /api/health
```

Expected response (200):

```json
{
  "status": "ok",
  "app": "CognitiaX AI LMS",
  "timestamp": "2026-05-23T12:00:00.000Z",
  "database": "connected"
}
```

Returns `503` with `"status": "degraded"` if the database is unreachable.

### Uploads in production

With `STORAGE_PROVIDER=local`, mount a persistent disk at `backend/uploads`. Without persistent storage, uploaded files are lost on redeploy. **Local disk is not suitable for large (multi-GB) lesson videos.**

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_VIDEO_UPLOAD_MB` | 500 | Local video upload limit |
| `MAX_RESOURCE_UPLOAD_MB` | 50 | Local resource upload limit |
| `NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB` | 500 | Frontend video limit (must match backend) |
| `NEXT_PUBLIC_MAX_RESOURCE_UPLOAD_MB` | 50 | Frontend resource limit (must match backend) |

For production large videos, plan to use **Cloudflare R2** or **AWS S3** with presigned multipart upload. See [UPLOADS.md](./UPLOADS.md). S3/R2 adapters are stubbed for future use.

## 3. Frontend (Vercel)

### Build settings

- **Framework:** Next.js
- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Install command:** `npm install` (from monorepo root if using workspaces)

### Environment variables

Copy from `frontend/.env.example`:

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_API_URL` | Backend origin only (no `/api`), e.g. `https://lmsdatabase-production.up.railway.app` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL, e.g. `https://your-app.vercel.app` |

Do **not** set `API_PROXY_URL` in production unless you use Next.js rewrites to proxy the API. Prefer pointing `NEXT_PUBLIC_API_URL` directly at the backend.

### Cookies across domains

If frontend and backend are on different domains:

1. Set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` on the backend.
2. Set `FRONTEND_URL` and `CORS_ORIGIN` to the exact frontend origin.
3. Ensure `credentials: "include"` requests use HTTPS.

If both run on the same parent domain (e.g. `app.example.com` + `api.example.com`), set `COOKIE_DOMAIN=.example.com`.

## 4. Security checklist

- [ ] No real secrets in git (`.env` is gitignored)
- [ ] Unique `JWT_SECRET` and `OTP_SECRET` per environment
- [ ] `COOKIE_SECURE=true` in production
- [ ] Demo account passwords rotated or disabled
- [ ] SMTP credentials stored only in host env vars
- [ ] `backend/uploads/` not committed (gitignored)

## 5. Production testing checklist

### Authentication

- [ ] Register → OTP → login
- [ ] Login with demo accounts (admin, teacher, student)
- [ ] Logout clears session and shows public navbar
- [ ] Stale session after DB reset redirects to login
- [ ] Forgot password flow (if SMTP configured)
- [ ] Profile edit and change password

### Navbar (per role)

- [ ] Public: Home, Courses, Login, Register, theme toggle
- [ ] Student: Dashboard, Courses, My Learning, Resources, Certificates, Profile, Logout
- [ ] Teacher: Dashboard, My Courses, Create Course, Quizzes, Resources, Courses, Profile, Logout
- [ ] Admin: Dashboard, Users, Courses, Review Queue, Resources, Reports, Profile, Logout
- [ ] Mobile hamburger menu works; Logout visible

### Student flows

- [ ] Enroll in course (duplicate enrollment blocked)
- [ ] Learning page, lesson progress, quiz attempt
- [ ] Resources and certificates

### Teacher flows

- [ ] Create/edit course, modules, lessons
- [ ] Thumbnail, video, and resource uploads
- [ ] Submit for review, quiz CRUD

### Admin flows

- [ ] User management, review queue, analytics
- [ ] Approve/reject courses with reason

### Uploads

- [ ] Thumbnail, small video, and resource uploads succeed
- [ ] Large video (>500 MB local limit) blocked with friendly message before upload
- [ ] Lesson video plays without download option in player
- [ ] PDF/image resources open in browser; DOC/PPT/ZIP download
- [ ] Files persist after refresh
- [ ] Served from `/uploads` with correct headers
- [ ] Invalid file types/sizes rejected

### Infrastructure

- [ ] `GET /api/health` returns `database: "connected"`
- [ ] Frontend `npm run build` succeeds
- [ ] Backend `npm run build` succeeds

## 6. Local production build test

```bash
npm run build -w backend
npm run build -w frontend
```

## 7. Troubleshooting

### Logged in but empty navbar

Usually a stale JWT after database reset. Logout or clear cookies; the app now validates `/auth/me` on load and clears invalid sessions.

### CORS errors

Ensure `FRONTEND_URL` or `CORS_ORIGIN` matches the exact browser origin (scheme + host + port).

### Cookies not sent

Check `COOKIE_SECURE`, `COOKIE_SAME_SITE`, and that both apps use HTTPS in production.

### Uploads 404

Confirm backend serves `/uploads` and `STORAGE_PUBLIC_URL` matches how the frontend references files.
