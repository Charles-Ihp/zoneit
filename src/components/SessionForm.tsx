import { useState } from "react";
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

const goalOptions: { value: Goal; label: string }[] = [
  { value: "technique", label: "Technique" },
  { value: "projecting", label: "Projecting" },
  { value: "power", label: "Power" },
  { value: "endurance", label: "Endurance" },
  { value: "volume", label: "Volume" },
  { value: "recovery", label: "Recovery" },
];

const gymOptions: { value: GymType; label: string }[] = [
  { value: "mixed", label: "Mixed / General" },
  { value: "slab", label: "Mostly Slab" },
  { value: "comp", label: "Comp Style" },
  { value: "spray", label: "Spray Wall" },
  { value: "moonboard", label: "Moonboard" },
];

const timeOptions = [45, 60, 90, 120];

const fatigueOptions: { value: Fatigue; label: string }[] = [
  { value: "fresh", label: "Fresh" },
  { value: "normal", label: "Normal" },
  { value: "tired", label: "Tired" },
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
    <div className="space-y-8">
      {/* Level */}
      <FormSection title="Climbing Level" step={1}>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {levelOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLevel(opt.value)}
              className={`rounded border-2 p-3 text-left transition-all sm:p-4 ${
                level === opt.value
                  ? "border-primary bg-primary/8 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              <span className="block font-heading text-sm font-bold">{opt.label}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Goal */}
      <FormSection title="Session Goal" step={2}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {goalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGoal(opt.value)}
              className={`flex items-center gap-2.5 rounded border-2 px-3 py-3 transition-all sm:gap-3 sm:p-4 ${
                goal === opt.value
                  ? "border-primary bg-primary/8 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              <span className="font-heading text-sm font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Time */}
      <FormSection title="Session Length" step={3}>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {timeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setSessionLength(t)}
              className={`rounded border-2 py-3 font-heading text-sm font-bold transition-all ${
                sessionLength === t
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              {t}m
            </button>
          ))}
        </div>
      </FormSection>

      {/* Gym & Fatigue row */}
      <div className="grid gap-8 sm:grid-cols-2">
        <FormSection title="Gym Type" step={4}>
          <div className="flex flex-wrap gap-2">
            {gymOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGymType(opt.value)}
                className={`rounded border-2 px-3 py-2 text-sm font-medium transition-all ${
                  gymType === opt.value
                    ? "border-primary bg-primary/8 font-semibold"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection title="Energy Level" step={5}>
          <div className="grid grid-cols-3 gap-2">
            {fatigueOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFatigue(opt.value)}
                className={`flex flex-col items-center gap-1 rounded border-2 py-3 text-sm font-medium transition-all ${
                  fatigue === opt.value
                    ? "border-primary bg-primary/8 font-semibold shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                <span className="font-heading text-sm font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </FormSection>
      </div>

      {/* Injuries & Equipment */}
      <div className="grid gap-8 sm:grid-cols-2">
        <FormSection title="Injuries / Restrictions" step={6} optional>
          <div className="flex flex-wrap gap-2">
            {injuryOptions.map((val) => (
              <button
                key={val}
                onClick={() => toggleInjury(val)}
                className={`rounded border-2 px-3 py-1.5 text-sm capitalize transition-all ${
                  injuries.includes(val)
                    ? "border-destructive bg-destructive/8 font-semibold text-destructive"
                    : "border-border bg-card hover:border-destructive/30 hover:bg-secondary"
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
                className={`rounded border-2 px-3 py-1.5 text-sm transition-all ${
                  equipment.includes(opt.value)
                    ? "border-primary bg-primary/8 font-semibold"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormSection>
      </div>

      {/* Generate */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded bg-primary py-4 font-heading text-base font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Session"}
        </button>
      </div>
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
    <div>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-foreground font-heading text-[10px] font-bold text-background">
          {step}
        </span>
        <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
          {title}
        </h3>
        {optional && <span className="text-xs text-muted-foreground">(optional)</span>}
      </div>
      {children}
    </div>
  );
}
