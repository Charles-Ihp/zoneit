import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarRange,
  Play,
  RotateCcw,
  Dumbbell,
  CheckCircle2,
  Circle,
  ChevronRight,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { SessionView } from "@/components/SessionView";
import { VipLocked } from "@/components/VipLocked";
import { useAuth } from "@/hooks/use-auth";
import { api, type ProgramProgressResponse, type ProgramResponse } from "@/lib/api";
import type { GeneratedSession } from "@/lib/types";
import { phaseForWeek } from "@/lib/programs/rcp-split";
import { buildProgramDaySession, programDays } from "@/lib/programs/custom";
import { type ProgramDescriptor, getBuiltinProgram } from "@/lib/programs/builtins";

export const Route = createFileRoute("/programs/$programId")({
  component: ProgramDetailPage,
  head: () => ({ meta: [{ title: "Program — GRAVITACIO" }] }),
});

function customDescriptor(p: ProgramResponse): ProgramDescriptor {
  const days = programDays(p);
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    typeLabel: `${p.type[0].toUpperCase()}${p.type.slice(1)} · ${p.lengthWeeks} week${p.lengthWeeks === 1 ? "" : "s"}`,
    description: p.description,
    lengthWeeks: p.lengthWeeks,
    trainingDays: days.length,
    days: days.map((d) => ({
      name: d.name,
      subtitle: `${d.exercises.length} exercise${d.exercises.length === 1 ? "" : "s"}`,
    })),
    buildSession: (w, di) => buildProgramDaySession(p, di, w),
    isBuiltIn: false,
  };
}

function ProgramDetailPage() {
  const { programId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const builtin = getBuiltinProgram(programId);

  const [descriptor, setDescriptor] = useState<ProgramDescriptor | null>(builtin ?? null);
  const [progress, setProgress] = useState<ProgramProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [launchedDay, setLaunchedDay] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refetchProgress = useCallback(
    () =>
      api.programs
        .getProgress(programId)
        .then(setProgress)
        .catch(() => {}),
    [programId],
  );

  useEffect(() => {
    if (!user || !user.isVip) {
      setLoading(false);
      return;
    }
    const loadDescriptor = builtin
      ? Promise.resolve(builtin)
      : api.programs.get(programId).then(customDescriptor);
    Promise.all([loadDescriptor, api.programs.getProgress(programId)])
      .then(([desc, prog]) => {
        setDescriptor(desc);
        setProgress(prog);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [user, programId, builtin]);

  const handleStartDay = async (dayIndex: number) => {
    if (!descriptor) return;
    setBusy(true);
    try {
      const current = progress ?? (await api.programs.start(programId));
      if (!progress) setProgress(current);
      setLaunchedDay(dayIndex);
      setSession(descriptor.buildSession(current.week, dayIndex));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* stay on overview */
    } finally {
      setBusy(false);
    }
  };

  const handleCompleted = async () => {
    if (launchedDay === null) return;
    try {
      setProgress(await api.programs.completeDay(programId, launchedDay));
    } catch {
      /* reconciled by refetch on return */
    }
  };

  const handleAdvanceWeek = async () => {
    setBusy(true);
    try {
      setProgress(await api.programs.advanceWeek(programId));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      setProgress(await api.programs.reset(programId));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.programs.delete(programId);
      navigate({ to: "/programs" });
    } catch {
      setBusy(false);
    }
  };

  // ── Launched session ────────────────────────────────────────────────────────
  if (session) {
    return (
      <div className="mx-auto max-w-2xl">
        <SessionView
          session={session}
          onBack={() => {
            setSession(null);
            setLaunchedDay(null);
            void refetchProgress();
          }}
          onCompleted={handleCompleted}
        />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!user || !user.isVip) {
    return <VipLocked />;
  }

  if (notFound || !descriptor) {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate({ to: "/programs" })}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Programs
        </button>
        <p className="py-16 text-center text-muted-foreground">Program not found.</p>
      </div>
    );
  }

  const started = progress !== null;
  const week = progress?.week ?? 1;
  const doneDays = new Set(progress?.completedDays ?? []);
  const doneCount = doneDays.size;
  const weekComplete = started && doneCount >= descriptor.trainingDays;
  const nextWeek = week >= descriptor.lengthWeeks ? 1 : week + 1;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate({ to: "/programs" })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Programs
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        {/* Header */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarRange className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-xl font-semibold text-foreground">
                {descriptor.name}
              </h1>
              <p className="text-sm text-muted-foreground">{descriptor.typeLabel}</p>
            </div>
            {!descriptor.isBuiltIn && (
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() =>
                    navigate({ to: "/programs/builder", search: { id: descriptor.id } })
                  }
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          {descriptor.description && (
            <p className="mt-4 text-sm text-foreground/90">{descriptor.description}</p>
          )}
          {started && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                Week {week} of {descriptor.lengthWeeks}
              </span>
              {descriptor.weekTable && (
                <span className="text-sm text-muted-foreground">
                  Phase {phaseForWeek(week)} of 3
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {doneCount}/{descriptor.trainingDays} done this week
              </span>
            </div>
          )}
          {!started && (
            <button
              onClick={() => handleStartDay(0)}
              disabled={busy}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              Start program
            </button>
          )}
        </div>

        {/* Day picker */}
        {started && (
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Choose a training day · Week {week}
              </span>
            </div>
            <div className="space-y-2">
              {descriptor.days.map((day, i) => {
                const done = doneDays.has(i);
                return (
                  <button
                    key={`${day.name}-${i}`}
                    onClick={() => handleStartDay(i)}
                    disabled={busy}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all hover:bg-muted/50 active:scale-[0.99] disabled:opacity-60 ${
                      done ? "border-primary/40 bg-primary/5" : "border-border/50"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{day.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{day.subtitle}</p>
                    </div>
                    <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {done ? "Repeat" : "Start"}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>

            {weekComplete && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground">
                  🎉 Week {week} complete — all {descriptor.trainingDays} days done!
                </p>
                <button
                  onClick={handleAdvanceWeek}
                  disabled={busy}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  <Play className="h-4 w-4" />
                  Start Week {nextWeek}
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-4">
              {!weekComplete && (
                <button
                  onClick={handleAdvanceWeek}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-60"
                  title="Skip to next week"
                >
                  <ChevronRight className="h-4 w-4" />
                  Skip to Week {nextWeek}
                </button>
              )}
              <button
                onClick={handleReset}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-60"
                title="Reset to Week 1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Days preview when not started */}
        {!started && (
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {descriptor.trainingDays} training day{descriptor.trainingDays === 1 ? "" : "s"} /
                week
              </span>
            </div>
            <div className="space-y-2">
              {descriptor.days.map((day, i) => (
                <div
                  key={`${day.name}-${i}`}
                  className="rounded-lg border border-border/50 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-foreground">{day.name}</p>
                  <p className="text-xs text-muted-foreground">{day.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Periodization table (built-in only) */}
        {descriptor.weekTable && (
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {descriptor.lengthWeeks}-week periodization (main lift)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-1.5 pr-4 font-medium">Week</th>
                    <th className="py-1.5 pr-4 font-medium">Phase</th>
                    <th className="py-1.5 pr-4 font-medium">Main pyramid</th>
                    <th className="py-1.5 font-medium">Accessory</th>
                  </tr>
                </thead>
                <tbody>
                  {descriptor.weekTable.map((w) => (
                    <tr
                      key={w.week}
                      className={`border-t border-border/40 ${
                        started && w.week === week ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <td className="py-1.5 pr-4 text-foreground">{w.week}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{w.phase}</td>
                      <td className="py-1.5 pr-4 text-foreground">{w.mainPyramid.join("-")}</td>
                      <td className="py-1.5 text-muted-foreground">{w.accessoryReps} reps</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="font-heading text-lg font-semibold text-foreground">Delete program?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              "{descriptor.name}" and your progress in it will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
