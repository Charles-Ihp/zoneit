---
name: add-feature
description: Scaffold a new full-stack feature in ZONEIT/GRAVITACIO following the project's exact patterns (Prisma model → TSOA controller + models → regenerate routes → typed api.ts client → TanStack route/component). Use when adding any new feature that touches the backend, the frontend, or both.
---

# Add a Feature to ZONEIT

This codebase has a consistent full-stack pattern. Follow it end to end so the new
feature matches existing code. Read the reference files listed below before writing
— mirror them, don't invent new conventions.

## Decide the scope first
- **Frontend-only** (UI, client behavior, data inside existing JSON blobs): skip
  the backend steps. Note: `Workout.generatedSession`, `Workout.sessionInput`, and
  `SessionLog.exercises` are JSON columns — adding fields *inside* them needs no
  migration or schema change, only type updates.
- **New persisted entity or endpoint**: do the full backend flow, then frontend.

Confirm with the user which one if it's ambiguous.

## Backend flow (new endpoint / entity)

Reference files to copy the pattern from:
- Controller: `backend/src/controllers/FolderController.ts`
- Models: `backend/src/models/Folder.ts`
- Auth/user access: `backend/src/authentication.ts`
- Schema: `backend/prisma/schema.prisma`

### 1. Schema (only if persisting new data)
Add the model/fields to `backend/prisma/schema.prisma`. Scope user-owned data with
a `userId` relation and `onDelete: Cascade` like existing models. Then:
```bash
docker compose up -d
cd backend && bun run prisma:migrate    # name the migration meaningfully
bun run prisma:generate
```

### 2. Models (DTOs)
Create `backend/src/models/<Feature>.ts`. Response interface suffixed `Response`,
request bodies suffixed `Body`. Use primitives + `string` for dates (ISO).

### 3. Controller
Create `backend/src/controllers/<Feature>Controller.ts`:
- Decorate the class: `@Route("api/<feature>")`, `@Tags("<Feature>")`, and
  `@Security("bearerAuth")` if it requires login.
- Methods use `@Get/@Post/@Put/@Delete`, `@Path`, `@Query`, `@Body`, `@Request`.
- Get the user: `const user = (request as ExpressRequest & { user: User }).user;`
  and **always scope DB queries by `user.id`**.
- Errors: `throw Object.assign(new Error("Not found"), { status: 404 })`
  (also call `this.setStatus(404)`).
- Add a module-level `toResponse(entity): <Feature>Response` mapping Prisma rows
  to DTOs, converting `Date` fields with `.toISOString()`.
- Use `@SuccessResponse(201, "Created")` / `(204, "No Content")` where apt.

### 4. Regenerate routes (required — easy to forget)
```bash
cd backend && bun run tsoa
```
This rewrites `src/generated/routes.ts` and `public/swagger.json` from your
decorators. Never edit those by hand. (`bun run dev:backend` also regenerates.)

### 5. Verify backend
```bash
cd backend && bun run typecheck
```

## Frontend flow

Reference files:
- API client: `src/lib/api.ts`
- A route/page: `src/routes/leaderboard.tsx` (simple fetch) or
  `src/routes/workouts/index.tsx` (richer)
- UI primitives: `src/components/ui/`

### 6. Mirror the types + add client methods
In `src/lib/api.ts`, hand-mirror the backend's `Response`/`Body` interfaces (the
contract is NOT auto-shared), then add a resource group to the `api` object using
the shared `request<T>()` helper (it injects the Bearer token and throws `ApiError`):
```ts
export const api = {
  // ...
  <feature>: {
    list: () => request<FeatureResponse[]>("/api/<feature>"),
    create: (body: CreateFeatureBody) =>
      request<FeatureResponse>("/api/<feature>", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
```

### 7. UI
- **New page**: add `src/routes/<name>.tsx` with
  `export const Route = createFileRoute("/<name>")({ component, head })`. The Vite
  plugin regenerates `routeTree.gen.ts` automatically (don't edit it). `$param`
  filenames map to `:param`. Add navigation in `src/components/AppSidebar.tsx` if
  it should be reachable.
- **Within an existing page/component**: edit the relevant file in `src/routes/`
  or `src/components/`.
- Data fetching: small pages use `api.<feature>.x()` in `useEffect`/with state
  (see `leaderboard.tsx`); prefer TanStack Query (`useQuery`/`useMutation`) for
  cached/mutating data. Read auth via `useAuth()`.
- Styling: Tailwind utilities inline, compose with `cn()` from `src/lib/utils.ts`,
  reuse Radix-based primitives in `src/components/ui/` rather than new ones.

### 8. Verify frontend
```bash
bun run typecheck                     # ignore the pre-existing baseline errors;
                                      # only your touched files must be clean
bun run lint:file -- <changed files>
```

## Final checklist
- [ ] Schema migrated + Prisma client regenerated (if data added)
- [ ] Controller scopes all queries by `user.id`; `@Security` matches auth need
- [ ] `bun run tsoa` run (routes/swagger regenerated)
- [ ] `api.ts` types mirror backend models exactly; client methods added
- [ ] Backend + frontend typecheck pass for changed files; lint clean
- [ ] Navigation/entry point wired up if a new page
- [ ] Manually exercised the flow (no test suite exists — run the app to confirm)
