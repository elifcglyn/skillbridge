# API Plan

The backend starts as a TypeScript Express API.

## Initial Endpoint

- `GET /health`: returns API health status.

## Planned API Areas

- Authentication/session integration with Supabase Auth tokens
- Profiles
- Skills
- Matches
- Sessions
- Notifications
- Feedback

## Conventions

- Keep route modules under `backend/src/routes`.
- Keep shared database access under `backend/src/lib`.
- Read secrets from environment variables only.
