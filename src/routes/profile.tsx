import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api, type UserResponse, type UpdateProfileBody } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — GRAVITACIO" }] }),
});

function ProfilePage() {
  const { user, loading: authLoading, login, logout, setUser } = useAuth();
  const [form, setForm] = useState<{
    name: string;
    age: string;
    weightKg: string;
    heightCm: string;
  }>({ name: "", age: "", weightKg: "", heightCm: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        age: user.age != null ? String(user.age) : "",
        weightKg: user.weightKg != null ? String(user.weightKg) : "",
        heightCm: user.heightCm != null ? String(user.heightCm) : "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const body: UpdateProfileBody = {};
      const trimmedName = form.name.trim();
      if (trimmedName && trimmedName !== user.name) body.name = trimmedName;

      const age = form.age === "" ? null : parseInt(form.age, 10);
      if (!isNaN(age as number) || age === null) body.age = age;

      const weight = form.weightKg === "" ? null : parseFloat(form.weightKg);
      if (!isNaN(weight as number) || weight === null) body.weightKg = weight;

      const height = form.heightCm === "" ? null : parseInt(form.heightCm, 10);
      if (!isNaN(height as number) || height === null) body.heightCm = height;

      const updated = await api.users.updateProfile(body);
      setUser(updated);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        {!user && !authLoading ? (
          <div className="mt-20 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to view your profile.</p>
            <button
              onClick={login}
              className="rounded bg-primary px-5 py-2.5 font-heading text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Avatar row */}
            {user?.picture && (
              <div className="mb-6 flex items-center gap-4">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-14 w-14 rounded-full border border-border"
                />
                <div>
                  <p className="font-heading text-base font-bold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Name */}
              <FieldGroup label="Display Name" hint="How your name appears in the app">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </FieldGroup>

              {/* Body stats row */}
              <div className="grid grid-cols-3 gap-3">
                <FieldGroup label="Age" hint="years">
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                    placeholder="—"
                    min={1}
                    max={120}
                    className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </FieldGroup>
                <FieldGroup label="Weight" hint="kg">
                  <input
                    type="number"
                    value={form.weightKg}
                    onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                    placeholder="—"
                    min={1}
                    step={0.1}
                    className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </FieldGroup>
                <FieldGroup label="Height" hint="cm">
                  <input
                    type="number"
                    value={form.heightCm}
                    onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                    placeholder="—"
                    min={1}
                    max={300}
                    className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </FieldGroup>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded bg-primary py-3 font-heading text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : saved ? "Saved" : "Save Profile"}
              </button>
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Account
              </h2>
              <p className="text-sm text-muted-foreground">
                Signed in with Google as <strong className="text-foreground">{user?.email}</strong>
              </p>
              <button
                onClick={logout}
                className="mt-3 rounded border border-border px-4 py-2 font-heading text-sm font-semibold text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <label className="font-heading text-xs font-bold uppercase tracking-widest text-foreground">
          {label}
        </label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
