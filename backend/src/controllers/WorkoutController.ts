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
  Tags,
  SuccessResponse,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import type { User, Workout } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { WorkoutResponse, CreateWorkoutBody, UpdateWorkoutBody } from "../models/Workout";

@Route("api/workouts")
@Tags("Workouts")
@Security("bearerAuth")
export class WorkoutController extends Controller {
  /**
   * List all saved workouts for the authenticated user, newest first.
   */
  @Get("/")
  public async listWorkouts(@Request() request: ExpressRequest): Promise<WorkoutResponse[]> {
    const user = (request as ExpressRequest & { user: User }).user;
    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return workouts.map(toResponse);
  }

  /**
   * Save a new generated workout session.
   */
  @Post("/")
  @SuccessResponse(201, "Created")
  public async createWorkout(
    @Request() request: ExpressRequest,
    @Body() body: CreateWorkoutBody,
  ): Promise<WorkoutResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const workout = await prisma.workout.create({
      data: {
        name: body.name,
        userId: user.id,
        sessionInput: body.sessionInput,
        generatedSession: body.generatedSession,
      },
    });
    this.setStatus(201);
    return toResponse(workout);
  }

  /**
   * Get a single saved workout by ID (must belong to the authenticated user).
   */
  @Get("{id}")
  public async getWorkout(
    @Request() request: ExpressRequest,
    @Path() id: string,
  ): Promise<WorkoutResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const workout = await prisma.workout.findFirst({ where: { id, userId: user.id } });
    if (!workout) {
      this.setStatus(404);
      throw Object.assign(new Error("Workout not found"), { status: 404 });
    }
    return toResponse(workout);
  }

  /**
   * Rename a saved workout.
   */
  @Put("{id}")
  public async updateWorkout(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body: UpdateWorkoutBody,
  ): Promise<WorkoutResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.workout.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      this.setStatus(404);
      throw Object.assign(new Error("Workout not found"), { status: 404 });
    }
    const workout = await prisma.workout.update({ where: { id }, data: { name: body.name } });
    return toResponse(workout);
  }

  /**
   * Delete a saved workout.
   */
  @Delete("{id}")
  @SuccessResponse(204, "No Content")
  public async deleteWorkout(
    @Request() request: ExpressRequest,
    @Path() id: string,
  ): Promise<void> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.workout.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      this.setStatus(404);
      throw Object.assign(new Error("Workout not found"), { status: 404 });
    }
    await prisma.workout.delete({ where: { id } });
    this.setStatus(204);
  }
}

function toResponse(w: Workout): WorkoutResponse {
  return {
    id: w.id,
    name: w.name,
    sessionInput: w.sessionInput as Record<string, unknown>,
    generatedSession: w.generatedSession as Record<string, unknown>,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}
