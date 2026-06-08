import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarRange, Plus, ChevronRight, LogIn, Sparkles, Dumbbell } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { VipLocked } from "@/components/VipLocked";
import { useAuth } from "@/hooks/use-auth";
import { api, type ProgramResponse } from "@/lib/api";
import { RCP_META, RCP_PROGRAM_ID } from "@/lib/programs/rcp-split";

export const Route = createFileRoute("/programs/")({
  component: ProgramsListPage,
  head: () => ({ meta: [{ title: "Programs — GRAVITACIO" }] }),
});

function ProgramsListPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.isVip) {
      setLoading(false);
      return;
    }
    api.programs
      .list()
      .then(setPrograms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Logged-out gate
  if (!user && !authLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarRange className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-foreground">
            Build and follow training programs
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Log in to design your own gym or climbing programs and track your progress.
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

  // VIP gate
  if (user && !user.isVip) {
    return <VipLocked />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Programs</h1>
        <button
          onClick={() => navigate({ to: "/programs/builder" })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading...</div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Built-in */}
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Built-in
            </h2>
            <Link
              to="/programs/$programId"
              params={{ programId: RCP_PROGRAM_ID }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-muted/30 active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{RCP_META.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Gym · {RCP_META.weeks} weeks · {RCP_META.trainingDays} days/week
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          </section>

          {/* User programs */}
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your programs
            </h2>
            {programs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <Dumbbell className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">No programs yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Design your own gym or climbing program and follow it week by week.
                </p>
                <button
                  onClick={() => navigate({ to: "/programs/builder" })}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Create program
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {programs.map((p) => (
                  <Link
                    key={p.id}
                    to="/programs/$programId"
                    params={{ programId: p.id }}
                    className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-muted/30 active:scale-[0.99]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarRange className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {p.type} · {p.lengthWeeks} week{p.lengthWeeks === 1 ? "" : "s"} ·{" "}
                        {p.days.length} day{p.days.length === 1 ? "" : "s"}/week
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </motion.div>
      )}
    </div>
  );
}
