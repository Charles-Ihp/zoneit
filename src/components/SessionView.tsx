import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedSession, SessionBlock } from "@/lib/types";
import { ActiveSessionOverlay } from "./ActiveSessionOverlay";

interface SessionViewProps {
  session: GeneratedSession;
  titleOverride?: React.ReactNode;
  workoutId?: string;
  onBack?: () => void;
  onRegenerate?: () => void;
  onSave?: () => void;
  saveLabel?: string;
}

const phaseColors: Record<string, { bg: string; border: string; accent: string; label: string }> = {
  warmup: {
    bg: "bg-transparent",
    border: "border-l-warm",
    accent: "text-warm bg-warm/15",
    label: "WARM-UP",
  },
  main: {
    bg: "bg-transparent",
    border: "border-l-primary",
    accent: "text-primary-foreground bg-primary",
    label: "MAIN",
  },
  addon: {
    bg: "bg-transparent",
    border: "border-l-accent",
    accent: "text-accent-foreground bg-accent",
    label: "SUPPLEMENTARY",
  },
  cooldown: {
    bg: "bg-transparent",
    border: "border-l-muted-foreground/40",
    accent: "text-muted-foreground bg-secondary",
    label: "COOL DOWN",
  },
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
  const [activeSession, setActiveSession] = useState(false);

  return (
    <>
      <AnimatePresence>
        {activeSession && (
          <ActiveSessionOverlay
            session={session}
            workoutId={workoutId}
            onClose={() => setActiveSession(false)}
          />
        )}
      </AnimatePresence>

      <div>
        {/* Session Header */}
        <div className="border-b border-border bg-card px-4 py-6 text-center sm:py-8">
          {titleOverride ?? (
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {session.title}
            </h1>
          )}
          <p className="mt-1.5 text-sm text-muted-foreground">{session.subtitle}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1">
            <span className="text-xs font-bold text-primary-foreground">
              {session.totalDuration} min total
            </span>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setActiveSession(true)}
              className="rounded bg-primary px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Start Session
            </button>
          </div>
        </div>

        {/* Blocks */}
        <div className="divide-y divide-border">
          {session.blocks.map((block, i) => (
            <BlockSection key={i} block={block} index={i} />
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
                    <span className="mt-0.5 shrink-0 font-bold text-primary">–</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {(onBack || onRegenerate || onSave) && (
          <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="rounded border border-border px-4 py-2.5 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    ← Adjust
                  </button>
                )}
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="rounded border border-border px-4 py-2.5 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    Regenerate
                  </button>
                )}
              </div>
              {onSave && (
                <button
                  onClick={onSave}
                  className="rounded bg-primary px-5 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 sm:ml-auto"
                >
                  {saveLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function BlockSection({ block, index }: { block: SessionBlock; index: number }) {
  const colors = phaseColors[block.phase] || phaseColors.main;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={`${colors.bg} border-l-4 ${colors.border}`}
    >
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span
              className={`rounded px-2 py-0.5 font-heading text-[10px] font-bold tracking-widest ${colors.accent}`}
            >
              {colors.label}
            </span>
            <h2 className="mt-0.5 font-heading text-base font-bold text-foreground">
              {block.phaseLabel}
            </h2>
          </div>
          <span className="font-heading text-sm font-bold text-muted-foreground">
            {block.totalDuration} min
          </span>
        </div>

        <div className="space-y-2">
          {block.exercises.map(({ exercise, duration }, j) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 + j * 0.04 }}
              className="flex items-start gap-3 rounded border border-border bg-card p-3 sm:p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-secondary font-heading text-xs font-bold text-secondary-foreground">
                {duration}m
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
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
