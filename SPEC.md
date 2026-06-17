# Spec: Migrate ZONEIT/GRAVITACIO Deployment from Railway to Cloudflare

> Status: **DRAFT — awaiting human approval.** Phase 1 (Specify) of the gated
> spec → plan → tasks → implement workflow. Do not start implementation until
> this spec is approved.

## Objective

Move the entire ZONEIT/GRAVITACIO deployment off Railway and onto the Cloudflare
stack, decommissioning Railway entirely in a single big-bang cutover.

**Why:** consolidate hosting on Cloudflare (edge delivery, unified billing/ops,
no always-on container costs for the API, free-tier-friendly D1).

**Users:** existing end users of the climbing/gym session app (no UX change is
intended — this is an infrastructure migration that must preserve current
behavior) and the solo developer/operator who owns deploys.

**Decisions locked in by the operator (2026-06-17):**

| Question | Decision |
|---|---|
| Scope | **Full stack** — frontend, backend API, and database all move; Railway is fully retired. |
| Backend runtime | **Rewrite Express + TSOA → Hono on Cloudflare Workers.** |
| Database | **Migrate PostgreSQL → Cloudflare D1 (SQLite).** |
| Topology | **One combined Worker** serves the SPA static assets *and* the API under `/api` — same origin, so **no CORS**. |
| Array columns | **Relational join tables** (not JSON-in-TEXT) for the 6 former Postgres array columns. |
| Bots cron | **Dropped** — the `bots/` fake-activity job is removed, not migrated. |
| Cutover | **Big-bang** — stand up Cloudflare and tear down Railway in the same change; no parallel grace period. |

> Implementation notes that refined this spec:
> - **Prisma stays on 5.22** (no major version bump). SQLite on Prisma 5 has no
>   native `Json` type, so the 5 JSON columns are stored as **`String` (TEXT)**
>   holding JSON, (de)serialized at the data-access boundary. The wire types
>   (`Record<string, unknown>`) are unchanged.
> - The 6 **array** columns (`wallTypes`, `levels`, `equipment`, `injuryRisk`,
>   `focus`, `completedDays`) become **join tables**, hydrated back into
>   `string[]`/`number[]` so `engine.ts` and the API responses are unchanged.

### Success Criteria (specific & testable)

1. The SPA loads from a Cloudflare-served URL (`*.workers.dev` or custom domain)
   with SPA fallback routing intact (deep links like `/leaderboard` resolve).
2. Every endpoint currently exposed by the TSOA controllers responds identically
   (same path, method, request body, response shape, status codes) from the new
   Hono Worker. Verified against the existing `backend/public/swagger.json` as a
   contract snapshot.
3. Auth works end-to-end on Workers: email/password login **against existing
   migrated password hashes**, Google OAuth login, and 7-day JWT issue/verify.
4. All production data from Railway Postgres is present in D1 after migration:
   row counts match per table, and array/JSON columns round-trip correctly.
5. The bots "fake-activity" job runs on a Cloudflare Cron Trigger on the same
   daily schedule (`0 8 * * *` UTC) and writes to D1.
6. `bun run typecheck` (frontend) shows no *new* errors beyond the documented
   pre-existing baseline; backend Worker typechecks clean.
7. All Railway services (frontend, backend, bots, Postgres) are deleted and
   `railway.toml` files are removed from the repo.

## Tech Stack

**Unchanged**
- Frontend: React 19, TanStack Router/Query, Tailwind v4, Radix UI, Vite 7, bun.
- Validation: Zod (already used both ends).

**New / changed (backend + infra)**
- Runtime: **Cloudflare Workers** (`nodejs_compat` flag) replacing Node/Express on Railway.
- HTTP framework: **Hono** replacing Express + TSOA.
- API contract/docs: **`@hono/zod-openapi`** to preserve a typed contract and a
  Swagger/OpenAPI doc (replacing TSOA's generated `swagger.json`).
- Database: **Cloudflare D1** (SQLite) replacing PostgreSQL.
- ORM: **Prisma with the D1 driver adapter** (`@prisma/adapter-d1`,
  `previewFeatures = ["driverAdapters"]`), `provider = "sqlite"`.
- Auth primitives (Workers-compatible swaps):
  - JWT: **`jose`** replacing `jsonwebtoken`.
  - Password hashing: **`bcryptjs`** (pure-JS) replacing native `bcrypt` — chosen
    specifically so **existing bcrypt hashes remain verifiable** (no forced
    password resets).
  - Google OAuth: hand-rolled OAuth2 authorization-code flow via `fetch`,
    replacing `passport` + `passport-google-oauth20`.
- Hosting: **one combined Worker** — the SPA static assets (Assets binding) and
  the Hono API in a single Worker, same origin; all tooling via **`wrangler`**.
- Secrets: **Wrangler secrets / `.dev.vars`** replacing Railway env vars.

## Commands

```bash
# ── Local dev (unchanged for app logic) ──────────────────────────────────
bun run dev:all                      # frontend :5173 + backend
bun run dev                          # frontend only

# ── Backend Worker (new) ─────────────────────────────────────────────────
cd backend
bun run dev                          # wrangler dev (local Worker + local D1)
bun run deploy                       # wrangler deploy
bun run typecheck                    # tsc --noEmit (+ worker types)

# ── Database / D1 (new) ──────────────────────────────────────────────────
npx wrangler d1 create zoneit                       # one-time: create D1 db
npx prisma generate                                 # with D1 adapter
npx wrangler d1 migrations apply zoneit --local     # apply migrations locally
npx wrangler d1 migrations apply zoneit --remote     # apply to production D1
npx wrangler d1 execute zoneit --remote --file seed.sql   # seed exercises + terms

# ── Frontend (Workers Assets) ────────────────────────────────────────────
bun run build                        # vite build -> /dist
npx wrangler deploy                  # deploy assets Worker

# ── Data migration (one-time, big-bang) ──────────────────────────────────
# scripts/pg-to-d1.ts: dump Railway Postgres -> transform arrays/JSON -> D1 import

# ── Quality gates (unchanged) ────────────────────────────────────────────
bun run typecheck
bun run lint
bun run format
```

## Project Structure

```
/                         → Frontend SPA (React/Vite) — unchanged source
  wrangler.jsonc          → REWRITTEN: SPA assets Worker (drop TanStack-Start entry)
  dist/                   → vite build output, served as static assets
  server.mjs              → DELETED (Railway-only static server)
  railway.toml            → DELETED

/backend                  → API, rewritten Express+TSOA → Hono Worker
  src/
    index.ts              → NEW Worker entry (Hono app + fetch handler)
    routes/               → Hono route modules (one per former controller)
    middleware/           → auth (jose JWT), CORS, error handling
    lib/
      engine.ts           → UNCHANGED (pure session-generation logic, reuse as-is)
      prisma.ts           → REWRITTEN: PrismaClient + D1 adapter per-request
      auth.ts             → NEW: bcryptjs verify, jose sign/verify, Google OAuth
    models/               → REUSED as zod schemas / TS types for the contract
  prisma/
    schema.prisma         → provider sqlite + driverAdapters; arrays→JSON/text
    migrations/           → NEW SQLite migration baseline for D1
  wrangler.jsonc          → NEW: API Worker + D1 binding + secrets
  railway.toml            → DELETED
  generated/, server.ts, app.ts, authentication.ts → DELETED (TSOA/Express-only)

/bots                     → fake-activity cron
  src/index.ts            → REWRITTEN: Worker with scheduled() handler + D1
  wrangler.jsonc          → NEW: cron trigger "0 8 * * *" + D1 binding
  railway.toml            → DELETED

/scripts
  pg-to-d1.ts             → NEW one-time data migration (Postgres → D1)

/docs
  deploy-cloudflare.md    → NEW runbook (create resources, secrets, cutover steps)
```

## Code Style

Match existing conventions. Backend routes use Hono + zod-openapi, keep the
TSOA-era idioms (`Response`/`Body` suffixes, `toResponse()` mappers, `userId`
scoping, `Object.assign(new Error, { status })`). Prisma client is created
**per request** (Workers have no long-lived process) and reads D1 from the env
binding:

```ts
// backend/src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export function getPrisma(env: Env) {
  const adapter = new PrismaD1(env.DB);          // env.DB = D1 binding
  return new PrismaClient({ adapter });
}

// backend/src/routes/folders.ts
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";

const folders = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

folders.get("/", requireAuth, async (c) => {
  const prisma = getPrisma(c.env);
  const userId = c.get("userId");                 // scope every query by userId
  const rows = await prisma.folder.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
  return c.json(rows.map(toFolderResponse));       // Date -> .toISOString()
});
```

Array/JSON columns that no longer exist natively in SQLite are accessed through
small helpers, not ad-hoc `JSON.parse` scattered across routes:

```ts
// String[] in Postgres -> TEXT (JSON) in SQLite
const wallTypes: string[] = JSON.parse(row.wallTypes ?? "[]");
```

## Testing Strategy

This repo has **no test framework** (per CLAUDE.md) and we are not adding one as
part of an infra migration. Verification is by typecheck, contract diffing, and
manual/scripted endpoint checks:

- **Typecheck** — `bun run typecheck` (frontend) and backend `tsc --noEmit` are
  the primary safety net. No new errors beyond the documented baseline.
- **Contract parity** — diff the new `@hono/zod-openapi` OpenAPI output against
  the existing `backend/public/swagger.json` to confirm every path/method/shape
  is preserved.
- **Endpoint smoke tests** — a `scripts/smoke.sh` (curl/httpie) hitting each
  route group against `wrangler dev` and again against the deployed Worker:
  auth (register/login/google), CRUD on workouts/folders/programs/session-logs,
  leaderboard, shared-workout import, terms, session generation.
- **Data-migration verification** — `scripts/pg-to-d1.ts` asserts per-table row
  counts match between source Postgres and target D1, and spot-checks that array
  and JSON columns deserialize.
- **Manual run** — run the SPA against the deployed API; confirm login, generate
  a session, save a workout, view leaderboard.

## Boundaries

**Always do**
- Keep the frontend↔backend contract identical (paths, methods, request/response
  shapes). The hand-mirrored types in `src/lib/api.ts` should need **no change**.
- Scope every DB query by `userId` (existing rule).
- Run `bun run typecheck` and `bun run lint` before committing.
- Take a full Railway Postgres dump (backup) **before** any destructive cutover step.
- Store all secrets via Wrangler secrets / `.dev.vars`; never commit them.
- Update this SPEC and CLAUDE.md when an architectural decision changes.

**Ask first**
- Any change to the public API contract or response shapes.
- Schema/data-model changes beyond the mechanical Postgres→SQLite type mapping
  (e.g. introducing join tables for the former array columns vs. JSON-in-TEXT).
- Adding new runtime dependencies beyond those named in Tech Stack.
- Choosing custom domain / DNS specifics and the final URL routing
  (single Worker vs. separate frontend/API Workers).
- Deleting Railway resources or the production Postgres (the irreversible step).

**Never do**
- Commit secrets, `.env`, or `.dev.vars`.
- Delete the Railway Postgres before the D1 import is verified (row counts matched).
- Force existing users to reset passwords (this is why we use `bcryptjs`, not a
  WebCrypto rehash) without explicit approval.
- Hand-edit generated artifacts (`routeTree.gen.ts`, Prisma client, OpenAPI output).
- Silently drop data during the array/JSON column transform.

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Postgres arrays** (`wallTypes`, `levels`, `equipment`, `injuryRisk`, `focus`, `completedDays`) have no SQLite equivalent | Schema + every read site changes; data transform needed | Store as JSON-encoded TEXT; centralize (de)serialization helpers; transform during migration |
| **`Json` columns** (`Program.days`, `Workout.sessionInput`/`generatedSession`, `SessionLog.exercises`, `SharedWorkout` snapshots) | SQLite stores as TEXT; Prisma `Json` behavior differs | Verify round-trip in migration script; keep `Record<string, unknown>` wire type |
| **`bcrypt` native** won't run on Workers | Login breaks | Swap to pure-JS `bcryptjs` — verifies existing hashes, no resets |
| **`passport` Google OAuth** is Express-coupled | Google login breaks | Reimplement OAuth2 code flow with `fetch` in a Hono route |
| **TSOA generation removed** | Lose routes + swagger generation | Hono explicit routes + `@hono/zod-openapi` for the spec; diff against old swagger |
| **Prisma on Workers** needs driver adapter + per-request client | API errors / cold-start cost | Use `@prisma/adapter-d1`; instantiate client per request |
| **14 Postgres migrations** can't replay on D1 | Migration history mismatch | Baseline a fresh SQLite migration from the final schema; don't replay PG history |
| **Big-bang cutover** has no rollback window | Downtime / data loss if a step fails | Full PG backup first; rehearse migration against a throwaway D1; scripted, ordered runbook in `docs/deploy-cloudflare.md` |
| **D1 limits** (size, write throughput, no extensions) | Could hit ceilings | Confirm current DB size < D1 limits during migration; app is read-heavy/small |

## Resolved Decisions

1. **Frontend hosting:** ✅ One **combined Worker** (assets + `/api`), no CORS.
2. **Array columns:** ✅ **Relational join tables.**
3. **Bots scope:** ✅ **Dropped** — not migrated.

## Open Questions (operational; needed before/at cutover)

1. **Domain/DNS:** confirm the production domain is on Cloudflare and the final
   URL for the combined Worker (apex serves both SPA and `/api`).
2. **Google OAuth credentials:** reuse the existing Google client ID/secret and
   just update the authorized redirect URI to the new `/api/auth/google/callback`.
3. **Acceptable downtime window** for the big-bang cutover (data migration + deploy
   + DNS flip).

## Next Steps (gated workflow)

1. **Approve / amend this spec** (you are here).
2. **Phase 2 — Plan:** component dependency order, what's parallelizable, verification checkpoints.
3. **Phase 3 — Tasks:** discrete tasks with acceptance + verify steps (≤5 files each).
4. **Phase 4 — Implement:** incremental, typecheck-gated, contract-diffed.
