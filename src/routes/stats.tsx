import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { api, type SessionLogResponse } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
  head: () => ({ meta: [{ title: "Stats — Zone It" }] }),
});

type Range = "3m" | "1y" | "all";

const RANGES: { value: Range; label: string }[] = [
  { value: "3m", label: "Last 3 months" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "All time" },
];

function sinceDate(range: Range): string | undefined {
  const now = new Date();
  if (range === "3m") {
    now.setMonth(now.getMonth() - 3);
    return now.toISOString();
  }
  if (range === "1y") {
    now.setFullYear(now.getFullYear() - 1);
    return now.toISOString();
  }
  return undefined;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameWeek(a: Date, b: Date): boolean {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StatsPage() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [range, setRange] = useState<Range>("3m");
  const [logs, setLogs] = useState<SessionLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.sessionLogs
      .list(sinceDate(range))
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [user, range]);

  const stats = useMemo(() => {
    const totalSessions = logs.length;
    const totalSeconds = logs.reduce((s, l) => s + l.durationSeconds, 0);
    const totalExercises = logs.reduce((s, l) => s + l.exerciseCount, 0);

    const now = new Date();
    const thisWeekSessions = logs.filter((l) => isSameWeek(new Date(l.startedAt), now)).length;

    // Build per-day data for chart
    const byDay: Record<string, number> = {};
    for (const log of logs) {
      const key = dayKey(new Date(log.startedAt));
      byDay[key] = (byDay[key] ?? 0) + log.durationSeconds / 3600;
    }

    // Fill a continuous date range for the chart
    const chartData: { date: string; hours: number }[] = [];
    if (logs.length > 0) {
      const earliest = new Date(Math.min(...logs.map((l) => new Date(l.startedAt).getTime())));
      const cursor = new Date(earliest);
      cursor.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      while (cursor <= end) {
        const k = dayKey(cursor);
        chartData.push({ date: k, hours: Math.round((byDay[k] ?? 0) * 10) / 10 });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // For longer ranges, aggregate by week
    const aggregate = chartData.length > 60 ? aggregateByWeek(chartData) : chartData;

    return { totalSessions, totalSeconds, totalExercises, thisWeekSessions, chartData: aggregate };
  }, [logs]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this log?")) return;
    setDeletingId(id);
    try {
      await api.sessionLogs.delete(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-heading text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              Zone It
            </Link>
            <span className="font-heading text-base font-extrabold tracking-tight text-foreground">
              Stats
            </span>
          </div>
          {!authLoading && user && <UserMenu user={user} onLogout={logout} />}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {!user && !authLoading ? (
          <div className="mt-20 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to view your training stats.</p>
            <button
              onClick={login}
              className="rounded bg-primary px-5 py-2.5 font-heading text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            {/* Range filter */}
            <div className="mb-6 flex gap-2">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`rounded border-2 px-3 py-1.5 font-heading text-xs font-bold transition-all ${
                    range === r.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="mt-20 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Sessions" value={String(stats.totalSessions)} />
                  <StatCard label="Total time" value={formatDuration(stats.totalSeconds)} />
                  <StatCard label="Exercises" value={String(stats.totalExercises)} />
                  <StatCard
                    label="This week"
                    value={`${stats.thisWeekSessions} session${stats.thisWeekSessions !== 1 ? "s" : ""}`}
                    highlight
                  />
                </div>

                {/* Chart */}
                {stats.chartData.length > 0 && (
                  <div className="mb-6 rounded border border-border bg-card p-4">
                    <h2 className="mb-4 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Training hours per day
                    </h2>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart
                        data={stats.chartData}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v: string) => shortDay(v)}
                          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => (v === 0 ? "" : `${v}h`)}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "4px",
                            fontSize: "12px",
                            color: "var(--color-foreground)",
                          }}
                          formatter={(v: number) => [`${v}h`, "Training"]}
                          labelFormatter={(l: string) => shortDay(l)}
                        />
                        <Bar dataKey="hours" radius={[2, 2, 0, 0]}>
                          {stats.chartData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={
                                entry.hours > 0 ? "var(--color-primary)" : "var(--color-border)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Session log table */}
                <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Session history
                </h2>

                {logs.length === 0 ? (
                  <div className="rounded border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                    No sessions in this range yet.{" "}
                    <Link to="/" className="text-primary hover:underline">
                      Generate and start one
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded border border-border bg-card"
                      >
                        <div className="flex items-start justify-between gap-4 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-heading text-sm font-bold text-foreground">
                                {log.sessionTitle}
                              </span>
                              <span className="rounded bg-secondary px-1.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                                {formatDuration(log.durationSeconds)}
                              </span>
                              <span className="rounded bg-secondary px-1.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                                {log.exerciseCount} exercises
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(log.startedAt).toLocaleDateString(undefined, {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {log.sessionSubtitle && ` · ${log.sessionSubtitle}`}
                            </p>
                            {log.notes && (
                              <p className="mt-1 text-xs italic text-muted-foreground">
                                "{log.notes}"
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(log.id)}
                            disabled={deletingId === log.id}
                            className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                          >
                            {deletingId === log.id ? "…" : "✕"}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded border p-4 ${highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}
    >
      <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-heading text-2xl font-extrabold tracking-tight ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function aggregateByWeek(
  days: { date: string; hours: number }[],
): { date: string; hours: number }[] {
  const weeks: Record<string, { date: string; hours: number }> = {};
  for (const d of days) {
    const weekStart = dayKey(startOfWeek(new Date(d.date + "T12:00:00")));
    if (!weeks[weekStart]) weeks[weekStart] = { date: weekStart, hours: 0 };
    weeks[weekStart].hours = Math.round((weeks[weekStart].hours + d.hours) * 10) / 10;
  }
  return Object.values(weeks).sort((a, b) => a.date.localeCompare(b.date));
}
