/** A user's progress through a recurring multi-week program. */
export interface ProgramProgressResponse {
  programId: string;
  /** Current week, 1..12. */
  week: number;
  /** Current training-day index within the week, 0..3. */
  dayIndex: number;
  /** Total sessions completed since starting. */
  completedCount: number;
  startedAt: string;
  updatedAt: string;
}
