import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, type WorkoutResponse } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";

export const Route = createFileRoute("/workouts/")({
  component: WorkoutsList,
  head: () => ({ meta: [{ title: "Saved Sessions — Send It" }] }),
});

function WorkoutsList() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.workouts
      .list()
      .then(setWorkouts)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    setDeletingId(id);
    try {
      await api.workouts.delete(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="font-heading text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Zone It
            </Link>
            <span className="text-border">/</span>
            <span className="font-heading text-lg font-extrabold tracking-tight text-foreground">
              My Sessions
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!authLoading && user && <UserMenu user={user} onLogout={logout} />}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
          Saved Sessions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your climbing history.</p>

        {authLoading || loading ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !user ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to see your saved sessions.</p>
            <button
              onClick={login}
              className="rounded-xl bg-primary px-6 py-3 font-heading text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90"
            >
              Sign in with Google
            </button>
          </div>
        ) : workouts.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">No saved sessions yet.</p>
            <Link
              to="/"
              className="rounded-xl bg-primary px-6 py-3 font-heading text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90"
            >
              Generate a session
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {workouts.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-heading text-sm font-bold text-foreground">
                    {w.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <Link
                    to="/workouts/$id"
                    params={{ id: w.id }}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(w.id)}
                    disabled={deletingId === w.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                  >
                    {deletingId === w.id ? "…" : "Delete"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
