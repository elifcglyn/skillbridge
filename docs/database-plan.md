# Database Plan

The application database is PostgreSQL/Supabase, managed from code through Prisma.

## Ownership

- Prisma schema: `backend/prisma/schema.prisma`
- Prisma migrations: `backend/prisma/migrations`
- Supabase reference migrations: `backend/supabase/migrations`

## Rules

- Do not commit real database credentials.
- Use `backend/.env.example` as the template for local backend configuration.
- Prefer Prisma migrations for schema changes.
- Keep Supabase Auth managed by Supabase.

## Commands

```bash
cd backend
npm run db:validate
npm run db:generate
npm run db:migrate
```
