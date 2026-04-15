import type { Exercise } from "@prisma/client";
import { prisma } from "./prisma";
import type { SessionInput, GeneratedSession, SessionBlock, ExerciseItem } from "../models/Session";

const gymToWallTypes: Record<string, string[]> = {
  slab: ["slab", "vertical", "any"],
  comp: ["comp", "overhang", "vertical", "any"],
  spray: ["spray", "overhang", "any"],
  moonboard: ["moonboard", "overhang", "any"],
  mixed: ["slab", "vertical", "overhang", "comp", "any"],
};

function filter(
  all: Exercise[],
  category: string,
  level: string,
  gymType: string,
  injuries: string[],
  equipment: string[],
): Exercise[] {
  const wallTypes = gymToWallTypes[gymType] ?? ["any"];
  return all.filter((ex) => {
    if (ex.category !== category) return false;
    if (!ex.levels.includes(level)) return false;
    if (!ex.wallTypes.some((w) => wallTypes.includes(w))) return false;
    if (injuries.length && ex.injuryRisk.some((r) => injuries.includes(r))) return false;
    if (!ex.equipment.every((e) => e === "none" || equipment.includes(e))) return false;
    return true;
  });
}

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

function toItem(ex: Exercise): ExerciseItem {
  return {
    id: ex.id,
    name: ex.name,
    description: ex.description,
    category: ex.category,
    focus: ex.focus,
    intensity: ex.intensity,
  };
}

function buildBlock(
  phase: SessionBlock["phase"],
  phaseLabel: string,
  selected: Exercise[],
  targetDuration: number,
): SessionBlock {
  let remaining = targetDuration;
  const items = selected
    .map((ex) => {
      const dur = Math.min(Math.round((ex.durationMin + ex.durationMax) / 2), remaining);
      remaining = Math.max(0, remaining - dur);
      return { exercise: toItem(ex), duration: dur };
    })
    .filter((i) => i.duration > 0);
  return {
    phase,
    phaseLabel,
    exercises: items,
    totalDuration: items.reduce((s, i) => s + i.duration, 0),
  };
}

export async function generateSession(input: SessionInput): Promise<GeneratedSession> {
  const { level, goal, sessionLength, gymType, fatigue, injuries, equipment } = input;

  const all = await prisma.exercise.findMany();

  const f = (cat: string, n: number) =>
    pick(filter(all, cat, level, gymType, injuries, equipment), n);

  const isShort = sessionLength <= 60;
  const warmupTime = isShort ? 10 : 15;
  const cooldownTime = isShort ? 5 : 10;
  const addonTime = isShort ? 0 : goal === "recovery" ? 5 : 15;
  let mainTime = sessionLength - warmupTime - cooldownTime - addonTime;
  if (goal === "recovery") mainTime = Math.round(mainTime * 0.7);

  // WARMUP
  const warmup = buildBlock(
    "warmup",
    "Warm-up",
    [...f("warmup-mobility", 2), ...f("warmup-climbing", 1)],
    warmupTime,
  );

  // MAIN
  let mainExs: Exercise[] = [];
  let mainLabel = "";
  switch (goal) {
    case "technique":
      mainExs = f("technique", isShort ? 2 : 3);
      mainLabel = "Technique Focus";
      break;
    case "projecting":
      mainExs = f("projecting", fatigue === "tired" ? 1 : 2);
      mainLabel = "Project Session";
      break;
    case "power":
      mainExs = f("power", 2);
      mainLabel = "Power Training";
      break;
    case "endurance":
      mainExs = f("endurance", isShort ? 1 : 2);
      mainLabel = "Endurance Work";
      break;
    case "volume":
      mainExs = [...f("technique", 1), ...f("endurance", 1)];
      mainLabel = "Volume Session";
      break;
    case "recovery":
      mainExs = f("warmup-climbing", 2);
      mainLabel = "Easy Movement";
      break;
  }
  const main = buildBlock("main", mainLabel, mainExs, mainTime);

  // ADDON
  let addonExs: Exercise[] = [];
  if (addonTime > 0 && goal !== "recovery") {
    addonExs = [
      ...(level !== "beginner" &&
      !injuries.includes("fingers") &&
      equipment.includes("hangboard") &&
      goal !== "endurance"
        ? f("finger-strength", 1)
        : []),
      ...f("core", 1),
      ...f("antagonist", 1),
    ];
  }
  if (goal === "recovery") addonExs = f("cooldown", 1);
  const addon = buildBlock(
    "addon",
    goal === "recovery" ? "Extra Mobility" : "Supplementary Work",
    addonExs,
    addonTime,
  );

  // COOLDOWN
  const cooldown = buildBlock(
    "cooldown",
    "Cool Down",
    f("cooldown", isShort ? 1 : 2),
    cooldownTime,
  );

  // TIPS
  const tips: string[] = [];
  if (fatigue === "tired")
    tips.push("You're tired today — listen to your body and cut the session short if needed.");
  if (injuries.length)
    tips.push(`Watch your ${injuries.join(", ")} — skip anything that causes pain.`);
  if (level === "beginner") tips.push("Focus on technique and movement quality over difficulty.");
  if (goal === "projecting")
    tips.push("Quality attempts matter more than quantity. Rest fully between tries.");
  if (goal === "power") tips.push("Never train power when fatigued. Each rep should be explosive.");

  const goalLabels: Record<string, string> = {
    technique: "Technique Day",
    projecting: "Project Session",
    power: "Power Day",
    endurance: "Endurance Session",
    volume: "Volume Day",
    recovery: "Recovery Session",
  };

  const blocks = [warmup, main, ...(addon.exercises.length ? [addon] : []), cooldown];
  return {
    title: goalLabels[goal] ?? "Session",
    subtitle: `${level} · ${sessionLength} min · ${fatigue} energy`,
    totalDuration: blocks.reduce((s, b) => s + b.totalDuration, 0),
    blocks,
    tips,
  };
}
