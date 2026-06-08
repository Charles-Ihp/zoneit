import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarRange,
  Play,
  RotateCcw,
  LogIn,
  Dumbbell,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import { SessionView } from "@/components/SessionView";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/use-auth";
import { api, type ProgramProgressResponse } from "@/lib/api";
import type { GeneratedSession } from "@/lib/types";
import {
  RCP_META,
  RCP_PROGRAM_ID,
  buildProgramSession,
  phaseForWeek,
} from "@/lib/programs/rcp-split";

export const Route = createFileRoute("/programs/")({
  component: ProgramsPage,
  head: () => ({ meta: [{ title: "Programs — GRAVITACIO" }] }),
});

function ProgramsPage() {
  const { user, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [progress, setProgress] = useState<ProgramProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [launchedDay, setLaunchedDay] = useState<number | null>(null);

  const refetch = useCallback(
    () =>
      api.programs
        .getProgress(RCP_PROGRAM_ID)
        .then(setProgress)
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refetch().finally(() => setLoading(false));
  }, [user, refetch]);

  // Launch a chosen training day (starting the program if needed).
  const handleStartDay = async (dayIndex: number) => {
    setBusy(true);
    try {
      const current = progress ?? (await api.programs.start(RCP_PROGRAM_ID));
      if (!progress) setProgress(current);
      setLaunchedDay(dayIndex);
      setSession(buildProgramSession(current.week, dayIndex));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* leave the user on the overview */
    } finally {
      setBusy(false);
    }
  };

  // After a launched day's session is finished & logged — tick it off.
  const handleCompleted = async () => {
    if (launchedDay === null) return;
    try {
      const updated = await api.programs.completeDay(RCP_PROGRAM_ID, launchedDay);
      setProgress(updated);
    } catch {
      /* best-effort — refetch on return to overview will reconcile */
    }
  };

  const handleAdvanceWeek = async () => {
    setBusy(true);
    try {
      setProgress(await api.programs.advanceWeek(RCP_PROGRAM_ID));
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      setProgress(await api.programs.reset(RCP_PROGRAM_ID));
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  // ── Launched session view ──────────────────────────────────────────────────
  if (session) {
    return (
      <div className="mx-auto max-w-2xl">
        <SessionView
          session={session}
          onBack={() => {
            setSession(null);
            setLaunchedDay(null);
            void refetch();
          }}
          onCompleted={handleCompleted}
        />
      </div>
    );
  }

  // ── Logged-out gate ─────────────────────────────────────────────────────────
  if (!user && !authLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarRange className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-foreground">
            Follow a structured program
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Log in to start the {RCP_META.name} and have GRAVITACIO track your place in the cycle.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted"
          >
            <LogIn className="h-4 w-4" />
            Log in
          </button>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  // ── Overview ────────────────────────────────────────────────────────────────
  const started = progress !== null;
  const week = progress?.week ?? 1;
  const doneDays = new Set(progress?.completedDays ?? []);
  const doneCount = doneDays.size;
  const weekComplete = started && doneCount >= RCP_META.trainingDays;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-semibold tracking-tight">Programs</h1>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading...</div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Program header */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarRange className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {RCP_META.name}
                </h2>
                <p className="text-sm text-muted-foreground">{RCP_META.tagline}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-foreground/90">{RCP_META.description}</p>

            {started && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                  Week {week} of {RCP_META.weeks}
                </span>
                <span className="text-sm text-muted-foreground">
                  Phase {phaseForWeek(week)} of 3
                </span>
                <span className="text-sm text-muted-foreground">
                  {doneCount}/{RCP_META.trainingDays} done this week
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

          {/* Training days — pick any to train; ticks show what's done this week */}
          {started && (
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Choose a training day · Week {week}
                </span>
              </div>
              <div className="space-y-2">
                {RCP_META.days.map((day, i) => {
                  const done = doneDays.has(i);
                  return (
                    <button
                      key={day.dayLabel}
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
                        <p className="truncate text-sm font-medium text-foreground">
                          {day.focusLabel}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {day.dayLabel} · {day.mainLift} · {day.exerciseCount} exercises
                        </p>
                      </div>
                      <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        {done ? "Repeat" : "Start"}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Week complete → roll to next week */}
              {weekComplete && (
                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-foreground">
                    🎉 Week {week} complete — all {RCP_META.trainingDays} days done!
                  </p>
                  <button
                    onClick={handleAdvanceWeek}
                    disabled={busy}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  >
                    <Play className="h-4 w-4" />
                    Start Week {week >= RCP_META.weeks ? 1 : week + 1}
                  </button>
                </div>
              )}

              {/* Manual controls */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-4">
                {!weekComplete && (
                  <button
                    onClick={handleAdvanceWeek}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-60"
                    title="Skip to next week"
                  >
                    <ChevronRight className="h-4 w-4" />
                    Skip to Week {week >= RCP_META.weeks ? 1 : week + 1}
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

          {/* Weekly periodization */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {RCP_META.weeks}-week periodization (main lift)
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
                  {RCP_META.weekTable.map((w) => (
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
        </motion.div>
      )}
    </div>
  );
}
