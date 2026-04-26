import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { api, type WorkoutResponse } from "@/lib/api";
import { SessionView } from "@/components/SessionView";
import type { GeneratedSession } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";

export const Route = createFileRoute("/workouts/$id")({
  component: WorkoutView,
  head: () => ({ meta: [{ title: "Session — Send It" }] }),
});

function WorkoutView() {
  const { id } = Route.useParams();
  const { user, loading: authLoading, logout } = useAuth();
  const [workout, setWorkout] = useState<WorkoutResponse | null>(null);
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user && !authLoading) {
      setLoading(false);
      return;
    }
    if (!user) return;
    api.workouts
      .get(id)
      .then((w) => {
        setWorkout(w);
        setSession(w.generatedSession as GeneratedSession);
      })
      .catch(() => setError("Session not found."))
      .finally(() => setLoading(false));
  }, [id, user, authLoading]);

  const startEditing = () => {
    if (!workout) return;
    setNameValue(workout.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 30);
  };

  const commitRename = async () => {
    if (!workout || !nameValue.trim() || nameValue === workout.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await api.workouts.update(workout.id, { name: nameValue.trim() });
      setWorkout(updated);
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="font-heading text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              GRAVITACIO
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

      <main className="pb-16">
        {authLoading || loading ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link
              to="/workouts/"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Back to saved sessions
            </Link>
          </div>
        ) : !user ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            Sign in to view this session.
          </div>
        ) : session ? (
          <SessionView
            session={session}
            onSessionChange={setSession}
            titleOverride={
              editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  disabled={savingName}
                  autoFocus
                  className="w-full max-w-lg rounded-xl border-2 border-primary bg-background px-4 py-2 text-center font-heading text-4xl font-extrabold tracking-tight text-foreground focus:outline-none md:text-5xl"
                />
              ) : (
                <button
                  onClick={startEditing}
                  title="Click to rename"
                  className="group inline-flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-secondary"
                >
                  <span className="font-heading text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                    {workout!.name}
                  </span>
                  <span className="flex items-center justify-center rounded border border-border bg-secondary px-2 py-1 font-heading text-xs font-bold text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                    Edit
                  </span>
                </button>
              )
            }
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
