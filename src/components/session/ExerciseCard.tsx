import { Reorder, useDragControls } from "framer-motion";

export interface SetState {
  reps: number;
  weight?: number;
  completed: boolean;
  previousReps?: number;
  previousWeight?: number;
}

export interface ExerciseState {
  key: string;
  id: string;
  name: string;
  description: string;
  focus: string[];
  duration: number;
  elapsed: number;
  isDone: boolean;
  isActive: boolean;
  sets: SetState[];
  isSetBased: boolean;
  defaultReps: number;
  notes: string;
  previousNotes?: string;
}

interface ExerciseCardProps {
  state: ExerciseState;
  restTimeSeconds: number;
  onUpdateSets: (sets: SetState[]) => void;
  onUpdateNotes: (notes: string) => void;
  onSetCompleted: () => void;
}

function formatRestTime(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
}

function formatPrevious(set: SetState): string {
  if (set.previousReps == null) return "—";
  const parts = [];
  if (set.previousWeight != null) parts.push(`${set.previousWeight}kg`);
  parts.push(`×${set.previousReps}`);
  return parts.join(" ");
}

export function ExerciseCard({
  state,
  restTimeSeconds,
  onUpdateSets,
  onUpdateNotes,
  onSetCompleted,
}: ExerciseCardProps) {
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

  const updateWeight = (setIdx: number, weight: number | undefined) => {
    const newSets = state.sets.map((s, i) => (i === setIdx ? { ...s, weight } : s));
    onUpdateSets(newSets);
  };

  const addSet = () => {
    const lastSet = state.sets[state.sets.length - 1];
    onUpdateSets([
      ...state.sets,
      {
        reps: lastSet?.reps ?? state.defaultReps,
        weight: lastSet?.weight,
        completed: false,
        previousReps: lastSet?.previousReps,
        previousWeight: lastSet?.previousWeight,
      },
    ]);
  };

  const removeSet = (setIdx: number) => {
    if (state.sets.length <= 1) return;
    onUpdateSets(state.sets.filter((_, i) => i !== setIdx));
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
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        {/* Drag handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg bg-secondary text-muted-foreground active:cursor-grabbing"
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

        {/* Exercise info */}
        <div className="min-w-0 flex-1">
          <h4
            className={`font-heading text-sm font-bold ${state.isDone ? "text-muted-foreground line-through" : "text-primary"}`}
          >
            {state.name}
          </h4>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
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
          {state.isActive && !state.isDone && (
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
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
          <div className="grid grid-cols-[40px_1fr_70px_70px_40px] items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Set</span>
            <span>Previous</span>
            <span className="text-center">kg</span>
            <span className="text-center">Reps</span>
            <span></span>
          </div>

          {/* Set rows */}
          {state.sets.map((set, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-[40px_1fr_70px_70px_40px] items-center gap-2 px-4 py-2 ${
                set.completed ? "bg-primary/5" : idx % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <span className="font-heading text-base font-bold text-foreground">{idx + 1}</span>
              <span className="text-sm text-muted-foreground">{formatPrevious(set)}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={set.weight ?? ""}
                onChange={(e) =>
                  updateWeight(idx, e.target.value ? parseFloat(e.target.value) : undefined)
                }
                onFocus={(e) => e.target.select()}
                placeholder={set.previousWeight != null ? String(set.previousWeight) : "—"}
                className="w-full rounded-lg border border-border bg-background py-2 text-center text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                style={{ fontSize: "16px" }}
                min={0}
                disabled={state.isDone}
              />
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
