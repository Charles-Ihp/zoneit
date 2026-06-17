# ZONEIT / GRAVITACIO

A full-stack climbing & gym workout session generator and tracker. A rule-based
engine generates personalized training sessions from a user's level, goals,
fatigue, injuries, and available equipment; users execute sessions with a live
timer, log results, and compare on a leaderboard.

## Architecture

Two separate apps in one repo:

- **Frontend** (`/src`) — React 19 SPA. TanStack Router (file-based, in `src/routes/`),
  TanStack Query for server state, Tailwind v4 + Radix UI (`src/components/ui/`),
  React Hook Form + Zod. Built with Vite. Talks to the backend via the typed
  client in `src/lib/api.ts`.
- **Backend** (`/backend`) — **Hono on Cloudflare Workers**. Route modules in
  `backend/src/routes/` (one per resource); the Worker entry `backend/src/worker.ts`
  serves the API under `/api` and falls back to the SPA assets. Prisma ORM over
  **Cloudflare D1 (SQLite)** via the D1 driver adapter (`backend/src/lib/prisma.ts`,
  per-request `getPrisma(env)`). Auth is Google OAuth + email/password, both
  issuing 7-day JWTs (`jose` + `bcryptjs`, see `backend/src/lib/auth.ts`).

Frontend and backend ship as **one combined Worker** (`wrangler.jsonc` at the
root): same origin, so there is **no CORS**. See `docs/deploy-cloudflare.md`.

Frontend ↔ backend contract is **not shared automatically**: request/response
types are hand-mirrored between `backend/src/models/*` and `src/lib/api.ts`.
Keep them in sync by hand.

## Commands

**Always use `bun`, not `npm`,** for the frontend. The backend's own scripts
call `npx` internally (that's fine — run them via `bun run`).

```bash
# Frontend dev with HMR (vite :5173); .env points VITE_API_URL at the Worker
bun run dev

# The combined Worker (serves built /dist + the API) on :8787
bun run build                        # produce /dist first (relative API base)
cd backend && bun run dev            # wrangler dev

# Typecheck (fast — no test suite exists, this is the main safety net)
bun run typecheck                    # frontend (tsc --noEmit)
cd backend && bun run typecheck      # backend (tsc --noEmit, Workers types)

# Lint (run before committing)
bun run lint                         # all files
bun run lint:file -- path/to/file.tsx
bun run format                       # prettier --write .

# Build + deploy
bun run build                        # frontend → /dist
cd backend && bun run deploy         # wrangler deploy (combined Worker)
```

> There is **no test framework** in this repo. Do not run `bun run test` — it
> does not exist. Verify changes with `typecheck`, `lint`, and by running the app.

## Database

**Cloudflare D1 (SQLite).** No Docker, no Postgres. Schema lives in
`backend/prisma/schema.prisma` (`provider = "sqlite"`, driver adapters).

```bash
cd backend
bun run prisma:generate              # regenerate Prisma client
bun run d1:migrate:local             # apply prisma/d1-migrations to local D1
bun run prisma:studio                # browse data
# seed the exercise catalog into D1:
bun run --cwd .. scripts/gen-seed-sql.ts > prisma/seed.sql
npx wrangler d1 execute zoneit --local --file prisma/seed.sql --config ../wrangler.jsonc
```

Migrations are SQLite SQL files in `backend/prisma/d1-migrations/`, applied with
`wrangler d1 migrations apply`. To change the schema: edit `schema.prisma`, then
`prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma
--script` (or a `--from-schema-datasource` diff for incremental changes) into a
new numbered file in `d1-migrations/`.

Two SQLite-specific shapes to know:
- The former Postgres **array** columns are **join tables** (`ExerciseWallType`,
  `…Level`, `…Equipment`, `…InjuryRisk`, `…Focus`, `ProgramProgressCompletedDay`).
  Read them via `exerciseInclude`/`hydrateExercise` so the rest of the code sees
  `string[]`/`number[]` (see `backend/src/lib/exercise-hydrate.ts`).
- The **JSON** columns (`Program.days`, `Workout.sessionInput`/`generatedSession`,
  `SessionLog.exercises`, `SharedWorkout` snapshots) are stored as `String` (TEXT)
  holding JSON — Prisma 5 + SQLite has no native `Json`. (De)serialize with
  `toJson`/`fromJson` from `backend/src/lib/serialize.ts`; the wire type stays
  `Record<string, unknown>`.

Only array-form `prisma.$transaction([...])` works on D1 (maps to a batch);
interactive transactions are not supported.

## Environment

- **Frontend** `.env` (local dev): `VITE_API_URL` → the Worker dev URL
  (`http://localhost:8787`). `.env.production` sets it **empty** (same-origin,
  combined Worker).
- **Worker** secrets via `wrangler secret put` (prod) or `.dev.vars` (local):
  `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
  Non-secret vars in `wrangler.jsonc`: `FRONTEND_URL`, `APP_URL`. (`DATABASE_URL`
  in `backend/.env` is only used by the Prisma CLI; runtime uses the D1 binding.)

`JWT_SECRET` must be set or all auth breaks. Google OAuth vars are only needed if
testing Google login; email/password works without them.

## Conventions

- **Backend routes**: one Hono sub-app per resource in `backend/src/routes/`,
  mounted in `backend/src/app.ts`. Protect with `requireAuth` / `requireVip`
  middleware (`backend/src/middleware/auth.ts`); the authed user is `c.get("user")`.
  Always scope queries by `userId`. Errors: `throw httpError("…", 404)` from
  `backend/src/middleware/error.ts`. A module-level `toResponse(entity)` maps
  Prisma rows → response DTOs and converts `Date` → `.toISOString()`. Mind Hono
  route ordering (static before `:param`). The DB client is per-request:
  `const prisma = getPrisma(c.env)`.
- **Models**: response types suffixed `Response`, request bodies suffixed `Body`,
  in `backend/src/models/`.
- **Frontend API**: every endpoint gets a method on the `api` object in
  `src/lib/api.ts`, grouped by resource. Use the shared `request<T>()` helper —
  it injects the Bearer token and throws `ApiError`.
- **Routes**: file-based via `createFileRoute("/path")`; `routeTree.gen.ts` is
  auto-generated by the Vite plugin (don't edit). `$param` files → `:param`.
- **Styling**: Tailwind utilities inline; compose classes with `cn()` from
  `src/lib/utils.ts`. Reuse `src/components/ui/` primitives.
- **Naming**: PascalCase components, no `Component` suffix. Exercise IDs are short
  codes (`wm1`, `t4`).

## Known issues

- `bun run typecheck` (frontend) currently reports **pre-existing type errors**
  (mostly `GeneratedSession` JSON casts in `src/routes/`). `vite build` does NOT
  typecheck, so these don't block builds. When typechecking your own changes,
  focus on errors in files you touched — don't try to fix the whole baseline.

## Skills

- `/troubleshoot` — diagnose common dev failures (D1, env, auth, wrangler,
  empty session generation). Note: predates the Cloudflare migration; some
  Postgres/TSOA/CORS steps no longer apply.
- `/add-feature` — scaffold a new full-stack feature. Note: its TSOA/Express
  steps are superseded by the Hono route-module pattern above.
