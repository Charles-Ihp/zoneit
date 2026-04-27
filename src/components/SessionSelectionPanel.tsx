import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api, type WorkoutResponse } from "@/lib/api";
import type { GeneratedSession, SessionInput } from "@/lib/types";

interface SessionSelectionPanelProps {
  onGenerateNew: () => void;
  onSelectWorkout: (workout: WorkoutResponse) => void;
}

export function SessionSelectionPanel({
  onGenerateNew,
  onSelectWorkout,
}: SessionSelectionPanelProps) {
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.workouts
      .list()
      .then(setWorkouts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="font-heading text-2xl font-extrabold tracking-tight">
          <span className="text-foreground">What would you like to </span>
          <span className="gradient-text">do?</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a new session or continue with a saved one.
        </p>

        {/* Generate New Session Card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onClick={onGenerateNew}
          className="mt-6 w-full rounded-xl border border-primary/30 bg-primary/10 p-6 text-left transition-all hover:border-primary/60 hover:bg-primary/20 hover:shadow-[0_0_30px_rgba(147,51,234,0.15)] animate-border-glow"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/20 shadow-[0_0_20px_rgba(147,51,234,0.2)]">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold gradient-text">Generate New Session</h3>
              <p className="text-sm text-muted-foreground">
                Create a personalized climbing session based on your goals and energy.
              </p>
            </div>
          </div>
        </motion.button>

        {/* Saved Sessions Section */}
        <div className="mt-8">
          <h3 className="font-heading text-lg font-bold text-foreground">Saved Sessions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick up where you left off with a saved workout.
          </p>

          {loading ? (
            <div className="mt-6 flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-[0_0_10px_rgba(147,51,234,0.3)]" />
            </div>
          ) : workouts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card mt-6 rounded-xl p-8 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                No saved sessions yet. Generate your first session to get started!
              </p>
            </motion.div>
          ) : (
            <div className="mt-4 space-y-2">
              {workouts.map((workout, i) => (
                <motion.button
                  key={workout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
                  onClick={() => onSelectWorkout(workout)}
                  className="glass-card card-hover-glow w-full rounded-xl p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-heading text-sm font-bold text-foreground">
                        {workout.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(workout.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 shrink-0 text-primary/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
