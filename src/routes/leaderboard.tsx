import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, type LeaderboardResponse, type WeeklyLeader, type AllTimeLeader } from "@/lib/api";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({ meta: [{ title: "Leaderboard — GRAVITACIO" }] }),
});

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatWithK(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num.toString();
}

const RANK_COLORS = [
  "bg-yellow-500 text-yellow-950",
  "bg-gray-400 text-gray-900",
  "bg-amber-600 text-amber-50",
];

function LeaderboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"week" | "month" | "year">("week");

  useEffect(() => {
    api.leaderboard
      .get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-heading text-lg font-extrabold tracking-tight text-foreground"
            >
              GRAVITACIO
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!authLoading && user && <UserMenu user={user} onLogout={logout} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="mb-6 font-heading text-2xl font-extrabold tracking-tight">Leaderboard</h1>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading...</div>
        ) : !data ? (
          <div className="py-16 text-center text-muted-foreground">Failed to load leaderboard</div>
        ) : (
          <div className="space-y-6">
            {/* Global Stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Community Stats
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-primary sm:text-3xl">
                    {formatWithK(data.globalStats.totalSessions)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Sessions</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-primary sm:text-3xl">
                    {formatWithK(data.globalStats.totalMinutes)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Total Minutes</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-primary sm:text-3xl">
                    {data.globalStats.activeUsers}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Active Users</div>
                </div>
              </div>
            </motion.div>

            {/* Training Hours Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Training Hours
                </h3>
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  {(["week", "month", "year"] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        chartPeriod === period
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <TrainingChart data={data.chartData[chartPeriod]} />
              </div>
            </motion.div>

            {/* MVPs - Week, Month, All-Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                MVPs
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Weekly MVP */}
                <MvpCard title="This Week" champion={data.weeklyChampion} icon="🏆" />
                {/* Monthly MVP */}
                <MvpCard title="This Month" champion={data.monthlyChampion} icon="🥇" />
                {/* All-Time MVP */}
                <MvpCard title="All Time" champion={data.allTimeChampion} icon="👑" />
              </div>
            </motion.div>

            {/* Top 5 This Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Top 5 This Week
              </h3>
              {data.weeklyTop.length > 0 ? (
                <div className="space-y-2">
                  {data.weeklyTop.slice(0, 5).map((leader, i) => (
                    <div
                      key={leader.user.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          RANK_COLORS[i] || "bg-secondary text-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      {leader.user.picture ? (
                        <img src={leader.user.picture} alt="" className="h-9 w-9 rounded-full" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                          {leader.user.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-heading text-sm font-bold">
                          {leader.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {leader.sessionCount} session{leader.sessionCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="font-heading text-sm font-bold text-primary">
                        {formatTime(leader.totalSeconds)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No sessions this week yet
                </div>
              )}
            </motion.div>

            {/* Empty State */}
            {data.weeklyTop.length === 0 && data.allTimeTop.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <h3 className="font-heading text-lg font-bold">No sessions yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Be the first to complete a session and claim the top spot!
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Start Training
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function TrainingChart({ data }: { data: { label: string; minutes: number }[] }) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  const totalHours = (data.reduce((s, d) => s + d.minutes, 0) / 60).toFixed(1);

  return (
    <div>
      <div className="mb-2 text-right text-xs text-muted-foreground">Total: {totalHours}h</div>
      <div className="flex h-32 items-end justify-between gap-2">
        {data.map((item, i) => {
          const normalizedHeight = (item.minutes / maxMinutes) * 100;

          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative flex h-24 w-full items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${normalizedHeight}%` }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`w-full max-w-[24px] rounded-t ${
                    item.minutes > 0 ? "bg-primary" : "bg-muted"
                  }`}
                  style={{ minHeight: item.minutes > 0 ? 4 : 2 }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MvpCard({
  title,
  champion,
  icon,
}: {
  title: string;
  champion: WeeklyLeader | AllTimeLeader | null;
  icon: string;
}) {
  const formatMinutes = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 1000) {
      return `${(minutes / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    }
    return minutes.toString();
  };

  if (!champion) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">No data yet</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="mt-3">
        <div className="truncate font-heading text-sm font-bold text-foreground">
          {champion.user.name}
        </div>
        <div className="mt-1 text-2xl font-bold text-primary">
          {formatMinutes(champion.totalSeconds)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">min</span>
        </div>
      </div>
    </div>
  );
}
