import { Hono } from "hono";
import type { Prisma, Workout } from "@prisma/client";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { toJson, fromJson } from "../lib/serialize";
import { httpError } from "../middleware/error";
import type { WorkoutResponse, CreateWorkoutBody, UpdateWorkoutBody } from "../models/Workout";

function toResponse(w: Workout): WorkoutResponse {
  return {
    id: w.id,
    name: w.name,
    folderId: w.folderId,
    sessionInput: fromJson<Record<string, unknown>>(w.sessionInput),
    generatedSession: fromJson<Record<string, unknown>>(w.generatedSession),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

export const workoutRoutes = new Hono<HonoEnv>();
workoutRoutes.use("*", requireAuth);

// GET /api/workouts
workoutRoutes.get("/", async (c) => {
  const user = c.get("user");
  const prisma = getPrisma(c.env);
  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return c.json(workouts.map(toResponse));
});

// POST /api/workouts
workoutRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<CreateWorkoutBody>();
  const prisma = getPrisma(c.env);
  const workout = await prisma.workout.create({
    data: {
      name: body.name,
      userId: user.id,
      folderId: body.folderId ?? null,
      sessionInput: toJson(body.sessionInput),
      generatedSession: toJson(body.generatedSession),
    },
  });
  return c.json(toResponse(workout), 201);
});

// GET /api/workouts/:id
workoutRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const prisma = getPrisma(c.env);
  const workout = await prisma.workout.findFirst({ where: { id, userId: user.id } });
  if (!workout) {
    throw httpError("Workout not found", 404);
  }
  return c.json(toResponse(workout));
});

// PUT /api/workouts/:id
workoutRoutes.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json<UpdateWorkoutBody>();
  const prisma = getPrisma(c.env);

  const existing = await prisma.workout.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    throw httpError("Workout not found", 404);
  }
  const updateData: Prisma.WorkoutUpdateInput = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.folderId !== undefined) {
    updateData.folder = body.folderId ? { connect: { id: body.folderId } } : { disconnect: true };
  }
  if (body.generatedSession !== undefined) {
    updateData.generatedSession = toJson(body.generatedSession);
  }
  const workout = await prisma.workout.update({ where: { id }, data: updateData });
  return c.json(toResponse(workout));
});

// DELETE /api/workouts/:id
workoutRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const prisma = getPrisma(c.env);
  const existing = await prisma.workout.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    throw httpError("Workout not found", 404);
  }
  await prisma.workout.delete({ where: { id } });
  return c.body(null, 204);
});
