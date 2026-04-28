import { motion, AnimatePresence } from "framer-motion";
import { requestNotificationPermission } from "@/lib/notifications";

export const REST_TIME_OPTIONS = [30, 60, 90, 120, 180, 300];

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface RestSettingsModalProps {
  show: boolean;
  onClose: () => void;
  restTimeSeconds: number;
  onUpdateRestTime: (seconds: number) => void;
  notificationsEnabled: boolean;
  onNotificationsChange: (enabled: boolean) => void;
}

export function RestSettingsModal({
  show,
  onClose,
  restTimeSeconds,
  onUpdateRestTime,
  notificationsEnabled,
  onNotificationsChange,
}: RestSettingsModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-bold text-foreground">Rest Timer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set your default rest time between sets
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {REST_TIME_OPTIONS.map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => {
                    onUpdateRestTime(seconds);
                    onClose();
                  }}
                  className={`rounded border py-3 font-heading text-sm font-bold transition-colors ${
                    restTimeSeconds === seconds
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
                  {seconds === 90 && (
                    <span className="ml-1 text-xs text-muted-foreground">(default)</span>
                  )}
                </button>
              ))}
            </div>

            {/* Notification Status */}
            <div className="mt-4 flex items-center justify-between rounded border border-border p-3">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={notificationsEnabled ? "text-primary" : "text-muted-foreground"}
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span className="text-sm text-foreground">Notifications</span>
              </div>
              {notificationsEnabled ? (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Enabled
                </span>
              ) : (
                <button
                  onClick={async () => {
                    const enabled = await requestNotificationPermission();
                    onNotificationsChange(enabled);
                  }}
                  className="rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground"
                >
                  Enable
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {notificationsEnabled
                ? "Sound, vibration & notification when rest is over"
                : "Sound & vibration always work. Enable for banner notifications."}
            </p>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CancelSessionModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionElapsed: number;
  doneCount: number;
  totalExercises: number;
}

export function CancelSessionModal({
  show,
  onClose,
  onConfirm,
  sessionElapsed,
  doneCount,
  totalExercises,
}: CancelSessionModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
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
                className="text-destructive"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground">Cancel session?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You've been working out for {formatTime(sessionElapsed)} and completed {doneCount}/
              {totalExercises} exercises.
              <span className="mt-2 block font-medium text-destructive">
                This session will not be saved and all progress will be lost.
              </span>
            </p>
            <button
              onClick={onConfirm}
              className="mt-4 w-full rounded bg-destructive py-3 font-heading text-sm font-bold text-destructive-foreground transition-all hover:bg-destructive/90"
            >
              Cancel Session
            </button>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded border border-border py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Keep Going
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FinishSessionModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionElapsed: number;
  doneCount: number;
  totalExercises: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  saving: boolean;
  isLoggedIn: boolean;
}

export function FinishSessionModal({
  show,
  onClose,
  onConfirm,
  sessionElapsed,
  doneCount,
  totalExercises,
  notes,
  onNotesChange,
  saving,
  isLoggedIn,
}: FinishSessionModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-sm rounded-t border-x border-t border-border bg-card p-6 sm:rounded sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-bold text-foreground">End session?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTime(sessionElapsed)} · {doneCount}/{totalExercises} exercises done.
              {isLoggedIn ? " This will be saved to your history." : " Sign in to save to history."}
            </p>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Session notes (optional)"
              rows={2}
              className="mt-3 w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={onConfirm}
              disabled={saving}
              className="mt-3 w-full rounded bg-primary py-3 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Finish & Save"}
            </button>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              Keep going
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SessionSavedModalProps {
  show: boolean;
  onClose: () => void;
  sessionElapsed: number;
  doneCount: number;
}

export function SessionSavedModal({
  show,
  onClose,
  sessionElapsed,
  doneCount,
}: SessionSavedModalProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center bg-background"
    >
      <div className="text-center">
        <p className="font-heading text-4xl font-extrabold text-primary">Done</p>
        <p className="mt-2 font-heading text-base font-bold text-foreground">Session logged!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatTime(sessionElapsed)} · {doneCount} exercises
        </p>
        <button
          onClick={onClose}
          className="mt-6 rounded bg-primary px-6 py-2.5 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
