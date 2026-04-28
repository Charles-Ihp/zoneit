import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SessionForm } from "@/components/SessionForm";
import { SessionView } from "@/components/SessionView";
import { SessionSelectionPanel } from "@/components/SessionSelectionPanel";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { GeneratedSession, SessionInput } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { api, type WorkoutResponse } from "@/lib/api";
import { loadActiveSession } from "@/lib/active-session-store";

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
  const navigate = useNavigate();
  const { user, loading: authLoading, login, logout } = useAuth();
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [lastInput, setLastInput] = useState<SessionInput | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);

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

  const handleSelectWorkout = useCallback(
    (workout: WorkoutResponse) => {
      navigate({ to: "/workouts/$id", params: { id: workout.id } });
    },
    [navigate],
  );

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
    <div className="flex min-h-screen flex-col bg-background">
      <Header transparent={!session && !showSessionForm} />

      {/* Hero - show different content based on state (hide when showing form) */}
      {!session && !showSessionForm && (
        <div
          className={`hero-gradient relative flex flex-col items-center justify-center px-4 pt-20 pb-16 text-center sm:pt-24 sm:pb-20 ${!user && !authLoading ? "flex-1" : "min-h-[60vh] sm:min-h-[70vh]"}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 mx-auto max-w-3xl"
          >
            {user ? (
              <>
                <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                  Welcome back,
                  <br />
                  <span className="gradient-text">ready to climb?</span>
                </h1>
                <p className="mx-auto mt-6 max-w-lg text-base text-white/70 sm:text-lg">
                  Start a new session or continue with a saved one.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                  Build your perfect
                  <br />
                  <span className="gradient-text">climbing session</span>
                </h1>
                <p className="mx-auto mt-6 max-w-lg text-base text-white/70 sm:text-lg">
                  Tell us about today. We'll generate a session plan you can actually follow at the
                  gym.
                </p>
                {/* Show CTA button only for non-logged in users on landing */}
                {!user && !authLoading && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    onClick={login}
                    className="mt-8 inline-flex w-full max-w-md items-center justify-center gap-4 rounded-xl border border-white/20 bg-white/10 px-10 py-5 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20 sm:w-auto"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/30">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="block font-heading text-lg font-bold text-white">
                        Generate New Session
                      </span>
                      <span className="block text-sm text-white/60">Sign in to get started</span>
                    </div>
                  </motion.button>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Content - only show when user is logged in */}
      {user && (
        <main className="relative flex-1">
          <AnimatePresence mode="wait">
            {session ? (
              <motion.div
                key="session"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="pb-20"
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
            ) : !showSessionForm ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <SessionSelectionPanel
                  onGenerateNew={handleGenerateNew}
                  onSelectWorkout={handleSelectWorkout}
                />
              </motion.div>
            ) : showSessionForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mx-auto max-w-2xl px-4 py-8 sm:px-6"
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
                  Back to sessions
                </button>
                <SessionForm onGenerate={handleGenerate} loading={generating} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Save dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            key="save-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-sm rounded-xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold gradient-text">Name this session</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give it a name so you can find it later.
              </p>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmSave()}
                placeholder="e.g. Tuesday overhang session"
                className="mt-4 w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button
                onClick={handleConfirmSave}
                disabled={!saveName.trim()}
                className="glow-button mt-4 w-full rounded-lg py-2.5 font-heading text-sm font-bold text-white transition-all disabled:opacity-40 disabled:shadow-none"
              >
                Save Session
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="mt-2 w-full rounded-lg border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-sm rounded-xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold gradient-text">Sign in to continue</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create an account to generate sessions, track your progress, and save workouts.
              </p>
              <button
                onClick={login}
                className="glow-button mt-5 w-full rounded-lg py-2.5 font-heading text-sm font-bold text-white transition-all"
              >
                Sign in with Google
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="mt-2 w-full rounded-lg border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
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
