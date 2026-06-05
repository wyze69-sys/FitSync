import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Bike, Clock, Dumbbell, Flame, Footprints, HeartPulse, PersonStanding, Waves } from "lucide-react";
import workoutService from "../services/workoutService.js";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import { todayStr } from "../utils/workoutUtils.js";

const CATEGORIES = [
  { slug: "running", name: "Running", icon: PersonStanding, type: "cardio", met: 9.8, xp: 0.18 },
  { slug: "cycling", name: "Cycling", icon: Bike, type: "cardio", met: 7.5, xp: 0.18 },
  { slug: "walking", name: "Walking", icon: Footprints, type: "cardio", met: 3.5, xp: 0.2 },
  { slug: "swimming", name: "Swimming", icon: Waves, type: "cardio", met: 8, xp: 0.18 },
  { slug: "chest", name: "Chest", icon: Dumbbell, type: "strength", met: 6, xp: 0.2 },
  { slug: "back", name: "Back", icon: Dumbbell, type: "strength", met: 6, xp: 0.2 },
  { slug: "legs", name: "Legs", icon: Dumbbell, type: "strength", met: 6.5, xp: 0.2 },
  { slug: "yoga-vinyasa", name: "Yoga Vinyasa", icon: HeartPulse, type: "time", met: 4, xp: 0.25 }
];

function cardioMet(slug, distanceKm, durationMin) {
  const speed = durationMin > 0 ? distanceKm / (durationMin / 60) : 0;
  if (slug === "running") {
    if (speed >= 14) return 12.51;
    if (speed >= 12) return 11;
    if (speed >= 10) return 10;
    if (speed >= 8) return 8.29;
    return 7;
  }
  if (slug === "cycling") {
    if (speed >= 25) return 12;
    if (speed >= 20) return 8;
    if (speed > 15) return 6;
    if (speed >= 10) return 4;
    return 3.5;
  }
  if (slug === "walking") {
    if (speed >= 6.5) return 5;
    if (speed >= 5) return 3.8;
    return 3.5;
  }
  return CATEGORIES.find((category) => category.slug === slug)?.met || 3.5;
}

function previewReward(category, durationMin, distanceKm, weightKg) {
  if (!category || durationMin <= 0) return { xp: 0, calories: 0 };
  const met = category.type === "cardio" && distanceKm > 0
    ? cardioMet(category.slug, distanceKm, durationMin)
    : category.met;
  const xp = distanceKm > 0
    ? Math.floor(distanceKm * met * 0.8)
    : Math.floor(durationMin * met * category.xp);
  const calories = Math.round(met * weightKg * (durationMin / 60));
  return { xp, calories };
}

export default function Log() {
  const { user, refreshAll, push } = useOutletContext();
  const navigate = useNavigate();
  const [selectedSlug, setSelectedSlug] = useState("running");
  const [date, setDate] = useState(todayStr());
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [earnedXp, setEarnedXp] = useState(null);

  const selectedCategory = CATEGORIES.find((category) => category.slug === selectedSlug);
  const weightKg = Number(user?.weight || 70);
  const durationMin = Number(duration || 0);
  const distanceKm = Number(distance || 0);
  const preview = useMemo(
    () => previewReward(selectedCategory, durationMin, distanceKm, weightKg),
    [selectedCategory, durationMin, distanceKm, weightKg]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await workoutService.createWorkout({
        date,
        category: selectedCategory.slug,
        title: selectedCategory.name,
        duration_min: durationMin,
        distance_km: selectedCategory.type === "cardio" ? distanceKm : undefined
      });
      setEarnedXp(result.xp_earned);
      push(`+${result.xp_earned} XP • ${result.calories_burned} kcal logged.`, "milestone");
      await refreshAll();
      setTimeout(() => navigate("/"), 650);
    } catch (err) {
      setError(err.message || "Could not log workout.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = durationMin > 0 && (selectedCategory.type !== "cardio" || distanceKm > 0);

  return (
    <div className="max-w-4xl mx-auto text-left text-text pb-16">
      {earnedXp !== null && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="animate-bounce rounded-full bg-accent px-8 py-5 text-4xl font-black text-black shadow-glow">
            +{earnedXp} XP
          </div>
        </div>
      )}

      <div className="mb-8">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-accent">
          Auto log
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">What did you do?</h1>
        <p className="mt-2 text-sm text-muted">Pick a workout, add time, and FitSync calculates fair XP and calories.</p>
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const active = category.slug === selectedSlug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => {
                  setSelectedSlug(category.slug);
                  if (category.type !== "cardio") setDistance("");
                }}
                className={`min-h-28 rounded-lg border p-4 text-left transition-all ${
                  active ? "border-accent bg-accent/10 shadow-glow" : "border-border bg-surface hover:border-accent/60"
                }`}
              >
                <Icon className="h-7 w-7 text-accent mb-4" aria-hidden="true" />
                <span className="block text-sm font-bold">{category.name}</span>
                <span className="mt-1 block text-[10px] font-mono uppercase tracking-widest text-muted">
                  {category.type === "cardio" ? "distance + time" : "time only"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-sm border border-border bg-bg px-3 py-3 text-sm font-mono text-text outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">Duration (min)</span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="45"
                className="w-full rounded-sm border border-border bg-bg px-3 py-3 text-sm font-mono text-text outline-none focus:border-accent"
              />
            </label>
            {selectedCategory.type === "cardio" && (
              <label className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">Distance (km)</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  inputMode="decimal"
                  value={distance}
                  onChange={(event) => setDistance(event.target.value)}
                  placeholder="5.0"
                  className="w-full rounded-sm border border-border bg-bg px-3 py-3 text-sm font-mono text-text outline-none focus:border-accent"
                />
              </label>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-bg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-accent/10 p-3 text-accent">
                <Flame className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-2xl font-black tabular-nums">≈ {preview.xp} XP • ≈ {preview.calories} kcal</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted">science-based live preview</div>
              </div>
            </div>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="rounded-sm bg-accent px-6 py-3 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Logging..." : "Log workout"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
          Logging is designed to take under 7 seconds: category, duration, done.
        </div>
      </form>
    </div>
  );
}
