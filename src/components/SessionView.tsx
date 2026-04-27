import React, { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import type { GeneratedSession, SessionBlock, ExerciseItem } from "@/lib/types";
import { ActiveSessionOverlay } from "./ActiveSessionOverlay";
import { ExerciseSearchModal } from "./ExerciseSearchModal";
import { loadActiveSession, clearActiveSession } from "@/lib/active-session-store";

interface SessionViewProps {
  session: GeneratedSession;
  titleOverride?: React.ReactNode;
  workoutId?: string;
  onBack?: () => void;
  onRegenerate?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  /** If provided, allows editing the session */
  onSessionChange?: (session: GeneratedSession) => void;
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
  onSessionChange,
}: SessionViewProps) {
  const [activeSession, setActiveSession] = useState(() => {
    const stored = loadActiveSession();
    return stored !== null && stored.session.title === session.title;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToBlockIndex, setAddToBlockIndex] = useState<number | null>(null);

  const canEdit = !!onSessionChange;

  // Get all exercise IDs currently in the session
  const existingIds = session.blocks.flatMap((b) => b.exercises.map((e) => e.exercise.id));

  const handleRemoveExercise = useCallback((blockIndex: number, exerciseIndex: number) => {
    if (!onSessionChange) return;
    const newBlocks = session.blocks.map((block, bi) => {
      if (bi !== blockIndex) return block;
      const newExercises = block.exercises.filter((_, ei) => ei !== exerciseIndex);
      const newDuration = newExercises.reduce((sum, e) => sum + e.duration, 0);
      return { ...block, exercises: newExercises, totalDuration: newDuration };
    });
    // Filter out empty blocks
    const filteredBlocks = newBlocks.filter((b) => b.exercises.length > 0);
    const newTotal = filteredBlocks.reduce((sum, b) => sum + b.totalDuration, 0);
    onSessionChange({ ...session, blocks: filteredBlocks, totalDuration: newTotal });
  }, [onSessionChange, session]);

  const handleAddExercise = useCallback((exercise: ExerciseItem, duration: number) => {
    if (!onSessionChange || addToBlockIndex === null) return;
    const newBlocks = session.blocks.map((block, bi) => {
      if (bi !== addToBlockIndex) return block;
      const newExercises = [...block.exercises, { exercise, duration }];
      const newDuration = newExercises.reduce((sum, e) => sum + e.duration, 0);
      return { ...block, exercises: newExercises, totalDuration: newDuration };
    });
    const newTotal = newBlocks.reduce((sum, b) => sum + b.totalDuration, 0);
    onSessionChange({ ...session, blocks: newBlocks, totalDuration: newTotal });
  }, [onSessionChange, session, addToBlockIndex]);

  const handleReorderExercises = useCallback((blockIndex: number, newExercises: { exercise: ExerciseItem; duration: number }[]) => {
    if (!onSessionChange) return;
    const newBlocks = session.blocks.map((block, bi) => {
      if (bi !== blockIndex) return block;
      return { ...block, exercises: newExercises };
    });
    onSessionChange({ ...session, blocks: newBlocks });
  }, [onSessionChange, session]);

  const openAddModal = (blockIndex: number) => {
    setAddToBlockIndex(blockIndex);
    setShowAddModal(true);
  };

  return (
    <>
      <AnimatePresence>
        {activeSession && (
          <ActiveSessionOverlay
            session={session}
            workoutId={workoutId}
            onClose={() => {
              clearActiveSession();
              setActiveSession(false);
            }}
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
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveSession(true)}
              className="rounded bg-primary px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Start Session
            </button>
            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`rounded border px-4 py-2.5 font-heading text-sm font-bold transition-all ${
                  isEditing
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-secondary"
                }`}
              >
                {isEditing ? "Done Editing" : "Edit Session"}
              </button>
            )}
          </div>
        </div>

        {/* Blocks */}
        <div className="divide-y divide-border">
          {session.blocks.map((block, i) => (
            <BlockSection
              key={`${block.phase}-${i}`}
              block={block}
              blockIndex={i}
              isEditing={isEditing}
              onRemove={(exIndex) => handleRemoveExercise(i, exIndex)}
              onAdd={() => openAddModal(i)}
              onReorder={(newExercises) => handleReorderExercises(i, newExercises)}
            />
          ))}
        </div>

        {/* Add Exercise Modal */}
        <ExerciseSearchModal
          open={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setAddToBlockIndex(null);
          }}
          onSelect={handleAddExercise}
          excludeIds={existingIds}
        />

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

// Wrapper type with stable key for reordering
interface ExerciseWithKey {
  key: string;
  exercise: ExerciseItem;
  duration: number;
}

function BlockSection({
  block,
  blockIndex,
  isEditing,
  onRemove,
  onAdd,
  onReorder,
}: {
  block: SessionBlock;
  blockIndex: number;
  isEditing: boolean;
  onRemove?: (exerciseIndex: number) => void;
  onAdd?: () => void;
  onReorder?: (exercises: { exercise: ExerciseItem; duration: number }[]) => void;
}) {
  const colors = phaseColors[block.phase] || phaseColors.main;
  
  // Create stable keys for exercises based on their position
  const exercisesWithKeys: ExerciseWithKey[] = block.exercises.map((item, idx) => ({
    key: `${item.exercise.id}-${idx}`,
    ...item,
  }));

  const handleReorder = (reordered: ExerciseWithKey[]) => {
    // Convert back to original format without keys
    const newExercises = reordered.map(({ exercise, duration }) => ({ exercise, duration }));
    onReorder?.(newExercises);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: blockIndex * 0.08, duration: 0.3 }}
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

        {isEditing ? (
          <Reorder.Group
            axis="y"
            values={exercisesWithKeys}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {exercisesWithKeys.map((item, idx) => (
              <EditableExerciseCard
                key={item.key}
                item={item}
                onRemove={() => onRemove?.(idx)}
              />
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-2">
            {block.exercises.map(({ exercise, duration }, j) => (
              <motion.div
                key={`${exercise.id}-${j}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: blockIndex * 0.08 + j * 0.04 }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 sm:p-4"
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
        )}

        {/* Add Exercise Button - only in edit mode */}
        {isEditing && onAdd && (
          <button
            onClick={onAdd}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Exercise
          </button>
        )}
      </div>
    </motion.div>
  );
}

function EditableExerciseCard({
  item,
  onRemove,
}: {
  item: ExerciseWithKey;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();
  const { exercise, duration } = item;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 sm:p-4"
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded bg-secondary text-muted-foreground active:cursor-grabbing"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="8" cy="5" r="2" />
          <circle cx="16" cy="5" r="2" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="8" cy="19" r="2" />
          <circle cx="16" cy="19" r="2" />
        </svg>
      </div>
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
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        title="Remove exercise"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </Reorder.Item>
  );
}
