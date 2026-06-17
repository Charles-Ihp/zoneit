import { Hono } from "hono";
import type { SessionLog } from "@prisma/client";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { toJson, fromJsonOrNull } from "../lib/serialize";
import type {
  SessionLogResponse,
  CreateSessionLogBody,
  ExerciseLogData,
} from "../models/SessionLog";

function toResponse(log: SessionLog): SessionLogResponse {
  return {
    id: log.id,
    workoutId: log.workoutId,
    sessionTitle: log.sessionTitle,
    sessionSubtitle: log.sessionSubtitle,
    startedAt: log.startedAt.toISOString(),
    durationSeconds: log.durationSeconds,
    exerciseCount: log.exerciseCount,
    notes: log.notes,
    exercises: fromJsonOrNull<ExerciseLogData[]>(log.exercises),
    createdAt: log.createdAt.toISOString(),
  };
}

export const sessionLogRoutes = new Hono<HonoEnv>();
sessionLogRoutes.use("*", requireAuth);

// GET /api/session-logs?since=
sessionLogRoutes.get("/", async (c) => {
  const user = c.get("user");
  const since = c.req.query("since");
  const prisma = getPrisma(c.env);
  const logs = await prisma.sessionLog.findMany({
    where: {
      userId: user.id,
      ...(since ? { startedAt: { gte: new Date(since) } } : {}),
    },
    orderBy: { startedAt: "desc" },
  });
  return c.json(logs.map(toResponse));
});

// POST /api/session-logs
sessionLogRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<CreateSessionLogBody>();
  const prisma = getPrisma(c.env);
  const log = await prisma.sessionLog.create({
    data: {
      userId: user.id,
      workoutId: body.workoutId ?? null,
      sessionTitle: body.sessionTitle,
      sessionSubtitle: body.sessionSubtitle ?? null,
      startedAt: new Date(body.startedAt),
      durationSeconds: body.durationSeconds,
      exerciseCount: body.exerciseCount,
      notes: body.notes ?? "",
      ...(body.exercises ? { exercises: toJson(body.exercises) } : {}),
    },
  });
  return c.json(toResponse(log), 201);
});

// POST /api/session-logs/previous-exercises — most recent data per exercise ID
sessionLogRoutes.post("/previous-exercises", async (c) => {
  const user = c.get("user");
  const { exerciseIds } = await c.req.json<{ exerciseIds: string[] }>();
  const prisma = getPrisma(c.env);

  const logs = await prisma.sessionLog.findMany({
    where: { userId: user.id, exercises: { not: null } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const result: Record<string, ExerciseLogData> = {};
  for (const exerciseId of exerciseIds) {
    for (const log of logs) {
      const exercises = fromJsonOrNull<ExerciseLogData[]>(log.exercises);
      if (!exercises) continue;
      const found = exercises.find((e) => e.id === exerciseId);
      if (found) {
        result[exerciseId] = found;
        break;
      }
    }
  }
  return c.json(result);
});

// DELETE /api/session-logs/:id
sessionLogRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const prisma = getPrisma(c.env);
  await prisma.sessionLog.deleteMany({ where: { id, userId: user.id } });
  return c.body(null, 204);
});
