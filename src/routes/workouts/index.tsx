import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type WorkoutResponse, type FolderResponse } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/workouts/")({
  component: WorkoutsList,
  head: () => ({ meta: [{ title: "Saved Sessions — Send It" }] }),
});

function WorkoutsList() {
  const { user, loading: authLoading, login } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [folders, setFolders] = useState<FolderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmWorkout, setDeleteConfirmWorkout] = useState<WorkoutResponse | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Folder state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Drag and drop state
  const [draggingWorkoutId, setDraggingWorkoutId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderResponse | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<FolderResponse | null>(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const [moveWorkout, setMoveWorkout] = useState<WorkoutResponse | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [workoutsData, foldersData] = await Promise.all([
        api.workouts.list(),
        api.folders.list(),
      ]);
      setWorkouts(workoutsData);
      setFolders(foldersData);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteConfirmWorkout) return;
    const id = deleteConfirmWorkout.id;
    setDeleteConfirmWorkout(null);
    setDeletingId(id);
    try {
      await api.workouts.delete(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (workoutId: string) => {
    setSharingId(workoutId);
    try {
      const result = await api.shared.createShareLink(workoutId);
      setShareUrl(result.shareUrl);
    } catch (err) {
      console.error("Failed to create share link:", err);
    } finally {
      setSharingId(null);
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

  // Folder handlers
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const folder = await api.folders.create({ name: newFolderName.trim() });
      setFolders((prev) => [...prev, folder]);
      setExpandedFolders((prev) => new Set([...prev, folder.id]));
      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) return;
    try {
      const updated = await api.folders.update(editingFolder.id, { name: editFolderName.trim() });
      setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditingFolder(null);
      setEditFolderName("");
    } catch (err) {
      console.error("Failed to rename folder:", err);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteConfirmFolder) return;
    try {
      await api.folders.delete(deleteConfirmFolder.id);
      setFolders((prev) => prev.filter((f) => f.id !== deleteConfirmFolder.id));
      // Workouts in this folder will be moved to root by the backend
      setWorkouts((prev) =>
        prev.map((w) => (w.folderId === deleteConfirmFolder.id ? { ...w, folderId: null } : w)),
      );
      setDeleteConfirmFolder(null);
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  };

  const handleMoveWorkout = async (targetFolderId: string | null) => {
    if (!moveWorkout) return;
    try {
      const updated = await api.workouts.update(moveWorkout.id, { folderId: targetFolderId });
      setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setMoveWorkout(null);
    } catch (err) {
      console.error("Failed to move workout:", err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, workoutId: string) => {
    setDraggingWorkoutId(workoutId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", workoutId);
  };

  const handleDragEnd = () => {
    setDraggingWorkoutId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetFolderId: string | null) => {
    e.preventDefault();
    const workoutId = e.dataTransfer.getData("text/plain");
    const workout = workouts.find((w) => w.id === workoutId);

    if (workout && workout.folderId !== targetFolderId) {
      try {
        const updated = await api.workouts.update(workoutId, { folderId: targetFolderId });
        setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      } catch (err) {
        console.error("Failed to move workout:", err);
      }
    }

    setDraggingWorkoutId(null);
    setDragOverFolderId(null);
  };

  // Group workouts
  const rootWorkouts = workouts.filter((w) => !w.folderId);
  const workoutsByFolder = folders.map((folder) => ({
    folder,
    workouts: workouts.filter((w) => w.folderId === folder.id),
  }));

  const renderWorkoutCard = (w: WorkoutResponse, i: number) => (
    <motion.div
      key={w.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.3 }}
      draggable
      onDragStart={(e) => handleDragStart(e as unknown as DragEvent<HTMLDivElement>, w.id)}
      onDragEnd={handleDragEnd}
      className={`flex cursor-grab items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm active:cursor-grabbing ${
        draggingWorkoutId === w.id ? "opacity-50" : ""
      }`}
    >
      <div className="mr-2 text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-sm font-bold text-foreground">{w.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(w.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-2">
        <button
          onClick={() => handleShare(w.id)}
          disabled={sharingId === w.id}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          title="Share workout"
        >
          {sharingId === w.id ? (
            "…"
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
            </svg>
          )}
        </button>
        <Link
          to="/workouts/$id"
          params={{ id: w.id }}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          View
        </Link>
        <button
          onClick={() => setDeleteConfirmWorkout(w)}
          disabled={deletingId === w.id}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
        >
          {deletingId === w.id ? "…" : "Delete"}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Saved Sessions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your climbing history.</p>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <Link
              to="/"
              search={{ new: "1" }}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Session</span>
            </Link>
            {workouts.length > 0 && (
              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New Folder</span>
              </button>
            )}
          </div>
        )}
      </div>

      {authLoading || loading ? (
        <div className="mt-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !user ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">Sign in to see your saved sessions.</p>
          <button
            onClick={login}
            className="rounded-lg border border-border bg-background px-6 py-3 font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted"
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
        <div className="mt-6 space-y-4">
          {/* Folders */}
          {workoutsByFolder.map(({ folder, workouts: folderWorkouts }) => (
            <div
              key={folder.id}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`rounded-xl border-2 transition-colors ${
                dragOverFolderId === folder.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="font-heading text-sm font-semibold text-foreground">
                    {folder.name}
                  </span>
                  <span className="text-xs text-muted-foreground">({folderWorkouts.length})</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() =>
                      setFolderMenuOpen(folderMenuOpen === folder.id ? null : folder.id)
                    }
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {folderMenuOpen === folder.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-border bg-card py-1 shadow-lg">
                      <button
                        onClick={() => {
                          setEditingFolder(folder);
                          setEditFolderName(folder.name);
                          setFolderMenuOpen(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmFolder(folder);
                          setFolderMenuOpen(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {expandedFolders.has(folder.id) && folderWorkouts.length > 0 && (
                <div className="space-y-2 px-4 pb-4">
                  {folderWorkouts.map((w, i) => renderWorkoutCard(w, i))}
                </div>
              )}
              {expandedFolders.has(folder.id) && folderWorkouts.length === 0 && (
                <p className="px-4 pb-4 text-sm text-muted-foreground">
                  No workouts in this folder
                </p>
              )}
            </div>
          ))}

          {/* Root workouts (no folder) - also a drop zone */}
          <div
            onDragOver={(e) => handleDragOver(e, "root")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={`space-y-3 rounded-xl border-2 border-dashed p-4 transition-colors ${
              dragOverFolderId === "root"
                ? "border-primary bg-primary/5"
                : rootWorkouts.length > 0 || draggingWorkoutId
                  ? "border-border"
                  : "border-transparent"
            }`}
          >
            {folders.length > 0 && (rootWorkouts.length > 0 || draggingWorkoutId) && (
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Uncategorized
              </p>
            )}
            {rootWorkouts.map((w, i) => renderWorkoutCard(w, i))}
            {rootWorkouts.length === 0 && draggingWorkoutId && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Drop here to remove from folder
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteConfirmWorkout && (
          <motion.div
            key="delete-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirmWorkout(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Delete Session?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently delete "{deleteConfirmWorkout.name}". This action cannot be
                undone.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setDeleteConfirmWorkout(null)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground transition-all hover:bg-destructive/90"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share link dialog */}
      <AnimatePresence>
        {shareUrl && (
          <motion.div
            key="share-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm"
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

      {/* Create folder dialog */}
      <AnimatePresence>
        {showCreateFolder && (
          <motion.div
            key="create-folder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm"
            onClick={() => setShowCreateFolder(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">New Folder</h2>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowCreateFolder(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename folder dialog */}
      <AnimatePresence>
        {editingFolder && (
          <motion.div
            key="rename-folder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm"
            onClick={() => setEditingFolder(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">Rename Folder</h2>
              <input
                type="text"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Folder name"
                className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
              />
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setEditingFolder(null)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameFolder}
                  disabled={!editFolderName.trim()}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete folder confirmation dialog */}
      <AnimatePresence>
        {deleteConfirmFolder && (
          <motion.div
            key="delete-folder-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirmFolder(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">Delete Folder?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This will delete the folder "{deleteConfirmFolder.name}". Workouts inside will be
                moved to the root level.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setDeleteConfirmFolder(null)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFolder}
                  className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground transition-all hover:bg-destructive/90"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move workout dialog */}
      <AnimatePresence>
        {moveWorkout && (
          <motion.div
            key="move-workout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm"
            onClick={() => setMoveWorkout(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-heading text-lg font-semibold text-foreground">Move to Folder</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a destination for "{moveWorkout.name}"
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleMoveWorkout(null)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    !moveWorkout.folderId
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <Folder className="h-4 w-4" />
                  No folder (root)
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveWorkout(folder.id)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      moveWorkout.folderId === folder.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <Folder className="h-4 w-4" />
                    {folder.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setMoveWorkout(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
