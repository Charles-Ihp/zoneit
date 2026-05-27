import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Flame, Target, Clock } from "lucide-react";
import { SessionForm } from "@/components/SessionForm";
import { SessionView } from "@/components/SessionView";
import type { GeneratedSession, SessionInput } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { api, type SessionLogResponse } from "@/lib/api";
import { loadActiveSession } from "@/lib/active-session-store";

// Climbing tips for motivation
const CLIMBING_TIPS = [
  { tip: "Focus on your footwork today. Quiet feet = efficient climbing.", category: "Technique" },
  {
    tip: "Rest between attempts. Quality over quantity leads to faster progress.",
    category: "Training",
  },
  {
    tip: "Try a route that scares you a little. Growth happens outside comfort zones.",
    category: "Mindset",
  },
  { tip: "Warm up thoroughly. Cold muscles are injury-prone muscles.", category: "Health" },
  {
    tip: "Watch others climb. You can learn a lot from different body types and styles.",
    category: "Learning",
  },
  { tip: "Breathe. Many climbers hold their breath on hard moves.", category: "Technique" },
  {
    tip: "Focus on one skill per session. Deliberate practice beats random climbing.",
    category: "Training",
  },
  {
    tip: "Climb with intention. Know what you're working on before you start.",
    category: "Mindset",
  },
  { tip: "Antagonist exercises prevent injuries. Don't skip them.", category: "Health" },
  { tip: "Celebrate small wins. Progress isn't always about grades.", category: "Mindset" },
];

function getDailyTip(): (typeof CLIMBING_TIPS)[0] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return CLIMBING_TIPS[dayOfYear % CLIMBING_TIPS.length];
}

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "GRAVITACIO" },
      {
        name: "description",
        content:
          "Generate personalized climbing sessions based on your level, goals, and energy. Rule-based session plans you can actually follow at the gym.",
      },
      { property: "og:title", content: "GRAVITACIO" },
      {
        property: "og:description",
        content: "Generate personalized climbing sessions based on your level, goals, and energy.",
      },
    ],
  }),
});

function Index() {
  const { user, loading: authLoading, login } = useAuth();
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [lastInput, setLastInput] = useState<SessionInput | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLogResponse[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Get daily tip
  const dailyTip = useMemo(() => getDailyTip(), []);

  // Load session logs for stats
  useEffect(() => {
    if (!user) {
      setStatsLoading(false);
      return;
    }
    // Get last 30 days of logs
    const since = new Date();
    since.setDate(since.getDate() - 30);
    api.sessionLogs
      .list(since.toISOString())
      .then(setSessionLogs)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => {
    if (sessionLogs.length === 0) return null;

    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessionLogs.filter(
      (l) => new Date(l.startedAt) >= thisWeekStart,
    ).length;

    const totalMinutes = Math.round(
      sessionLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 60,
    );

    // Calculate streak (consecutive days with sessions)
    const daySet = new Set(sessionLogs.map((l) => new Date(l.startedAt).toDateString()));
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    while (daySet.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { thisWeekSessions, totalMinutes, streak };
  }, [sessionLogs]);

  // Restore session from localStorage only when user is logged in
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const stored = loadActiveSession();
      if (stored && !session) {
        setSession(stored.session);
        if (stored.workoutId) {
          setCurrentWorkoutId(stored.workoutId);
        }
      }
    } else {
      setSession(null);
      setShowSessionForm(false);
      setCurrentWorkoutId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [generating, setGenerating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  const handleGenerate = useCallback(
    async (input: SessionInput) => {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }
      setLastInput(input);
      setGenerating(true);
      try {
        const result = await api.sessions.generate(input);
        setSession(result);
        setSaveState("idle");
        setCurrentWorkoutId(null); // New session, not saved yet
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setGenerating(false);
      }
    },
    [user],
  );

  const handleRegenerate = useCallback(async () => {
    if (!lastInput || !user) return;
    setGenerating(true);
    try {
      const result = await api.sessions.generate(lastInput);
      setSession(result);
      setSaveState("idle");
      setCurrentWorkoutId(null); // Regenerated session, not saved yet
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setGenerating(false);
    }
  }, [lastInput, user]);

  const handleBack = useCallback(() => {
    setSession(null);
    setSaveState("idle");
    setShowSessionForm(false);
    setCurrentWorkoutId(null);
  }, []);

  const handleGenerateNew = useCallback(() => {
    setShowSessionForm(true);
  }, []);

  // Handle session changes from editing - mark as modified so it can be re-saved
  const handleSessionChange = useCallback(
    (newSession: GeneratedSession) => {
      setSession(newSession);
      // If this is an existing workout, mark as modified so user can save changes
      if (currentWorkoutId) {
        setSaveState("idle"); // Allow re-saving
      }
    },
    [currentWorkoutId],
  );

  const handleSave = useCallback(async () => {
    if (!session || !lastInput || saveState === "saving" || saveState === "saved") return;
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setSaveName(session.title);
    setShowSaveDialog(true);
  }, [session, lastInput, saveState, user]);

  const handleConfirmSave = useCallback(async () => {
    if (!session || !lastInput) return;
    setSaveState("saving");
    setShowSaveDialog(false);
    try {
      if (currentWorkoutId) {
        // Update existing workout
        await api.workouts.update(currentWorkoutId, {
          name: saveName.trim() || session.title,
          generatedSession: session as unknown as Record<string, unknown>,
        });
      } else {
        // Create new workout
        const created = await api.workouts.create({
          name: saveName.trim() || session.title,
          sessionInput: lastInput as unknown as Record<string, unknown>,
          generatedSession: session as unknown as Record<string, unknown>,
        });
        setCurrentWorkoutId(created.id);
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [session, lastInput, saveName, currentWorkoutId]);

  const saveButtonLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Retry Save"
          : currentWorkoutId
            ? "Update Session"
            : "Save Session";

  return (
    <div className="min-h-full">
      {/* Welcome section - show different content based on state */}
      {!session && !showSessionForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          {user ? (
            <>
              {/* Daily Tip Card */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      {dailyTip.category} Tip
                    </p>
                    <p className="mt-1 text-foreground">{dailyTip.tip}</p>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                      <Flame className="h-5 w-5" />
                      <span className="text-2xl font-bold">{stats.streak}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Target className="h-5 w-5" />
                      <span className="text-2xl font-bold">{stats.thisWeekSessions}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">This Week</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-500">
                      <Clock className="h-5 w-5" />
                      <span className="text-2xl font-bold">{stats.totalMinutes}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Minutes (30d)</p>
                  </div>
                </div>
              )}

              {/* Start Session Button */}
              <button
                onClick={handleGenerateNew}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
              >
                <Plus className="h-6 w-6" />
                Start New Session
              </button>

              {/* Quick Links */}
              <div className="flex justify-center gap-6 text-sm">
                <Link to="/workouts" className="text-muted-foreground hover:text-foreground">
                  View Saved Sessions
                </Link>
                <Link to="/stats" className="text-muted-foreground hover:text-foreground">
                  View Stats
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Build your perfect climbing session
              </h1>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Tell us about today. We'll generate a session plan you can actually follow at the
                gym.
              </p>
              {!authLoading && (
                <button
                  onClick={login}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Get Started
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Content - only show when user is logged in */}
      {user && (
        <AnimatePresence mode="wait">
          {session ? (
            <motion.div
              key="session"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SessionView
                session={session}
                onBack={handleBack}
                onRegenerate={handleRegenerate}
                onSave={handleSave}
                onSessionChange={handleSessionChange}
                saveLabel={saveButtonLabel}
              />
            </motion.div>
          ) : showSessionForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-2xl"
            >
              <button
                onClick={() => setShowSessionForm(false)}
                className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
                Back
              </button>
              <SessionForm onGenerate={handleGenerate} loading={generating} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      {/* Save dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            key="save-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Name this session
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give it a name so you can find it later.
              </p>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmSave()}
                placeholder="e.g. Tuesday overhang session"
                className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={handleConfirmSave}
                disabled={!saveName.trim()}
                className="mt-4 w-full rounded-lg border border-border bg-background py-2.5 font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted disabled:opacity-40"
              >
                Save Session
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="mt-2 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login prompt */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            key="login-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Sign in to continue
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create an account to generate sessions, track your progress, and save workouts.
              </p>
              <button
                onClick={login}
                className="mt-5 w-full rounded-lg border border-border bg-background py-2.5 font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted"
              >
                Sign in with Google
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="mt-2 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
