import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, Dumbbell, Search, Loader2, ArrowLeft } from "lucide-react";
import { ExerciseSearchModal } from "./ExerciseSearchModal";
import { api, type CreateProgramBody } from "@/lib/api";
import type { ExerciseItem } from "@/lib/types";
import type { ProgramDay, ProgramType } from "@/lib/programs/types";

let keyCounter = 0;
function uid(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${keyCounter}`;
}

interface BuilderExercise {
  key: string;
  exercise: ExerciseItem;
  duration: number;
}
interface BuilderDay {
  key: string;
  name: string;
  exercises: BuilderExercise[];
}

function isCustom(ex: ExerciseItem): boolean {
  return ex.id.startsWith("custom-");
}

export function ProgramBuilder({ editId }: { editId?: string }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<ProgramType>("gym");
  const [description, setDescription] = useState("");
  const [lengthWeeks, setLengthWeeks] = useState(4);
  const [days, setDays] = useState<BuilderDay[]>([
    { key: uid("day"), name: "Day 1", exercises: [] },
  ]);

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerDayKey, setPickerDayKey] = useState<string | null>(null);

  // Load existing program when editing
  useEffect(() => {
    if (!editId) return;
    api.programs
      .get(editId)
      .then((p) => {
        setName(p.name);
        setType(p.type);
        setDescription(p.description);
        setLengthWeeks(p.lengthWeeks);
        setDays(
          (p.days ?? []).map((d) => ({
            key: uid("day"),
            name: d.name,
            exercises: (d.exercises ?? []).map((e) => ({
              key: uid("ex"),
              exercise: e.exercise,
              duration: e.duration,
            })),
          })),
        );
      })
      .catch(() => setError("Could not load this program."))
      .finally(() => setLoading(false));
  }, [editId]);

  const pickerDay = useMemo(
    () => days.find((d) => d.key === pickerDayKey) ?? null,
    [days, pickerDayKey],
  );

  // ── Day mutations ───────────────────────────────────────────────────────────
  const addDay = () =>
    setDays((d) => [...d, { key: uid("day"), name: `Day ${d.length + 1}`, exercises: [] }]);
  const removeDay = (key: string) => setDays((d) => d.filter((x) => x.key !== key));
  const renameDay = (key: string, name: string) =>
    setDays((d) => d.map((x) => (x.key === key ? { ...x, name } : x)));

  // ── Exercise mutations ──────────────────────────────────────────────────────
  const addLibraryExercise = (dayKey: string, exercise: ExerciseItem, duration: number) =>
    setDays((d) =>
      d.map((x) =>
        x.key === dayKey
          ? { ...x, exercises: [...x.exercises, { key: uid("ex"), exercise, duration }] }
          : x,
      ),
    );

  const addCustomExercise = (dayKey: string) => {
    const exercise: ExerciseItem = {
      id: uid("custom"),
      name: "",
      description: "",
      category: type,
      focus: [],
      intensity: 5,
      defaultSets: 3,
      defaultReps: 10,
    };
    setDays((d) =>
      d.map((x) =>
        x.key === dayKey
          ? { ...x, exercises: [...x.exercises, { key: uid("ex"), exercise, duration: 6 }] }
          : x,
      ),
    );
  };

  const removeExercise = (dayKey: string, exKey: string) =>
    setDays((d) =>
      d.map((x) =>
        x.key === dayKey ? { ...x, exercises: x.exercises.filter((e) => e.key !== exKey) } : x,
      ),
    );

  const patchExercise = (dayKey: string, exKey: string, patch: Partial<ExerciseItem>) =>
    setDays((d) =>
      d.map((x) =>
        x.key === dayKey
          ? {
              ...x,
              exercises: x.exercises.map((e) =>
                e.key === exKey ? { ...e, exercise: { ...e.exercise, ...patch } } : e,
              ),
            }
          : x,
      ),
    );

  const patchDuration = (dayKey: string, exKey: string, duration: number) =>
    setDays((d) =>
      d.map((x) =>
        x.key === dayKey
          ? {
              ...x,
              exercises: x.exercises.map((e) => (e.key === exKey ? { ...e, duration } : e)),
            }
          : x,
      ),
    );

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);
    if (!name.trim()) return setError("Give your program a name.");
    if (days.length === 0) return setError("Add at least one training day.");
    if (days.some((d) => d.exercises.length === 0))
      return setError("Every day needs at least one exercise.");
    if (days.some((d) => d.exercises.some((e) => !e.exercise.name.trim())))
      return setError("Custom exercises need a name.");

    const payloadDays: ProgramDay[] = days.map((d) => ({
      name: d.name.trim() || "Day",
      exercises: d.exercises.map((e) => ({ exercise: e.exercise, duration: e.duration })),
    }));
    const body: CreateProgramBody = {
      name: name.trim(),
      description: description.trim(),
      type,
      lengthWeeks: Math.max(1, Math.round(lengthWeeks) || 1),
      days: payloadDays,
    };

    setSaving(true);
    try {
      const saved = editId
        ? await api.programs.update(editId, body)
        : await api.programs.create(body);
      navigate({ to: "/programs/$programId", params: { programId: saved.id } });
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate({ to: "/programs" })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Programs
      </button>

      <h1 className="mb-6 font-heading text-2xl font-semibold tracking-tight">
        {editId ? "Edit program" : "Create program"}
      </h1>

      <div className="space-y-5">
        {/* Basics */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Push/Pull/Legs"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Type</label>
              <div className="inline-flex rounded-lg border border-border p-0.5">
                {(["gym", "climbing"] as ProgramType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                      type === t
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Length (weeks)
              </label>
              <input
                type="number"
                min={1}
                max={104}
                value={lengthWeeks}
                onChange={(e) => setLengthWeeks(Number(e.target.value))}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this program for?"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Days */}
        {days.map((day, di) => (
          <div key={day.key} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={day.name}
                onChange={(e) => renameDay(day.key, e.target.value)}
                placeholder={`Day ${di + 1}`}
                className="flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm font-medium outline-none hover:border-border focus:border-primary"
              />
              {days.length > 1 && (
                <button
                  onClick={() => removeDay(day.key)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Remove day"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Exercises */}
            <div className="space-y-2">
              {day.exercises.map((ex) => {
                const timeBased = ex.exercise.defaultReps === null;
                return (
                  <div
                    key={ex.key}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 px-3 py-2"
                  >
                    {isCustom(ex.exercise) ? (
                      <input
                        value={ex.exercise.name}
                        onChange={(e) => patchExercise(day.key, ex.key, { name: e.target.value })}
                        placeholder="Custom exercise name"
                        className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {ex.exercise.name}
                      </span>
                    )}

                    {timeBased ? (
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="number"
                          min={1}
                          value={ex.duration}
                          onChange={(e) =>
                            patchDuration(day.key, ex.key, Math.max(1, Number(e.target.value) || 1))
                          }
                          className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                        />
                        min
                      </label>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="number"
                          min={1}
                          value={ex.exercise.defaultSets ?? 3}
                          onChange={(e) =>
                            patchExercise(day.key, ex.key, {
                              defaultSets: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-12 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                          title="Sets"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          min={1}
                          value={ex.exercise.defaultReps ?? 10}
                          onChange={(e) =>
                            patchExercise(day.key, ex.key, {
                              defaultReps: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-12 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                          title="Reps"
                        />
                        <span>reps</span>
                      </div>
                    )}

                    <button
                      onClick={() => removeExercise(day.key, ex.key)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Remove exercise"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {day.exercises.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No exercises yet — add some below.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setPickerDayKey(day.key)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Search className="h-4 w-4" />
                Add from library
              </button>
              <button
                onClick={() => addCustomExercise(day.key)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Add custom
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addDay}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add training day
        </button>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Save */}
        <div className="flex justify-end gap-2 pb-8">
          <button
            onClick={() => navigate({ to: "/programs" })}
            className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editId ? "Save changes" : "Create program"}
          </button>
        </div>
      </div>

      {/* Exercise library picker */}
      <ExerciseSearchModal
        open={pickerDay !== null}
        onClose={() => setPickerDayKey(null)}
        excludeIds={pickerDay?.exercises.map((e) => e.exercise.id) ?? []}
        onSelect={(exercise, duration) => {
          if (pickerDayKey) addLibraryExercise(pickerDayKey, exercise, duration);
        }}
      />
    </div>
  );
}
