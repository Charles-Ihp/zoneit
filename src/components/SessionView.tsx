import React from "react";
import { motion } from "framer-motion";
import type { GeneratedSession, SessionBlock } from "@/lib/types";

interface SessionViewProps {
  session: GeneratedSession;
  titleOverride?: React.ReactNode;
  onBack?: () => void;
  onRegenerate?: () => void;
  onSave?: () => void;
  saveLabel?: string;
}

const phaseColors: Record<string, { bg: string; border: string; accent: string }> = {
  warmup: { bg: "bg-warm/10", border: "border-warm/30", accent: "text-warm" },
  main: { bg: "bg-primary/10", border: "border-primary/30", accent: "text-primary" },
  addon: { bg: "bg-accent/10", border: "border-accent/30", accent: "text-accent" },
  cooldown: {
    bg: "bg-surface",
    border: "border-surface-foreground/20",
    accent: "text-surface-foreground",
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
  onBack,
  onRegenerate,
  onSave,
  saveLabel = "Save Session",
}: SessionViewProps) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        {titleOverride ?? (
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            {session.title}
          </h1>
        )}
        <p className="mt-2 text-base text-muted-foreground">{session.subtitle}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <span className="text-sm font-medium text-primary">
            ⏱ {session.totalDuration} min total
          </span>
        </div>
      </motion.div>

      {/* Blocks */}
      {session.blocks.map((block, i) => (
        <BlockSection key={i} block={block} index={i} />
      ))}

      {/* Tips */}
      {session.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-auto max-w-2xl px-6 py-8"
        >
          <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Session Tips
          </h3>
          <ul className="space-y-2">
            {session.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Actions */}
      {(onBack || onRegenerate || onSave) && (
        <div className="flex items-center justify-center gap-4 px-6 py-10">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className="rounded-xl border-2 border-border bg-card px-6 py-3 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              ← Adjust Inputs
            </motion.button>
          )}
          {onRegenerate && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRegenerate}
              className="rounded-xl bg-primary px-6 py-3 font-heading text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl"
            >
              🎲 Regenerate
            </motion.button>
          )}
          {onSave && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSave}
              className="rounded-xl border-2 border-primary bg-card px-6 py-3 font-heading text-sm font-semibold text-primary transition-all hover:bg-primary/10"
            >
              💾 {saveLabel}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

function BlockSection({ block, index }: { block: SessionBlock; index: number }) {
  const colors = phaseColors[block.phase] || phaseColors.main;
  const icon = phaseIcons[block.phase] || "📋";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`${colors.bg} border-y ${colors.border}`}
    >
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h2 className="font-heading text-xl font-bold text-foreground">{block.phaseLabel}</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${colors.accent} ${colors.bg}`}
          >
            {block.totalDuration} min
          </span>
        </div>

        <div className="space-y-3">
          {block.exercises.map(({ exercise, duration }, j) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + j * 0.05 }}
              className="flex items-start gap-4 rounded-xl bg-card/80 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-bold text-primary">
                {duration}m
              </div>
              <div className="flex-1">
                <h4 className="font-heading text-sm font-bold text-foreground">{exercise.name}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {exercise.description}
                </p>
                {exercise.focus.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {exercise.focus.map((f) => (
                      <span
                        key={f}
                        className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary-foreground"
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
