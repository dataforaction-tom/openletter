# Project: OpenLetter

Self-hostable open letter platform — create letters, collect verified signatures, manage from dashboard.

## Architecture

- `src/` — Hono server (TypeScript)
  - `routes/` — auth.ts, dashboard.ts, public.ts, api.ts
  - `views/` — Server-rendered HTML template functions
  - `lib/` — db.ts (SQLite), email.ts (Resend), nanoid.ts, hash.ts, markdown.ts
  - `middleware/` — auth.ts (session validation), error.ts (404/500)
- `public/` — Static assets (CSS, JS), no build step
- `data/` — SQLite database (gitignored)

## Commands

- `npm run dev` — start dev server with hot reload
- `npm start` — start production server
- `npm run migrate` — initialize database
- `docker compose up` — run with Docker

## Standards

- Server-rendered HTML views (TypeScript functions returning strings)
- Vanilla CSS and JS (no frameworks, no build step)
- SQLite with better-sqlite3 (synchronous queries, parameterized)
- All IDs use nanoid
- ESM modules (.js extensions in imports)

## Verification

- Run `npx tsc --noEmit` after changes to confirm types check
- Run `npm run dev` to verify server starts
- Test auth flow: /login → magic link → /dashboard

## Working Rules

- Always check for existing patterns before creating new ones
- Prefer small, incremental changes over big rewrites
- Don't add dependencies without asking
- Don't refactor code that wasn't part of the task
