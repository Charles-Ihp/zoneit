import { Controller, Get, Query, Route, Tags } from "tsoa";
import type { Exercise } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ExerciseResponse } from "../models/Exercise";

function toResponse(ex: Exercise): ExerciseResponse {
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

@Route("api/exercises")
@Tags("Exercises")
export class ExerciseController extends Controller {
  /**
   * List all exercises, optionally filtered by search query.
   * Search matches name or category (case-insensitive).
   */
  @Get("/")
  public async listExercises(@Query() q?: string): Promise<ExerciseResponse[]> {
    const exercises = await prisma.exercise.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { focus: { hasSome: [q.toLowerCase()] } },
            ],
          }
        : undefined,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return exercises.map(toResponse);
  }
}
