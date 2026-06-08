/** A user's progress through a recurring multi-week program. */
export interface ProgramProgressResponse {
  programId: string;
  /** Current week, 1..12. */
  week: number;
  /** Training-day indices (0..3) completed in the current week. */
  completedDays: number[];
  /** Total sessions completed since starting. */
  completedCount: number;
  startedAt: string;
  updatedAt: string;
}

/** Body for marking a training day complete. */
export interface CompleteDayBody {
  /** Training-day index within the week, 0..3. */
  dayIndex: number;
}
