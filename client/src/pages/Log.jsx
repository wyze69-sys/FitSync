import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import PageHeader from "../components/common/PageHeader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import QuickLogGrid from "../components/workout/QuickLogGrid.jsx";
import SubtypePicker from "../components/workout/SubtypePicker.jsx";
import RepeatLast from "../components/workout/RepeatLast.jsx";
import { WORKOUT_MAP } from "../utils/constants.js";
import { estimateCalories, estimateXP, getProfileWeight } from "../utils/previewCalculator.js";
import workoutService from "../services/workoutService.js";
import { todayStr } from "../utils/workoutUtils.js";

const LAST_WORKOUT_KEY = "fitsync:lastWorkout";
const LAST_CATEGORY_KEY = "fitsync_last_log";
const DEFAULT_DURATION = 30;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function findCategoryMeta(apiCategories, category, subtype) {
  const subtypeSlug = normalize(subtype?.slug);
  const subtypeName = normalize(subtype?.name);
  const categorySlug = normalize(category?.slug);
  const categoryName = normalize(category?.name);
  return (
    apiCategories.find((item) => normalize(item.slug) === subtypeSlug || normalize(item.name) === subtypeName) ||
    apiCategories.find((item) => normalize(item.slug) === categorySlug || normalize(item.name) === categoryName) ||
    null
  );
}

function getStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (err) {
    return null;
  }
}

function store(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function realNumber(result, names) {
  for (const name of names) {
    if (result?.[name] !== undefined && result?.[name] !== null) return Number(result[name]);
  }
  return 0;
}

export default function Log() {
  const { user, categories = [], loading, error, refreshAll, push } = useOutletContext();
  const [category, setCategory] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState({ date: todayStr(), distance: "", intensity: "med", notes: "", sets: "", reps: "", weight: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [lastWorkout, setLastWorkout] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [savedTotals, setSavedTotals] = useState(null);

  useEffect(() => {
    const saved = getStored(LAST_CATEGORY_KEY);
    const savedCategory = WORKOUT_MAP.find((item) => item.slug === saved?.categorySlug) || WORKOUT_MAP[0];
    const savedSubtype = savedCategory.subtypes.find((item) => item.slug === saved?.subtypeSlug) || savedCategory.subtypes[0];
    setCategory(savedCategory);
    setSubtype(savedSubtype);
    setDuration(Number(saved?.duration || DEFAULT_DURATION));
    setLastWorkout(getStored(LAST_WORKOUT_KEY));
  }, []);

  const categoryMeta = useMemo(() => findCategoryMeta(categories, category, subtype), [categories, category, subtype]);
  const subtypeForPreview = useMemo(() => ({
    ...subtype,
    categorySlug: categoryMeta?.slug || category?.slug,
    categoryName: categoryMeta?.name || category?.name
  }), [category, categoryMeta, subtype]);
  const isCardio = normalize(category?.slug).includes("cardio") || normalize(category?.name).includes("cardio");
  const isStrength = normalize(category?.slug).includes("strength") || normalize(category?.name).includes("strength");

  const preview = useMemo(() => {
    const weightKg = getProfileWeight(user);
    const distance = isCardio ? Number(details.distance || 0) : 0;
    return {
      calories: estimateCalories(subtypeForPreview, duration, weightKg, distance),
      xp: estimateXP(subtypeForPreview, duration, weightKg, distance)
    };
  }, [details.distance, duration, isCardio, subtypeForPreview, user]);

  const handleCategorySelect = useCallback((nextCategory) => {
    setSavedTotals(null);
    setCategory(nextCategory);
    setSubtype(nextCategory.subtypes[0]);
    store(LAST_CATEGORY_KEY, { categorySlug: nextCategory.slug, subtypeSlug: nextCategory.subtypes[0]?.slug, duration });
  }, [duration]);

  const handleSubtypeSelect = useCallback((nextSubtype) => {
    setSavedTotals(null);
    setSubtype(nextSubtype);
    store(LAST_CATEGORY_KEY, { categorySlug: category?.slug, subtypeSlug: nextSubtype.slug, duration });
  }, [category?.slug, duration]);

  const handleRepeat = useCallback((workout) => {
    const nextCategory = WORKOUT_MAP.find((item) => item.slug === workout.categorySlug) || WORKOUT_MAP[0];
    const nextSubtype = nextCategory.subtypes.find((item) => item.slug === workout.subtypeSlug) || nextCategory.subtypes[0];
    setSavedTotals(null);
    setCategory(nextCategory);
    setSubtype(nextSubtype);
    setDuration(Number(workout.duration || DEFAULT_DURATION));
    setDetails((current) => ({ ...current, distance: workout.distance || "", intensity: workout.intensity || "med", sets: workout.sets || "", reps: workout.reps || "", weight: workout.weight || "" }));
    setAnnouncement(`Ready to repeat ${nextSubtype.name}.`);
  }, []);

  const handleCustomDuration = useCallback((value) => {
    const nextDuration = Math.min(300, Math.max(1, Number(value || 1)));
    setDuration(nextDuration);
    setSavedTotals(null);
    store(LAST_CATEGORY_KEY, { categorySlug: category?.slug, subtypeSlug: subtype?.slug, duration: nextDuration });
  }, [category?.slug, subtype?.slug]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!category || !subtype || submitting) return;

    const meta = findCategoryMeta(categories, category, subtype);
    const categorySlug = meta?.slug || category.slug;
    const categoryId = meta?.id || subtype.categoryId || category.id;
    const title = `${subtype.name} ${category.name}`;
    const payload = {
      date: details.date || todayStr(),
      title,
      category: categorySlug,
      categorySlug,
      duration_min: Number(duration || DEFAULT_DURATION),
      distance_km: isCardio && details.distance ? Number(details.distance) : undefined,
      intensity: details.intensity,
      notes: details.notes || undefined,
      exercises: [
        {
          categoryId,
          categoryName: meta?.name || category.name,
          exerciseName: subtype.name,
          duration: Number(duration || DEFAULT_DURATION),
          categorySlug,
          sets: isStrength && details.sets ? [{ reps: Number(details.reps || 0), weight: Number(details.weight || 0) }] : undefined
        }
      ]
    };

    setSubmitting(true);
    setFormError("");
    setAnnouncement(`Logging ${subtype.name}. Preview was ${preview.xp} XP.`);

    try {
      const result = await workoutService.log(payload);
      const realXp = realNumber(result, ["xp_earned", "xp", "xpEarned"]);
      const realCalories = realNumber(result, ["calories", "caloriesTotal", "calories_total", "caloriesBurned"]);
      setSavedTotals({ xp: realXp, calories: realCalories });
      const storedWorkout = {
        categorySlug: category.slug,
        categoryName: category.name,
        subtypeSlug: subtype.slug,
        subtypeName: subtype.name,
        duration,
        distance: details.distance,
        intensity: details.intensity,
        sets: details.sets,
        reps: details.reps,
        weight: details.weight
      };
      store(LAST_WORKOUT_KEY, storedWorkout);
      store(LAST_CATEGORY_KEY, storedWorkout);
      setLastWorkout(storedWorkout);
      push(`Nice! You earned +${realXp} XP • ${realCalories} cal`, "success");
      setAnnouncement(`Workout logged. Backend awarded ${realXp} XP and ${realCalories} calories.`);
      await refreshAll();
    } catch (err) {
      setFormError(err.message || "Could not log workout.");
      setAnnouncement("Workout was not logged. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [categories, category, details, duration, isCardio, isStrength, preview.xp, push, refreshAll, submitting, subtype]);

  if (loading) return <LoadingSpinner label="Loading workout logger" />;

  if (error) {
    return <PageError message={error} onRetry={refreshAll} />;
  }

  if (!category || !subtype) {
    return <EmptyState icon={Dumbbell} title="Workout map unavailable" description="Refresh to load quick logging." />;
  }

  return (
    <main className="space-y-6 text-text">
      <PageHeader
        eyebrow="Quick log"
        title="Log a workout in 3 taps"
        description="Choose a category, choose a subtype, and submit. Preview values are estimates; saved values always come from the backend."
      />

      <div className="sr-only" aria-live="polite">{announcement}</div>
      {formError && <InlineError message={formError} />}

      <RepeatLast workout={lastWorkout} onRepeat={handleRepeat} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <QuickLogGrid selectedSlug={category.slug} onSelect={handleCategorySelect} />
        <SubtypePicker category={category} selectedSubtype={subtype} onSelect={handleSubtypeSelect} />

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Duration</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Workout duration">
                {[15, 30, 45, 60].map((minutes) => (
                  <button
                    type="button"
                    key={minutes}
                    onClick={() => {
                      setDuration(minutes);
                      setSavedTotals(null);
                      store(LAST_CATEGORY_KEY, { categorySlug: category.slug, subtypeSlug: subtype.slug, duration: minutes });
                    }}
                    aria-pressed={duration === minutes}
                    className={`min-h-[44px] min-w-[44px] rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${duration === minutes ? "bg-primary text-white" : "bg-bg text-text"}`}
                  >
                    {minutes}m
                  </button>
                ))}
                <label className="sr-only" htmlFor="custom-duration">Custom duration</label>
                <input
                  id="custom-duration"
                  type="number"
                  min="1"
                  max="300"
                  placeholder="Custom"
                  value={[15, 30, 45, 60].includes(Number(duration)) ? "" : duration}
                  onChange={(event) => handleCustomDuration(event.target.value)}
                  className="min-h-[44px] w-28 rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-bg p-3 text-sm">
              {savedTotals ? (
                <p className="font-bold text-primary">Saved XP: {savedTotals.xp} / Calories: {savedTotals.calories}</p>
              ) : (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Estimate before submit</p>
                  <p className="mt-1 font-bold text-text">Estimated XP: {preview.xp} / Calories: {preview.calories}</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="mt-4 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={showDetails}
          >
            Add details
          </button>

          {showDetails && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-text">
                Date
                <input type="date" value={details.date} onChange={(e) => setDetails((current) => ({ ...current, date: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </label>
              {isCardio && (
                <label className="text-sm text-text">
                  Distance (km, optional)
                  <input type="number" min="0" step="0.1" inputMode="decimal" value={details.distance} onChange={(e) => { setSavedTotals(null); setDetails((current) => ({ ...current, distance: e.target.value })); }} className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary" />
                </label>
              )}
              <label className="text-sm text-text">
                Intensity
                <select value={details.intensity} onChange={(e) => setDetails((current) => ({ ...current, intensity: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              {isStrength && (
                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
                  <label className="text-sm text-text">
                    Sets
                    <input type="number" min="1" max="20" value={details.sets} onChange={(e) => setDetails((current) => ({ ...current, sets: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary" />
                  </label>
                  <label className="text-sm text-text">
                    Reps
                    <input type="number" min="1" max="100" value={details.reps} onChange={(e) => setDetails((current) => ({ ...current, reps: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary" />
                  </label>
                  <label className="text-sm text-text">
                    Weight (kg)
                    <input type="number" min="0" step="0.5" value={details.weight} onChange={(e) => setDetails((current) => ({ ...current, weight: e.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary" />
                  </label>
                </div>
              )}
              <label className="text-sm text-text sm:col-span-2">
                Notes
                <textarea value={details.notes} onChange={(e) => setDetails((current) => ({ ...current, notes: e.target.value }))} rows="3" className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary" />
              </label>
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging…" : `Log ${subtype.name}`}
        </button>
      </form>
    </main>
  );
}

function InlineError({ message }) {
  return <section role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">{message}</section>;
}

function PageError({ message, onRetry }) {
  return (
    <main className="space-y-4 text-text">
      <InlineError message={message} />
      <button type="button" onClick={onRetry} className="rounded-2xl border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        Retry
      </button>
    </main>
  );
}
