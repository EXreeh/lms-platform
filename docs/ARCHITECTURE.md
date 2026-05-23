# Architecture

## Monorepo layout

```
lms-platform/
├── frontend/          # Next.js 15 (App Router, TypeScript, Tailwind v4)
├── backend/           # Express API (TypeScript, modular routes)
├── database/          # Prisma schema & generated client
└── docs/              # Documentation
```

## Backend module structure

```
backend/src/
├── config/            # Environment & database
├── middleware/        # Auth, RBAC, errors, CORS stack
├── modules/
│   ├── auth/          # Register, login, profile
│   ├── courses/       # Placeholder — future
│   ├── videos/        # Placeholder — future
│   ├── quizzes/       # Placeholder — future
│   ├── progress/      # Placeholder — future
│   └── payments/      # Placeholder — future
├── routes/            # API route aggregation
└── utils/             # JWT, password, errors
```

## API versioning

All routes are prefixed with `/api/v1`.

## Future feature integration

| Feature            | Backend module      | Database (planned)     |
|--------------------|---------------------|------------------------|
| Course uploads     | `modules/courses`   | `Course` model         |
| Video uploads      | `modules/videos`    | Storage + metadata     |
| Quizzes            | `modules/quizzes`   | `Quiz`, `Question`     |
| Progress tracking  | `modules/progress`  | `Progress`, enrollment |
| Payments           | `modules/payments`  | `Payment`, Stripe IDs  |

Add routes in `routes/index.ts` and uncomment relations in `database/prisma/schema.prisma` as each module is implemented.

## Frontend structure

```
frontend/src/
├── app/               # Pages (landing, auth, dashboards)
├── components/        # UI & layout
├── context/           # Auth provider
├── lib/               # API client, JWT helpers
└── types/             # Shared TypeScript types
```
