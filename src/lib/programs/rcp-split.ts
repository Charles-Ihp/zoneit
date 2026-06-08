// RCP-Split — a fixed 12-week gym program that loops forever ("a circle every
// 12 weeks"). The exercises are identical every week; only the rep scheme
// periodizes across three 4-week phases. Source: docs/Hoang-Phi-RCP-Split.pdf.
//
// This module is the single source of truth for the program *content*. The
// backend only stores the user's position (week + dayIndex) — see
// ProgramController. Exercise ids point at real seeded exercises so the
// "previous weight" lookup keeps working across sessions.

import type { ExerciseItem, GeneratedSession, SessionBlock } from "../types";

export const RCP_PROGRAM_ID = "rcp-split";
export const RCP_WEEKS = 12;
/** Number of training sessions per week (PDF Day 1, 2, 4, 5; Day 3/6/7 are rest). */
export const RCP_TRAINING_DAYS = 4;

type Role = "main" | "accessory" | "calf" | "abs" | "plank";

interface ProgramExercise {
  /** Seeded exercise id (so previous-session data resolves). */
  id: string;
  name: string;
  description: string;
  category: string;
  focus: string[];
  intensity: number;
  role: Role;
}

interface ProgramDay {
  /** Original PDF day label (Day 1 / 2 / 4 / 5). */
  dayLabel: string;
  /** Muscle-group focus, shown as the block label and session subtitle. */
  focusLabel: string;
  exercises: ProgramExercise[];
}

// ─── Periodization tables (keyed by week 1..12) ──────────────────────────────

/** Main compound lift: 5-set pyramid, reps per set. */
const MAIN_PYRAMID: Record<number, number[]> = {
  1: [12, 12, 12, 15, 15],
  2: [10, 10, 10, 12, 12],
  3: [8, 8, 8, 10, 10],
  4: [6, 6, 6, 8, 8],
  5: [5, 5, 5, 5, 5],
  6: [5, 5, 5, 5, 5],
  7: [3, 3, 3, 3, 3],
  8: [3, 3, 3, 3, 3],
  9: [3, 3, 3, 1, 1],
  10: [3, 3, 3, 1, 1],
  11: [12, 12, 12, 15, 15],
  12: [12, 12, 12, 15, 15],
};

/** Reps for the 3-set accessory movements. */
const ACCESSORY_REPS: Record<number, number> = {
  1: 15,
  2: 12,
  3: 10,
  4: 8,
  5: 6,
  6: 6,
  7: 6,
  8: 6,
  9: 6,
  10: 6,
  11: 15,
  12: 15,
};

/** Reps for calf work (standing/seated calf raises). */
const CALF_REPS: Record<number, number> = {
  1: 25,
  2: 20,
  3: 15,
  4: 10,
  5: 8,
  6: 8,
  7: 8,
  8: 8,
  9: 8,
  10: 8,
  11: 25,
  12: 25,
};

/** Reps for ab work (leg raise, crunch). */
const ABS_REPS: Record<number, number> = {
  1: 12,
  2: 12,
  3: 10,
  4: 8,
  5: 8,
  6: 8,
  7: 8,
  8: 8,
  9: 8,
  10: 8,
  11: 12,
  12: 12,
};

// ─── Training days ───────────────────────────────────────────────────────────

const DAYS: ProgramDay[] = [
  {
    dayLabel: "Day 1",
    focusLabel: "Chest, Triceps, Calf",
    exercises: [
      {
        id: "gym-push-001",
        name: "Bench Press (Barbell)",
        description:
          "Main lift — 5-set pyramid. Controlled descent to the chest, drive up explosively.",
        category: "gym-push",
        focus: ["chest", "triceps", "shoulders"],
        intensity: 9,
        role: "main",
      },
      {
        id: "gym-push-002",
        name: "Incline Dumbbell Bench Press",
        description:
          "Bench at ~30°. Press dumbbells from chest level, focusing on the upper chest.",
        category: "gym-push",
        focus: ["chest", "shoulders"],
        intensity: 7,
        role: "accessory",
      },
      {
        id: "gym-push-003",
        name: "Dumbbell Fly (Flat)",
        description:
          "Flat bench, slight elbow bend. Open arms wide for a chest stretch, squeeze back together.",
        category: "gym-push",
        focus: ["chest"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-push-006",
        name: "Triceps Rope Pressdown",
        description:
          "Cable rope, elbows pinned to sides. Press down and split the rope at the bottom.",
        category: "gym-push",
        focus: ["triceps"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-push-011",
        name: "Skull Crusher with Dumbbell",
        description:
          "Lying triceps extension. Lower the dumbbells toward the forehead, extend to lockout.",
        category: "gym-push",
        focus: ["triceps"],
        intensity: 6,
        role: "accessory",
      },
      {
        id: "gym-legs-009",
        name: "Standing Calf Raise",
        description:
          "Rise onto the toes, squeeze the calves at the top, full stretch at the bottom.",
        category: "gym-legs",
        focus: ["calves"],
        intensity: 4,
        role: "calf",
      },
      {
        id: "gym-legs-013",
        name: "Seated Calf Raise (or Calf-press / Leg-press Machine)",
        description: "Seated, weight on the knees. Targets the soleus — full range, no bouncing.",
        category: "gym-legs",
        focus: ["calves"],
        intensity: 4,
        role: "calf",
      },
    ],
  },
  {
    dayLabel: "Day 2",
    focusLabel: "Back, Biceps, Abs",
    exercises: [
      {
        id: "gym-pull-013",
        name: "Pendlay Row",
        description:
          "Main lift — 5-set pyramid. Explosive row from a dead stop on the floor, flat back, reset each rep.",
        category: "gym-pull",
        focus: ["back", "lats", "biceps"],
        intensity: 8,
        role: "main",
      },
      {
        id: "gym-pull-001",
        name: "Lat Pulldown",
        description:
          "Pull the bar to the upper chest, drive the elbows down and back, control the return.",
        category: "gym-pull",
        focus: ["lats", "back", "biceps"],
        intensity: 6,
        role: "accessory",
      },
      {
        id: "gym-pull-014",
        name: "Lat Pullover with Cable",
        description:
          "Arms nearly straight, pull a high cable down in an arc to the hips. Big lat stretch.",
        category: "gym-pull",
        focus: ["lats", "chest"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-pull-003",
        name: "Cable Row",
        description:
          "Seated cable row to the abdomen. Squeeze the shoulder blades together at the back.",
        category: "gym-pull",
        focus: ["back", "lats", "biceps"],
        intensity: 6,
        role: "accessory",
      },
      {
        id: "gym-pull-006",
        name: "Barbell Curl",
        description: "Strict barbell curl, elbows fixed at the sides. No swinging the torso.",
        category: "gym-pull",
        focus: ["biceps"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-pull-015",
        name: "Preacher Curl with Dumbbell",
        description:
          "Upper arm braced on the preacher bench. Curl through a full range, strict form.",
        category: "gym-pull",
        focus: ["biceps"],
        intensity: 5,
        role: "accessory",
      },
    ],
  },
  {
    dayLabel: "Day 4",
    focusLabel: "Delts, Traps, Calf",
    exercises: [
      {
        id: "gym-push-004",
        name: "Military Press (OHP)",
        description:
          "Main lift — 5-set pyramid. Strict standing overhead press, braced core, bar to lockout.",
        category: "gym-push",
        focus: ["shoulders", "delts", "triceps"],
        intensity: 8,
        role: "main",
      },
      {
        id: "gym-push-005",
        name: "Dumbbell Lateral Raise",
        description:
          "Raise the dumbbells out to the sides to shoulder height, slight forward lean, controlled.",
        category: "gym-push",
        focus: ["delts"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-pull-010",
        name: "Rear Delt Fly",
        description:
          "Bent over or on a pec-deck. Open the arms back to hit the rear delts, squeeze at the top.",
        category: "gym-pull",
        focus: ["delts", "back"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-push-013",
        name: "Upright Row with Barbell",
        description: "Pull the bar up the front of the body to upper-chest height, elbows leading.",
        category: "gym-push",
        focus: ["delts", "traps"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-pull-012",
        name: "Barbell Shrug",
        description:
          "Hold the bar, shrug the shoulders straight up toward the ears, squeeze the traps.",
        category: "gym-pull",
        focus: ["traps"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-legs-009",
        name: "Standing Calf Raise",
        description:
          "Rise onto the toes, squeeze the calves at the top, full stretch at the bottom.",
        category: "gym-legs",
        focus: ["calves"],
        intensity: 4,
        role: "calf",
      },
      {
        id: "gym-legs-013",
        name: "Seated Calf Raise (or Calf-press / Leg-press Machine)",
        description: "Seated, weight on the knees. Targets the soleus — full range, no bouncing.",
        category: "gym-legs",
        focus: ["calves"],
        intensity: 4,
        role: "calf",
      },
    ],
  },
  {
    dayLabel: "Day 5",
    focusLabel: "Legs, Abs",
    exercises: [
      {
        id: "gym-legs-001",
        name: "Squat",
        description:
          "Main lift — 5-set pyramid. Bar on the back, sit down between the hips, drive up through the heels.",
        category: "gym-legs",
        focus: ["quads", "glutes", "hamstrings"],
        intensity: 9,
        role: "main",
      },
      {
        id: "gym-legs-003",
        name: "Legpress Machine",
        description:
          "Feet shoulder-width on the platform. Lower under control, press without locking the knees hard.",
        category: "gym-legs",
        focus: ["quads", "glutes"],
        intensity: 7,
        role: "accessory",
      },
      {
        id: "gym-legs-006",
        name: "Leg Extension",
        description: "Seated, extend the knees to lock out, squeeze the quads, control the return.",
        category: "gym-legs",
        focus: ["quads"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "gym-legs-002",
        name: "Stiffleg Deadlift (or Romanian DL)",
        description:
          "Soft knees, hinge at the hips, bar close to the legs. Feel the hamstring stretch, drive the hips through.",
        category: "gym-legs",
        focus: ["hamstrings", "glutes", "lower back"],
        intensity: 7,
        role: "accessory",
      },
      {
        id: "gym-legs-005",
        name: "Leg Curl",
        description:
          "Curl the heels toward the glutes against the pad, squeeze the hamstrings, slow on the way back.",
        category: "gym-legs",
        focus: ["hamstrings"],
        intensity: 5,
        role: "accessory",
      },
      {
        id: "c2",
        name: "Leg Raise",
        description: "Hanging or lying. Raise the legs with control, avoid swinging, lower slowly.",
        category: "core",
        focus: ["abs", "core"],
        intensity: 5,
        role: "abs",
      },
      {
        id: "c8",
        name: "Crunch Machine",
        description:
          "Seated ab-crunch machine. Curl the torso against the resistance, squeeze, control the return.",
        category: "core",
        focus: ["abs", "core"],
        intensity: 4,
        role: "abs",
      },
      {
        id: "c3",
        name: "Plank",
        description:
          "Hold a rigid plank for ~1 minute per set. Brace the core, neutral spine, no sagging hips.",
        category: "core",
        focus: ["abs", "core"],
        intensity: 4,
        role: "plank",
      },
    ],
  },
];

// ─── Position helpers (the "circle") ─────────────────────────────────────────

/** Clamp a week into 1..12 and a day into 0..3. */
function clampPosition(week: number, dayIndex: number): { week: number; dayIndex: number } {
  const w = Math.min(Math.max(Math.round(week) || 1, 1), RCP_WEEKS);
  const d = Math.min(Math.max(Math.round(dayIndex) || 0, 0), RCP_TRAINING_DAYS - 1);
  return { week: w, dayIndex: d };
}

/** Phase number (1..3) for a given week. */
export function phaseForWeek(week: number): number {
  const { week: w } = clampPosition(week, 0);
  return Math.ceil(w / 4);
}

function phaseLabel(week: number): string {
  const phase = phaseForWeek(week);
  const ranges = ["Weeks 1–4", "Weeks 5–8", "Weeks 9–12"];
  return `Phase ${phase} (${ranges[phase - 1]})`;
}

/** Short label for a training day, e.g. "Day 1 · Chest, Triceps, Calf". */
export function dayName(dayIndex: number): string {
  const { dayIndex: d } = clampPosition(1, dayIndex);
  const day = DAYS[d];
  return `${day.dayLabel} · ${day.focusLabel}`;
}

/** Just the muscle-group focus for a training day, e.g. "Chest, Triceps, Calf". */
export function dayFocus(dayIndex: number): string {
  const { dayIndex: d } = clampPosition(1, dayIndex);
  return DAYS[d].focusLabel;
}

// ─── Session builder ─────────────────────────────────────────────────────────

function repsForExercise(ex: ProgramExercise, week: number): number {
  switch (ex.role) {
    case "calf":
      return CALF_REPS[week];
    case "abs":
      return ABS_REPS[week];
    case "plank":
      return 1; // one ~60s hold per set
    case "main":
      return MAIN_PYRAMID[week][0];
    case "accessory":
    default:
      return ACCESSORY_REPS[week];
  }
}

/** Rough minutes for a single exercise, used only for the duration estimate. */
function durationForExercise(ex: ProgramExercise): number {
  switch (ex.role) {
    case "main":
      return 12;
    case "plank":
      return 4;
    case "calf":
    case "abs":
      return 4;
    case "accessory":
    default:
      return 6;
  }
}

function toExerciseItem(ex: ProgramExercise, week: number): ExerciseItem {
  const isMain = ex.role === "main";
  const sets = isMain ? 5 : ex.role === "plank" ? 2 : 3;
  return {
    id: ex.id,
    name: ex.name,
    description: ex.description,
    category: ex.category,
    focus: ex.focus,
    intensity: ex.intensity,
    defaultSets: sets,
    defaultReps: repsForExercise(ex, week),
    ...(isMain ? { repScheme: MAIN_PYRAMID[week] } : {}),
  };
}

/**
 * Build the runnable session for a given position in the cycle. Produces a
 * standard GeneratedSession so it flows through SessionView / ActiveSessionOverlay
 * and is logged like any other session.
 */
export function buildProgramSession(week: number, dayIndex: number): GeneratedSession {
  const { week: w, dayIndex: d } = clampPosition(week, dayIndex);
  const day = DAYS[d];

  const exercises = day.exercises.map((ex) => ({
    exercise: toExerciseItem(ex, w),
    duration: durationForExercise(ex),
  }));
  const totalDuration = exercises.reduce((sum, e) => sum + e.duration, 0);

  const block: SessionBlock = {
    phase: "main",
    phaseLabel: day.focusLabel,
    exercises,
    totalDuration,
  };

  const pyramid = MAIN_PYRAMID[w].join("-");
  return {
    title: `RCP-Split — Week ${w}, ${day.dayLabel}`,
    subtitle: `${day.focusLabel} · ${phaseLabel(w)}`,
    totalDuration,
    blocks: [block],
    tips: [
      `Main lift: 5-set pyramid — ${pyramid} reps.`,
      "Rest ~90 seconds between sets (60s after planks).",
      "Add a little weight whenever you hit the top of the rep range with clean form.",
    ],
  };
}

// ─── Metadata for the Programs page ──────────────────────────────────────────

export interface RcpDaySummary {
  dayLabel: string;
  focusLabel: string;
  mainLift: string;
  exerciseCount: number;
}

export interface RcpWeekSummary {
  week: number;
  phase: number;
  mainPyramid: number[];
  accessoryReps: number;
}

export const RCP_META = {
  id: RCP_PROGRAM_ID,
  name: "RCP-Split",
  tagline: "12-week push/pull/legs split — a circle that repeats every 12 weeks.",
  description:
    "A periodized 4-day split. The exercises stay the same every week while the rep " +
    "scheme drops from high-rep hypertrophy toward heavy low-rep strength across three " +
    "4-week phases, then resets. Finish a session and the program advances to the next " +
    "training day automatically; after Week 12 it loops back to Week 1.",
  weeks: RCP_WEEKS,
  trainingDays: RCP_TRAINING_DAYS,
  days: DAYS.map(
    (day): RcpDaySummary => ({
      dayLabel: day.dayLabel,
      focusLabel: day.focusLabel,
      mainLift: day.exercises.find((e) => e.role === "main")?.name ?? "",
      exerciseCount: day.exercises.length,
    }),
  ),
  weekTable: Array.from(
    { length: RCP_WEEKS },
    (_, i): RcpWeekSummary => ({
      week: i + 1,
      phase: phaseForWeek(i + 1),
      mainPyramid: MAIN_PYRAMID[i + 1],
      accessoryReps: ACCESSORY_REPS[i + 1],
    }),
  ),
};
