# SkillBridge

SkillBridge is a full-stack web platform for skill sharing, matching, learning progress, notifications, and user profiles. The repository is organized as a single GitHub repo with separate frontend, backend, and documentation areas.

## Technologies

- Frontend: Vite, React, TypeScript, Tailwind CSS, shadcn/ui-style components, Supabase client
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL/Supabase managed through Prisma migrations
- Package manager: npm

## Project Structure

```text
skillbridge/
├── frontend/
├── backend/
├── docs/
├── README.md
├── .gitignore
└── package.json
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Build the backend:

```bash
cd backend
npm run build
```

Run Prisma commands from the backend folder:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
```

Root scripts are also available:

```bash
npm run dev:frontend
npm run build:frontend
npm run dev:backend
npm run build:backend
npm run db:validate
```

## Environment Variables

Do not commit real environment files. Use the example files as templates:

- `frontend/.env.example` -> `frontend/.env.local`
- `backend/.env.example` -> `backend/.env`

Frontend variables:

```bash
VITE_SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
VITE_SUPABASE_ANON_KEY="<SUPABASE_PUBLISHABLE_OR_ANON_KEY>"
```

Backend variables:

```bash
# Runtime Prisma Client connection. Supabase transaction pooler (:6543) is OK here.
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Prisma CLI and migrations must not use the transaction pooler.
# Prefer Supabase's direct connection. If that endpoint is not reachable from your network,
# use the Supabase session pooler on port 5432 instead.
DIRECT_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres"
# DIRECT_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-<REGION>.pooler.supabase.com:5432/postgres"

PORT="4000"
CORS_ORIGIN="http://localhost:5173"
```

## Git Branch Flow

- `main`: stable branch
- `develop`: integration branch for completed work
- `feature/<short-name>`: new features or isolated changes
- `fix/<short-name>`: bug fixes

Open pull requests into `develop`, test locally, then merge tested releases into `main`.

## Database Notes

Prisma owns the application schema in `backend/prisma/schema.prisma`. Supabase-specific SQL and legacy/reference migrations are kept under `backend/supabase/migrations`.

With Prisma 7, `backend/prisma.config.ts` uses `DIRECT_URL` for Prisma CLI commands such as `migrate status`, `migrate dev`, and `migrate deploy`. Keep `DATABASE_URL` for application runtime traffic, and use Supabase's direct connection string for `DIRECT_URL`. If the direct endpoint is unavailable on your network, use the Supabase session pooler on port 5432 for `DIRECT_URL`; do not use the transaction pooler on port 6543 for migrations.
