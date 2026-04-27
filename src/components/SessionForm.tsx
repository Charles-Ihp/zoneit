import { useState } from "react";
import type { SessionInput, Level, Equipment, Goal, GymType, Fatigue } from "@/lib/types";

interface SessionFormProps {
  onGenerate: (input: SessionInput) => void;
  loading?: boolean;
}

type TrainingType = "climb" | "gym";

const levelOptions: { value: Level; label: string; climbDesc: string; gymDesc: string }[] = [
  {
    value: "beginner",
    label: "Beginner",
    climbDesc: "V0–V3 / 5.6–5.10a",
    gymDesc: "New to lifting",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    climbDesc: "V3–V6 / 5.10a–5.12a",
    gymDesc: "1–3 years training",
  },
  { value: "advanced", label: "Advanced", climbDesc: "V6+ / 5.12a+", gymDesc: "3+ years training" },
];

const climbGoalOptions: { value: Goal; label: string }[] = [
  { value: "technique", label: "Technique" },
  { value: "projecting", label: "Projecting" },
  { value: "power", label: "Power" },
  { value: "dynos", label: "Dynos" },
  { value: "endurance", label: "Endurance" },
  { value: "volume", label: "Volume" },
  { value: "recovery", label: "Recovery" },
];

const gymGoalOptions: { value: Goal; label: string }[] = [
  { value: "gym-push", label: "Push Day" },
  { value: "gym-pull", label: "Pull Day" },
  { value: "gym-legs", label: "Leg Day" },
  { value: "handstand", label: "Handstand" },
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
  const [trainingType, setTrainingType] = useState<TrainingType>("climb");
  const [level, setLevel] = useState<Level>("intermediate");
  const [goal, setGoal] = useState<Goal>("technique");
  const [sessionLength, setSessionLength] = useState(60);
  const [gymType, setGymType] = useState<GymType>("mixed");
  const [fatigue, setFatigue] = useState<Fatigue>("normal");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const isClimbing = trainingType === "climb";
  const goalOptions = isClimbing ? climbGoalOptions : gymGoalOptions;

  // Reset goal when switching training type
  const handleTrainingTypeChange = (type: TrainingType) => {
    setTrainingType(type);
    setGoal(type === "climb" ? "technique" : "gym-push");
  };

  const toggleInjury = (val: string) =>
    setInjuries((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  const toggleEquipment = (val: Equipment) =>
    setEquipment((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));

  const handleSubmit = () => {
    onGenerate({ level, goal, sessionLength, gymType, fatigue, injuries, equipment });
  };

  // Calculate step numbers dynamically based on what's shown
  let stepNum = 0;

  return (
    <div className="space-y-8">
      {/* Training Type */}
      <FormSection title="Training Type" step={++stepNum}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={() => handleTrainingTypeChange("climb")}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
              trainingType === "climb"
                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(147,51,234,0.15)]"
                : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
            }`}
          >
            <span className="font-heading text-sm font-bold">Climbing</span>
          </button>
          <button
            onClick={() => handleTrainingTypeChange("gym")}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
              trainingType === "gym"
                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(147,51,234,0.15)]"
                : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
            }`}
          >
            <span className="font-heading text-sm font-bold">Gym</span>
          </button>
        </div>
      </FormSection>

      {/* Level */}
      <FormSection title={isClimbing ? "Climbing Level" : "Fitness Level"} step={++stepNum}>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {levelOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLevel(opt.value)}
              className={`rounded-lg border-2 p-3 text-left transition-all sm:p-4 ${
                level === opt.value
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(147,51,234,0.15)]"
                  : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
              }`}
            >
              <span className="block font-heading text-sm font-bold">{opt.label}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {isClimbing ? opt.climbDesc : opt.gymDesc}
              </span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Goal */}
      <FormSection title="Session Goal" step={++stepNum}>
        <div
          className={`grid gap-2 sm:gap-3 ${isClimbing ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
        >
          {goalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGoal(opt.value)}
              className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-3 transition-all sm:gap-3 sm:p-4 ${
                goal === opt.value
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(147,51,234,0.15)]"
                  : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
              }`}
            >
              <span className="font-heading text-sm font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Time */}
      <FormSection title="Session Length" step={++stepNum}>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {timeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setSessionLength(t)}
              className={`rounded-lg border-2 py-3 font-heading text-sm font-bold transition-all ${
                sessionLength === t
                  ? "border-primary bg-gradient-to-br from-primary to-accent text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                  : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
              }`}
            >
              {t}m
            </button>
          ))}
        </div>
      </FormSection>

      {/* Gym & Fatigue row - Gym Type only for climbing */}
      {isClimbing ? (
        <div className="grid gap-8 sm:grid-cols-2">
          <FormSection title="Gym Type" step={++stepNum}>
            <div className="flex flex-wrap gap-2">
              {gymOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGymType(opt.value)}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                    gymType === opt.value
                      ? "border-primary bg-primary/10 font-semibold shadow-[0_0_10px_rgba(147,51,234,0.15)]"
                      : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection title="Energy Level" step={++stepNum}>
            <div className="grid grid-cols-3 gap-2">
              {fatigueOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFatigue(opt.value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 py-3 text-sm font-medium transition-all ${
                    fatigue === opt.value
                      ? "border-primary bg-primary/10 font-semibold shadow-[0_0_10px_rgba(147,51,234,0.15)]"
                      : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </FormSection>
        </div>
      ) : (
        <FormSection title="Energy Level" step={++stepNum}>
          <div className="grid grid-cols-3 gap-2">
            {fatigueOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFatigue(opt.value)}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 py-3 text-sm font-medium transition-all ${
                  fatigue === opt.value
                    ? "border-primary bg-primary/10 font-semibold shadow-[0_0_10px_rgba(147,51,234,0.15)]"
                    : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-xs">{opt.label}</span>
              </button>
            ))}
          </div>
        </FormSection>
      )}

      {/* Injuries & Equipment - only for climbing */}
      {isClimbing && (
        <div className="grid gap-8 sm:grid-cols-2">
          <FormSection title="Injuries / Restrictions" step={++stepNum} optional>
            <div className="flex flex-wrap gap-2">
              {injuryOptions.map((val) => (
                <button
                  key={val}
                  onClick={() => toggleInjury(val)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm capitalize transition-all ${
                    injuries.includes(val)
                      ? "border-destructive bg-destructive/10 font-semibold text-destructive"
                      : "border-border/50 bg-card/50 hover:border-destructive/30 hover:bg-secondary/50"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection title="Available Equipment" step={++stepNum} optional>
            <div className="flex flex-wrap gap-2">
              {equipmentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleEquipment(opt.value)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm transition-all ${
                    equipment.includes(opt.value)
                      ? "border-primary bg-primary/10 font-semibold shadow-[0_0_10px_rgba(147,51,234,0.15)]"
                      : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FormSection>
        </div>
      )}

      {/* Generate */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="glow-button w-full rounded-xl py-4 font-heading text-base font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Generating…" : "Generate Session →"}
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
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-primary to-accent font-heading text-[10px] font-bold text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]">
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
