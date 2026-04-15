import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import type { User, SessionLog } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { SessionLogResponse, CreateSessionLogBody } from "../models/SessionLog";

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
    createdAt: log.createdAt.toISOString(),
  };
}

@Route("api/session-logs")
@Tags("SessionLogs")
@Security("bearerAuth")
export class SessionLogController extends Controller {
  /**
   * List session logs for the authenticated user, newest first.
   * Optionally filter by a start date (ISO string).
   */
  @Get("/")
  public async listSessionLogs(
    @Request() request: ExpressRequest,
    @Query() since?: string,
  ): Promise<SessionLogResponse[]> {
    const user = (request as ExpressRequest & { user: User }).user;
    const where: Parameters<typeof prisma.sessionLog.findMany>[0]["where"] = {
      userId: user.id,
    };
    if (since) {
      where.startedAt = { gte: new Date(since) };
    }
    const logs = await prisma.sessionLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
    });
    return logs.map(toResponse);
  }

  /**
   * Record a completed training session.
   */
  @Post("/")
  @SuccessResponse(201, "Created")
  public async createSessionLog(
    @Request() request: ExpressRequest,
    @Body() body: CreateSessionLogBody,
  ): Promise<SessionLogResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
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
      },
    });
    this.setStatus(201);
    return toResponse(log);
  }

  /**
   * Delete a session log by ID.
   */
  @Delete("/{id}")
  @SuccessResponse(204, "Deleted")
  public async deleteSessionLog(
    @Request() request: ExpressRequest,
    @Path() id: string,
  ): Promise<void> {
    const user = (request as ExpressRequest & { user: User }).user;
    await prisma.sessionLog.deleteMany({ where: { id, userId: user.id } });
    this.setStatus(204);
  }
}
