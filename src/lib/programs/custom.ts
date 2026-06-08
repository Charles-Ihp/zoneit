// Build a runnable GeneratedSession from a custom program's day. Custom programs
// repeat the same days every week (no per-week periodization), so `week` only
// affects the title.

import type { GeneratedSession } from "../types";
import type { ProgramResponse } from "../api";
import type { ProgramDay } from "./types";

/** The program's days, typed (stored as JSON on the backend). */
export function programDays(program: ProgramResponse): ProgramDay[] {
  return Array.isArray(program.days) ? (program.days as ProgramDay[]) : [];
}

export function buildProgramDaySession(
  program: ProgramResponse,
  dayIndex: number,
  week: number,
): GeneratedSession {
  const days = programDays(program);
  const day = days[dayIndex];
  const exercises = day?.exercises ?? [];
  const totalDuration = exercises.reduce((sum, e) => sum + (e.duration || 0), 0);
  const dayName = day?.name || `Day ${dayIndex + 1}`;

  return {
    title: `${program.name} — Week ${week}, ${dayName}`,
    subtitle: `${exercises.length} exercise${exercises.length === 1 ? "" : "s"}`,
    totalDuration,
    blocks: [
      {
        phase: "main",
        phaseLabel: dayName,
        exercises,
        totalDuration,
      },
    ],
    tips: [],
  };
}
