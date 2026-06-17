# Deploying ZONEIT/GRAVITACIO on Cloudflare (Workers + D1)

The whole app runs as **one combined Cloudflare Worker**: it serves the built SPA
(`/dist`) as static assets and the Hono API under `/api`, backed by **Cloudflare
D1** (SQLite). There is no separate backend service, no Postgres, and no Railway.

```
Browser ──▶ Worker "gravitacio"
              ├─ /health, /api/*          → Hono app  ──▶ D1 (env.DB)
              └─ everything else          → static SPA (env.ASSETS, SPA fallback)
```

Config lives in `wrangler.jsonc` (root). The Worker entry is `backend/src/worker.ts`.

## Prerequisites

- A Cloudflare account with Workers + D1 enabled, and `wrangler` authenticated
  (`npx wrangler login`).
- `bun` installed (frontend build).
- The Railway Postgres connection string (for the one-time data migration).

## Local development

```bash
# 1. Create + migrate + seed a LOCAL D1 (first time only)
cd backend
bun run d1:migrate:local                                   # applies prisma/d1-migrations
bun run --cwd .. scripts/gen-seed-sql.ts > prisma/seed.sql # exercise catalog SQL
npx wrangler d1 execute zoneit --local --file prisma/seed.sql --config ../wrangler.jsonc

# 2. Secrets for local dev: copy and fill .dev.vars
cp ../.dev.vars.example ../.dev.vars     # then edit JWT_SECRET, GOOGLE_* …

# 3. Run the combined Worker (serves SPA from ../dist + API)
cd .. && bun run build                    # produce /dist (uses .env.production → relative API)
cd backend && bun run dev                 # wrangler dev on http://localhost:8787

# For frontend HMR instead, run `bun run dev` at the root (vite :5173) — .env
# points VITE_API_URL at http://localhost:8787 so it talks to `wrangler dev`.
```

Smoke test (local): `curl localhost:8787/health`, `curl localhost:8787/api/exercises`.

## One-time production setup

```bash
# Create the production D1 database, then paste its id into wrangler.jsonc
npx wrangler d1 create zoneit
#  → set "database_id" in wrangler.jsonc d1_databases[0]

# Apply the schema to the REMOTE D1
npx wrangler d1 migrations apply zoneit --remote

# Set production secrets (one prompt each)
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_CALLBACK_URL      # https://<your-domain>/api/auth/google/callback
# The post-OAuth redirect target and share-link base are derived from the request
# origin automatically — no FRONTEND_URL/APP_URL needed. (Set them in wrangler.jsonc
# `vars` only to override the derived origin.) GOOGLE_CALLBACK_URL must be the exact
# prod URL and must match the authorized redirect URI in the Google console.
```

In the **Google Cloud console**, add the new authorized redirect URI
`https://<your-domain>/api/auth/google/callback` to the existing OAuth client.

## Big-bang cutover (retire Railway)

> Take a backup first and DO NOT delete the Railway Postgres until step 4 passes.

1. **Back up** the Railway Postgres: `pg_dump "$RAILWAY_DATABASE_URL" > backup.sql`.

2. **Migrate the data** PG → D1:
   ```bash
   SOURCE_DATABASE_URL="$RAILWAY_DATABASE_URL" bun run scripts/pg-to-d1.ts > seed-data.sql
   # review the printed source row counts (STDERR)
   npx wrangler d1 execute zoneit --remote --file seed-data.sql
   ```
   The script transforms the Postgres array columns into join-table rows and the
   JSON(b) columns into JSON-encoded TEXT.
   > Rehearse this against a throwaway D1 (`wrangler d1 create zoneit-rehearsal`)
   > before doing it for real — it has not been exercised against a live Postgres
   > in CI.

3. **Build + deploy** the combined Worker:
   ```bash
   bun run build                 # /dist with relative API base (.env.production)
   npx wrangler deploy
   ```

4. **Verify (cutover gate).** Compare D1 row counts to the source counts from
   step 2 — abort and investigate on any mismatch:
   ```bash
   for t in User Exercise Folder Workout SessionLog Program ProgramProgress \
            SharedWorkout AppConfig PromoCode Term; do
     printf "%-18s " "$t"
     npx wrangler d1 execute zoneit --remote --command "SELECT COUNT(*) AS n FROM \"$t\";"
   done
   ```
   Then smoke-test production: load the SPA, deep-link `/leaderboard`, log in with
   email/password (verifies a migrated bcrypt hash — no reset needed) and with
   Google, generate a session, save a workout, view the leaderboard.

5. **Point DNS / attach the custom domain** to the Worker (Workers ▸ Triggers ▸
   Custom Domains, or a route on your zone).

6. **Decommission Railway** — delete the frontend, backend, bots, and Postgres
   services. (The `railway.toml` files and `bots/` are already removed from the repo.)

## Rollback

There is no parallel grace period (big-bang). The rollback is the `pg_dump`
backup from step 1 plus the still-running Railway services *until you delete them
in step 6* — so keep Railway alive until production is verified.

## Notes / known constraints

- **JSON columns** are stored as TEXT (Prisma 5 + SQLite has no native `Json`).
  (De)serialization is centralized in `backend/src/lib/serialize.ts` and the
  per-resource `toResponse` mappers.
- **Array columns** are join tables (`Exercise*` and `ProgramProgressCompletedDay`),
  hydrated in `backend/src/lib/exercise-hydrate.ts` and `routes/programs.ts`.
- **Prisma transactions:** only array-form `$transaction([...])` is used (folder
  reorder) — it maps to a D1 batch. Interactive transactions are not supported on D1.
- **Auth:** `bcryptjs` (verifies existing `$2b$` hashes), `jose` HS256 JWTs
  (compatible with tokens issued by the old `jsonwebtoken`), hand-rolled Google
  OAuth2 — see `backend/src/lib/auth.ts`.
- The old TSOA `backend/public/swagger.json` is kept as a frozen contract
  reference; remove it once you're confident parity holds.
