import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedSession, ExerciseItem } from "@/lib/types";
import { api, type CreateSessionLogBody } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface ActiveSessionOverlayProps {
  session: GeneratedSession;
  workoutId?: string;
  onClose: () => void;
}

interface ExerciseState {
  id: string;
  name: string;
  duration: number;
  elapsed: number;
  isDone: boolean;
  isActive: boolean;
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

  const allExercises: ExerciseState[] = session.blocks.flatMap((block) =>
    block.exercises.map(({ exercise, duration }) => ({
      id: exercise.id,
      name: exercise.name,
      duration,
      elapsed: 0,
      isDone: false,
      isActive: false,
    })),
  );

  const [exercises, setExercises] = useState<ExerciseState[]>(allExercises);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [showFinish, setShowFinish] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const startedAt = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Wall-clock references so the timer stays accurate in background tabs
  const sessionStartWall = useRef<number | null>(null);
  const sessionBaseElapsed = useRef<number>(0);
  const exerciseStartWall = useRef<number | null>(null);
  const exerciseBaseElapsed = useRef<number>(0);

  useEffect(() => {
    if (running) {
      const now = Date.now();
      sessionStartWall.current = now;
      exerciseStartWall.current = now;
      intervalRef.current = setInterval(() => {
        const wall = Date.now();
        const sessionSec = Math.floor(
          sessionBaseElapsed.current + (wall - (sessionStartWall.current ?? wall)) / 1000,
        );
        const exSec = Math.floor(
          exerciseBaseElapsed.current + (wall - (exerciseStartWall.current ?? wall)) / 1000,
        );
        setSessionElapsed(sessionSec);
        setExercises((prev) =>
          prev.map((ex) => (ex.isActive && !ex.isDone ? { ...ex, elapsed: exSec } : ex)),
        );
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Snapshot elapsed so far when paused
      if (sessionStartWall.current !== null) {
        sessionBaseElapsed.current += (Date.now() - sessionStartWall.current) / 1000;
        sessionStartWall.current = null;
      }
      if (exerciseStartWall.current !== null) {
        exerciseBaseElapsed.current += (Date.now() - exerciseStartWall.current) / 1000;
        exerciseStartWall.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const startExercise = (idx: number) => {
    // Reset per-exercise wall-clock when switching to a new exercise
    exerciseBaseElapsed.current = 0;
    exerciseStartWall.current = Date.now();
    setActiveIdx(idx);
    setRunning(true);
    setExercises((prev) =>
      prev.map((ex, i) => ({
        ...ex,
        isActive: i === idx && !ex.isDone,
        elapsed: i === idx ? 0 : ex.elapsed,
      })),
    );
  };

  const markDone = useCallback(
    (idx: number) => {
      setExercises((prev) =>
        prev.map((ex, i) => (i === idx ? { ...ex, isDone: true, isActive: false } : ex)),
      );
      const next = exercises.findIndex((ex, i) => i > idx && !ex.isDone);
      if (next !== -1) {
        startExercise(next);
      } else {
        setRunning(false);
        setActiveIdx(null);
      }
    },
    [exercises],
  );

  const handleFinish = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
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
        durationSeconds: sessionElapsed,
        exerciseCount: exercises.length,
        notes: notes.trim(),
      };
      await api.sessionLogs.create(body);
    } catch {
      /* close gracefully */
    } finally {
      setSaving(false);
      setSaved(true);
    }
  }, [user, workoutId, session, sessionElapsed, exercises.length, notes]);

  const doneCount = exercises.filter((e) => e.isDone).length;
  const allDone = doneCount === exercises.length;

  // Group back into blocks for display
  let exIdx = 0;
  const blocks = session.blocks.map((block) => {
    const items = block.exercises.map(({ exercise }) => {
      const state = exercises[exIdx];
      const idx = exIdx++;
      return { exercise, state, idx };
    });
    return { block, items };
  });

  const phaseBorder: Record<string, string> = {
    warmup: "border-l-warm",
    main: "border-l-primary",
    addon: "border-l-accent",
    cooldown: "border-l-muted-foreground/40",
  };
  const phaseLabel: Record<string, string> = {
    warmup: "WARM-UP",
    main: "MAIN",
    addon: "SUPPLEMENTARY",
    cooldown: "COOL DOWN",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Active Session
          </p>
          <h2 className="font-heading text-sm font-bold text-foreground">{session.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl font-bold tabular-nums text-primary">
            {formatTime(sessionElapsed)}
          </span>
          <button
            onClick={() => setShowFinish(true)}
            className="rounded bg-primary px-3 py-1.5 font-heading text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Finish
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto pb-24">
        {blocks.map(({ block, items }) => (
          <div
            key={block.phase}
            className={`border-l-4 ${phaseBorder[block.phase] ?? "border-l-border"}`}
          >
            <div className="px-4 pt-4 pb-1">
              <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {phaseLabel[block.phase] ?? block.phase} · {block.phaseLabel}
              </span>
            </div>
            <div className="space-y-2 px-4 pb-4">
              {items.map(({ exercise, state, idx }) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  state={state}
                  onStart={() => startExercise(idx)}
                  onDone={() => markDone(idx)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {doneCount}/{exercises.length} done
          </span>
          <div className="flex gap-2">
            {!allDone && activeIdx !== null && (
              <button
                onClick={() => setRunning((r) => !r)}
                className="rounded border border-border px-4 py-2 font-heading text-sm font-bold text-foreground transition-colors hover:bg-secondary"
              >
                {running ? "Pause" : "Resume"}
              </button>
            )}
            {!allDone && activeIdx === null && (
              <button
                onClick={() => {
                  const first = exercises.findIndex((e) => !e.isDone);
                  if (first !== -1) startExercise(first);
                }}
                className="rounded bg-primary px-5 py-2 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Start
              </button>
            )}
            {allDone && (
              <button
                onClick={() => setShowFinish(true)}
                className="rounded bg-primary px-5 py-2 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Finish Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Finish modal */}
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
                {formatTime(sessionElapsed)} · {doneCount}/{exercises.length} exercises done.
                {user ? " This will be saved to your history." : " Sign in to save to history."}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session notes (optional)"
                rows={2}
                className="mt-3 w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleFinish}
                disabled={saving}
                className="mt-3 w-full rounded bg-primary py-3 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
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
            className="absolute inset-0 flex items-center justify-center bg-background"
          >
            <div className="text-center">
              <p className="font-heading text-4xl font-extrabold text-primary">Done</p>
              <p className="mt-2 font-heading text-base font-bold text-foreground">
                Session logged!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatTime(sessionElapsed)} · {doneCount} exercises
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

function ExerciseCard({
  exercise,
  state,
  onStart,
  onDone,
}: {
  exercise: ExerciseItem;
  state: ExerciseState;
  onStart: () => void;
  onDone: () => void;
}) {
  const badgeText =
    state.isDone && state.elapsed > 0
      ? formatTime(state.elapsed)
      : state.isActive
        ? formatTime(state.elapsed)
        : `${state.duration}m`;

  return (
    <div
      className={`flex items-start gap-3 rounded border p-3 transition-colors sm:p-4 ${
        state.isActive
          ? "border-primary bg-primary/5"
          : state.isDone
            ? "border-border bg-muted/30 opacity-60"
            : "border-border bg-card"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded font-heading text-xs font-bold tabular-nums ${
          state.isDone || state.isActive
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {badgeText}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-heading text-sm font-bold text-foreground">{exercise.name}</h4>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {exercise.description}
        </p>
        {exercise.focus.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {exercise.focus.map((f) => (
              <span
                key={f}
                className="rounded bg-secondary px-1.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-secondary-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        {!state.isDone && !state.isActive && (
          <button
            onClick={onStart}
            className="rounded border border-border px-2.5 py-1 font-heading text-xs font-bold text-foreground transition-colors hover:bg-secondary"
          >
            Start
          </button>
        )}
        {!state.isDone && (
          <button
            onClick={onDone}
            className="rounded bg-primary px-2.5 py-1 font-heading text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Done
          </button>
        )}
        {state.isDone && <span className="font-heading text-xs font-bold text-primary">✓</span>}
      </div>
    </div>
  );
}
