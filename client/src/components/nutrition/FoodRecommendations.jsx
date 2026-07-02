import { useCallback, useEffect, useMemo, useState } from "react";
import { Utensils } from "lucide-react";
import nutritionService from "../../services/nutritionService.js";

/**
 * Dataset-backed food suggestions.
 *
 * Renders recommendation cards sourced from the backend nutrition_foods table
 * via nutritionService.getRecommendations(). Nothing here is hardcoded: every
 * card reflects a real row returned by /api/nutrition/recommendations, scored
 * against the user's goal and (when available) their most recent workout.
 */

function formatMacro(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function prettyLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function FoodCard({ food }) {
  const reasons = Array.isArray(food.recommendationReasons) ? food.recommendationReasons : [];
  const label = prettyLabel(food.goalProfile || food.foodType);

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/10 transition-all hover:border-primary">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold capitalize leading-snug text-text">{food.name}</h4>
        {label && (
          <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted">
            {label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-base font-bold text-primary">{formatMacro(food.calories)} cal</span>
        {food.servingSize && <span className="text-[11px] text-muted">per {food.servingSize}</span>}
      </div>

      <p className="text-[11px] font-medium text-muted">
        Protein {formatMacro(food.proteinG)}g · Carbs {formatMacro(food.carbsG)}g · Fat {formatMacro(food.fatG)}g
      </p>

      {reasons.length > 0 ? (
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {reasons.slice(0, 2).map((reason) => (
            <li
              key={reason}
              className="rounded-2xl border border-border bg-bg px-2 py-0.5 text-[10px] capitalize text-muted"
            >
              {reason}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[10px] italic text-muted">Recommended recovery option.</p>
      )}
    </li>
  );
}

export default function FoodRecommendations({
  goal,
  workoutType,
  category,
  caloriesBurned,
  limit = 5,
  title = "Recovery fuel",
  description = "Food suggestions based on your workout and goal."
}) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const next = { limit };
    if (goal) next.goal = goal;
    if (workoutType) next.workoutType = workoutType;
    if (category) next.category = category;
    if (caloriesBurned !== undefined && caloriesBurned !== null && Number(caloriesBurned) > 0) {
      next.caloriesBurned = Number(caloriesBurned);
    }
    return next;
  }, [goal, workoutType, category, caloriesBurned, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await nutritionService.getRecommendations(params);
      const list = Array.isArray(data?.recommendations) ? data.recommendations : [];
      setFoods(list);
    } catch (err) {
      setError(err?.message || "Could not load food suggestions.");
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    nutritionService
      .getRecommendations(params)
      .then((data) => {
        if (!isMounted) return;
        setFoods(Array.isArray(data?.recommendations) ? data.recommendations : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Could not load food suggestions.");
        setFoods([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <section
      aria-label="Recommended food suggestions"
      className="rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/10 sm:p-5"
    >
      <header className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-bg text-primary" aria-hidden="true">
          <Utensils className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-text">{title}</h3>
          <p className="text-[11px] leading-snug text-muted">{description}</p>
        </div>
      </header>

      <div className="mt-4">
        {loading && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, idx) => (
              <li
                key={idx}
                className="h-28 animate-pulse rounded-2xl border border-border bg-bg"
              />
            ))}
          </ul>
        )}

        {!loading && error && (
          <div role="alert" className="flex flex-col items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={load}
              className="rounded-2xl border border-border px-3 py-1 text-xs font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && foods.length === 0 && (
          <p className="rounded-2xl border border-border bg-bg p-4 text-sm text-muted">
            No suggestions matched this context yet. Log a workout or update your goal to see options.
          </p>
        )}

        {!loading && !error && foods.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {foods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
