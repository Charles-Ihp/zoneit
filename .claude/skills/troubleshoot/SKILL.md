---
name: troubleshoot
description: Diagnose and fix common ZONEIT/GRAVITACIO dev failures — backend won't start, DB/Prisma errors, auth/JWT 401s, CORS, port conflicts, TSOA route issues, frontend can't reach API, or session generation returning empty. Use when something is broken locally and you need a systematic diagnosis.
---

# Troubleshoot ZONEIT

Systematic diagnosis for local dev failures. Work top-down: confirm the symptom,
run the matching checks, apply the fix, verify. Always report what you found and
what you changed.

## 0. Orient first

```bash
docker compose ps                 # is Postgres up?
lsof -i :5173 -i :3001 -i :5432   # what's bound to the dev ports?
git -C . status                   # uncommitted changes that might explain it
```

Frontend is :5173, backend is :3001, Postgres is :5432.

## Symptom → checks

### Backend won't start / crashes on boot
1. **Missing env** — `backend/.env` must define `DATABASE_URL` and `JWT_SECRET`.
   Auth signing throws if `JWT_SECRET` is unset. Google OAuth vars
   (`GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`) are only needed for Google login.
2. **Postgres not running** — `docker compose up -d`, then wait for the
   healthcheck (`docker compose ps` shows `healthy`).
3. **Prisma client stale/missing** — `cd backend && bun run prisma:generate`.
   Symptom: `@prisma/client did not initialize yet` or unknown-field type errors.
4. **TSOA not generated** — `cd backend && bun run tsoa`. Symptom: import errors
   from `src/generated/routes.ts`, or missing routes at runtime. (`dev`/`build`
   already run this, but a manual `tsc`/`node` run may not.)

### "Database" / Prisma errors
- `P1001 can't reach database server` → Postgres down or wrong `DATABASE_URL`.
  Default: `postgresql://zoneit:zoneit@localhost:5432/zoneit`.
- `P3009 migrate found failed migration` / drift → in dev you can reset:
  `cd backend && npx prisma migrate reset` (DROPS all data, re-seeds).
- Column/field unknown after a schema edit → you forgot
  `bun run prisma:migrate` (writes migration + applies) then
  `bun run prisma:generate`.
- Empty exercise list / leaderboard → DB not seeded: `cd backend && npx prisma db seed`.

### 401 Unauthorized on API calls
- Token expires after **7 days** — log out and back in (clears `auth_token` in
  localStorage, gets a fresh JWT).
- `JWT_SECRET` changed between sign and verify → all existing tokens invalid;
  re-login. Verification lives in `backend/src/authentication.ts`.
- Missing `Authorization: Bearer` header → the frontend only attaches it if
  `auth_token` is in localStorage (see `request()` in `src/lib/api.ts`). Check
  the user is actually logged in.
- Protected route → controller has `@Security("bearerAuth")`. Public ones (terms,
  exercises, leaderboard, `/w/:code`) must NOT have it.

### CORS errors in the browser console
- Backend allows `FRONTEND_URL` (comma-separated) plus `localhost:5173` and
  `localhost:8080` (see `backend/src/app.ts`). If the frontend runs on a
  different host/port, add it to `FRONTEND_URL` in `backend/.env`.
- Google OAuth redirect mismatch → `GOOGLE_CALLBACK_URL` must exactly match the
  redirect URI registered in Google Cloud Console.

### Frontend can't reach the backend
- `VITE_API_URL` (frontend `.env`) must point at the backend (default
  `http://localhost:3001`). Vite only reads env at **startup** — restart `bun run dev`
  after changing it.
- Confirm backend is alive: `curl localhost:3001/health` → `{"status":"ok"}`.

### Port already in use (EADDRINUSE)
```bash
lsof -ti :3001 | xargs kill    # backend
lsof -ti :5173 | xargs kill    # frontend
lsof -ti :5432 | xargs kill    # or: docker compose down
```

### Session generation returns an empty session
The engine (`backend/src/lib/engine.ts`) filters the exercise library by level,
wall types, equipment, and injuries. Over-constrained input → no matches.
- Confirm exercises are seeded (see above).
- Loosen the input (fewer injuries / more equipment / wall types) to isolate
  whether it's data or filter logic.
- Add a temporary log of the candidate count after each filter stage to find
  which filter empties the set.

### TSOA changes not taking effect
After editing controllers or their request/response models, routes are stale
until regenerated: `cd backend && bun run tsoa` (or just restart `bun run dev:backend`).
Never hand-edit `src/generated/routes.ts` or `public/swagger.json`.

### Type errors
- `bun run typecheck` has a **pre-existing baseline** of errors in `src/routes/`
  (JSON `GeneratedSession` casts). Only act on errors in files you changed.
- After a Prisma schema change, regenerate the client or backend types will be wrong.

## After fixing
Run `bun run typecheck` (and `cd backend && bun run typecheck` if backend changed),
then `bun run lint`. Report the root cause, the fix, and verification output.
