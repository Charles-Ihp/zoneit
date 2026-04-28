/** Set data for a single set within an exercise */
export interface SetData {
  reps: number;
  weight?: number;
  completed: boolean;
}

/** Exercise data logged during a session */
export interface ExerciseLogData {
  id: string;
  name: string;
  sets: SetData[];
  isSetBased: boolean;
  durationSeconds?: number;
}

/** A completed training session log returned by the API */
export interface SessionLogResponse {
  id: string;
  workoutId: string | null;
  sessionTitle: string;
  sessionSubtitle: string | null;
  startedAt: string;
  durationSeconds: number;
  exerciseCount: number;
  notes: string;
  exercises: ExerciseLogData[] | null;
  createdAt: string;
}

/** Body to create a new session log */
export interface CreateSessionLogBody {
  /** Optional reference to a saved workout */
  workoutId?: string;
  /** Display title of the session */
  sessionTitle: string;
  /** Subtitle (e.g. "intermediate · 60 min · normal energy") */
  sessionSubtitle?: string;
  /** ISO timestamp when the session started */
  startedAt: string;
  /** Actual time spent in seconds */
  durationSeconds: number;
  /** Total number of exercises performed */
  exerciseCount: number;
  /** Free-form notes */
  notes?: string;
  /** Detailed exercise data with sets/reps */
  exercises?: ExerciseLogData[];
}
