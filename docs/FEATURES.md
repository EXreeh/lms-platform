# CognitiaX AI LMS — Features

Overview of implemented platform capabilities. Brand name is always **CognitiaX AI** (capital X).

## Authentication & accounts

- Email/password registration with OTP verification
- Login, logout, session persistence (JWT + HTTP-only cookie)
- Forgot password via OTP
- Role-based access: **Student**, **Teacher**, **Admin**
- Profile page with edit name, change password, and role-specific stats (`/dashboard/profile`)

## Courses & curriculum

- Course lifecycle: Draft → Under Review → Approved / Rejected / Archived
- Admin rejection with required reason visible to teachers
- Modules, lessons, video URLs, ordering
- Teacher create/edit; admin review queue
- Soft delete with admin approval workflow
- Public course catalog with search and filters

## Learning & progress

- Student enrollment (free courses)
- Learn page with video player and lesson sidebar
- Explicit lesson completion (progress = completed lessons / total)
- Continue learning on student dashboard

## Quizzes

- Teacher: create quizzes, MCQ questions, edit questions, time limits, passing scores
- Student: attempts, scoring, result pages
- Quizzes visible when course is approved

## Resources

- Teachers upload URL-based or **direct file uploads** (PDF, DOC, PPT, ZIP, images)
- Course-level and lesson-level resources
- Student resources hub: `/dashboard/student/resources`
- Admin moderation

## File uploads (local development)

- **Lesson videos:** MP4, MOV, WebM, MKV (max 500 MB) — upload or paste YouTube/external URL
- **Resources:** PDF, Office docs, ZIP, images (max 50 MB) — upload or paste link
- **Course thumbnails:** JPG, PNG, WebP (max 5 MB)
- Storage abstraction: `STORAGE_PROVIDER=local` (future: `s3`, `r2`)
- Files saved under `backend/uploads/` and served at `/uploads/...`
- API: `POST /api/uploads/video`, `/resource`, `/thumbnail` (Teacher/Admin only)

## Certificates

- Issued when 100% lessons complete + all quizzes passed
- PDF download, public verification by code

## Admin platform

- User management (create teachers, roles, suspend, reset password)
- Course review, approve/reject with reason, analytics
- Student growth chart (registrations over time) on Reports & Analytics
- Activity feed, resource moderation, certificate registry
- Revenue page shows "Payments not configured yet" until Razorpay is enabled

## UI & branding

- CognitiaX AI design system (green/gold palette)
- Role-based navbar with mobile menu (Resources link for students)
- Full-width dashboards, professional site footer with contact placeholders
- Dark mode support
- User-friendly API error messages

## Planned (not in scope for polish pass)

- Razorpay payments (schema exists; enable when `RAZORPAY_*` env vars are set)
- File uploads to cloud storage (resources are URL-based today)

See [TESTING.md](./TESTING.md) for verification checklists.
