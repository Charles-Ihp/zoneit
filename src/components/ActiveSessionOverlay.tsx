import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import type { GeneratedSession } from "@/lib/types";
import { api, type CreateSessionLogBody, type ExerciseLogData } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
} from "@/lib/active-session-store";

interface ActiveSessionOverlayProps {
  session: GeneratedSession;
  workoutId?: string;
  onClose: () => void;
}

interface SetState {
  reps: number;
  completed: boolean;
}

interface ExerciseState {
  key: string; // Unique key for reordering
  id: string;
  name: string;
  description: string;
  focus: string[];
  duration: number;
  elapsed: number;
  isDone: boolean;
  isActive: boolean;
  /** For set-based exercises */
  sets: SetState[];
  /** Whether this exercise uses sets/reps (vs time-based) */
  isSetBased: boolean;
  defaultReps: number;
  notes: string;
}

const REST_TIME_OPTIONS = [30, 60, 90, 120, 180, 300];
const DEFAULT_REST_TIME = 90;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ActiveSessionOverlay({ session, workoutId, onClose }: ActiveSessionOverlayProps) {
  const { user } = useAuth();

  let exKeyCounter = 0;
  const allExercises: ExerciseState[] = session.blocks.flatMap((block) =>
    block.exercises.map(({ exercise, duration }) => {
      const isSetBased = exercise.defaultSets !== null && exercise.defaultReps !== null;
      const numSets = exercise.defaultSets ?? 1;
      const defaultReps = exercise.defaultReps ?? 0;
      return {
        key: `${exercise.id}-${exKeyCounter++}`,
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        focus: exercise.focus,
        duration,
        elapsed: 0,
        isDone: false,
        isActive: false,
        isSetBased,
        defaultReps,
        notes: "",
        sets: isSetBased
          ? Array.from({ length: numSets }, () => ({ reps: defaultReps, completed: false }))
          : [],
      };
    }),
  );

  // Load any persisted session that matches the current session title
  const storedOnMount = (() => {
    const s = loadActiveSession();
    return s && s.session.title === session.title ? s : null;
  })();
  const isRestore = storedOnMount !== null;

  // Migrate old stored exercises to include new fields
  const migrateExercises = (stored: ExerciseState[]): ExerciseState[] => {
    return stored.map((ex, idx) => {
      const original = allExercises.find((a) => a.id === ex.id) ?? allExercises[idx];
      return {
        ...ex,
        key: ex.key ?? `${ex.id}-${idx}`,
        description: ex.description ?? original?.description ?? "",
        focus: ex.focus ?? original?.focus ?? [],
        notes: ex.notes ?? "",
      };
    });
  };

  const [exercises, setExercises] = useState<ExerciseState[]>(
    () => (isRestore ? migrateExercises(storedOnMount!.exercises as ExerciseState[]) : allExercises),
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(
    isRestore ? storedOnMount!.activeIdx : null,
  );
  const [sessionElapsed, setSessionElapsed] = useState(
    isRestore ? Math.floor(storedOnMount!.sessionBaseElapsed) : 0,
  );
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState(isRestore ? storedOnMount!.notes : "");
  const [showFinish, setShowFinish] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Rest timer state
  const [restTimeSeconds, setRestTimeSeconds] = useState(
    () => user?.restTimeSeconds ?? DEFAULT_REST_TIME,
  );
  const [isResting, setIsResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [showRestSettings, setShowRestSettings] = useState(false);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save rest time to user profile when changed
  const updateRestTime = useCallback(
    async (seconds: number) => {
      setRestTimeSeconds(seconds);
      if (user) {
        try {
          await api.users.updateMe({ restTimeSeconds: seconds });
        } catch {
          /* ignore save errors */
        }
      }
    },
    [user],
  );

  const startedAt = useRef<string>(isRestore ? storedOnMount!.startedAt : new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Wall-clock references so the timer stays accurate in background tabs
  const sessionStartWall = useRef<number | null>(null);
  const sessionBaseElapsed = useRef<number>(isRestore ? storedOnMount!.sessionBaseElapsed : 0);
  const exerciseStartWall = useRef<number | null>(null);
  const exerciseBaseElapsed = useRef<number>(isRestore ? storedOnMount!.exerciseBaseElapsed : 0);

  // On mount: if restoring a running session, catch up elapsed time and auto-resume
  useEffect(() => {
    if (!isRestore || !storedOnMount) return;
    if (storedOnMount.runningAt !== null) {
      const extra = (Date.now() - storedOnMount.runningAt) / 1000;
      sessionBaseElapsed.current = storedOnMount.sessionBaseElapsed + extra;
      exerciseBaseElapsed.current = storedOnMount.exerciseBaseElapsed + extra;
      setSessionElapsed(Math.floor(sessionBaseElapsed.current));
      // Update the active exercise's elapsed to include the time since the page closed
      if (storedOnMount.activeIdx !== null) {
        const extraFloor = Math.floor(extra);
        setExercises((prev) =>
          prev.map((ex, i) =>
            i === storedOnMount.activeIdx ? { ...ex, elapsed: ex.elapsed + extraFloor } : ex,
          ),
        );
      }
      setRunning(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Persist state to localStorage whenever meaningful state changes.
  // We save sessionBaseElapsed (from the ref) and runningAt so we can
  // reconstruct total elapsed on the next page load.
  useEffect(() => {
    if (saved) return; // already finished — store was cleared
    saveActiveSession({
      session,
      workoutId,
      startedAt: startedAt.current,
      exercises,
      sessionBaseElapsed: sessionBaseElapsed.current,
      exerciseBaseElapsed: exerciseBaseElapsed.current,
      activeIdx,
      notes,
      runningAt: sessionStartWall.current,
    });
  }, [exercises, activeIdx, notes, running, saved, session, workoutId]);

  // Rest timer countdown
  useEffect(() => {
    if (isResting && restRemaining > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isResting, restRemaining]);

  const startRestTimer = useCallback(() => {
    setRestRemaining(restTimeSeconds);
    setIsResting(true);
  }, [restTimeSeconds]);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestRemaining(0);
  }, []);

  const addRestTime = useCallback((seconds: number) => {
    setRestRemaining((prev) => Math.max(0, prev + seconds));
  }, []);

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
    clearActiveSession();
    if (!user) {
      setSaved(true);
      return;
    }
    setSaving(true);
    try {
      // Map exercise state to log data
      const exercisesData: ExerciseLogData[] = exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        isSetBased: ex.isSetBased,
        durationSeconds: ex.elapsed,
      }));
      const body: CreateSessionLogBody = {
        workoutId: workoutId ?? undefined,
        sessionTitle: session.title,
        sessionSubtitle: session.subtitle,
        startedAt: startedAt.current,
        durationSeconds: sessionElapsed,
        exerciseCount: exercises.length,
        notes: notes.trim(),
        exercises: exercisesData,
      };
      await api.sessionLogs.create(body);
    } catch {
      /* close gracefully */
    } finally {
      setSaving(false);
      setSaved(true);
    }
  }, [user, workoutId, session, sessionElapsed, exercises, notes]);

  const doneCount = exercises.filter((e) => e.isDone).length;
  const allDone = doneCount === exercises.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCancel(true)}
            className="rounded border border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
            title="Cancel session"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Active Session
            </p>
            <h2 className="font-heading text-sm font-bold text-foreground">{session.title}</h2>
          </div>
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

      {/* Exercise list - Reorderable */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <Reorder.Group
          axis="y"
          values={exercises}
          onReorder={setExercises}
          className="space-y-3 px-4 py-4"
        >
          {exercises.map((state, idx) => (
            <ExerciseCard
              key={state.key}
              state={state}
              restTimeSeconds={restTimeSeconds}
              onStart={() => startExercise(idx)}
              onDone={() => markDone(idx)}
              onUpdateSets={(sets) => {
                setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, sets } : ex)));
              }}
              onUpdateNotes={(notes) => {
                setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, notes } : ex)));
              }}
              onSetCompleted={startRestTimer}
            />
          ))}
        </Reorder.Group>
      </div>

      {/* Rest Timer Banner */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed left-0 right-0 z-10 px-4"
            style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto max-w-md rounded-lg border border-primary bg-primary/10 p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Rest
                    </p>
                    <p className="font-heading text-2xl font-bold tabular-nums text-primary">
                      {formatRestTime(restRemaining)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addRestTime(-30)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-border text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    -30
                  </button>
                  <button
                    onClick={() => addRestTime(30)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-border text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    +30
                  </button>
                  <button
                    onClick={skipRest}
                    className="rounded bg-primary px-3 py-1.5 font-heading text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {doneCount}/{exercises.length} done
            </span>
            <button
              onClick={() => setShowRestSettings(true)}
              className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
              title="Rest timer settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {restTimeSeconds}s
            </button>
          </div>
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

      {/* Rest Settings Modal */}
      <AnimatePresence>
        {showRestSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
            onClick={() => setShowRestSettings(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold text-foreground">Rest Timer</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set your default rest time between sets
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {REST_TIME_OPTIONS.map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => {
                      updateRestTime(seconds);
                      setShowRestSettings(false);
                    }}
                    className={`rounded border py-3 font-heading text-sm font-bold transition-colors ${
                      restTimeSeconds === seconds
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
                    {seconds === 90 && (
                      <span className="ml-1 text-xs text-muted-foreground">(default)</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowRestSettings(false)}
                className="mt-4 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish modal */}
      <AnimatePresence>
        {showCancel && !saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
            onClick={() => setShowCancel(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-destructive"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <h2 className="font-heading text-lg font-bold text-foreground">Cancel session?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You've been working out for {formatTime(sessionElapsed)} and completed {doneCount}/
                {exercises.length} exercises.
                <span className="mt-2 block font-medium text-destructive">
                  This session will not be saved and all progress will be lost.
                </span>
              </p>
              <button
                onClick={() => {
                  if (intervalRef.current) clearInterval(intervalRef.current);
                  clearActiveSession();
                  onClose();
                }}
                className="mt-4 w-full rounded bg-destructive py-3 font-heading text-sm font-bold text-destructive-foreground transition-all hover:bg-destructive/90"
              >
                Cancel Session
              </button>
              <button
                onClick={() => setShowCancel(false)}
                className="mt-2 w-full rounded border border-border py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                Keep Going
              </button>
            </motion.div>
          </motion.div>
        )}

        {showFinish && !saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
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
  state,
  restTimeSeconds,
  onStart,
  onDone,
  onUpdateSets,
  onUpdateNotes,
  onSetCompleted,
}: {
  state: ExerciseState;
  restTimeSeconds: number;
  onStart: () => void;
  onDone: () => void;
  onUpdateSets: (sets: SetState[]) => void;
  onUpdateNotes: (notes: string) => void;
  onSetCompleted: () => void;
}) {
  const dragControls = useDragControls();

  const toggleSetComplete = (setIdx: number) => {
    const wasCompleted = state.sets[setIdx].completed;
    const newSets = state.sets.map((s, i) =>
      i === setIdx ? { ...s, completed: !s.completed } : s,
    );
    onUpdateSets(newSets);
    if (!wasCompleted) {
      onSetCompleted();
    }
  };

  const updateReps = (setIdx: number, reps: number) => {
    const newSets = state.sets.map((s, i) => (i === setIdx ? { ...s, reps } : s));
    onUpdateSets(newSets);
  };

  const addSet = () => {
    onUpdateSets([...state.sets, { reps: state.defaultReps, completed: false }]);
  };

  const removeSet = (setIdx: number) => {
    if (state.sets.length <= 1) return;
    onUpdateSets(state.sets.filter((_, i) => i !== setIdx));
  };

  const formatRestTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  return (
    <Reorder.Item
      value={state}
      dragListener={false}
      dragControls={dragControls}
      className={`rounded-xl border transition-colors ${
        state.isActive
          ? "border-primary bg-primary/5"
          : state.isDone
            ? "border-border bg-muted/20 opacity-70"
            : "border-border bg-card"
      }`}
    >
      {/* Header - draggable area */}
      <div 
        onPointerDown={(e) => {
          // Don't start drag if clicking on buttons
          if ((e.target as HTMLElement).closest('button')) return;
          dragControls.start(e);
        }}
        className="flex cursor-grab touch-none items-center gap-3 p-4 pb-2 active:cursor-grabbing"
      >
        {/* Exercise info */}
        <div className="min-w-0 flex-1">
          <h4
            className={`font-heading text-sm font-bold ${state.isDone ? "text-muted-foreground line-through" : "text-primary"}`}
          >
            {state.name}
          </h4>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!state.isDone && !state.isActive && (
            <button
              onClick={onStart}
              className="rounded-lg border border-border px-3 py-1.5 font-heading text-xs font-bold text-foreground transition-colors hover:bg-secondary"
            >
              Start
            </button>
          )}
          {!state.isDone && (
            <button
              onClick={onDone}
              className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Done
            </button>
          )}
          {state.isDone && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Notes input */}
      <div className="px-4 pb-2">
        <input
          type="text"
          value={state.notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Add notes here..."
          className="w-full bg-transparent text-base text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          style={{ fontSize: "16px" }}
          disabled={state.isDone}
        />
      </div>

      {/* Rest timer indicator */}
      {state.isSetBased && (
        <div className="flex items-center gap-2 px-4 pb-3 text-primary">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm font-medium">Rest Timer: {formatRestTime(restTimeSeconds)}</span>
        </div>
      )}

      {/* Sets tracking */}
      {state.isSetBased && state.sets.length > 0 && (
        <div className="border-t border-border">
          {/* Header row */}
          <div className="grid grid-cols-[48px_1fr_80px_48px] items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Set</span>
            <span>Previous</span>
            <span className="text-center">Reps</span>
            <span></span>
          </div>

          {/* Set rows */}
          {state.sets.map((set, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-[48px_1fr_80px_48px] items-center gap-2 px-4 py-2 ${
                set.completed ? "bg-primary/5" : idx % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <span className="font-heading text-base font-bold text-foreground">{idx + 1}</span>
              <span className="text-sm text-muted-foreground">× {state.defaultReps}</span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={set.reps || ""}
                onChange={(e) => updateReps(idx, parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder={String(state.defaultReps)}
                className="w-full rounded-lg border border-border bg-background py-2 text-center text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                style={{ fontSize: "16px" }}
                min={0}
                disabled={state.isDone}
              />
              <button
                onClick={() => toggleSetComplete(idx)}
                disabled={state.isDone}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  set.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground/50 hover:border-primary hover:text-primary"
                } disabled:opacity-50`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add/remove set buttons */}
          {!state.isDone && (
            <div className="flex gap-2 p-4 pt-2">
              <button
                onClick={addSet}
                className="flex-1 rounded-lg border border-dashed border-border py-2 text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                + Add Set
              </button>
              {state.sets.length > 1 && (
                <button
                  onClick={() => removeSet(state.sets.length - 1)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Focus tags - collapsed when done */}
      {!state.isDone && state.focus?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {state.focus.map((f) => (
            <span
              key={f}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </Reorder.Item>
  );
}
