// Built-in climbing program: "Dyno & Technique" — 2 days/week for intermediate to
// advanced climbers. One explosive/dyno day and one movement-technique day. No
// per-week periodization; runs on an 8-week loop. Exercise ids reference seeded
// climbing exercises so previous-session data resolves.

import type { ExerciseItem, GeneratedSession, SessionBlock } from "../types";

export const DYNO_TECH_ID = "dyno-technique";
export const DYNO_TECH_WEEKS = 8;

type Phase = "warmup" | "main" | "cooldown";
interface Entry {
  phase: Phase;
  exercise: ExerciseItem;
  duration: number;
}

/** Time-based climbing exercise (sets/reps null → tracked by the session timer). */
function ex(
  id: string,
  name: string,
  description: string,
  category: string,
  focus: string[],
  intensity: number,
  duration: number,
  phase: Phase = "main",
): Entry {
  return {
    phase,
    exercise: {
      id,
      name,
      description,
      category,
      focus,
      intensity,
      defaultSets: null,
      defaultReps: null,
    },
    duration,
  };
}

interface DayDef {
  name: string;
  subtitle: string;
  entries: Entry[];
}

const DAYS: DayDef[] = [
  {
    name: "Dyno & Power",
    subtitle: "Explosive power · dynos & deadpoints",
    entries: [
      ex(
        "wc2",
        "Progressive Ladder",
        "Climb 3-5 problems, each one grade harder. Start very easy, end 1-2 grades below max.",
        "warmup-climbing",
        ["progression", "warm-up"],
        3,
        10,
        "warmup",
      ),
      ex(
        "ex-dynos-003",
        "Deadpoint Practice",
        "Control the apex of your reach — throw to a hold and catch it at the moment of zero momentum. Slopers or crimps. 6 × 3 reps.",
        "dynos",
        ["dynos", "deadpoint", "precision"],
        6,
        15,
      ),
      ex(
        "ex-dynos-002",
        "Double Dyno Drills",
        "Both feet leave the wall simultaneously. Start with a small hop between jugs, progressively increase the span. 4 × 4 reps.",
        "dynos",
        ["dynos", "explosive power", "timing"],
        7,
        15,
      ),
      ex(
        "ex-dynos-005",
        "Span Dyno Progression",
        "Set dyno problems with incrementally larger spans. Climb each twice before increasing distance. Rest 2 min between.",
        "dynos",
        ["dynos", "explosive power", "progression"],
        8,
        20,
      ),
      ex(
        "pw2",
        "Dyno Practice",
        "Find or set dyno problems. Focus on explosive hip drive and coordination.",
        "power",
        ["explosiveness", "coordination"],
        8,
        18,
      ),
      ex(
        "pw3",
        "Power Boulders",
        "Climb short, powerful problems (3-5 moves) near your limit. 3-5 min rest between attempts.",
        "power",
        ["power", "recruitment"],
        8,
        22,
      ),
      ex(
        "cd2",
        "Shoulder & Back Stretch",
        "Cross-body shoulder stretch, doorway chest opener, child's pose.",
        "cooldown",
        ["shoulders", "back"],
        1,
        5,
        "cooldown",
      ),
    ],
  },
  {
    name: "Technique",
    subtitle: "Footwork, body positioning & efficiency",
    entries: [
      ex(
        "wc1",
        "Easy Traversing",
        "Traverse the wall at low height, focusing on smooth movement. Stay 2-3 grades below max.",
        "warmup-climbing",
        ["movement", "flow"],
        2,
        8,
        "warmup",
      ),
      ex(
        "t1",
        "Silent Feet",
        "Climb easy problems placing feet with zero noise. Focus on precision and awareness.",
        "technique",
        ["footwork", "precision"],
        3,
        10,
      ),
      ex(
        "t4",
        "Flag & Twist Drills",
        "On moderate climbs, practice flagging and twisting into every move even when not required.",
        "technique",
        ["balance", "efficiency"],
        4,
        12,
      ),
      ex(
        "t6",
        "Drop Knee Practice",
        "Find moderate overhang problems and turn the hips using drop knees on every move.",
        "technique",
        ["technique", "efficiency"],
        5,
        12,
      ),
      ex(
        "t7",
        "Heel Hook Progressions",
        "On overhangs, seek out heel-hook moves. Load the heel actively and pull with the hamstring.",
        "technique",
        ["heel hooks", "body tension"],
        5,
        12,
      ),
      ex(
        "t9",
        "Pinch & Side-pull Drills",
        "Climb a circuit of moderate problems on pinch and side-pull holds. Exaggerate hip position.",
        "technique",
        ["pinch strength", "body position"],
        5,
        12,
      ),
      ex(
        "cd2",
        "Shoulder & Back Stretch",
        "Cross-body shoulder stretch, doorway chest opener, child's pose.",
        "cooldown",
        ["shoulders", "back"],
        1,
        5,
        "cooldown",
      ),
    ],
  },
];

const PHASE_LABELS: Record<Phase, string> = {
  warmup: "Warm-up",
  main: "Main",
  cooldown: "Cool-down",
};

/** Day summaries for the list/detail UI. */
export const DYNO_TECH_DAYS = DAYS.map((d) => ({ name: d.name, subtitle: d.subtitle }));

export function buildDynoTechSession(week: number, dayIndex: number): GeneratedSession {
  const day = DAYS[Math.min(Math.max(dayIndex, 0), DAYS.length - 1)];

  const blocks: SessionBlock[] = (["warmup", "main", "cooldown"] as Phase[])
    .map((phase) => {
      const exercises = day.entries
        .filter((e) => e.phase === phase)
        .map((e) => ({ exercise: e.exercise, duration: e.duration }));
      const totalDuration = exercises.reduce((s, e) => s + e.duration, 0);
      return { phase, phaseLabel: PHASE_LABELS[phase], exercises, totalDuration };
    })
    .filter((b) => b.exercises.length > 0);

  const totalDuration = blocks.reduce((s, b) => s + b.totalDuration, 0);
  return {
    title: `Dyno & Technique — Week ${week}, ${day.name}`,
    subtitle: `${day.subtitle} · intermediate/advanced`,
    totalDuration,
    blocks,
    tips: [
      "Warm up thoroughly before any explosive or limit climbing — cold fingers get injured.",
      "Quality over quantity: rest fully between hard attempts so each one is near-max.",
      "Film yourself on the technique day; reviewing footwork beats just climbing more.",
    ],
  };
}
