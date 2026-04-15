// Shared types used by the frontend. Mirror the backend Session models.

export type Level = "beginner" | "intermediate" | "advanced";
export type Equipment = "hangboard" | "campus-board" | "resistance-bands" | "pull-up-bar" | "none";
export type Goal = "technique" | "projecting" | "power" | "endurance" | "volume" | "recovery";
export type GymType = "slab" | "comp" | "spray" | "moonboard" | "mixed";
export type Fatigue = "fresh" | "normal" | "tired";

export interface SessionInput {
  level: Level;
  goal: Goal;
  sessionLength: number;
  gymType: GymType;
  fatigue: Fatigue;
  injuries: string[];
  equipment: Equipment[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  description: string;
  category: string;
  focus: string[];
  intensity: number;
}

export interface SessionBlock {
  phase: "warmup" | "main" | "addon" | "cooldown";
  phaseLabel: string;
  exercises: { exercise: ExerciseItem; duration: number }[];
  totalDuration: number;
}

export interface GeneratedSession {
  title: string;
  subtitle: string;
  totalDuration: number;
  blocks: SessionBlock[];
  tips: string[];
}
