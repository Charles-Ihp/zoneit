import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, type SharedWorkoutResponse } from "@/lib/api";
import type { GeneratedSession } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SessionView } from "@/components/SessionView";

export const Route = createFileRoute("/w/$code")({
  component: SharedWorkoutPage,
  head: () => ({ meta: [{ title: "Shared Workout — Send It" }] }),
});

function SharedWorkoutPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, login } = useAuth();

  const [shared, setShared] = useState<SharedWorkoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    api.shared
      .get(code)
      .then(setShared)
      .catch((err: Error & { status?: number }) => {
        if (err.status === 404) {
          setError("This shared workout was not found.");
        } else if (err.status === 410) {
          setError("This share link has expired.");
        } else {
          setError("Failed to load shared workout.");
        }
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleImport = async () => {
    if (!user) {
      login();
      return;
    }
    setImporting(true);
    try {
      const result = await api.shared.import(code);
      setImported(true);
      // Navigate to the imported workout after a short delay
      setTimeout(() => {
        navigate({ to: "/workouts/$id", params: { id: result.workoutId } });
      }, 1500);
    } catch (err) {
      console.error("Failed to import workout:", err);
      setError("Failed to import workout. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const session = shared?.generatedSession as GeneratedSession | undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {loading ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="rounded-xl bg-primary px-6 py-3 font-heading text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90"
            >
              Go Home
            </button>
          </div>
        ) : shared && session ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Shared by header */}
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              {shared.createdBy.picture && (
                <img
                  src={shared.createdBy.picture}
                  alt={shared.createdBy.name}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Shared by{" "}
                  <span className="font-semibold text-foreground">{shared.createdBy.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {shared.importCount} {shared.importCount === 1 ? "person has" : "people have"}{" "}
                  added this workout
                </p>
              </div>
            </div>

            {/* Session preview */}
            <SessionView session={session} />

            {/* Import button */}
            <div className="mt-8 flex flex-col items-center gap-4">
              {imported ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 text-green-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-heading font-bold">Added to your workouts!</span>
                </motion.div>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="rounded-xl bg-primary px-8 py-4 font-heading text-base font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-50"
                >
                  {importing ? "Adding…" : user ? "Add to My Workouts" : "Sign in to Add Workout"}
                </button>
              )}
              {!user && !authLoading && (
                <p className="text-xs text-muted-foreground">
                  You'll need to sign in to save this workout to your library.
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
