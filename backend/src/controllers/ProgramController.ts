import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import { Prisma, type User, type ProgramProgress, type Program } from "@prisma/client";
import { prisma } from "../lib/prisma";
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

@Route("api/programs")
@Tags("Programs")
@Security("vip")
export class ProgramController extends Controller {
  // ─── Custom program CRUD ────────────────────────────────────────────────────

  /** List the authenticated user's custom programs (newest first). */
  @Get("/")
  public async listPrograms(@Request() request: ExpressRequest): Promise<ProgramResponse[]> {
    const user = (request as ExpressRequest & { user: User }).user;
    const programs = await prisma.program.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return programs.map(toProgramResponse);
  }

  /** Create a custom program. */
  @Post("/")
  @SuccessResponse(201, "Created")
  public async createProgram(
    @Request() request: ExpressRequest,
    @Body() body: CreateProgramBody,
  ): Promise<ProgramResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const program = await prisma.program.create({
      data: {
        userId: user.id,
        name: body.name,
        description: body.description ?? "",
        type: body.type,
        lengthWeeks: body.lengthWeeks,
        days: body.days as unknown as Prisma.InputJsonValue,
      },
    });
    this.setStatus(201);
    return toProgramResponse(program);
  }

  /** All of the user's program progress rows (for the Home "continue" card). */
  @Get("progress/all")
  public async listProgress(
    @Request() request: ExpressRequest,
  ): Promise<ProgramProgressResponse[]> {
    const user = (request as ExpressRequest & { user: User }).user;
    const rows = await prisma.programProgress.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toResponse);
  }

  /** Get one custom program (owner only). */
  @Get("{id}")
  public async getProgram(
    @Request() request: ExpressRequest,
    @Path() id: string,
  ): Promise<ProgramResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const program = await prisma.program.findFirst({ where: { id, userId: user.id } });
    if (!program) {
      this.setStatus(404);
      throw Object.assign(new Error("Program not found"), { status: 404 });
    }
    return toProgramResponse(program);
  }

  /** Update a custom program (owner only). */
  @Put("{id}")
  public async updateProgram(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body: UpdateProgramBody,
  ): Promise<ProgramResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.program.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      this.setStatus(404);
      throw Object.assign(new Error("Program not found"), { status: 404 });
    }
    const program = await prisma.program.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        lengthWeeks: body.lengthWeeks,
        days:
          body.days === undefined
            ? undefined
            : (body.days as unknown as Prisma.InputJsonValue),
      },
    });
    return toProgramResponse(program);
  }

  /** Delete a custom program and its progress (owner only). */
  @Delete("{id}")
  @SuccessResponse(204, "No Content")
  public async deleteProgram(
    @Request() request: ExpressRequest,
    @Path() id: string,
  ): Promise<void> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.program.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      this.setStatus(404);
      throw Object.assign(new Error("Program not found"), { status: 404 });
    }
    await prisma.programProgress.deleteMany({ where: { userId: user.id, programId: id } });
    await prisma.program.delete({ where: { id } });
    this.setStatus(204);
  }

  // ─── Progress within a program (built-in or custom) ─────────────────────────

  /** Get the authenticated user's progress in a program, or null if not started. */
  @Get("{programId}/progress")
  public async getProgress(
    @Request() request: ExpressRequest,
    @Path() programId: string,
  ): Promise<ProgramProgressResponse | null> {
    const user = (request as ExpressRequest & { user: User }).user;
    const progress = await prisma.programProgress.findUnique({
      where: { userId_programId: { userId: user.id, programId } },
    });
    return progress ? toResponse(progress) : null;
  }

  /** Start (or resume) a program at week 1; safe to re-click. */
  @Post("{programId}/start")
  public async startProgram(
    @Request() request: ExpressRequest,
    @Path() programId: string,
  ): Promise<ProgramProgressResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const progress = await prisma.programProgress.upsert({
      where: { userId_programId: { userId: user.id, programId } },
      update: {},
      create: { userId: user.id, programId, week: 1, completedDays: [] },
    });
    return toResponse(progress);
  }

  /**
   * Mark a training day complete for the current week. Idempotent per day —
   * re-completing a day keeps a single tick but still counts the session.
   */
  @Post("{programId}/complete-day")
  public async completeDay(
    @Request() request: ExpressRequest,
    @Path() programId: string,
    @Body() body: CompleteDayBody,
  ): Promise<ProgramProgressResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const { dayCount } = await resolveDims(user.id, programId);

    const dayIndex = Math.trunc(body.dayIndex);
    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex >= dayCount) {
      this.setStatus(400);
      throw Object.assign(new Error("Invalid dayIndex"), { status: 400 });
    }

    const existing = await prisma.programProgress.findUnique({
      where: { userId_programId: { userId: user.id, programId } },
    });
    const completedDays = new Set(existing?.completedDays ?? []);
    completedDays.add(dayIndex);

    const progress = await prisma.programProgress.upsert({
      where: { userId_programId: { userId: user.id, programId } },
      update: {
        completedDays: [...completedDays].sort((a, b) => a - b),
        completedCount: { increment: 1 },
      },
      create: { userId: user.id, programId, week: 1, completedDays: [dayIndex], completedCount: 1 },
    });
    return toResponse(progress);
  }

  /**
   * Advance to the next week, wrapping within the program's cycle
   * (Week N → Week 1) and clearing the week's completed days.
   */
  @Post("{programId}/advance-week")
  public async advanceWeek(
    @Request() request: ExpressRequest,
    @Path() programId: string,
  ): Promise<ProgramProgressResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const { lengthWeeks } = await resolveDims(user.id, programId);

    const existing = await prisma.programProgress.findUnique({
      where: { userId_programId: { userId: user.id, programId } },
    });
    const currentWeek = existing?.week ?? 1;
    const nextWeek = currentWeek >= lengthWeeks ? 1 : currentWeek + 1;

    const progress = await prisma.programProgress.upsert({
      where: { userId_programId: { userId: user.id, programId } },
      update: { week: nextWeek, completedDays: [] },
      create: { userId: user.id, programId, week: nextWeek, completedDays: [] },
    });
    return toResponse(progress);
  }

  /** Reset the program back to week 1 with no days completed (keeps lifetime count). */
  @Post("{programId}/reset")
  public async resetProgram(
    @Request() request: ExpressRequest,
    @Path() programId: string,
  ): Promise<ProgramProgressResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const progress = await prisma.programProgress.upsert({
      where: { userId_programId: { userId: user.id, programId } },
      update: { week: 1, completedDays: [] },
      create: { userId: user.id, programId, week: 1, completedDays: [] },
    });
    return toResponse(progress);
  }
}

/** Resolve a program's cycle length and day count (built-in constant or DB lookup). */
async function resolveDims(
  userId: string,
  programId: string,
): Promise<{ lengthWeeks: number; dayCount: number }> {
  const builtin = BUILTIN_DIMS[programId];
  if (builtin) {
    return builtin;
  }
  const program = await prisma.program.findFirst({ where: { id: programId, userId } });
  if (!program) {
    throw Object.assign(new Error("Program not found"), { status: 404 });
  }
  const days = Array.isArray(program.days) ? program.days : [];
  return { lengthWeeks: program.lengthWeeks, dayCount: days.length };
}

function toResponse(p: ProgramProgress): ProgramProgressResponse {
  return {
    programId: p.programId,
    week: p.week,
    completedDays: p.completedDays,
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
    days: (p.days as Record<string, unknown>[] | null) ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
