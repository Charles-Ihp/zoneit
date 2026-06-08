import { Body, Controller, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";
import type { Request as ExpressRequest } from "express";
import type { User, ProgramProgress } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ProgramProgressResponse, CompleteDayBody } from "../models/Program";

/** Cycle dimensions — must match the frontend program module (rcp-split.ts). */
const WEEKS = 12;
const TRAINING_DAYS = 4;

@Route("api/programs")
@Tags("Programs")
@Security("bearerAuth")
export class ProgramController extends Controller {
  /**
   * Get the authenticated user's progress in a program, or null if not started.
   */
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

  /**
   * Start (or resume) a program. Creates progress at week 1 with no days completed
   * if none exists; returns the existing progress otherwise so re-clicking is safe.
   */
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

    const dayIndex = Math.trunc(body.dayIndex);
    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex >= TRAINING_DAYS) {
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
      update: { completedDays: [...completedDays].sort((a, b) => a - b), completedCount: { increment: 1 } },
      create: {
        userId: user.id,
        programId,
        week: 1,
        completedDays: [dayIndex],
        completedCount: 1,
      },
    });
    return toResponse(progress);
  }

  /**
   * Advance to the next week, wrapping within the 12-week cycle (Week 12 → Week 1)
   * — "a circle every 12 weeks" — and clearing the week's completed days.
   */
  @Post("{programId}/advance-week")
  public async advanceWeek(
    @Request() request: ExpressRequest,
    @Path() programId: string,
  ): Promise<ProgramProgressResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.programProgress.findUnique({
      where: { userId_programId: { userId: user.id, programId } },
    });
    const currentWeek = existing?.week ?? 1;
    const nextWeek = currentWeek >= WEEKS ? 1 : currentWeek + 1;

    const progress = await prisma.programProgress.upsert({
      where: { userId_programId: { userId: user.id, programId } },
      update: { week: nextWeek, completedDays: [] },
      create: { userId: user.id, programId, week: nextWeek, completedDays: [] },
    });
    return toResponse(progress);
  }

  /**
   * Reset the program back to week 1 with no days completed (keeps the lifetime count).
   */
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
