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
import activityService from "../services/activityService.js";
import FoodRecommendations from "../components/nutrition/FoodRecommendations.jsx";
import { todayStr } from "../utils/workoutUtils.js";

const LAST_WORKOUT_KEY = "fitsync:lastWorkout";
const LAST_CATEGORY_KEY = "fitsync_last_log";
const DEFAULT_DURATION = 30;
const CATEGORY_ORDER = ["cardio", "strength", "hiit", "yoga", "mobility", "sports"];
const CATEGORY_ICONS = { cardio: "🏃", strength: "💪", hiit: "⚡", yoga: "🧘", mobility: "🌿", sports: "🏀" };

// Sensible starting duration per category. Strength defaults low (quick log)
// because full-hour resistance sessions overstate effort; HIIT is short by
// nature. Users can still pick any duration, including custom or 60m.
const CATEGORY_DEFAULT_DURATION = { strength: 30, hiit: 20, yoga: 30, mobility: 30, cardio: 30, sports: 30 };

function defaultDurationForCategory(slug) {
  const key = String(slug || "").trim().toLowerCase();
  return CATEGORY_DEFAULT_DURATION[key] || DEFAULT_DURATION;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Builds quick-log categories from the backend activity library. Each activity
 * becomes a selectable subtype carrying its calorie/XP metadata so the form can
 * render the right input fields. Returns null when no activities are available
 * (the caller then falls back to the legacy hardcoded map).
 */
function buildActivityCategories(apiCategories, grouped) {
  if (!Array.isArray(grouped) || grouped.length === 0) return null;

  const ordered = [...grouped].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a.categorySlug);
    const ib = CATEGORY_ORDER.indexOf(b.categorySlug);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return ordered.map((group) => {
    const core = WORKOUT_MAP.find((c) => c.slug === group.categorySlug);
    const apiCat = apiCategories.find(
      (c) => normalize(c.slug) === group.categorySlug || normalize(c.name) === group.categorySlug
    );
    const categoryId = apiCat?.id || core?.id || `cat_${group.categorySlug}`;
    const categoryName = apiCat?.name || core?.name || group.categorySlug;

    return {
      id: categoryId,
      slug: group.categorySlug,
      name: categoryName,
      description: apiCat?.description || core?.description || "",
      icon: CATEGORY_ICONS[group.categorySlug] || core?.icon || "🔥",
      subtypes: group.activities.map((activity) => ({
        name: activity.name,
        slug: activity.slug,
        categoryId,
        categorySlug: group.categorySlug,
        categoryName,
        activitySlug: activity.slug,
        baseMet: activity.baseMet,
        calorieMethod: activity.calorieMethod,
        intensityLevel: activity.intensityLevel,
        equipment: activity.equipment || "",
        primaryMuscles: activity.primaryMuscles || "",
        trackingFields: Array.isArray(activity.trackingFields) ? activity.trackingFields : ["duration"]
      }))
    };
  });
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

/**
 * Returns which extra detail fields an activity requires, derived from its
 * trackingFields. Used to auto-expand the details panel and prefill defaults.
 */
function activityFieldNeeds(subtype) {
  const tf = Array.isArray(subtype?.trackingFields) ? subtype.trackingFields : [];
  const strength = tf.includes("sets") || tf.includes("weight");
  return {
    strength,
    hold: tf.includes("holdTime"),
    repsOnly: tf.includes("reps") && !strength,
    distance: tf.includes("distance")
  };
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

function getStored(key) {  try {
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
  const [groupedActivities, setGroupedActivities] = useState([]);
  const mergedFallback = useMergedCategories(apiCategories);
  const activityCategories = useMemo(
    () => buildActivityCategories(apiCategories, groupedActivities),
    [apiCategories, groupedActivities]
  );
  const finalCategories = activityCategories || mergedFallback;
  const [category, setCategory] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [workoutTitle, _setWorkoutTitle] = useState("");
  const [debouncedWorkoutTitle, setDebouncedWorkoutTitle] = useState("");

  const setWorkoutTitle = useCallback((val) => {
    _setWorkoutTitle(val);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedWorkoutTitle(workoutTitle);
    }, 500);
    return () => clearTimeout(handler);
  }, [workoutTitle]);

  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState({ date: todayStr(), distance: "", intensity: "med", notes: "", sets: "", reps: "", weight: "", holdTime: "" });
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
    // Respect a previously saved duration; otherwise start from the category
    // default (e.g. 30m for strength) rather than a one-size-fits-all value.
    setDuration(Number(saved?.duration || defaultDurationForCategory(savedCategory?.slug)));
    setLastWorkout(getStored(LAST_WORKOUT_KEY));
  }, [finalCategories]);



  useEffect(() => {
    let isMounted = true;
    async function loadActivities() {
      try {
        const data = await activityService.getGroupedActivities();
        if (isMounted) setGroupedActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load activity library:", err);
        if (isMounted) setGroupedActivities([]);
      }
    }
    loadActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  // When the backend activity library arrives after the initial render, remap
  // the current category/subtype selection onto the activity-backed objects so
  // the selected subtype carries its calorie/XP metadata (trackingFields, etc.).
  useEffect(() => {
    if (!activityCategories || !category || subtype?.activitySlug) return;
    const match = activityCategories.find((c) => c.slug === category.slug) || activityCategories[0];
    if (!match) return;
    const nextSubtype = match.subtypes.find((s) => s.slug === subtype?.slug) || match.subtypes[0];
    setCategory(match);
    setSubtype(nextSubtype);
    if (nextSubtype) setWorkoutTitle((current) => current || nextSubtype.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityCategories]);

  const categoryMeta = useMemo(() => findCategoryMeta(finalCategories, category, subtype), [finalCategories, category, subtype]);
  const subtypeForPreview = useMemo(() => ({
    ...subtype,
    categorySlug: categoryMeta?.slug || category?.slug,
    categoryName: categoryMeta?.name || category?.name
  }), [category, categoryMeta, subtype]);
  const isCardio = normalize(category?.slug).includes("cardio") || normalize(category?.name).includes("cardio");
  const isStrength = normalize(category?.slug).includes("strength") || normalize(category?.name).includes("strength");

  // Activity-driven field visibility. When the selected subtype comes from the
  // backend activity library it carries trackingFields; otherwise we fall back
  // to the legacy category heuristics so old data keeps logging.
  const trackingFields = Array.isArray(subtype?.trackingFields) ? subtype.trackingFields : null;
  const hasActivityMeta = Boolean(trackingFields && subtype?.activitySlug);
  const showDistance = hasActivityMeta ? trackingFields.includes("distance") : isCardio;
  const showStrength = hasActivityMeta
    ? trackingFields.includes("sets") || trackingFields.includes("weight")
    : isStrength;
  const showRepsOnly = hasActivityMeta && trackingFields.includes("reps") && !showStrength;
  const showHold = hasActivityMeta && trackingFields.includes("holdTime");

  const preview = useMemo(() => {
    const weightKg = getProfileWeight(user);
    const distance = showDistance ? Number(details.distance || 0) : 0;
    return {
      calories: estimateCalories(subtypeForPreview, duration, weightKg, distance, details.intensity),
      xp: estimateXP(subtypeForPreview, duration, weightKg, distance, details.intensity)
    };
  }, [details.distance, duration, showDistance, subtypeForPreview, user, details.intensity]);

  const derivedPaceAndSpeed = useMemo(() => {
    const mins = Number(duration || 0);
    const dist = Number(details.distance || 0);
    if (mins <= 0 || dist <= 0) return null;
    const speedKmh = dist / (mins / 60);
    const paceMinKm = mins / dist;
    const paceMins = Math.floor(paceMinKm);
    const paceSecs = Math.round((paceMinKm - paceMins) * 60);
    return {
      speed: speedKmh.toFixed(1),
      pace: `${paceMins}:${paceSecs < 10 ? "0" : ""}${paceSecs}`
    };
  }, [duration, details.distance]);

  const isFormValid = useMemo(() => {
    if (!workoutTitle.trim()) return false;
    if (Number(duration) <= 0) return false;
    if (showDistance) {
      if (subtype?.calorieMethod === "distance_multiplier" && Number(details.distance) <= 0) return false;
    }
    if (showStrength) {
      if (Number(details.sets) <= 0 || Number(details.reps) <= 0) return false;
    }
    if (showRepsOnly && Number(details.reps) <= 0) return false;
    if (showHold && Number(details.holdTime) <= 0) return false;
    return true;
  }, [workoutTitle, duration, showDistance, showStrength, showRepsOnly, showHold, details, subtype]);

  const handleCategorySelect = useCallback((nextCategory) => {
    setSavedTotals(null);
    setCategory(nextCategory);
    const nextSubtype = nextCategory.subtypes[0];
    setSubtype(nextSubtype);
    if (nextSubtype) {
      setWorkoutTitle(nextSubtype.name);
    }
    // A category change clearly warrants re-defaulting the duration to that
    // category's sensible starting point (strength no longer inherits 60m).
    const nextDuration = defaultDurationForCategory(nextCategory.slug);
    setDuration(nextDuration);
    store(LAST_CATEGORY_KEY, { categorySlug: nextCategory.slug, subtypeSlug: nextSubtype?.slug, duration: nextDuration });
  }, []);

  const handleSubtypeSelect = useCallback((nextSubtype) => {
    setSavedTotals(null);
    setSubtype(nextSubtype);
    if (nextSubtype) {
      setWorkoutTitle(nextSubtype.name);
    }
    const needs = activityFieldNeeds(nextSubtype);
    if (needs.strength || needs.hold || needs.repsOnly) {
      setShowDetails(true);
      setDetails((current) => ({
        ...current,
        sets: needs.strength && !current.sets ? "3" : current.sets,
        reps: (needs.strength || needs.repsOnly) && !current.reps ? "10" : current.reps,
        weight: needs.strength && !current.weight ? "20" : current.weight,
        holdTime: needs.hold && !current.holdTime ? "60" : current.holdTime
      }));
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



  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!category || !subtype || submitting) return;

    const meta = findCategoryMeta(finalCategories, category, subtype);
    const categorySlug = meta?.slug || category.slug;
    const categoryId = meta?.id || subtype.categoryId || category.id;
    const title = workoutTitle.trim() || subtype.name;
    const activitySlug = subtype.activitySlug;
    const setCount = Math.max(1, Number(details.sets) || 1);
    const payload = {
      date: details.date || todayStr(),
      title,
      category: categorySlug,
      categorySlug,
      duration_min: Number(duration || DEFAULT_DURATION),
      intensity: details.intensity,
      notes: details.notes || undefined
    };
    if (activitySlug) payload.activitySlug = activitySlug;
    if (showDistance && details.distance) payload.distance_km = Number(details.distance);
    if (showStrength) {
      if (details.sets) payload.sets = Number(details.sets);
      if (details.reps) payload.reps = Number(details.reps);
      if (details.weight) payload.weight = Number(details.weight);
    }
    if (showRepsOnly && details.reps) payload.reps = Number(details.reps);
    if (showHold && details.holdTime) payload.holdTime = Number(details.holdTime);
    payload.exercises = [
      {
        categoryId,
        categoryName: meta?.name || category.name,
        exerciseName: subtype.name,
        duration: Number(duration || DEFAULT_DURATION),
        categorySlug,
        activitySlug: activitySlug || undefined,
        sets:
          showStrength && details.sets
            ? Array.from({ length: setCount }, () => ({
                reps: Number(details.reps || 0),
                weight: Number(details.weight || 0)
              }))
            : undefined
      }
    ];

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
  }, [finalCategories, category, details, duration, showDistance, showStrength, showRepsOnly, showHold, preview.xp, push, refreshAll, submitting, subtype, workoutTitle]);

  if (loading) return <LoadingSpinner label="Loading workout logger" />;

  if (error) {
    return <PageError message={error} onRetry={refreshAll} />;
  }

  if (!category || !subtype) {
    return <EmptyState icon={Dumbbell} title="Workout map unavailable" description="Refresh to load quick logging." />;
  }

  return (
    <main className="log-page-container space-y-4 text-text animate-fade-in max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-2xl bg-surface border border-border p-4 md:p-5 shadow-sm">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
            QUICK LOG
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Log a workout in 3 taps
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Choose a category, pick an activity, add the right details, and submit.
          </p>
        </div>
      </header>

      <div className="sr-only" aria-live="polite">{announcement}</div>
      {formError && <InlineError message={formError} />}

      <RepeatLast workout={lastWorkout} onRepeat={handleRepeat} />



      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs font-mono">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-text tracking-tight">Choose category</h2>
              <p className="text-xs text-secondary">Select a fitness category for your workout</p>
            </div>
          </div>
          <QuickLogGrid categories={finalCategories} selectedSlug={category.slug} onSelect={handleCategorySelect} />
        </div>

        <SubtypePicker category={category} selectedSubtype={subtype} workoutTitle={debouncedWorkoutTitle} onSelect={handleSubtypeSelect} />

        <section className="rounded-2xl border border-border bg-surface p-4 md:p-5 shadow-sm">
          {/* Header block with metadata and estimate card */}
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs font-mono">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-text tracking-tight">
                  Configure <span className="text-primary">{debouncedWorkoutTitle || subtype?.name || category?.name}</span>
                </h2>
                <p className="text-xs text-secondary">
                  Category: <span className="font-semibold text-text capitalize">{category?.name}</span> • Add details to estimate calories and XP.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg/50 px-3.5 py-2.5 md:text-right shrink-0">
              {savedTotals ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Saved Result</p>
                  <p className="mt-0.5 text-sm font-bold text-primary">+{savedTotals.xp} XP • {savedTotals.calories} kcal</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">Estimate before submit</p>
                  <p className="mt-0.5 text-sm font-bold text-text">+{preview.xp} XP • {preview.calories} kcal</p>
                  <p className="text-[9px] text-muted font-medium">Based on duration, intensity, and selected activity.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Core Info */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-secondary" htmlFor="workout-title">
                  Workout Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="workout-title"
                  type="text"
                  required
                  placeholder="e.g. Upper Body Push, Running"
                  value={workoutTitle}
                  onChange={(e) => _setWorkoutTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2.5" role="group" aria-label="Workout duration">
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
                      className={`min-h-[34px] min-w-[34px] rounded-full px-3 py-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-all duration-150 ${
                        duration === minutes 
                          ? "bg-primary text-primary-contrast shadow-sm shadow-primary/20 scale-[1.02]" 
                          : "bg-bg text-secondary hover:bg-bg/85"
                      }`}
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
                    className="min-h-[34px] w-20 rounded-full border border-border bg-bg px-3 py-1 text-xs font-bold text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Date
                  </label>
                  <input 
                    type="date" 
                    value={details.date} 
                    onChange={(e) => setDetails((current) => ({ ...current, date: e.target.value }))} 
                    className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Intensity <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={details.intensity} 
                    onChange={(e) => setDetails((current) => ({ ...current, intensity: e.target.value }))} 
                    className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="med">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column - Metrics & Notes */}
            <div className="space-y-4">
              {/* Dynamic metrics block */}
              {(showDistance || showStrength || showRepsOnly || showHold) && (
                <div className="rounded-xl bg-bg/40 border border-border p-3.5 space-y-3">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">
                    Performance Metrics
                  </p>
                  
                  {showDistance && (
                    <div>
                      <label className="text-xs font-semibold text-secondary">
                        Distance (km{subtype?.calorieMethod === "distance_multiplier" ? " *" : ""})
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        inputMode="decimal" 
                        value={details.distance} 
                        onChange={(e) => { setSavedTotals(null); setDetails((current) => ({ ...current, distance: e.target.value })); }} 
                        className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                      />
                      {derivedPaceAndSpeed && (
                        <p className="mt-1.5 text-xs text-primary font-semibold">
                          Derived Speed: {derivedPaceAndSpeed.speed} km/h • Derived Pace: {derivedPaceAndSpeed.pace} /km
                        </p>
                      )}
                    </div>
                  )}

                  {showStrength && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-secondary">
                          Sets <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={details.sets} 
                          onChange={(e) => { setSavedTotals(null); setDetails((current) => ({ ...current, sets: e.target.value })); }} 
                          className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-secondary">
                          Reps <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="number" 
                          min="1" 
                          max="100" 
                          value={details.reps} 
                          onChange={(e) => { setSavedTotals(null); setDetails((current) => ({ ...current, reps: e.target.value })); }} 
                          className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-secondary">
                          Weight (kg)
                        </label>
                        <input 
                          type="number" 
                          min="0" 
                          step="0.5" 
                          value={details.weight} 
                          onChange={(e) => { setSavedTotals(null); setDetails((current) => ({ ...current, weight: e.target.value })); }} 
                          className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                        />
                      </div>
                    </div>
                  )}

                  {showRepsOnly && (
                    <div>
                      <label className="text-xs font-semibold text-secondary">
                        Reps <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        max="500" 
                        value={details.reps} 
                        onChange={(e) => { setSavedTotals(null); setDetails((current) => ({ ...current, reps: e.target.value })); }} 
                        className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                      />
                    </div>
                  )}

                  {showHold && (
                    <div>
                      <label className="text-xs font-semibold text-secondary">
                        Hold time (seconds) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        max="3600" 
                        value={details.holdTime} 
                        onChange={(e) => { setSavedTotals(null); setDetails((current) => ({ ...current, holdTime: e.target.value })); }} 
                        className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-secondary" htmlFor="workout-notes">
                  Notes
                </label>
                <textarea 
                  id="workout-notes"
                  value={details.notes} 
                  onChange={(e) => setDetails((current) => ({ ...current, notes: e.target.value }))} 
                  rows="2" 
                  placeholder="Optional details about the session"
                  className="mt-2 w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                />
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting || !isFormValid}
          className="w-full rounded-xl bg-primary py-2.5 text-base font-bold text-primary-contrast shadow-sm hover:bg-primary-bright transition duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
        >
          {submitting ? "Logging…" : `Log ${debouncedWorkoutTitle || subtype?.name || category?.name || "Workout"}`}
        </button>
      </form>

      {savedTotals && (
        <FoodRecommendations
          goal={user?.goal}
          workoutType={subtype?.name || category?.name}
          category={category?.slug || category?.name}
          caloriesBurned={savedTotals?.calories}
          limit={5}
        />
      )}
    </main>
  );
}

function InlineError({ message }) {
  return <section role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">{message}</section>;
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
