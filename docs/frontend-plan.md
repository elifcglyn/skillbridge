# Frontend Plan

The frontend remains a Vite + React + TypeScript application.

## Responsibilities

- Render landing, authentication, dashboard, profile, match, notification, and learning views.
- Use Supabase client-side auth and public client APIs where appropriate.
- Keep browser-only environment variables prefixed with `VITE_`.

## Commands

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Notes

- Existing imports using `@/` continue to resolve to `frontend/src`.
- Frontend database access should not use Prisma directly.
