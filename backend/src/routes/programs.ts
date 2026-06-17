import { Hono } from "hono";
import { Prisma, type Program } from "@prisma/client";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { requireVip } from "../middleware/auth";
import { httpError } from "../middleware/error";
import { toJson, fromJson } from "../lib/serialize";
import type {
  ProgramProgressResponse,
  CompleteDayBody,
  ProgramResponse,
  CreateProgramBody,
  UpdateProgramBody,
} from "../models/Program";

/** Built-in (app-provided) programs and their fixed dimensions — must match the
 *  frontend registry in src/lib/programs/builtins.ts. */
const BUILTIN_DIMS: Record<string, { lengthWeeks: number; dayCount: number }> = {
  "rcp-split": { lengthWeeks: 12, dayCount: 4 },
  "dyno-technique": { lengthWeeks: 8, dayCount: 2 },
};

const progressInclude = { completedDays: true } satisfies Prisma.ProgramProgressInclude;
type ProgressWithDays = Prisma.ProgramProgressGetPayload<{ include: typeof progressInclude }>;

function toResponse(p: ProgressWithDays): ProgramProgressResponse {
  return {
    programId: p.programId,
    week: p.week,
    completedDays: p.completedDays.map((d) => d.day).sort((a, b) => a - b),
    completedCount: p.completedCount,
    startedAt: p.startedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function toProgramResponse(p: Program): ProgramResponse {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    type: p.type,
    lengthWeeks: p.lengthWeeks,
    days: fromJson<Record<string, unknown>[]>(p.days),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

type Db = ReturnType<typeof getPrisma>;

/** Resolve a program's cycle length and day count (built-in constant or DB lookup). */
async function resolveDims(
  prisma: Db,
  userId: string,
  programId: string,
): Promise<{ lengthWeeks: number; dayCount: number }> {
  const builtin = BUILTIN_DIMS[programId];
  if (builtin) return builtin;
  const program = await prisma.program.findFirst({ where: { id: programId, userId } });
  if (!program) {
    throw httpError("Program not found", 404);
  }
  const days = fromJson<unknown[]>(program.days);
  return { lengthWeeks: program.lengthWeeks, dayCount: Array.isArray(days) ? days.length : 0 };
}

export const programRoutes = new Hono<HonoEnv>();
programRoutes.use("*", requireVip);

// ─── Custom program CRUD ──────────────────────────────────────────────────────

// GET /api/programs
programRoutes.get("/", async (c) => {
  const user = c.get("user");
  const prisma = getPrisma(c.env);
  const programs = await prisma.program.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return c.json(programs.map(toProgramResponse));
});

// POST /api/programs
programRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<CreateProgramBody>();
  const prisma = getPrisma(c.env);
  const program = await prisma.program.create({
    data: {
      userId: user.id,
      name: body.name,
      description: body.description ?? "",
      type: body.type,
      lengthWeeks: body.lengthWeeks,
      days: toJson(body.days),
    },
  });
  return c.json(toProgramResponse(program), 201);
});

// GET /api/programs/progress/all — registered before "/:id" (static wins anyway)
programRoutes.get("/progress/all", async (c) => {
  const user = c.get("user");
  const prisma = getPrisma(c.env);
  const rows = await prisma.programProgress.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: progressInclude,
  });
  return c.json(rows.map(toResponse));
});

// GET /api/programs/:id
programRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const prisma = getPrisma(c.env);
  const program = await prisma.program.findFirst({ where: { id, userId: user.id } });
  if (!program) {
    throw httpError("Program not found", 404);
  }
  return c.json(toProgramResponse(program));
});

// PUT /api/programs/:id
programRoutes.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json<UpdateProgramBody>();
  const prisma = getPrisma(c.env);

  const existing = await prisma.program.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    throw httpError("Program not found", 404);
  }
  const program = await prisma.program.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      type: body.type,
      lengthWeeks: body.lengthWeeks,
      days: body.days === undefined ? undefined : toJson(body.days),
    },
  });
  return c.json(toProgramResponse(program));
});

// DELETE /api/programs/:id
programRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const prisma = getPrisma(c.env);

  const existing = await prisma.program.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    throw httpError("Program not found", 404);
  }
  // Clear progress (+ its completed-day children) explicitly — don't rely on D1
  // foreign-key cascade behavior.
  await prisma.programProgressCompletedDay.deleteMany({
    where: { progress: { userId: user.id, programId: id } },
  });
  await prisma.programProgress.deleteMany({ where: { userId: user.id, programId: id } });
  await prisma.program.delete({ where: { id } });
  return c.body(null, 204);
});

// ─── Progress within a program (built-in or custom) ───────────────────────────

// GET /api/programs/:programId/progress
programRoutes.get("/:programId/progress", async (c) => {
  const user = c.get("user");
  const programId = c.req.param("programId");
  const prisma = getPrisma(c.env);
  const progress = await prisma.programProgress.findUnique({
    where: { userId_programId: { userId: user.id, programId } },
    include: progressInclude,
  });
  return c.json(progress ? toResponse(progress) : null);
});

// POST /api/programs/:programId/start
programRoutes.post("/:programId/start", async (c) => {
  const user = c.get("user");
  const programId = c.req.param("programId");
  const prisma = getPrisma(c.env);
  const progress = await prisma.programProgress.upsert({
    where: { userId_programId: { userId: user.id, programId } },
    update: {},
    create: { userId: user.id, programId, week: 1 },
    include: progressInclude,
  });
  return c.json(toResponse(progress));
});

// POST /api/programs/:programId/complete-day
programRoutes.post("/:programId/complete-day", async (c) => {
  const user = c.get("user");
  const programId = c.req.param("programId");
  const body = await c.req.json<CompleteDayBody>();
  const prisma = getPrisma(c.env);

  const { dayCount } = await resolveDims(prisma, user.id, programId);
  const dayIndex = Math.trunc(body.dayIndex);
  if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex >= dayCount) {
    throw httpError("Invalid dayIndex", 400);
  }

  // Ensure the progress row exists and bump the lifetime count (every call).
  const base = await prisma.programProgress.upsert({
    where: { userId_programId: { userId: user.id, programId } },
    update: { completedCount: { increment: 1 } },
    create: { userId: user.id, programId, week: 1, completedCount: 1 },
  });
  // Idempotent per day (the join-table PK dedups).
  await prisma.programProgressCompletedDay.upsert({
    where: { progressId_day: { progressId: base.id, day: dayIndex } },
    update: {},
    create: { progressId: base.id, day: dayIndex },
  });

  const full = await prisma.programProgress.findUniqueOrThrow({
    where: { id: base.id },
    include: progressInclude,
  });
  return c.json(toResponse(full));
});

// POST /api/programs/:programId/advance-week
programRoutes.post("/:programId/advance-week", async (c) => {
  const user = c.get("user");
  const programId = c.req.param("programId");
  const prisma = getPrisma(c.env);

  const { lengthWeeks } = await resolveDims(prisma, user.id, programId);
  const existing = await prisma.programProgress.findUnique({
    where: { userId_programId: { userId: user.id, programId } },
  });
  const currentWeek = existing?.week ?? 1;
  const nextWeek = currentWeek >= lengthWeeks ? 1 : currentWeek + 1;

  const base = await prisma.programProgress.upsert({
    where: { userId_programId: { userId: user.id, programId } },
    update: { week: nextWeek },
    create: { userId: user.id, programId, week: nextWeek },
  });
  // Clear the week's completed days.
  await prisma.programProgressCompletedDay.deleteMany({ where: { progressId: base.id } });

  const full = await prisma.programProgress.findUniqueOrThrow({
    where: { id: base.id },
    include: progressInclude,
  });
  return c.json(toResponse(full));
});

// POST /api/programs/:programId/reset
programRoutes.post("/:programId/reset", async (c) => {
  const user = c.get("user");
  const programId = c.req.param("programId");
  const prisma = getPrisma(c.env);

  const base = await prisma.programProgress.upsert({
    where: { userId_programId: { userId: user.id, programId } },
    update: { week: 1 },
    create: { userId: user.id, programId, week: 1 },
  });
  await prisma.programProgressCompletedDay.deleteMany({ where: { progressId: base.id } });

  const full = await prisma.programProgress.findUniqueOrThrow({
    where: { id: base.id },
    include: progressInclude,
  });
  return c.json(toResponse(full));
});
