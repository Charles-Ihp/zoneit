// Registry of built-in (app-provided) programs. These are not stored in the DB —
// they're rendered from static modules and gated like any program. Custom user
// programs (from the DB) are handled separately in the routes.

import type { GeneratedSession } from "../types";
import type { ProgramType } from "./types";
import { RCP_META, RCP_PROGRAM_ID, buildProgramSession } from "./rcp-split";
import {
  DYNO_TECH_ID,
  DYNO_TECH_WEEKS,
  DYNO_TECH_DAYS,
  buildDynoTechSession,
} from "./dyno-technique";

export interface WeekRow {
  week: number;
  phase: number;
  mainPyramid: number[];
  accessoryReps: number;
}

/** Normalized shape consumed by the programs list + detail pages. */
export interface ProgramDescriptor {
  id: string;
  name: string;
  type: ProgramType;
  typeLabel: string;
  description: string;
  lengthWeeks: number;
  trainingDays: number;
  days: { name: string; subtitle: string }[];
  buildSession: (week: number, dayIndex: number) => GeneratedSession;
  isBuiltIn: boolean;
  /** Per-week periodization table (RCP-Split only). */
  weekTable?: WeekRow[];
}

const rcp: ProgramDescriptor = {
  id: RCP_PROGRAM_ID,
  name: RCP_META.name,
  type: "gym",
  typeLabel: "Gym · Built-in",
  description: RCP_META.description,
  lengthWeeks: RCP_META.weeks,
  trainingDays: RCP_META.trainingDays,
  days: RCP_META.days.map((d) => ({
    name: d.focusLabel,
    subtitle: `${d.dayLabel} · ${d.mainLift}`,
  })),
  buildSession: (w, di) => buildProgramSession(w, di),
  isBuiltIn: true,
  weekTable: RCP_META.weekTable,
};

const dynoTech: ProgramDescriptor = {
  id: DYNO_TECH_ID,
  name: "Dyno & Technique",
  type: "climbing",
  typeLabel: "Climbing · Built-in",
  description:
    "A 2-day-per-week climbing block for intermediate to advanced climbers: one explosive " +
    "dyno/power day and one movement-technique day. Repeats on an 8-week loop.",
  lengthWeeks: DYNO_TECH_WEEKS,
  trainingDays: DYNO_TECH_DAYS.length,
  days: DYNO_TECH_DAYS,
  buildSession: (w, di) => buildDynoTechSession(w, di),
  isBuiltIn: true,
};

export const BUILTIN_PROGRAMS: ProgramDescriptor[] = [rcp, dynoTech];

export function getBuiltinProgram(id: string): ProgramDescriptor | undefined {
  return BUILTIN_PROGRAMS.find((p) => p.id === id);
}
