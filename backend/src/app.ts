import { Hono } from "hono";
import type { HonoEnv } from "./env";
import { onError } from "./middleware/error";

import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { sessionRoutes } from "./routes/sessions";
import { workoutRoutes } from "./routes/workouts";
import { folderRoutes } from "./routes/folders";
import { sessionLogRoutes } from "./routes/sessionLogs";
import { termRoutes } from "./routes/terms";
import { exerciseRoutes } from "./routes/exercises";
import { leaderboardRoutes } from "./routes/leaderboard";
import { programRoutes } from "./routes/programs";
import { sharedRoutes } from "./routes/shared";

/// The API. Mounted by the Worker entry (worker.ts) for /api and /health;
/// everything else falls through to the static SPA assets. Same origin as the
/// SPA (combined Worker), so no CORS is needed.
const app = new Hono<HonoEnv>();

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);
app.route("/api/sessions", sessionRoutes);
app.route("/api/workouts", workoutRoutes);
app.route("/api/folders", folderRoutes);
app.route("/api/session-logs", sessionLogRoutes);
app.route("/api/terms", termRoutes);
app.route("/api/exercises", exerciseRoutes);
app.route("/api/leaderboard", leaderboardRoutes);
app.route("/api/programs", programRoutes);
app.route("/api/shared", sharedRoutes);

app.onError(onError);

export default app;
