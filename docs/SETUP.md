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
