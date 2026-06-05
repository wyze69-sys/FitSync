import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import CategoryPicker from "../components/log/CategoryPicker.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import WorkoutForm, { needsDistance } from "../components/log/WorkoutForm.jsx";
import workoutService from "../services/workoutService.js";
import { todayStr } from "../utils/workoutUtils.js";

const DEFAULT_WEIGHT_KG = 70;
const DISTANCE_XP_FACTOR = 0.8;
const INITIAL_FORM = {
  date: todayStr(),
  duration: "",
  distance: "",
  intensity: "med",
  notes: ""
};

/**
 * Handles log-form state transitions.
 * @param {object} state Current form state.
 * @param {object} action Reducer action.
 * @returns {object}
 */
function formReducer(state, action) {
  if (action.type === "field") {
    return { ...state, [action.name]: action.value };
  }
  if (action.type === "reset") {
    return { ...INITIAL_FORM, date: todayStr() };
  }
  if (action.type === "clearDistance") {
    return { ...state, distance: "" };
  }
  return state;
}

/**
 * Returns the MET value used for a client-side preview only.
 * @param {object} category Selected category.
 * @param {number} distanceKm Distance in kilometres.
 * @param {number} durationMin Duration in minutes.
 * @returns {number}
 */
function previewMet(category, distanceKm, durationMin) {
  const baseMet = Number(category?.baseMet || 3.5);
  if (!needsDistance(category?.slug) || distanceKm <= 0) return baseMet;

  const speed = durationMin > 0 ? distanceKm / (durationMin / 60) : 0;
  if (speed >= 14) return 12.51;
  if (speed >= 10) return 10;
  if (speed >= 8) return 8.29;
  return baseMet;
}

/**
 * Calculates a muted local preview; the API remains the source of truth.
 * @param {object} category Selected category.
 * @param {object} form Form state.
 * @param {number} weightKg User weight.
 * @returns {{xp: number, calories: number}}
 */
function previewReward(category, form, weightKg) {
  const durationMin = Number(form.duration || 0);
  const distanceKm = Number(form.distance || 0);
  if (!category || durationMin <= 0) return { xp: 0, calories: 0 };

  const met = previewMet(category, distanceKm, durationMin);
  const xp = distanceKm > 0
    ? Math.floor(distanceKm * met * DISTANCE_XP_FACTOR)
    : Math.floor(durationMin * met * Number(category.xpPerMetMin || 0.2));
  const calories = Math.round(met * weightKg * (durationMin / 60));
  return { xp, calories };
}

/**
 * Loading skeleton for the log page.
 * @returns {JSX.Element}
 */
function LogSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-5" aria-label="Loading log form">
      <div className="h-96 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 lg:col-span-2" />
      <div className="h-96 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 lg:col-span-3" />
    </div>
  );
}

/**
 * Workout logging page with category picker and compact form.
 * @returns {JSX.Element}
 */
export default function Log() {
  const { user, categories = [], loading, error, refreshAll, push } = useOutletContext();
  const navigate = useNavigate();
  const [form, dispatch] = useReducer(formReducer, INITIAL_FORM);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!selectedSlug && categories[0]?.slug) {
      setSelectedSlug(categories[0].slug);
    }
  }, [categories, selectedSlug]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === selectedSlug),
    [categories, selectedSlug]
  );
  const preview = useMemo(
    () => previewReward(selectedCategory, form, Number(user?.weight || DEFAULT_WEIGHT_KG)),
    [selectedCategory, form, user?.weight]
  );
  const canSubmit = Number(form.duration || 0) > 0 && (!needsDistance(selectedSlug) || Number(form.distance || 0) > 0);

  const handleCategorySelect = useCallback((slug) => {
    setSelectedSlug(slug);
    if (!needsDistance(slug)) {
      dispatch({ type: "clearDistance" });
    }
  }, []);

  const handleChange = useCallback((event) => {
    dispatch({ type: "field", name: event.target.name, value: event.target.value });
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!selectedCategory || !canSubmit) return;

    setSubmitting(true);
    setFormError(null);
    setAnnouncement(`Logging ${selectedCategory.name}. Estimated ${preview.xp} XP.`);

    try {
      const result = await workoutService.createWorkout({
        date: form.date,
        title: selectedCategory.name,
        category: selectedCategory.slug,
        duration_min: Number(form.duration),
        distance_km: needsDistance(selectedCategory.slug) ? Number(form.distance) : undefined,
        intensity: form.intensity,
        notes: form.notes || undefined
      });
      setAnnouncement(`Workout logged. ${result.xp_earned || 0} XP added.`);
      push(`+${result.xp_earned || 0} XP logged.`, "milestone");
      await refreshAll();
      dispatch({ type: "reset" });
      navigate("/");
    } catch (err) {
      setFormError(err.message || "Could not log workout.");
      setAnnouncement("Workout was not logged. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, form, navigate, preview.xp, push, refreshAll, selectedCategory]);

  if (loading) return <LogSkeleton />;

  if (error) {
    return <PageError message={error} onRetry={refreshAll} />;
  }

  return (
    <main className="space-y-6 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div>
        <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Log</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">Choose a category and add the details you actually tracked.</p>
      </div>

      <div aria-live="polite" className="sr-only">{announcement}</div>

      {formError && <InlineError message={formError} />}

      {categories.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CategoryPicker categories={categories} selectedSlug={selectedSlug} onSelect={handleCategorySelect} />
          </div>
          <div className="lg:col-span-3">
            <WorkoutForm
              form={form}
              selectedCategory={selectedCategory}
              preview={preview}
              canSubmit={canSubmit}
              submitting={submitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : (
        <EmptyState icon={Dumbbell} title="No categories available" description="Refresh to load the workout catalog." />
      )}
    </main>
  );
}

/**
 * Neutral inline error for form submissions.
 * @param {{message: string}} props Component props.
 * @returns {JSX.Element}
 */
function InlineError({ message }) {
  return (
    <section role="alert" className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      {message}
    </section>
  );
}

/**
 * Page-level load error with retry action.
 * @param {{message: string, onRetry: Function}} props Component props.
 * @returns {JSX.Element}
 */
function PageError({ message, onRetry }) {
  return (
    <main className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <section role="alert" className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm">{message}</p>
        <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-zinc-900 px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-100 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950">
          Retry
        </button>
      </section>
    </main>
  );
}
