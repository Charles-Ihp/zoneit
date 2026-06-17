import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { exerciseInclude, hydrateExercise, type HydratedExercise } from "../lib/exercise-hydrate";
import type { ExerciseResponse } from "../models/Exercise";

function toResponse(ex: HydratedExercise): ExerciseResponse {
  return {
    id: ex.id,
    name: ex.name,
    description: ex.description,
    category: ex.category,
    focus: ex.focus,
    intensity: ex.intensity,
    defaultSets: ex.defaultSets,
    defaultReps: ex.defaultReps,
  };
}

export const exerciseRoutes = new Hono<HonoEnv>();

// GET /api/exercises?q=
// `focus` is now a join table, so the focus search uses a relation filter
// (`some: { value }`) instead of the old Postgres `hasSome`. `mode:"insensitive"`
// is dropped (SQLite LIKE is already ASCII-case-insensitive).
exerciseRoutes.get("/", async (c) => {
  const q = c.req.query("q");
  const prisma = getPrisma(c.env);
  const rows = await prisma.exercise.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { category: { contains: q } },
            { focus: { some: { value: q.toLowerCase() } } },
          ],
        }
      : undefined,
    include: exerciseInclude,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return c.json(rows.map((r) => toResponse(hydrateExercise(r))));
});
