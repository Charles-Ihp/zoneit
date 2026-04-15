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
  const { user, loading: authLoading, login, logout, testingMode } = useAuth();
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [lastInput, setLastInput] = useState<SessionInput | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [generating, setGenerating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showCodeGate, setShowCodeGate] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!testingMode) {
      login();
      return;
    }
    setShowCodeGate(true);
    setAccessCode("");
    setCodeError("");
  }, [testingMode, login]);

  const handleVerifyCode = useCallback(async () => {
    setVerifying(true);
    setCodeError("");
    try {
      const { valid } = await api.auth.verifyCode(accessCode);
      if (valid) {
        setShowCodeGate(false);
        login();
      } else setCodeError("Invalid access code. Please try again.");
    } catch {
      setCodeError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }, [accessCode, login]);

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
        ? "Saved"
        : saveState === "error"
          ? "Retry Save"
          : "Save Session";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="font-heading text-lg font-extrabold tracking-tight text-foreground">
              🪨 Zone It
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!authLoading &&
              (user ? (
                <UserMenu user={user} onLogout={logout} />
              ) : (
                <button
                  onClick={handleSignIn}
                  className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  Sign in
                </button>
              ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      {!session && (
        <div className="border-b border-border bg-foreground px-4 py-8 text-center sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-background sm:text-5xl">
              Build your climb.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-background/60">
              Tell us about today. We'll generate a session plan you can actually follow at the gym.
            </p>
          </motion.div>
        </div>
      )}

      {/* Content */}
      <main className="relative">
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
                saveLabel={user ? saveButtonLabel : "Save Session"}
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
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold text-foreground">Name this session</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give it a name so you can find it later.
              </p>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmSave()}
                placeholder="e.g. Tuesday overhang session"
                className="mt-4 w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button
                onClick={handleConfirmSave}
                disabled={!saveName.trim()}
                className="mt-3 w-full rounded bg-primary py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
              >
                Save Session
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="mt-2 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
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
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold text-foreground">Save your session</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with Google to save this workout and access it any time.
              </p>
              <button
                onClick={login}
                className="mt-5 w-full rounded bg-primary py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Sign in with Google
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="mt-2 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Access code gate (testing mode) */}
      <AnimatePresence>
        {showCodeGate && (
          <motion.div
            key="code-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => setShowCodeGate(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold text-foreground">Enter access code</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This app is in testing mode. Enter your 6-character invite code to continue.
              </p>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                placeholder="XXXXXX"
                maxLength={6}
                autoFocus
                className="mt-4 w-full rounded border border-border bg-background px-3 py-2.5 text-center font-heading text-lg font-bold tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
              />
              {codeError && <p className="mt-2 text-xs text-destructive">{codeError}</p>}
              <button
                onClick={handleVerifyCode}
                disabled={verifying || accessCode.length < 6}
                className="mt-3 w-full rounded bg-primary py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
              >
                {verifying ? "Checking…" : "Continue"}
              </button>
              <button
                onClick={() => setShowCodeGate(false)}
                className="mt-2 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
