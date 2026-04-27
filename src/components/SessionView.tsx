import React, { useState, useRef } from "react";
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
  onDelete?: () => void;
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
  onDelete,
  saveLabel = "Save Session",
  onSessionChange,
}: SessionViewProps) {
  const [activeSession, setActiveSession] = useState(() => {
    const stored = loadActiveSession();
    return stored !== null && stored.session.title === session.title;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToBlockIndex, setAddToBlockIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [draftSession, setDraftSession] = useState<GeneratedSession>(session);

  // Sync draft when session prop changes (and not editing)
  React.useEffect(() => {
    if (!isEditing) {
      setDraftSession(session);
    }
  }, [session, isEditing]);

  const canEdit = !!onSessionChange;
  const currentSession = isEditing ? draftSession : session;

  const handleStartEditing = () => {
    setDraftSession(session);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraftSession(session);
    setIsEditing(false);
  };

  const handleSaveEditing = () => {
    onSessionChange?.(draftSession);
    setIsEditing(false);
  };

  // Get all exercise IDs currently in the session
  const existingIds = currentSession.blocks.flatMap((b) => b.exercises.map((e) => e.exercise.id));

  const handleRemoveExercise = (blockIndex: number, exerciseIndex: number) => {
    if (!isEditing) return;
    const newBlocks = draftSession.blocks.map((block, bi) => {
      if (bi !== blockIndex) return block;
      const newExercises = block.exercises.filter((_, ei) => ei !== exerciseIndex);
      const newDuration = newExercises.reduce((sum, e) => sum + e.duration, 0);
      return { ...block, exercises: newExercises, totalDuration: newDuration };
    });
    // Filter out empty blocks
    const filteredBlocks = newBlocks.filter((b) => b.exercises.length > 0);
    const newTotal = filteredBlocks.reduce((sum, b) => sum + b.totalDuration, 0);
    setDraftSession({ ...draftSession, blocks: filteredBlocks, totalDuration: newTotal });
  };

  const handleAddExercise = (exercise: ExerciseItem, duration: number) => {
    if (!isEditing || addToBlockIndex === null) return;
    const newBlocks = draftSession.blocks.map((block, bi) => {
      if (bi !== addToBlockIndex) return block;
      const newExercises = [...block.exercises, { exercise, duration }];
      const newDuration = newExercises.reduce((sum, e) => sum + e.duration, 0);
      return { ...block, exercises: newExercises, totalDuration: newDuration };
    });
    const newTotal = newBlocks.reduce((sum, b) => sum + b.totalDuration, 0);
    setDraftSession({ ...draftSession, blocks: newBlocks, totalDuration: newTotal });
  };

  const handleReorderExercises = (
    blockIndex: number,
    newExercises: { exercise: ExerciseItem; duration: number }[],
  ) => {
    if (!isEditing) return;
    const newBlocks = draftSession.blocks.map((block, bi) => {
      if (bi !== blockIndex) return block;
      const newDuration = newExercises.reduce((sum, e) => sum + e.duration, 0);
      return { ...block, exercises: newExercises, totalDuration: newDuration };
    });
    setDraftSession({ ...draftSession, blocks: newBlocks });
  };

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
          {titleOverride ??
            (isEditing ? (
              <input
                type="text"
                value={draftSession.title}
                onChange={(e) => setDraftSession({ ...draftSession, title: e.target.value })}
                className="w-full max-w-md bg-transparent text-center font-heading text-2xl font-extrabold tracking-tight text-foreground outline-none border-b-2 border-primary/50 focus:border-primary sm:text-4xl"
                placeholder="Session name"
              />
            ) : (
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {currentSession.title}
              </h1>
            ))}
          <p className="mt-1.5 text-sm text-muted-foreground">{currentSession.subtitle}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1">
            <span className="text-xs font-bold text-primary-foreground">
              {currentSession.totalDuration} min total
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setActiveSession(true)}
                className="rounded bg-primary px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Start Session
              </button>
            )}
            {canEdit && !isEditing && (
              <button
                onClick={handleStartEditing}
                className="rounded border border-border px-4 py-2.5 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Edit
              </button>
            )}
            {onDelete && !isEditing && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded border border-destructive/30 px-4 py-2.5 font-heading text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                Delete
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleCancelEditing}
                  className="rounded border border-border px-4 py-2.5 font-heading text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditing}
                  className="rounded bg-primary px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Blocks */}
        <div className="divide-y divide-border">
          {currentSession.blocks.map((block, i) => (
            <BlockSection
              key={i}
              block={block}
              index={i}
              editable={isEditing}
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
        {currentSession.tips.length > 0 && (
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
                {currentSession.tips.map((tip, i) => (
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

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            key="delete-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-bold text-foreground">Delete Session?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently delete "{currentSession.title}". This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete?.();
                  }}
                  className="flex-1 rounded bg-destructive py-2.5 text-sm font-bold text-destructive-foreground transition-all hover:bg-destructive/90"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function BlockSection({
  block,
  index,
  editable = false,
  onRemove,
  onAdd,
  onReorder,
}: {
  block: SessionBlock;
  index: number;
  editable?: boolean;
  onRemove?: (exerciseIndex: number) => void;
  onAdd?: () => void;
  onReorder?: (exercises: { exercise: ExerciseItem; duration: number }[]) => void;
}) {
  const colors = phaseColors[block.phase] || phaseColors.main;
  const [exercises, setExercises] = useState(block.exercises);
  const isDraggingRef = useRef(false);
  const latestExercisesRef = useRef(exercises);

  // Keep local state in sync with props (only when not dragging)
  React.useEffect(() => {
    if (!isDraggingRef.current) {
      setExercises(block.exercises);
      latestExercisesRef.current = block.exercises;
    }
  }, [block.exercises]);

  const handleReorder = (newExercises: { exercise: ExerciseItem; duration: number }[]) => {
    setExercises(newExercises);
    latestExercisesRef.current = newExercises;
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    // Commit the reorder to parent
    onReorder?.(latestExercisesRef.current);
  };

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

        {editable ? (
          <Reorder.Group
            axis="y"
            values={exercises}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {exercises.map((item, j) => (
              <ExerciseCard
                key={item.exercise.id}
                item={item}
                editable={editable}
                onRemove={() => onRemove?.(j)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-2">
            {exercises.map(({ exercise, duration }, j) => (
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
                  <h4 className="font-heading text-sm font-bold text-foreground">
                    {exercise.name}
                  </h4>
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

        {/* Add Exercise Button */}
        {editable && onAdd && (
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

function ExerciseCard({
  item,
  editable,
  onRemove,
  onDragStart,
  onDragEnd,
}: {
  item: { exercise: ExerciseItem; duration: number };
  editable: boolean;
  onRemove: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const dragControls = useDragControls();
  const { exercise, duration } = item;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 sm:p-4"
    >
      {/* Drag handle */}
      {editable && (
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
      )}
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
      {editable && (
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
      )}
    </Reorder.Item>
  );
}
