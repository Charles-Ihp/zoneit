import { useState } from "react";
import { motion } from "framer-motion";
import type { SessionInput, Level, Equipment, Goal, GymType, Fatigue } from "@/lib/types";

interface SessionFormProps {
  onGenerate: (input: SessionInput) => void;
  loading?: boolean;
}

const levelOptions: { value: Level; label: string; desc: string }[] = [
  { value: "beginner", label: "Beginner", desc: "V0–V3 / 5.6–5.10a" },
  { value: "intermediate", label: "Intermediate", desc: "V3–V6 / 5.10a–5.12a" },
  { value: "advanced", label: "Advanced", desc: "V6+ / 5.12a+" },
];

const goalOptions: { value: Goal; label: string; icon: string }[] = [
  { value: "technique", label: "Technique", icon: "🎯" },
  { value: "projecting", label: "Projecting", icon: "🧗" },
  { value: "power", label: "Power", icon: "⚡" },
  { value: "endurance", label: "Endurance", icon: "🔁" },
  { value: "volume", label: "Volume", icon: "📊" },
  { value: "recovery", label: "Recovery", icon: "🧘" },
];

const gymOptions: { value: GymType; label: string }[] = [
  { value: "mixed", label: "Mixed / General" },
  { value: "slab", label: "Mostly Slab" },
  { value: "comp", label: "Comp Style" },
  { value: "spray", label: "Spray Wall" },
  { value: "moonboard", label: "Moonboard" },
];

const timeOptions = [45, 60, 90, 120];

const fatigueOptions: { value: Fatigue; label: string; emoji: string }[] = [
  { value: "fresh", label: "Fresh", emoji: "🟢" },
  { value: "normal", label: "Normal", emoji: "🟡" },
  { value: "tired", label: "Tired", emoji: "🔴" },
];

const injuryOptions = ["fingers", "shoulders", "elbows", "wrists", "knees", "back"];

const equipmentOptions: { value: Equipment; label: string }[] = [
  { value: "hangboard", label: "Hangboard" },
  { value: "campus-board", label: "Campus Board" },
  { value: "resistance-bands", label: "Resistance Bands" },
  { value: "pull-up-bar", label: "Pull-up Bar" },
];

export function SessionForm({ onGenerate, loading = false }: SessionFormProps) {
  const [level, setLevel] = useState<Level>("intermediate");
  const [goal, setGoal] = useState<Goal>("technique");
  const [sessionLength, setSessionLength] = useState(60);
  const [gymType, setGymType] = useState<GymType>("mixed");
  const [fatigue, setFatigue] = useState<Fatigue>("normal");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const toggleInjury = (val: string) =>
    setInjuries((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  const toggleEquipment = (val: Equipment) =>
    setEquipment((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));

  const handleSubmit = () => {
    onGenerate({ level, goal, sessionLength, gymType, fatigue, injuries, equipment });
  };

  return (
    <div className="space-y-10">
      {/* Level */}
      <FormSection title="Climbing Level" step={1}>
        <div className="grid grid-cols-3 gap-3">
          {levelOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLevel(opt.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                level === opt.value
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <span className="font-heading text-sm font-semibold">{opt.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Goal */}
      <FormSection title="Session Goal" step={2}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {goalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGoal(opt.value)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                goal === opt.value
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="font-heading text-sm font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Time */}
      <FormSection title="Session Length" step={3}>
        <div className="flex gap-3">
          {timeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setSessionLength(t)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 font-heading text-sm font-semibold transition-all ${
                sessionLength === t
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {t} min
            </button>
          ))}
        </div>
      </FormSection>

      {/* Gym & Fatigue row */}
      <div className="grid gap-10 md:grid-cols-2">
        <FormSection title="Gym Type" step={4}>
          <div className="flex flex-wrap gap-2">
            {gymOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGymType(opt.value)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                  gymType === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection title="Energy Level" step={5}>
          <div className="flex gap-3">
            {fatigueOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFatigue(opt.value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  fatigue === opt.value
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </FormSection>
      </div>

      {/* Injuries & Equipment */}
      <div className="grid gap-10 md:grid-cols-2">
        <FormSection title="Injuries / Restrictions" step={6} optional>
          <div className="flex flex-wrap gap-2">
            {injuryOptions.map((val) => (
              <button
                key={val}
                onClick={() => toggleInjury(val)}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm capitalize transition-all ${
                  injuries.includes(val)
                    ? "border-accent bg-accent/15 text-accent-foreground"
                    : "border-border bg-card hover:border-accent/30"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection title="Available Equipment" step={7} optional>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleEquipment(opt.value)}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm transition-all ${
                  equipment.includes(opt.value)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormSection>
      </div>

      {/* Generate */}
      <motion.div
        className="flex justify-center pt-4"
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
      >
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-2xl bg-primary px-12 py-4 font-heading text-lg font-bold text-primary-foreground shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate Session"}
        </button>
      </motion.div>
    </div>
  );
}

function FormSection({
  title,
  step,
  optional,
  children,
}: {
  title: string;
  step: number;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step * 0.05, duration: 0.3 }}
    >
      <div className="mb-3 flex items-baseline gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-heading text-xs font-bold text-primary">
          {step}
        </span>
        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
        {optional && <span className="text-xs text-muted-foreground">optional</span>}
      </div>
      {children}
    </motion.div>
  );
}
