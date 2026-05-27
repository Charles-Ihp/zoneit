import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { api, type WorkoutResponse } from "@/lib/api";
import { SessionView } from "@/components/SessionView";
import type { GeneratedSession } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/workouts/$id")({
  component: WorkoutView,
  head: () => ({ meta: [{ title: "Session — Send It" }] }),
});

function WorkoutView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [workout, setWorkout] = useState<WorkoutResponse | null>(null);
  const [session, setSession] = useState<GeneratedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle session changes - update local state AND persist to backend
  const handleSessionChange = useCallback(
    async (newSession: GeneratedSession) => {
      setSession(newSession);
      // Persist changes to backend
      try {
        const updated = await api.workouts.update(id, {
          generatedSession: newSession as unknown as Record<string, unknown>,
        });
        setWorkout(updated);
      } catch (err) {
        console.error("Failed to save session changes:", err);
      }
    },
    [id],
  );

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

  const handleDelete = async () => {
    if (!workout) return;
    try {
      await api.workouts.delete(workout.id);
      navigate({ to: "/" });
    } catch {
      // Handle error silently or show a toast
    }
  };

  const handleShare = async () => {
    if (!workout) return;
    setSharing(true);
    try {
      const result = await api.shared.createShareLink(workout.id);
      setShareUrl(result.shareUrl);
    } catch (err) {
      console.error("Failed to create share link:", err);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div>
      {authLoading || loading ? (
        <div className="mt-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/workouts/" className="mt-4 inline-block text-sm text-primary hover:underline">
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
          workoutId={id}
          onSessionChange={handleSessionChange}
          onDelete={handleDelete}
          onShare={handleShare}
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
                className="w-full max-w-lg rounded-xl border-2 border-primary bg-background px-4 py-2 text-center font-heading text-3xl font-semibold tracking-tight text-foreground focus:outline-none md:text-4xl"
              />
            ) : (
              <button
                onClick={startEditing}
                title="Click to rename"
                className="group inline-flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-muted"
              >
                <span className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {workout!.name}
                </span>
                <span className="flex items-center justify-center rounded-lg border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                  Edit
                </span>
              </button>
            )
          }
        />
      ) : null}

      {/* Share link dialog */}
      <AnimatePresence>
        {shareUrl && (
          <motion.div
            key="share-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => setShareUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">Share Workout</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Anyone with this link can add a copy of this workout to their library.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShareUrl(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
