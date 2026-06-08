// Shared shapes for user-created custom programs. A program's `days` are stored as
// JSON; each day mirrors a SessionBlock's exercise list so it runs through the
// existing SessionView / ActiveSessionOverlay unchanged.

import type { ExerciseItem } from "../types";

export type ProgramType = "gym" | "climbing";

export interface ProgramDayExercise {
  exercise: ExerciseItem;
  /** Estimated minutes for this exercise (used for the session timer/estimate). */
  duration: number;
}

export interface ProgramDay {
  name: string;
  exercises: ProgramDayExercise[];
}
