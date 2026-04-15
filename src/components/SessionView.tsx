import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedSession, SessionBlock, ExerciseItem } from "@/lib/types";
import { api, type CreateSessionLogBody } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface SessionViewProps {
  session: GeneratedSession;
  titleOverride?: React.ReactNode;
  workoutId?: string;
  onBack?: () => void;
  onRegenerate?: () => void;
  onSave?: () => void;
  saveLabel?: string;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const phaseColors: Record<string, { bg: string; border: string; accent: string; label: string }> = {
  warmup: {
    bg: "bg-warm/10",
    border: "border-l-warm",
    accent: "text-warm-foreground bg-warm/20",
    label: "WARM-UP",
  },
  main: {
    bg: "bg-primary/5",
    border: "border-l-primary",
    accent: "text-primary-foreground bg-primary",
    label: "MAIN",
  },
  addon: {
    bg: "bg-accent/5",
    border: "border-l-accent",
    accent: "text-accent-foreground bg-accent",
    label: "SUPPLEMENTARY",
  },
  cooldown: {
    bg: "bg-muted",
    border: "border-l-muted-foreground/30",
    accent: "text-muted-foreground bg-secondary",
    label: "COOL DOWN",
  },
};

const phaseIcons: Record<string, string> = {
  warmup: "🔥",
  main: "💪",
  addon: "🔧",
  cooldown: "🧊",
};

export function SessionView({
  session,
  titleOverride,
  workoutId,
  onBack,
  onRegenerate,
  onSave,
  saveLabel = "Save Session",
}: SessionViewProps) {
  const { user } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [runningId, setRunningId] = useState<string | null>(null);
  const [exerciseElapsed, setExerciseElapsed] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const startedAt = useRef<string>("");
  const totalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exerciseCount = session.blocks.reduce((n, b) => n + b.exercises.length, 0);
  const allDone = doneIds.size === exerciseCount && exerciseCount > 0;

  useEffect(() => {
    if (!isActive) return;
    if (paused) {
      if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
      return;
    }
    totalIntervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
    };
  }, [isActive, paused]);

  useEffect(() => {
    if (exIntervalRef.current) clearInterval(exIntervalRef.current);
    if (!runningId || paused) return;
    exIntervalRef.current = setInterval(() => {
      setExerciseElapsed((prev) => ({ ...prev, [runningId]: (prev[runningId] ?? 0) + 1 }));
    }, 1000);
    return () => {
      if (exIntervalRef.current) clearInterval(exIntervalRef.current);
    };
  }, [runningId, paused]);

  useEffect(() => {
    if (allDone && isActive && !showFinish && !saved) setShowFinish(true);
  }, [allDone, isActive, showFinish, saved]);

  const startSession = useCallback(() => {
    startedAt.current = new Date().toISOString();
    setIsActive(true);
    setPaused(false);
    setElapsed(0);
    setDoneIds(new Set());
    setRunningId(null);
    setExerciseElapsed({});
    setSaved(false);
    setNotes("");
  }, []);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const toggleExerciseTimer = useCallback((id: string) => {
    setRunningId((prev) => (prev === id ? null : id));
  }, []);

  const markDone = useCallback((id: string) => {
    setDoneIds((prev) => { const n = new Set(prev); n.add(id); return n; });
    setRunningId((prev) => (prev === id ? null : prev));
  }, []);

  const handleFinish = useCallback(async () => {
    if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
    if (exIntervalRef.current) clearInterval(exIntervalRef.current);
    if (!user) { setSaved(true); setIsActive(false); setShowFinish(false); return; }
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
    } catch { /* fail silently */ } finally {
      setSaving(false);
      setSaved(true);
      setIsActive(false);
      setShowFinish(false);
    }
  }, [user, workoutId, session, elapsed, exerciseCount, notes]);

  const handleCancel = useCallback(() => {
    if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
    if (exIntervalRef.current) clearInterval(exIntervalRef.current);
    setIsActive(false); setPaused(false); setElapsed(0);
    setDoneIds(new Set()); setRunningId(null); setExerciseElapsed({});
    setShowCancel(false);
  }, []);

  return (
    <div>
      {/* Session Header */}
      <div className="border-b border-border bg-foreground px-4 py-6 text-center sm:py-8">
        {titleOverride ?? (
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-background sm:text-4xl">
            {session.title}
          </h1>
        )}
        <p className="mt-1.5 text-sm text-background/60">{session.subtitle}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1">
          <span className="text-xs font-bold text-primary-foreground">
            ⏱ {session.totalDuration} min total
          </span>
        </div>
        {!isActive && (
          <div className="mt-4">
            <button
              onClick={startSession}
              className="rounded bg-primary px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              ▶ Start Session
            </button>
          </div>
        )}
      </div>

      {/* Active session bar */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-primary/30 bg-foreground px-4 py-2.5 sm:px-6"
          >
            <div className="flex items-center gap-3">
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-background/50">
                In Progress
              </span>
              <span className="font-heading text-lg font-extrabold tabular-nums text-background">
                {formatTime(elapsed)}
              </span>
              <span className="text-xs text-background/40">
                {doneIds.size}/{exerciseCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={togglePause}
                className="rounded border border-background/20 px-3 py-1.5 font-heading text-xs font-bold text-background/70 transition-colors hover:border-background/40 hover:text-background"
              >
                {paused ? "▶ Resume" : "⏸ Pause"}
              </button>
              <button
                onClick={() => setShowFinish(true)}
                className="rounded border border-background/20 px-3 py-1.5 font-heading text-xs font-bold text-primary transition-colors hover:border-primary/50"
              >
                Finish
              </button>
              <button
                onClick={() => setShowCancel(true)}
                className="rounded border border-background/20 px-3 py-1.5 font-heading text-xs font-bold text-background/40 transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocks */}
      <div className="divide-y divide-border">
        {session.blocks.map((block, i) => (
          <BlockSection
            key={i}
            block={block}
            index={i}
            isActive={isActive}
            paused={paused}
            doneIds={doneIds}
            runningId={runningId}
            exerciseElapsed={exerciseElapsed}
            onToggleTimer={toggleExerciseTimer}
            onMarkDone={markDone}
          />
        ))}
      </div>

      {/* Tips */}
      {session.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-border bg-muted px-4 py-6 sm:px-6"
        >
          <div className="mx-auto max-w-2xl">
            <h3 className="mb-3 font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Coach Tips
            </h3>
            <ul className="space-y-2">
              {session.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-0.5 shrink-0 font-bold text-primary">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Actions bar (only when not active) */}
      {(onBack || onRegenerate || onSave) && !isActive && (
        <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {onBack && (
                <button onClick={onBack} className="rounded border border-border px-4 py-2.5 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
                  ← Adjust
                </button>
              )}
              {onRegenerate && (
                <button onClick={onRegenerate} className="rounded border border-border px-4 py-2.5 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
                  🎲 Regenerate
                </button>
              )}
            </div>
            {onSave && (
              <button onClick={onSave} className="rounded bg-primary px-5 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 sm:ml-auto">
                💾 {saveLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      <AnimatePresence>
        {showCancel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
            onClick={() => setShowCancel(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-base font-bold text-foreground">Cancel session?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your progress won't be saved.</p>
              <button onClick={handleCancel} className="mt-4 w-full rounded border border-destructive py-2.5 font-heading text-sm font-bold text-destructive transition-colors hover:bg-destructive/5">
                Yes, cancel
              </button>
              <button onClick={() => setShowCancel(false)} className="mt-2 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary">
                Keep going
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish confirm */}
      <AnimatePresence>
        {showFinish && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
            onClick={() => !allDone && setShowFinish(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-heading text-2xl font-extrabold text-primary">
                {allDone ? "🎉 All done!" : "Finish session?"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatTime(elapsed)} · {doneIds.size}/{exerciseCount} exercises
                {user ? " — saved to your history." : " — sign in to save."}
              </p>
              <div className="mt-3">
                <label className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any sends? How did it feel?"
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="mt-3 w-full rounded bg-primary py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Finish & Save"}
              </button>
              {!allDone && (
                <button onClick={() => setShowFinish(false)} className="mt-2 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary">
                  Keep going
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setSaved(false), 3000)}
            className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded border border-primary bg-card px-5 py-3 shadow-lg"
          >
            <span className="font-heading text-sm font-bold text-primary">
              ✓ Session logged — {formatTime(elapsed)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BlockSectionProps {
  block: SessionBlock;
  index: number;
  isActive: boolean;
  paused: boolean;
  doneIds: Set<string>;
  runningId: string | null;
  exerciseElapsed: Record<string, number>;
  onToggleTimer: (id: string) => void;
  onMarkDone: (id: string) => void;
}

function BlockSection({ block, index, isActive, paused, doneIds, runningId, exerciseElapsed, onToggleTimer, onMarkDone }: BlockSectionProps) {
  const colors = phaseColors[block.phase] || phaseColors.main;
  const icon = phaseIcons[block.phase] || "📋";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={`${colors.bg} border-l-4 ${colors.border}`}
    >
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <div>
              <span className={`rounded px-2 py-0.5 font-heading text-[10px] font-bold tracking-widest ${colors.accent}`}>
                {colors.label}
              </span>
              <h2 className="mt-0.5 font-heading text-base font-bold text-foreground">{block.phaseLabel}</h2>
            </div>
          </div>
          <span className="font-heading text-sm font-bold text-muted-foreground">{block.totalDuration} min</span>
        </div>

        <div className="space-y-2">
          {block.exercises.map(({ exercise, duration }, j) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              duration={duration}
              animDelay={index * 0.08 + j * 0.04}
              isActive={isActive}
              paused={paused}
              isDone={doneIds.has(exercise.id)}
              isRunning={runningId === exercise.id}
              elapsed={exerciseElapsed[exercise.id] ?? 0}
              onToggleTimer={() => onToggleTimer(exercise.id)}
              onMarkDone={() => onMarkDone(exercise.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface ExerciseCardProps {
  exercise: ExerciseItem;
  duration: number;
  animDelay: number;
  isActive: boolean;
  paused: boolean;
  isDone: boolean;
  isRunning: boolean;
  elapsed: number;
  onToggleTimer: () => void;
  onMarkDone: () => void;
}

function ExerciseCard({ exercise, duration, animDelay, isActive, paused, isDone, isRunning, elapsed, onToggleTimer, onMarkDone }: ExerciseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isDone ? 0.45 : 1, x: 0 }}
      transition={{ delay: animDelay }}
      className={`flex items-start gap-3 rounded border bg-card p-3 transition-all sm:p-4 ${isDone ? "border-border grayscale" : "border-border"}`}
    >
      <div className={`flex h-9 w-12 shrink-0 items-center justify-center rounded font-heading text-xs font-bold tabular-nums transition-colors ${
        isDone ? "bg-muted text-muted-foreground" : isRunning ? "bg-primary text-primary-foreground" : "bg-foreground text-background"
      }`}>
        {isDone && elapsed > 0 ? formatTime(elapsed) : isActive && !isDone ? formatTime(elapsed) : `${duration}m`}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-heading text-sm font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {exercise.name}
          </h4>
          {isDone && <span className="shrink-0 font-heading text-xs font-bold text-primary">✓</span>}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{exercise.description}</p>
        {exercise.focus.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {exercise.focus.map((f) => (
              <span key={f} className="rounded bg-secondary px-1.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                {f}
              </span>
            ))}
          </div>
        )}
        {isActive && !isDone && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onToggleTimer}
              disabled={paused}
              className={`rounded border px-3 py-1 font-heading text-xs font-bold transition-colors disabled:opacity-40 ${
                isRunning ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {isRunning ? "⏸ Pause" : "▶ Start"}
            </button>
            <button
              onClick={onMarkDone}
              className="rounded border border-primary/30 bg-primary/10 px-3 py-1 font-heading text-xs font-bold text-primary transition-colors hover:bg-primary/20"
            >
              ✓ Done
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
