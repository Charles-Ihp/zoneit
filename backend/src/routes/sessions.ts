import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { generateSession } from "../lib/engine";
import { exerciseInclude, hydrateExercise } from "../lib/exercise-hydrate";
import type { SessionInput } from "../models/Session";

export const sessionRoutes = new Hono<HonoEnv>();
sessionRoutes.use("*", requireAuth);

// POST /api/sessions/generate
sessionRoutes.post("/generate", async (c) => {
  const body = await c.req.json<SessionInput>();
  const prisma = getPrisma(c.env);
  const rows = await prisma.exercise.findMany({ include: exerciseInclude });
  const all = rows.map(hydrateExercise);
  return c.json(generateSession(body, all));
});
