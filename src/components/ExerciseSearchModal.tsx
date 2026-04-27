import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type ExerciseResponse } from "@/lib/api";
import type { ExerciseItem } from "@/lib/types";

interface ExerciseSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseItem, duration: number) => void;
  excludeIds?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  "warmup-mobility": "Mobility Warmup",
  "warmup-climbing": "Climbing Warmup",
  technique: "Technique",
  projecting: "Projecting",
  power: "Power",
  endurance: "Endurance",
  volume: "Volume",
  recovery: "Recovery",
  dynos: "Dynos",
  "antagonist-push": "Push (Antagonist)",
  "antagonist-pull": "Pull (Antagonist)",
  "antagonist-core": "Core (Antagonist)",
  cooldown: "Cooldown",
  handstand: "Handstand",
  "gym-push": "Gym Push",
  "gym-pull": "Gym Pull",
  "gym-legs": "Gym Legs",
};

export function ExerciseSearchModal({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}: ExerciseSearchModalProps) {
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load all exercises on mount
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.exercises
      .list()
      .then(setExercises)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Reset filters when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedTags([]);
    }
  }, [open]);

  // Toggle a tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Filter exercises by search query and selected tags
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const results = exercises.filter((ex) => {
      if (excludeIds.includes(ex.id)) return false;

      // Filter by selected tags (must match ALL selected tags)
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every((tag) => ex.focus.includes(tag));
        if (!hasAllTags) return false;
      }

      // Filter by search query
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.focus.some((f) => f.toLowerCase().includes(q))
      );
    });
    return results;
  }, [exercises, query, excludeIds, selectedTags]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, ExerciseResponse[]> = {};
    for (const ex of filtered) {
      if (!map[ex.category]) map[ex.category] = [];
      map[ex.category].push(ex);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleSelect = (ex: ExerciseResponse) => {
    const item: ExerciseItem = {
      id: ex.id,
      name: ex.name,
      description: ex.description,
      category: ex.category,
      focus: ex.focus,
      intensity: ex.intensity,
      defaultSets: ex.defaultSets,
      defaultReps: ex.defaultReps,
    };
    onSelect(item, selectedDuration);
    onClose();
    setQuery("");
    setSelectedTags([]);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="flex max-h-[85vh] w-full flex-col rounded-t-xl bg-background sm:max-w-lg sm:rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-heading text-lg font-bold">Add Exercise</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="border-b border-border px-4 py-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, category, or muscle..."
              autoFocus
              className="w-full rounded border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              style={{ fontSize: "16px" }}
            />

            {/* Selected tag filters - only show when tags are selected */}
            {selectedTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Filtering:</span>
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                  >
                    {tag}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Tip: Click tags on exercises to filter by muscle group
              </p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Duration:</span>
              {[3, 5, 8, 10, 15].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    selectedDuration === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {query || selectedTags.length > 0
                  ? "No exercises match your filters"
                  : "No exercises available"}
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map(([category, exs]) => (
                  <div key={category}>
                    <h3 className="mb-2 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                    <div className="space-y-1">
                      {exs.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex w-full items-start gap-3 rounded border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="font-heading text-sm font-bold text-foreground">
                              {ex.name}
                            </h4>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {ex.description}
                            </p>
                            {/* Focus tags */}
                            {ex.focus.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {ex.focus.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTag(tag);
                                    }}
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                      selectedTags.includes(tag)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                            {ex.defaultSets && ex.defaultReps && (
                              <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                {ex.defaultSets} × {ex.defaultReps} reps
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleSelect(ex)}
                            className="mt-1 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                            title="Add this exercise"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
