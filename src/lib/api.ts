// ─── Types ────────────────────────────────────────────────────────────────────

export type { SessionInput, GeneratedSession } from "./types";
import type { ProgramDay, ProgramType } from "./programs/types";

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  restTimeSeconds: number;
  isVip: boolean;
  createdAt: string;
}

export interface UpdateProfileBody {
  name?: string;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  restTimeSeconds?: number;
}

export interface WorkoutResponse {
  id: string;
  name: string;
  folderId: string | null;
  sessionInput: Record<string, unknown>;
  generatedSession: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutBody {
  name: string;
  folderId?: string | null;
  sessionInput: Record<string, unknown>;
  generatedSession: Record<string, unknown>;
}

export interface UpdateWorkoutBody {
  name?: string;
  folderId?: string | null;
  generatedSession?: Record<string, unknown>;
}

export interface FolderResponse {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderBody {
  name: string;
}

export interface UpdateFolderBody {
  name?: string;
}

export interface ReorderFoldersBody {
  folderIds: string[];
}

export interface SetData {
  reps: number;
  weight?: number;
  completed: boolean;
}

export interface ExerciseLogData {
  id: string;
  name: string;
  sets: SetData[];
  isSetBased: boolean;
  durationSeconds?: number;
}

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

export interface CreateSessionLogBody {
  workoutId?: string;
  sessionTitle: string;
  sessionSubtitle?: string;
  startedAt: string;
  durationSeconds: number;
  exerciseCount: number;
  notes?: string;
  exercises?: ExerciseLogData[];
}

export interface TermResponse {
  id: string;
  term: string;
  definition: string;
  letter: string;
}

export interface ExerciseResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  focus: string[];
  intensity: number;
  defaultSets: number | null;
  defaultReps: number | null;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  picture: string | null;
}

export interface WeeklyLeader {
  user: LeaderboardUser;
  totalSeconds: number;
  sessionCount: number;
}

export interface AllTimeLeader {
  user: LeaderboardUser;
  totalSeconds: number;
  sessionCount: number;
  streak: number;
}

export interface LeaderboardResponse {
  weeklyChampion: WeeklyLeader | null;
  monthlyChampion: WeeklyLeader | null;
  allTimeChampion: AllTimeLeader | null;
  weeklyTop: WeeklyLeader[];
  allTimeTop: AllTimeLeader[];
  globalStats: {
    totalSessions: number;
    totalMinutes: number;
    activeUsers: number;
  };
  chartData: {
    week: { label: string; minutes: number }[];
    month: { label: string; minutes: number }[];
    year: { label: string; minutes: number }[];
  };
  funFacts: string[];
}

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

export interface ProgramResponse {
  id: string;
  name: string;
  description: string;
  /** "gym" | "climbing" */
  type: ProgramType;
  lengthWeeks: number;
  days: ProgramDay[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramBody {
  name: string;
  description?: string;
  type: ProgramType;
  lengthWeeks: number;
  days: ProgramDay[];
}

export interface UpdateProgramBody {
  name?: string;
  description?: string;
  type?: ProgramType;
  lengthWeeks?: number;
  days?: ProgramDay[];
}

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

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

export const TOKEN_KEY = "auth_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init?.headers) Object.assign(headers, init.headers);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ message: res.statusText }))) as {
      message?: string;
    };
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture: string | null;
  };
}

export const api = {
  auth: {
    /** URL to redirect the browser to for Google OAuth login */
    googleLoginUrl: () => `${API_BASE}/api/auth/google`,
    /** Register a new user with email and password */
    register: (body: RegisterBody) =>
      request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    /** Login with email and password */
    login: (body: LoginBody) =>
      request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  sessions: {
    generate: (body: import("./types").SessionInput) =>
      request<import("./types").GeneratedSession>("/api/sessions/generate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  users: {
    me: () => request<UserResponse>("/api/users/me"),
    updateMe: (body: UpdateProfileBody) =>
      request<UserResponse>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },

  workouts: {
    list: () => request<WorkoutResponse[]>("/api/workouts"),
    create: (body: CreateWorkoutBody) =>
      request<WorkoutResponse>("/api/workouts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    get: (id: string) => request<WorkoutResponse>(`/api/workouts/${id}`),
    update: (id: string, body: UpdateWorkoutBody) =>
      request<WorkoutResponse>(`/api/workouts/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) => request<void>(`/api/workouts/${id}`, { method: "DELETE" }),
  },
  folders: {
    list: () => request<FolderResponse[]>("/api/folders"),
    create: (body: CreateFolderBody) =>
      request<FolderResponse>("/api/folders", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    get: (id: string) => request<FolderResponse>(`/api/folders/${id}`),
    update: (id: string, body: UpdateFolderBody) =>
      request<FolderResponse>(`/api/folders/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    reorder: (body: ReorderFoldersBody) =>
      request<FolderResponse[]>("/api/folders", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) => request<void>(`/api/folders/${id}`, { method: "DELETE" }),
  },
  sessionLogs: {
    list: (since?: string) =>
      request<SessionLogResponse[]>(
        `/api/session-logs${since ? `?since=${encodeURIComponent(since)}` : ""}`,
      ),
    create: (body: CreateSessionLogBody) =>
      request<SessionLogResponse>("/api/session-logs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    delete: (id: string) => request<void>(`/api/session-logs/${id}`, { method: "DELETE" }),
    getPreviousExerciseData: (exerciseIds: string[]) =>
      request<Record<string, ExerciseLogData>>("/api/session-logs/previous-exercises", {
        method: "POST",
        body: JSON.stringify({ exerciseIds }),
      }),
  },

  terms: {
    list: (q?: string) =>
      request<TermResponse[]>(`/api/terms${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  },

  exercises: {
    list: (q?: string) =>
      request<ExerciseResponse[]>(`/api/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  },

  leaderboard: {
    get: () => request<LeaderboardResponse>("/api/leaderboard"),
  },

  programs: {
    /** List the user's custom programs. */
    list: () => request<ProgramResponse[]>("/api/programs"),
    /** Get one custom program. */
    get: (id: string) => request<ProgramResponse>(`/api/programs/${id}`),
    /** Create a custom program. */
    create: (body: CreateProgramBody) =>
      request<ProgramResponse>("/api/programs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    /** Update a custom program. */
    update: (id: string, body: UpdateProgramBody) =>
      request<ProgramResponse>(`/api/programs/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    /** Delete a custom program (and its progress). */
    delete: (id: string) => request<void>(`/api/programs/${id}`, { method: "DELETE" }),
    /** All of the user's progress rows (for the Home continue card). */
    listProgress: () => request<ProgramProgressResponse[]>("/api/programs/progress/all"),
    /**
     * Current progress in a program, or null if not started. The backend returns
     * 204 (No Content) when there is no progress, which `request` maps to
     * undefined — normalize that to null so callers can rely on `=== null`.
     */
    getProgress: (programId: string) =>
      request<ProgramProgressResponse | null>(`/api/programs/${programId}/progress`).then(
        (p) => p ?? null,
      ),
    /** Start (or resume) a program at week 1. */
    start: (programId: string) =>
      request<ProgramProgressResponse>(`/api/programs/${programId}/start`, { method: "POST" }),
    /** Mark a training day complete for the current week. */
    completeDay: (programId: string, dayIndex: number) =>
      request<ProgramProgressResponse>(`/api/programs/${programId}/complete-day`, {
        method: "POST",
        body: JSON.stringify({ dayIndex }),
      }),
    /** Advance to the next week (wraps within the 12-week cycle), clearing ticks. */
    advanceWeek: (programId: string) =>
      request<ProgramProgressResponse>(`/api/programs/${programId}/advance-week`, {
        method: "POST",
      }),
    /** Reset progress back to week 1 with no days completed. */
    reset: (programId: string) =>
      request<ProgramProgressResponse>(`/api/programs/${programId}/reset`, { method: "POST" }),
  },

  shared: {
    /** Create a share link for a workout */
    createShareLink: (workoutId: string) =>
      request<{ code: string; shareUrl: string }>(`/api/shared/workouts/${workoutId}/share`, {
        method: "POST",
      }),
    /** Get shared workout details by code (no auth required) */
    get: (code: string) => request<SharedWorkoutResponse>(`/api/shared/${code}`),
    /** Import a shared workout to user's library */
    import: (code: string, name?: string) =>
      request<{ workoutId: string; name: string }>(`/api/shared/${code}/import`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    /** List share links created by the user */
    listMyLinks: () => request<SharedWorkoutResponse[]>("/api/shared/my/links"),
  },
};
