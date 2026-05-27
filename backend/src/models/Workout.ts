/** Saved workout returned by the API */
export interface WorkoutResponse {
  id: string;
  name: string;
  folderId: string | null;
  sessionInput: Record<string, unknown>;
  generatedSession: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Body for saving a generated workout */
export interface CreateWorkoutBody {
  /** Display name for this workout session */
  name: string;
  /** Optional folder ID to organize the workout */
  folderId?: string | null;
  /** The inputs used to generate the session (level, goal, etc.) */
  sessionInput: Record<string, unknown>;
  /** The full generated session object */
  generatedSession: Record<string, unknown>;
}

/** Body for updating a saved workout */
export interface UpdateWorkoutBody {
  /** New display name */
  name?: string;
  /** Move to a different folder (null = root) */
  folderId?: string | null;
  /** Updated generated session (when exercises are edited) */
  generatedSession?: Record<string, unknown>;
}
