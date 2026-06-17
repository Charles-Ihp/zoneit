import type { Prisma } from "@prisma/client";

/// The shape the rest of the app expects for an Exercise: the same flat object
/// with `string[]` fields it had when those were native Postgres array columns.
/// After normalization into join tables we hydrate rows back into this shape so
/// `engine.ts` and the exercises endpoint stay unchanged.
export interface HydratedExercise {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMin: number;
  durationMax: number;
  intensity: number;
  defaultSets: number | null;
  defaultReps: number | null;
  wallTypes: string[];
  levels: string[];
  equipment: string[];
  injuryRisk: string[];
  focus: string[];
}

/// `include` clause that pulls every join-table relation. Use with findMany /
/// findUnique so the rows can be hydrated.
export const exerciseInclude = {
  wallTypes: true,
  levels: true,
  equipment: true,
  injuryRisk: true,
  focus: true,
} satisfies Prisma.ExerciseInclude;

type ExerciseWithRelations = Prisma.ExerciseGetPayload<{
  include: typeof exerciseInclude;
}>;

/// Collapse the join-table relations back into `string[]` fields.
export function hydrateExercise(row: ExerciseWithRelations): HydratedExercise {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    durationMin: row.durationMin,
    durationMax: row.durationMax,
    intensity: row.intensity,
    defaultSets: row.defaultSets,
    defaultReps: row.defaultReps,
    wallTypes: row.wallTypes.map((r) => r.value),
    levels: row.levels.map((r) => r.value),
    equipment: row.equipment.map((r) => r.value),
    injuryRisk: row.injuryRisk.map((r) => r.value),
    focus: row.focus.map((r) => r.value),
  };
}
