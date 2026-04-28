import type { GeneratedSession } from "./types";

const KEY = "zoneit_active_session";

export interface StoredSetState {
  reps: number;
  weight?: number;
  completed: boolean;
}

export interface StoredExerciseState {
  id: string;
  name: string;
  duration: number;
  elapsed: number;
  isDone: boolean;
  isActive: boolean;
  /** For set-based exercises */
  sets: StoredSetState[];
  /** Whether this exercise uses sets/reps (vs time-based) */
  isSetBased: boolean;
  defaultReps: number;
}

export interface ActiveSessionStore {
  session: GeneratedSession;
  workoutId?: string;
  startedAt: string;
  exercises: StoredExerciseState[];
  /** Accumulated session seconds (not including the current running interval) */
  sessionBaseElapsed: number;
  /** Accumulated seconds for the active exercise (not including current interval) */
  exerciseBaseElapsed: number;
  activeIdx: number | null;
  notes: string;
  /** Date.now() when the timer was last started, null if paused */
  runningAt: number | null;
}

export function saveActiveSession(data: ActiveSessionStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or unavailable */
  }
}

export function loadActiveSession(): ActiveSessionStore | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSessionStore;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  localStorage.removeItem(KEY);
}
