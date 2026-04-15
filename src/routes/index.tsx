import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SessionForm } from "@/components/SessionForm";
import { SessionView } from "@/components/SessionView";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
import type { GeneratedSession, SessionInput } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Zone it" },
      {
        name: "description",
        content:
          "Generate personalized climbing sessions based on your level, goals, and energy. Rule-based session plans you can actually follow at the gym.",
      },
      { property: "og:title", content: "Zone it" },
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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [generating, setGenerating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  const handleGenerate = useCallback(async (input: SessionInput) => {
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
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!lastInput) return;
    setGenerating(true);
    try {
      const result = await api.sessions.generate(lastInput);
      setSession(result);
      setSaveState("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setGenerating(false);
    }
  }, [lastInput]);

  const handleBack = useCallback(() => {
    setSession(null);
    setSaveState("idle");
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
        ? "✓ Saved"
        : saveState === "error"
          ? "Retry Save"
          : "Save Session";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Header */}
      <header className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/8%,transparent_60%)]" />
        {/* Auth control */}
        <div className="absolute right-4 top-4 z-10">
          {!authLoading &&
            (user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <button
                onClick={login}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90"
              >
                Sign in with Google
              </button>
            ))}
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-12 text-center md:py-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1 font-heading text-xs font-bold uppercase tracking-widest text-primary">
              Session Generator
            </span>
            <h1 className="mt-4 font-heading text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
              Zone It
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
              {session
                ? "Your personalized session is ready. Follow the plan, climb smart."
                : "Tell us about your session. We'll build a plan you can actually follow at the gym."}
            </p>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <main className="relative">
        <AnimatePresence mode="wait">
          {session ? (
            <motion.div
              key="session"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="pb-16"
            >
              <SessionView
                session={session}
                onBack={handleBack}
                onRegenerate={handleRegenerate}
                onSave={handleSave}
                saveLabel={user ? saveButtonLabel : "Save Session"}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-3xl px-6 py-10"
            >
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-1 text-3xl">💾</div>
              <h2 className="mt-3 font-heading text-xl font-bold text-foreground">
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
                className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button
                onClick={handleConfirmSave}
                disabled={!saveName.trim()}
                className="mt-4 w-full rounded-xl bg-primary py-3 font-heading text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                Save Session
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-1 text-3xl">💾</div>
              <h2 className="mt-3 font-heading text-xl font-bold text-foreground">
                Save your session
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with Google to save this workout and access it any time.
              </p>
              <button
                onClick={login}
                className="mt-6 w-full rounded-xl bg-primary py-3 font-heading text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90"
              >
                Sign in with Google
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
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
