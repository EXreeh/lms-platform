# Authentication — Cognitiax AI LMS

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| POST | `/api/auth/logout` | Yes | Clear session cookie |
| GET | `/api/auth/me` | Yes | Current user profile |

## Dashboard routes (protected)

| Method | Path | Role |
|--------|------|------|
| GET | `/api/dashboard/student` | STUDENT |
| GET | `/api/dashboard/teacher` | TEACHER |
| GET | `/api/dashboard/admin` | ADMIN |

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** signed with `JWT_SECRET` (min 32 characters)
- Token stored in **httpOnly cookie** (`cognitiax_token`)
- Readable cookie synced for Next.js middleware route guards
- Frontend proxies `/api/*` → backend via `next.config.ts` rewrites (same-origin cookies)

## User model

| Field | Type |
|-------|------|
| id | cuid |
| name | string |
| email | string (unique) |
| password | string (hashed) |
| role | STUDENT \| TEACHER \| ADMIN |
| createdAt | DateTime |
| updatedAt | DateTime |

Admin accounts cannot self-register; promote via Prisma Studio or SQL.

## Frontend redirects

| Role | Dashboard |
|------|-----------|
| STUDENT | `/dashboard/student` |
| TEACHER | `/dashboard/teacher` |
| ADMIN | `/dashboard/admin` |
