import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
import templateService from "../services/templateService.js";
import DashboardWorkoutTemplates from "../components/dashboard/DashboardWorkoutTemplates.jsx";
import { todayStr } from "../utils/workoutUtils.js";

const LAST_WORKOUT_KEY = "fitsync:lastWorkout";
const LAST_CATEGORY_KEY = "fitsync_last_log";
const DEFAULT_DURATION = 30;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function useMergedCategories(apiCategories = []) {
  return useMemo(() => {
    if (!apiCategories.length) return WORKOUT_MAP;

    return apiCategories.map((apiCat) => {
      const coreMatch = WORKOUT_MAP.find(
        (c) => c.slug === apiCat.slug || normalize(c.name) === normalize(apiCat.name)
      );

      if (coreMatch) {
        return {
          ...coreMatch,
          id: apiCat.id,
          name: apiCat.name,
          description: apiCat.description,
          slug: apiCat.slug || coreMatch.slug,
          isCustom: apiCat.isCustom,
          subtypes: coreMatch.subtypes.map((s) => ({ ...s, categoryId: apiCat.id }))
        };
      }

      const defaultSlug = apiCat.slug || normalize(apiCat.name).replace(/\s+/g, "-");
      return {
        ...apiCat,
        slug: defaultSlug,
        icon: "🔥",
        subtypes: [
          {
            name: apiCat.name,
            slug: defaultSlug,
            categoryId: apiCat.id
          }
        ]
      };
    });
  }, [apiCategories]);
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
  const { user, categories: apiCategories = [], loading, error, refreshAll, push } = useOutletContext();
  const finalCategories = useMergedCategories(apiCategories);
  const [category, setCategory] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [templates, setTemplates] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState({ date: todayStr(), distance: "", intensity: "med", notes: "", sets: "", reps: "", weight: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [lastWorkout, setLastWorkout] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [savedTotals, setSavedTotals] = useState(null);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current || !finalCategories.length) return;
    isInitialized.current = true;

    const saved = getStored(LAST_CATEGORY_KEY);
    const savedCategory = finalCategories.find((item) => item.slug === saved?.categorySlug) || finalCategories[0];
    const savedSubtype = savedCategory?.subtypes?.find((item) => item.slug === saved?.subtypeSlug) || savedCategory?.subtypes?.[0];
    
    setCategory(savedCategory);
    setSubtype(savedSubtype);
    if (savedSubtype) {
      setWorkoutTitle(savedSubtype.name);
    }
    setDuration(Number(saved?.duration || DEFAULT_DURATION));
    setLastWorkout(getStored(LAST_WORKOUT_KEY));
  }, [finalCategories]);

  useEffect(() => {
    let isMounted = true;
    async function loadTemplates() {
      try {
        const data = await templateService.getActiveTemplates();
        if (isMounted) {
          setTemplates(data || []);
        }
      } catch (err) {
        console.error("Failed to load active templates:", err);
        if (isMounted) {
          setTemplates([]);
        }
      }
    }
    loadTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoryMeta = useMemo(() => findCategoryMeta(finalCategories, category, subtype), [finalCategories, category, subtype]);
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
    const nextSubtype = nextCategory.subtypes[0];
    setSubtype(nextSubtype);
    if (nextSubtype) {
      setWorkoutTitle(nextSubtype.name);
    }
    store(LAST_CATEGORY_KEY, { categorySlug: nextCategory.slug, subtypeSlug: nextSubtype?.slug, duration });
  }, [duration]);

  const handleSubtypeSelect = useCallback((nextSubtype) => {
    setSavedTotals(null);
    setSubtype(nextSubtype);
    if (nextSubtype) {
      setWorkoutTitle(nextSubtype.name);
    }
    store(LAST_CATEGORY_KEY, { categorySlug: category?.slug, subtypeSlug: nextSubtype.slug, duration });
  }, [category?.slug, duration]);

  const handleRepeat = useCallback((workout) => {
    const nextCategory = finalCategories.find((item) => item.slug === workout.categorySlug) || finalCategories[0];
    const nextSubtype = nextCategory?.subtypes?.find((item) => item.slug === workout.subtypeSlug) || nextCategory?.subtypes?.[0];
    setSavedTotals(null);
    setCategory(nextCategory);
    setSubtype(nextSubtype);
    setWorkoutTitle(workout.title || nextSubtype?.name || "");
    setDuration(Number(workout.duration || DEFAULT_DURATION));
    setDetails((current) => ({ ...current, distance: workout.distance || "", intensity: workout.intensity || "med", sets: workout.sets || "", reps: workout.reps || "", weight: workout.weight || "" }));
    setAnnouncement(`Ready to repeat ${nextSubtype?.name || "workout"}.`);
  }, [finalCategories]);

  const handleCustomDuration = useCallback((value) => {
    const nextDuration = Math.min(300, Math.max(1, Number(value || 1)));
    setDuration(nextDuration);
    setSavedTotals(null);
    store(LAST_CATEGORY_KEY, { categorySlug: category?.slug, subtypeSlug: subtype?.slug, duration: nextDuration });
  }, [category?.slug, subtype?.slug]);

  const handleSelectTemplate = useCallback((template) => {
    const catId = template.categoryId || template.exercises?.[0]?.categoryId;
    const catName = template.categoryName || template.exercises?.[0]?.categoryName;
    const targetCategory = finalCategories.find((c) =>
      (catId && c.id === catId) ||
      (catName && normalize(c.name) === normalize(catName)) ||
      (catName && normalize(c.slug) === normalize(catName))
    ) || finalCategories[0];

    const subtypeName = template.subtype || template.exercises?.[0]?.exerciseName || "";
    let targetSubtype = targetCategory?.subtypes?.find((s) =>
      normalize(s.slug) === normalize(subtypeName) ||
      normalize(s.name) === normalize(subtypeName)
    );

    if (!targetSubtype && subtypeName) {
      targetSubtype = {
        name: subtypeName,
        slug: normalize(subtypeName).replace(/\s+/g, "-"),
        categoryId: targetCategory.id
      };
    } else if (!targetSubtype) {
      targetSubtype = targetCategory?.subtypes?.[0];
    }

    setSavedTotals(null);
    setCategory(targetCategory);
    setSubtype(targetSubtype);

    const templateDuration = template.durationMin || template.exercises?.[0]?.duration;
    if (templateDuration) {
      setDuration(Number(templateDuration));
    }

    setWorkoutTitle(template.title || subtypeName || "");

    const firstEx = template.exercises?.[0];
    const firstSet = firstEx?.sets?.[0];
    const templateDesc = template.description || template.desc || "";

    setDetails((current) => ({
      ...current,
      distance: template.distance || firstEx?.distance || "",
      intensity: template.intensity || firstEx?.intensity || "med",
      notes: templateDesc || firstEx?.notes || "",
      sets: firstEx && firstEx.sets ? String(firstEx.sets.length) : "",
      reps: firstSet ? String(firstSet.reps || "") : "",
      weight: firstSet ? String(firstSet.weight || "") : ""
    }));

    const hasDetails = template.distance || firstEx?.distance || templateDesc || (firstEx && firstEx.sets);
    if (hasDetails) {
      setShowDetails(true);
    }

    setAnnouncement(`Prefilled form with template: ${template.title}.`);
  }, [finalCategories]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!category || !subtype || submitting) return;

    const meta = findCategoryMeta(finalCategories, category, subtype);
    const categorySlug = meta?.slug || category.slug;
    const categoryId = meta?.id || subtype.categoryId || category.id;
    const title = workoutTitle.trim() || subtype.name;
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
      const data = result || {};
      const xp = data.xp_earned ?? data.xpEarned ?? data.xp;
      const calories = data.calories ?? data.caloriesTotal ?? data.calories_total ?? data.caloriesBurned;
      setSavedTotals({ xp, calories });
      const storedWorkout = {
        title,
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
      push(`Nice! You earned +${xp} XP • ${calories} cal`, "success");
      setAnnouncement(`Workout logged. Backend awarded ${xp} XP and ${calories} calories.`);
      await refreshAll();
    } catch (err) {
      setFormError(err.message || "Could not log workout.");
      setAnnouncement("Workout was not logged. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [finalCategories, category, details, duration, isCardio, isStrength, preview.xp, push, refreshAll, submitting, subtype, workoutTitle]);

  if (loading) return <LoadingSpinner label="Loading workout logger" />;

  if (error) {
    return <PageError message={error} onRetry={refreshAll} />;
  }

  if (!category || !subtype) {
    return <EmptyState icon={Dumbbell} title="Workout map unavailable" description="Refresh to load quick logging." />;
  }

  return (
    <main className="space-y-6 text-text animate-fade-in">
      <PageHeader
        eyebrow="Quick log"
        title="Log a workout in 3 taps"
        description="Choose a category, choose a subtype, and submit. Preview values are estimates; saved values always come from the backend."
      />

      <div className="sr-only" aria-live="polite">{announcement}</div>
      {formError && <InlineError message={formError} />}

      <RepeatLast workout={lastWorkout} onRepeat={handleRepeat} />

      {templates.length > 0 && (
        <div className="mb-6">
          <DashboardWorkoutTemplates templates={templates} onSelectTemplate={handleSelectTemplate} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <QuickLogGrid categories={finalCategories} selectedSlug={category.slug} onSelect={handleCategorySelect} />
        <SubtypePicker category={category} selectedSubtype={subtype} onSelect={handleSubtypeSelect} />

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/10">
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted" htmlFor="workout-title">
              Workout Title
            </label>
            <input
              id="workout-title"
              type="text"
              required
              placeholder="e.g. Upper Body Push, Running"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

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
