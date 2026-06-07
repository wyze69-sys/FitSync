import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import PageHeader from "../components/common/PageHeader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import workoutService from "../services/workoutService.js";

function n(value) {
  return Number(value || 0);
}

function formatWorkout(workout) {
  const title = workout.title || workout.exercises?.[0]?.exerciseName || "Workout";
  const category = workout.exercises?.[0]?.categoryName || "";

  return {
    id: workout.id,
    title,
    category,
    date: workout.date
      ? new Date(workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Today",
    duration: n(workout.durationTotal ?? workout.duration_min),
    calories: n(workout.calories ?? workout.caloriesTotal),
    xp: n(workout.xp ?? workout.xp_earned)
  };
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  async function loadWorkouts(filters = {}) {
    setLoading(true);
    setError("");

    try {
      const result = await workoutService.getWorkouts({
        limit: 100,
        sort: "date_desc",
        ...filters
      });
      setWorkouts((result.items || []).map(formatWorkout));
    } catch (err) {
      setError(err.message || "Could not load workout history.");
      setWorkouts([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      if (!isMounted) return;
      await loadWorkouts();
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (event) => {
    event?.preventDefault();
    setIsSearching(true);
    await loadWorkouts({ from: fromDate || undefined, to: toDate || undefined });
  };

  const handleClear = async () => {
    setFromDate("");
    setToDate("");
    setIsSearching(true);
    await loadWorkouts();
  };

  if (loading) {
    return <LoadingSpinner label="Loading workout history" />;
  }

  if (error) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Workout history unavailable"
        description={error}
        action={
          <Link
            to="/log"
            className="inline-flex rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Log a workout
          </Link>
        }
      />
    );
  }

  return (
    <main className="space-y-6 text-text animate-fade-in">
      <PageHeader
        eyebrow="History"
        title="All logged workouts"
        description="Review your past workout sessions, dates, duration, calories, and XP earned."
        action={
          <Link
            to="/log"
            className="inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Log workout
          </Link>
        }
      />

      <form
        onSubmit={handleSearch}
        className="grid gap-3 rounded-3xl border border-border bg-surface p-4 shadow-lg shadow-black/5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <div>
          <label
            htmlFor="from-date"
            className="block text-xs font-semibold uppercase tracking-widest text-muted"
          >
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="to-date"
            className="block text-xs font-semibold uppercase tracking-widest text-muted"
          >
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-end justify-end gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={isSearching}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-bg px-4 py-2 text-sm font-semibold text-text transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts logged yet"
          description="Log your first workout and it will appear here in your workout history."
          action={
            <Link
              to="/log"
              className="inline-flex rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Log a workout
            </Link>
          }
        />
      ) : (
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-lg shadow-black/5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-widest text-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Workout</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Duration</th>
                <th className="px-4 py-3 text-right">Calories</th>
                <th className="px-4 py-3 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((workout) => (
                <tr key={workout.id} className="border-b border-border last:border-b-0 hover:bg-bg">
                  <td className="px-4 py-4 font-medium text-text">{workout.date}</td>
                  <td className="px-4 py-4">{workout.title}</td>
                  <td className="px-4 py-4 text-muted">{workout.category || "—"}</td>
                  <td className="px-4 py-4 text-right">{workout.duration}m</td>
                  <td className="px-4 py-4 text-right">{workout.calories}</td>
                  <td className="px-4 py-4 text-right">{workout.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
