import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedSession } from "@/lib/types";
import { api, type CreateSessionLogBody } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface ActiveSessionOverlayProps {
  session: GeneratedSession;
  workoutId?: string;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ActiveSessionOverlay({ session, workoutId, onClose }: ActiveSessionOverlayProps) {
  const { user } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const [showFinish, setShowFinish] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const startedAt = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Main timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Rest timer
  const startRest = useCallback((seconds: number) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestSeconds(seconds);
    setRestActive(true);
    restIntervalRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) {
          clearInterval(restIntervalRef.current!);
          setRestActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const cancelRest = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestActive(false);
    setRestSeconds(0);
  }, []);

  const exerciseCount = session.blocks.reduce((n, b) => n + b.exercises.length, 0);

  const handleFinish = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);

    if (!user) {
      setSaved(true);
      return;
    }

    setSaving(true);
    try {
      const body: CreateSessionLogBody = {
        workoutId: workoutId ?? undefined,
        sessionTitle: session.title,
        sessionSubtitle: session.subtitle,
        startedAt: startedAt.current,
        durationSeconds: elapsed,
        exerciseCount,
        notes: notes.trim(),
      };
      await api.sessionLogs.create(body);
      setSaved(true);
    } catch {
      // still close gracefully
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [user, workoutId, session, elapsed, exerciseCount, notes]);

  const REST_PRESETS = [60, 90, 120, 180] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-foreground"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-background/10 px-4 py-3">
        <span className="font-heading text-sm font-bold uppercase tracking-widest text-background/50">
          Session Active
        </span>
        <button
          onClick={() => setShowFinish(true)}
          className="rounded bg-primary px-3 py-1.5 font-heading text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Finish
        </button>
      </div>

      {/* Main timer */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <div>
          <p className="text-center font-heading text-sm font-bold uppercase tracking-widest text-background/40">
            {session.title}
          </p>
          <p className="mt-4 text-center font-heading text-7xl font-extrabold tabular-nums tracking-tight text-background sm:text-8xl">
            {formatTime(elapsed)}
          </p>
          <p className="mt-2 text-center text-sm text-background/40">
            {exerciseCount} exercises · {session.totalDuration} min planned
          </p>
        </div>

        {/* Rest timer */}
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {restActive ? (
              <motion.div
                key="rest-active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded border border-primary/30 bg-background/5 p-4 text-center"
              >
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
                  Rest
                </p>
                <p className="mt-1 font-heading text-4xl font-extrabold tabular-nums text-background">
                  {formatTime(restSeconds)}
                </p>
                <button
                  onClick={cancelRest}
                  className="mt-3 text-xs text-background/40 underline hover:text-background/70"
                >
                  Cancel rest
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="rest-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded border border-background/10 bg-background/5 p-4"
              >
                <p className="mb-2 font-heading text-xs font-bold uppercase tracking-widest text-background/40">
                  Start Rest Timer
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {REST_PRESETS.map((s) => (
                    <button
                      key={s}
                      onClick={() => startRest(s)}
                      className="rounded border border-background/20 py-2 font-heading text-xs font-bold text-background/70 transition-all hover:border-primary hover:text-primary"
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notes */}
        <div className="w-full max-w-sm">
          <p className="mb-1.5 font-heading text-xs font-bold uppercase tracking-widest text-background/40">
            Notes
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How's the session going? Any sends?"
            rows={3}
            className="w-full resize-none rounded border border-background/20 bg-background/5 px-3 py-2.5 text-sm text-background placeholder:text-background/25 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Finish confirmation */}
      <AnimatePresence>
        {showFinish && !saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-end justify-center bg-black/70 sm:items-center"
            onClick={() => setShowFinish(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold text-foreground">End session?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You've been climbing for <strong>{formatTime(elapsed)}</strong>.
                {user ? " This will be saved to your history." : " Sign in to save to history."}
              </p>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="mt-4 w-full rounded bg-primary py-3 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Finish & Save"}
              </button>
              <button
                onClick={() => setShowFinish(false)}
                className="mt-2 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
              >
                Keep going
              </button>
            </motion.div>
          </motion.div>
        )}

        {saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-foreground"
          >
            <div className="text-center">
              <p className="font-heading text-5xl font-extrabold text-primary">✓</p>
              <p className="mt-3 font-heading text-xl font-bold text-background">Session logged!</p>
              <p className="mt-1 text-sm text-background/50">
                {formatTime(elapsed)} · {exerciseCount} exercises
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded bg-primary px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
