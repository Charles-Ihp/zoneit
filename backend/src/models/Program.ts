/** A user's progress through a recurring multi-week program. */
export interface ProgramProgressResponse {
  programId: string;
  /** Current week, 1..N. */
  week: number;
  /** Training-day indices completed in the current week. */
  completedDays: number[];
  /** Total sessions completed since starting. */
  completedCount: number;
  startedAt: string;
  updatedAt: string;
}

/** Body for marking a training day complete. */
export interface CompleteDayBody {
  /** Training-day index within the week, 0-based. */
  dayIndex: number;
}

/** A user-created multi-week training program. */
export interface ProgramResponse {
  id: string;
  name: string;
  description: string;
  /** "gym" | "climbing" */
  type: string;
  lengthWeeks: number;
  /** ProgramDay[] — each day: { name, exercises: [{ exercise, duration }] }. */
  days: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}

/** Body for creating a program. */
export interface CreateProgramBody {
  name: string;
  description?: string;
  type: string;
  lengthWeeks: number;
  days: Record<string, unknown>[];
}

/** Body for updating a program (all fields optional). */
export interface UpdateProgramBody {
  name?: string;
  description?: string;
  type?: string;
  lengthWeeks?: number;
  days?: Record<string, unknown>[];
}
