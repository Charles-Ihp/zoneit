import {
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import type { User, ProgramProgress } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ProgramProgressResponse } from "../models/Program";

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
   * Start (or resume) a program. Creates progress at week 1 / day 0 if none
   * exists; returns the existing progress otherwise so re-clicking is safe.
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
      create: { userId: user.id, programId, week: 1, dayIndex: 0 },
    });
    return toResponse(progress);
  }

  /**
   * Advance one training day. Wraps the day within the week and the week within
   * the 12-week cycle (Week 12 → Week 1) — "a circle every 12 weeks".
   */
  @Post("{programId}/advance")
  public async advanceProgram(
    @Request() request: ExpressRequest,
    @Path() programId: string,
  ): Promise<ProgramProgressResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.programProgress.findUnique({
      where: { userId_programId: { userId: user.id, programId } },
    });
    // If somehow advancing before starting, start then count this as day 1 done.
    const current = existing ?? { week: 1, dayIndex: 0, completedCount: 0 };

    let dayIndex = current.dayIndex + 1;
    let week = current.week;
    if (dayIndex >= TRAINING_DAYS) {
      dayIndex = 0;
      week += 1;
      if (week > WEEKS) week = 1;
    }

    const progress = await prisma.programProgress.upsert({
      where: { userId_programId: { userId: user.id, programId } },
      update: { week, dayIndex, completedCount: { increment: 1 } },
      create: { userId: user.id, programId, week, dayIndex, completedCount: 1 },
    });
    return toResponse(progress);
  }

  /**
   * Reset the program back to week 1 / day 0 (keeps the lifetime completed count).
   */
  @Post("{programId}/reset")
  public async resetProgram(
    @Request() request: ExpressRequest,
    @Path() programId: string,
  ): Promise<ProgramProgressResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const progress = await prisma.programProgress.upsert({
      where: { userId_programId: { userId: user.id, programId } },
      update: { week: 1, dayIndex: 0 },
      create: { userId: user.id, programId, week: 1, dayIndex: 0 },
    });
    return toResponse(progress);
  }
}

function toResponse(p: ProgramProgress): ProgramProgressResponse {
  return {
    programId: p.programId,
    week: p.week,
    dayIndex: p.dayIndex,
    completedCount: p.completedCount,
    startedAt: p.startedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
