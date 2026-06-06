# CognitiaX AI — LMS Platform

A private institute Learning Management System monorepo for **CognitiaX AI** — admin-managed accounts, assigned course access, batches, fees, messaging, and role-based dashboards.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend  | Node.js, Express, TypeScript, Zod |
| Database | PostgreSQL, Prisma |
| Auth     | JWT, bcrypt, OTP email verification |

## Quick start

```bash
npm install
docker compose up -d          # optional PostgreSQL
cp database/.env.example database/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run db:generate && npm run db:migrate
npm run db:seed               # optional demo data
npm run dev
```

- **Frontend:** http://localhost:3000  
- **API:** http://localhost:4000/api/health  

Full setup: [docs/SETUP.md](docs/SETUP.md)

## Demo accounts

Password for all: **`Password123!`**

| Role    | Email |
|---------|-------|
| Student | `student@cognitiax.ai` |
| Teacher | `teacher@cognitiax.ai` |
| Admin   | `admin@cognitiax.ai` |

## Project structure

```
frontend/     Next.js app (UI, dashboards, learn experience)
backend/      Express API modules
database/     Prisma schema & migrations
docs/         Setup, features, testing guides
```

## Key routes

| Audience | Path |
|----------|------|
| Public | `/`, `/courses`, `/login` (register page shows institute-only notice) |
| Student | `/dashboard/student`, `/dashboard/student/resources`, `/dashboard/profile` |
| Teacher | `/dashboard/teacher`, `/dashboard/teacher/courses/new` |
| Admin | `/dashboard/admin`, `/dashboard/admin/review` |
| Learn | `/courses/[slug]/learn` |
| Verify certificate | `/verify` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend + backend |
| `npm run build` | Build all workspaces |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Documentation

- [Setup guide](docs/SETUP.md)
- [Features](docs/FEATURES.md)
- [Testing checklist](docs/TESTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Authentication](docs/AUTHENTICATION.md)

## Site configuration

Footer contact placeholders live in `frontend/src/lib/site-config.ts` — replace support email, official mail, phone, address, social links, and legal URLs for production.

## License

Private — all rights reserved.
