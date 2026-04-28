/** Shared workout response returned by the API */
export interface SharedWorkoutResponse {
  id: string;
  code: string;
  workoutName: string;
  sessionInput: Record<string, unknown>;
  generatedSession: Record<string, unknown>;
  createdBy: {
    name: string;
    picture?: string;
  };
  importCount: number;
  expiresAt?: string;
  createdAt: string;
}

/** Response when creating a share link */
export interface CreateShareLinkResponse {
  code: string;
  shareUrl: string;
}

/** Body for importing a shared workout */
export interface ImportSharedWorkoutBody {
  /** Optional custom name for the imported workout */
  name?: string;
}

/** Response after importing a shared workout */
export interface ImportSharedWorkoutResponse {
  workoutId: string;
  name: string;
}
