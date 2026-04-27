import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SessionForm } from "@/components/SessionForm";
import { SessionView } from "@/components/SessionView";
import { SessionSelectionPanel } from "@/components/SessionSelectionPanel";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
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
  const { user, loading: authLoading, login, logout } = useAuth();
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [lastInput, setLastInput] = useState<SessionInput | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);

  // Restore session from localStorage only when user is logged in
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const stored = loadActiveSession();
      if (stored && !session) {
        setSession(stored.session);
      }
    } else {
      setSession(null);
      setShowSessionForm(false);
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setGenerating(false);
    }
  }, [lastInput, user]);

  const handleBack = useCallback(() => {
    setSession(null);
    setSaveState("idle");
    setShowSessionForm(false);
  }, []);

  const handleGenerateNew = useCallback(() => {
    setShowSessionForm(true);
  }, []);

  const handleSelectWorkout = useCallback((workout: WorkoutResponse) => {
    const generatedSession = workout.generatedSession as unknown as GeneratedSession;
    const sessionInput = workout.sessionInput as unknown as SessionInput;
    setSession(generatedSession);
    setLastInput(sessionInput);
    setSaveState("saved"); // Already saved workout
  }, []);

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
      await api.workouts.create({
        name: saveName.trim() || session.title,
        sessionInput: lastInput as unknown as Record<string, unknown>,
        generatedSession: session as unknown as Record<string, unknown>,
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [session, lastInput, saveName]);

  const saveButtonLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Retry Save"
          : "Save Session";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-heading text-lg font-extrabold tracking-tight gradient-text"
            >
              GRAVITACIO
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!authLoading &&
              (user ? (
                <UserMenu user={user} onLogout={logout} />
              ) : (
                <button
                  onClick={login}
                  className="glow-button rounded-lg px-4 py-2 text-xs font-bold text-white transition-all"
                >
                  Sign in
                </button>
              ))}
          </div>
        </div>
      </header>

      {/* Hero - show different content based on state */}
      {!session && (
        <div className="hero-gradient relative border-b border-border/30 px-4 py-12 text-center sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            {user && !showSessionForm ? (
              <>
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  <span className="gradient-text">Welcome back!</span>
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
                  Ready to climb? Start a new session or continue with a saved one.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  <span className="text-foreground">Build your </span>
                  <span className="gradient-text">climb.</span>
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
                  Tell us about today. We'll generate a session plan you can actually follow at the
                  gym.
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Content */}
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
                onSessionChange={setSession}
                saveLabel={user ? saveButtonLabel : "Save Session"}
              />
            </motion.div>
          ) : user && !showSessionForm ? (
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
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="mx-auto max-w-2xl px-4 py-8 sm:px-6"
            >
              {user && (
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
              )}
              <SessionForm onGenerate={handleGenerate} loading={generating} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
