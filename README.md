# CognitiaX AI — LMS Platform

A production-ready Learning Management System monorepo powered by **CognitiaX AI** branding, with authentication, role-based access, and a scalable foundation for future LMS features.

## Tech stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend  | Node.js, Express.js, TypeScript     |
| Database | PostgreSQL, Prisma                  |
| Auth     | JWT, bcrypt                         |

## Features (foundation)

- Student, Teacher, and Admin roles
- JWT authentication (register, login, protected routes)
- Role-based API and dashboard routing
- Monorepo with npm workspaces
- Prepared modules for courses, videos, quizzes, progress, and payments

## Project structure

```
frontend/     # Next.js application
backend/      # Express API
database/     # Prisma schema & client
docs/         # Documentation
```

## Getting started

See [docs/SETUP.md](docs/SETUP.md) for full instructions.

```bash
npm install
docker compose up -d
cp .env.example database/.env && cp .env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run db:generate && npm run db:migrate
npm run dev
```

## Scripts

| Command              | Description                    |
|----------------------|--------------------------------|
| `npm run dev`        | Frontend + backend concurrently |
| `npm run dev:frontend` | Next.js dev server           |
| `npm run dev:backend`  | Express dev server           |
| `npm run build`      | Build all workspaces           |
| `npm run db:migrate` | Run Prisma migrations          |
| `npm run db:studio`  | Open Prisma Studio             |

## API endpoints

| Method | Path                    | Auth | Description        |
|--------|-------------------------|------|--------------------|
| GET    | `/api/health`           | No   | Health check       |
| POST   | `/api/auth/register`    | No   | Register           |
| POST   | `/api/auth/login`       | No   | Login              |
| POST   | `/api/auth/logout`      | Yes  | Logout             |
| GET    | `/api/auth/me`          | Yes  | Current user       |

## Documentation

- [Setup](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Authentication](docs/AUTHENTICATION.md)

## License

Private — all rights reserved.
