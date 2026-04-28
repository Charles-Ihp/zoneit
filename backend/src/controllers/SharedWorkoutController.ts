import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
  SuccessResponse,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type {
  SharedWorkoutResponse,
  CreateShareLinkResponse,
  ImportSharedWorkoutBody,
  ImportSharedWorkoutResponse,
} from "../models/SharedWorkout";

/** Generate a short random code for share links */
function generateShareCode(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Route("api/shared")
@Tags("Shared Workouts")
export class SharedWorkoutController extends Controller {
  /**
   * Create a share link for a workout. Requires authentication.
   * The workout must belong to the authenticated user.
   */
  @Post("workouts/{workoutId}/share")
  @Security("bearerAuth")
  @SuccessResponse(201, "Created")
  public async createShareLink(
    @Request() request: ExpressRequest,
    @Path() workoutId: string,
  ): Promise<CreateShareLinkResponse> {
    const user = (request as ExpressRequest & { user: User }).user;

    // Find the workout (must belong to user)
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId: user.id },
    });
    if (!workout) {
      this.setStatus(404);
      throw Object.assign(new Error("Workout not found"), { status: 404 });
    }

    // Generate unique code (retry if collision)
    let code: string;
    let attempts = 0;
    do {
      code = generateShareCode();
      const existing = await prisma.sharedWorkout.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    if (attempts >= 5) {
      this.setStatus(500);
      throw Object.assign(new Error("Failed to generate unique share code"), { status: 500 });
    }

    // Create the shared workout snapshot
    await prisma.sharedWorkout.create({
      data: {
        code,
        createdById: user.id,
        workoutName: workout.name,
        sessionInput: workout.sessionInput as Prisma.InputJsonValue,
        generatedSession: workout.generatedSession as Prisma.InputJsonValue,
      },
    });

    this.setStatus(201);
    const baseUrl = process.env.APP_URL || "gravitacio.com";
    return {
      code,
      shareUrl: `${baseUrl}/w/${code}`,
    };
  }

  /**
   * Get details of a shared workout by code. No authentication required.
   */
  @Get("{code}")
  public async getSharedWorkout(@Path() code: string): Promise<SharedWorkoutResponse> {
    const shared = await prisma.sharedWorkout.findUnique({
      where: { code },
      include: {
        createdBy: {
          select: { name: true, picture: true },
        },
      },
    });

    if (!shared) {
      this.setStatus(404);
      throw Object.assign(new Error("Shared workout not found"), { status: 404 });
    }

    // Check expiration
    if (shared.expiresAt && shared.expiresAt < new Date()) {
      this.setStatus(410);
      throw Object.assign(new Error("This share link has expired"), { status: 410 });
    }

    return {
      id: shared.id,
      code: shared.code,
      workoutName: shared.workoutName,
      sessionInput: shared.sessionInput as Record<string, unknown>,
      generatedSession: shared.generatedSession as Record<string, unknown>,
      createdBy: {
        name: shared.createdBy.name,
        picture: shared.createdBy.picture ?? undefined,
      },
      importCount: shared.importCount,
      expiresAt: shared.expiresAt?.toISOString(),
      createdAt: shared.createdAt.toISOString(),
    };
  }

  /**
   * Import a shared workout to the authenticated user's library.
   * Creates a copy of the workout - doesn't link to the original.
   */
  @Post("{code}/import")
  @Security("bearerAuth")
  @SuccessResponse(201, "Created")
  public async importSharedWorkout(
    @Request() request: ExpressRequest,
    @Path() code: string,
    @Body() body: ImportSharedWorkoutBody,
  ): Promise<ImportSharedWorkoutResponse> {
    const user = (request as ExpressRequest & { user: User }).user;

    const shared = await prisma.sharedWorkout.findUnique({ where: { code } });
    if (!shared) {
      this.setStatus(404);
      throw Object.assign(new Error("Shared workout not found"), { status: 404 });
    }

    // Check expiration
    if (shared.expiresAt && shared.expiresAt < new Date()) {
      this.setStatus(410);
      throw Object.assign(new Error("This share link has expired"), { status: 410 });
    }

    // Create a copy in user's library
    const workoutName = body.name || shared.workoutName;
    const workout = await prisma.workout.create({
      data: {
        name: workoutName,
        userId: user.id,
        sessionInput: shared.sessionInput as Prisma.InputJsonValue,
        generatedSession: shared.generatedSession as Prisma.InputJsonValue,
      },
    });

    // Increment import count
    await prisma.sharedWorkout.update({
      where: { code },
      data: { importCount: { increment: 1 } },
    });

    this.setStatus(201);
    return {
      workoutId: workout.id,
      name: workout.name,
    };
  }

  /**
   * List all share links created by the authenticated user.
   */
  @Get("my/links")
  @Security("bearerAuth")
  public async listMyShareLinks(
    @Request() request: ExpressRequest,
  ): Promise<SharedWorkoutResponse[]> {
    const user = (request as ExpressRequest & { user: User }).user;

    const shares = await prisma.sharedWorkout.findMany({
      where: { createdById: user.id },
      include: {
        createdBy: {
          select: { name: true, picture: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return shares.map((s) => ({
      id: s.id,
      code: s.code,
      workoutName: s.workoutName,
      sessionInput: s.sessionInput as Record<string, unknown>,
      generatedSession: s.generatedSession as Record<string, unknown>,
      createdBy: {
        name: s.createdBy.name,
        picture: s.createdBy.picture ?? undefined,
      },
      importCount: s.importCount,
      expiresAt: s.expiresAt?.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }));
  }
}
