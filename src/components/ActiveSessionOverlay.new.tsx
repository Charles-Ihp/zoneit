import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import type { GeneratedSession } from "@/lib/types";
import { api, type CreateSessionLogBody, type ExerciseLogData } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
} from "@/lib/active-session-store";
import {
  requestNotificationPermission,
  initAudioContext,
  sendRestCompleteNotification,
} from "@/lib/notifications";
import {
  ExerciseCard,
  type ExerciseState,
  type SetState,
  RestSettingsModal,
  CancelSessionModal,
  FinishSessionModal,
  SessionSavedModal,
  formatTime,
} from "./session";

interface ActiveSessionOverlayProps {
  session: GeneratedSession;
  workoutId?: string;
  onClose: () => void;
}

const DEFAULT_REST_TIME = 90;

function formatRestTimeDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ActiveSessionOverlay({ session, workoutId, onClose }: ActiveSessionOverlayProps) {
  const { user } = useAuth();

  // Build initial exercises list from session blocks
  const buildInitialExercises = useCallback(
    (previousData?: Record<string, ExerciseLogData>): ExerciseState[] => {
      let exKeyCounter = 0;
      return session.blocks.flatMap((block) =>
        block.exercises.map(({ exercise, duration }) => {
          // Warmup exercises default to 1 set if not explicitly set-based
          const isWarmup = block.phase === "warmup";
          const isSetBased =
            (exercise.defaultSets !== null && exercise.defaultReps !== null) || isWarmup;
          const numSets = exercise.defaultSets ?? 1;
          const defaultReps = exercise.defaultReps ?? (isWarmup ? 1 : 0);
          const prevExercise = previousData?.[exercise.id];

          const sets: SetState[] = isSetBased
            ? Array.from({ length: numSets }, (_, i) => {
                const prevSet = prevExercise?.sets?.[i];
                return {
                  reps: prevSet?.reps ?? defaultReps,
                  weight: prevSet?.weight,
                  completed: false,
                  previousReps: prevSet?.reps,
                  previousWeight: prevSet?.weight,
                };
              })
            : [];

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
            sets,
          };
        }),
      );
    },
    [session],
  );

  // Load persisted session
  const storedOnMount = (() => {
    const s = loadActiveSession();
    return s && s.session.title === session.title ? s : null;
  })();
  const isRestore = storedOnMount !== null;

  const migrateExercises = (stored: ExerciseState[]): ExerciseState[] => {
    const allExercises = buildInitialExercises();
    return stored.map((ex, idx) => {
      const original = allExercises.find((a) => a.id === ex.id) ?? allExercises[idx];
      return {
        ...ex,
        key: ex.key ?? `${ex.id}-${idx}`,
        description: ex.description ?? original?.description ?? "",
        focus: ex.focus ?? original?.focus ?? [],
        notes: ex.notes ?? "",
        sets: ex.sets?.map((s) => ({ ...s })) ?? [],
      };
    });
  };

  // State
  const [exercises, setExercises] = useState<ExerciseState[]>(() =>
    isRestore
      ? migrateExercises(storedOnMount!.exercises as ExerciseState[])
      : buildInitialExercises(),
  );
  const [previousDataLoaded, setPreviousDataLoaded] = useState(isRestore);
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission().then(setNotificationsEnabled);
  }, []);

  // Fetch previous exercise data
  useEffect(() => {
    if (isRestore || !user || previousDataLoaded) return;
    const exerciseIds = session.blocks.flatMap((b) =>
      b.exercises.filter((e) => e.exercise.defaultSets !== null).map((e) => e.exercise.id),
    );
    if (exerciseIds.length === 0) {
      setPreviousDataLoaded(true);
      return;
    }
    api.sessionLogs
      .getPreviousExerciseData(exerciseIds)
      .then((prevData) => {
        if (Object.keys(prevData).length > 0) {
          setExercises(buildInitialExercises(prevData));
        }
        setPreviousDataLoaded(true);
      })
      .catch(() => setPreviousDataLoaded(true));
  }, [isRestore, user, session, previousDataLoaded, buildInitialExercises]);

  // Save rest time to user profile
  const updateRestTime = useCallback(
    async (seconds: number) => {
      setRestTimeSeconds(seconds);
      if (user) {
        try {
          await api.users.updateMe({ restTimeSeconds: seconds });
        } catch {
          /* ignore */
        }
      }
    },
    [user],
  );

  // Timer refs
  const startedAt = useRef<string>(isRestore ? storedOnMount!.startedAt : new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartWall = useRef<number | null>(null);
  const sessionBaseElapsed = useRef<number>(isRestore ? storedOnMount!.sessionBaseElapsed : 0);
  const exerciseStartWall = useRef<number | null>(null);
  const exerciseBaseElapsed = useRef<number>(isRestore ? storedOnMount!.exerciseBaseElapsed : 0);

  // Auto-start on mount
  useEffect(() => {
    if (isRestore && storedOnMount) {
      if (storedOnMount.runningAt !== null) {
        const extra = (Date.now() - storedOnMount.runningAt) / 1000;
        sessionBaseElapsed.current = storedOnMount.sessionBaseElapsed + extra;
        exerciseBaseElapsed.current = storedOnMount.exerciseBaseElapsed + extra;
        setSessionElapsed(Math.floor(sessionBaseElapsed.current));
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
    } else {
      const firstIdx = exercises.findIndex((e) => !e.isDone);
      if (firstIdx !== -1) startExercise(firstIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Session timer
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

  // Persist state
  useEffect(() => {
    if (saved) return;
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

  // Rest timer refs
  const restStartWall = useRef<number | null>(null);
  const restBaseRemaining = useRef<number>(0);

  // Recalculate rest time based on wall clock
  const recalculateRestTime = useCallback(() => {
    if (!isResting || restStartWall.current === null) return;
    const wall = Date.now();
    const elapsed = (wall - restStartWall.current) / 1000;
    const remaining = Math.max(0, Math.ceil(restBaseRemaining.current - elapsed));
    if (remaining <= 0) {
      setIsResting(false);
      setRestRemaining(0);
      restStartWall.current = null;
      sendRestCompleteNotification();
    } else {
      setRestRemaining(remaining);
    }
  }, [isResting]);

  // Rest timer countdown
  useEffect(() => {
    if (isResting && restRemaining > 0) {
      if (restStartWall.current === null) {
        restStartWall.current = Date.now();
        restBaseRemaining.current = restRemaining;
      }
      restIntervalRef.current = setInterval(recalculateRestTime, 500);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      restStartWall.current = null;
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isResting, recalculateRestTime]);

  // Wake up rest timer when tab becomes visible (intervals are throttled in background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isResting) {
        recalculateRestTime();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isResting, recalculateRestTime]);

  const startRestTimer = useCallback(() => {
    initAudioContext();
    restStartWall.current = null;
    restBaseRemaining.current = restTimeSeconds;
    setRestRemaining(restTimeSeconds);
    setIsResting(true);
  }, [restTimeSeconds]);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestRemaining(0);
  }, []);

  const addRestTime = useCallback((seconds: number) => {
    restBaseRemaining.current = Math.max(0, restBaseRemaining.current + seconds);
    setRestRemaining((prev) => Math.max(0, prev + seconds));
  }, []);

  const startExercise = (idx: number) => {
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
      const exercisesData: ExerciseLogData[] = exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight, completed: s.completed })),
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

  const handleCancel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    clearActiveSession();
    onClose();
  }, [onClose]);

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

      {/* Exercise list */}
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
              onUpdateSets={(sets) => {
                setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, sets } : ex)));
                const allSetsComplete = sets.length > 0 && sets.every((s) => s.completed);
                if (allSetsComplete && !state.isDone) markDone(idx);
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
                      {formatRestTimeDisplay(restRemaining)}
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
            {!allDone && (
              <button
                onClick={() => setRunning((r) => !r)}
                className="rounded border border-border px-4 py-2 font-heading text-sm font-bold text-foreground transition-colors hover:bg-secondary"
              >
                {running ? "Pause" : "Resume"}
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

      {/* Modals */}
      <RestSettingsModal
        show={showRestSettings}
        onClose={() => setShowRestSettings(false)}
        restTimeSeconds={restTimeSeconds}
        onUpdateRestTime={updateRestTime}
        notificationsEnabled={notificationsEnabled}
        onNotificationsChange={setNotificationsEnabled}
      />

      <CancelSessionModal
        show={showCancel && !saved}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        sessionElapsed={sessionElapsed}
        doneCount={doneCount}
        totalExercises={exercises.length}
      />

      <FinishSessionModal
        show={showFinish && !saved}
        onClose={() => setShowFinish(false)}
        onConfirm={handleFinish}
        sessionElapsed={sessionElapsed}
        doneCount={doneCount}
        totalExercises={exercises.length}
        notes={notes}
        onNotesChange={setNotes}
        saving={saving}
        isLoggedIn={!!user}
      />

      <SessionSavedModal
        show={saved}
        onClose={onClose}
        sessionElapsed={sessionElapsed}
        doneCount={doneCount}
      />
    </motion.div>
  );
}
