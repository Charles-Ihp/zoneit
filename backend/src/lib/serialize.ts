/// Helpers for the JSON columns stored as TEXT in SQLite (Program.days,
/// Workout.sessionInput/generatedSession, SessionLog.exercises, SharedWorkout
/// snapshots). The wire types are Record<string, unknown> etc., unchanged.

export const toJson = (value: unknown): string => JSON.stringify(value);

export const fromJson = <T>(text: string): T => JSON.parse(text) as T;

export const fromJsonOrNull = <T>(text: string | null): T | null =>
  text == null ? null : (JSON.parse(text) as T);
