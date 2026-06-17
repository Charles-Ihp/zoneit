import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { httpError } from "../middleware/error";
import { fromJson } from "../lib/serialize";
import type {
  SharedWorkoutResponse,
  ImportSharedWorkoutBody,
} from "../models/SharedWorkout";

/** Generate a short random code for share links. */
function generateShareCode(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function toSharedResponse(s: {
  id: string;
  code: string;
  workoutName: string;
  sessionInput: string;
  generatedSession: string;
  createdBy: { name: string; picture: string | null };
  importCount: number;
  expiresAt: Date | null;
  createdAt: Date;
}): SharedWorkoutResponse {
  return {
    id: s.id,
    code: s.code,
    workoutName: s.workoutName,
    sessionInput: fromJson<Record<string, unknown>>(s.sessionInput),
    generatedSession: fromJson<Record<string, unknown>>(s.generatedSession),
    createdBy: { name: s.createdBy.name, picture: s.createdBy.picture ?? undefined },
    importCount: s.importCount,
    expiresAt: s.expiresAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

export const sharedRoutes = new Hono<HonoEnv>();

// POST /api/shared/workouts/:workoutId/share (auth)
sharedRoutes.post("/workouts/:workoutId/share", requireAuth, async (c) => {
  const user = c.get("user");
  const workoutId = c.req.param("workoutId");
  const prisma = getPrisma(c.env);

  const workout = await prisma.workout.findFirst({ where: { id: workoutId, userId: user.id } });
  if (!workout) {
    throw httpError("Workout not found", 404);
  }
  // Same-origin combined Worker: build share links off the request origin
  // (APP_URL env var kept only as an explicit override).
  const baseUrl = c.env.APP_URL || new URL(c.req.url).origin;

  const existing = await prisma.sharedWorkout.findFirst({
    where: { workoutId, createdById: user.id },
  });
  if (existing) {
    await prisma.sharedWorkout.update({
      where: { id: existing.id },
      data: {
        workoutName: workout.name,
        sessionInput: workout.sessionInput,
        generatedSession: workout.generatedSession,
      },
    });
    return c.json({ code: existing.code, shareUrl: `${baseUrl}/w/${existing.code}` }, 201);
  }

  let code = "";
  let attempts = 0;
  do {
    code = generateShareCode();
    const codeExists = await prisma.sharedWorkout.findUnique({ where: { code } });
    if (!codeExists) break;
    attempts++;
  } while (attempts < 5);
  if (attempts >= 5) {
    throw httpError("Failed to generate unique share code", 500);
  }

  await prisma.sharedWorkout.create({
    data: {
      code,
      createdById: user.id,
      workoutId,
      workoutName: workout.name,
      sessionInput: workout.sessionInput,
      generatedSession: workout.generatedSession,
    },
  });
  return c.json({ code, shareUrl: `${baseUrl}/w/${code}` }, 201);
});

// GET /api/shared/my/links (auth) — registered before "/:code" (static wins).
sharedRoutes.get("/my/links", requireAuth, async (c) => {
  const user = c.get("user");
  const prisma = getPrisma(c.env);
  const shares = await prisma.sharedWorkout.findMany({
    where: { createdById: user.id },
    include: { createdBy: { select: { name: true, picture: true } } },
    orderBy: { createdAt: "desc" },
  });
  return c.json(shares.map(toSharedResponse));
});

// GET /api/shared/:code (public)
sharedRoutes.get("/:code", async (c) => {
  const code = c.req.param("code");
  const prisma = getPrisma(c.env);
  const shared = await prisma.sharedWorkout.findUnique({
    where: { code },
    include: { createdBy: { select: { name: true, picture: true } } },
  });
  if (!shared) {
    throw httpError("Shared workout not found", 404);
  }
  if (shared.expiresAt && shared.expiresAt < new Date()) {
    throw httpError("This share link has expired", 410);
  }
  return c.json(toSharedResponse(shared));
});

// POST /api/shared/:code/import (auth)
sharedRoutes.post("/:code/import", requireAuth, async (c) => {
  const user = c.get("user");
  const code = c.req.param("code");
  const body = await c.req.json<ImportSharedWorkoutBody>().catch(() => ({}) as ImportSharedWorkoutBody);
  const prisma = getPrisma(c.env);

  const shared = await prisma.sharedWorkout.findUnique({ where: { code } });
  if (!shared) {
    throw httpError("Shared workout not found", 404);
  }
  if (shared.expiresAt && shared.expiresAt < new Date()) {
    throw httpError("This share link has expired", 410);
  }

  const workoutName = body.name || shared.workoutName;
  const workout = await prisma.workout.create({
    data: {
      name: workoutName,
      userId: user.id,
      sessionInput: shared.sessionInput,
      generatedSession: shared.generatedSession,
    },
  });
  await prisma.sharedWorkout.update({
    where: { code },
    data: { importCount: { increment: 1 } },
  });

  return c.json({ workoutId: workout.id, name: workout.name }, 201);
});
