import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dumbbell,
  Clock,
  Flame,
  Award,
  Calendar,
  Search,
  RotateCcw,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Activity,
  X
} from "lucide-react";
import PageHeader from "../components/common/PageHeader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import workoutService from "../services/workoutService.js";

function n(value) {
  return Number(value || 0);
}

function getCategoryDetails(category) {
  const name = String(category || "").toLowerCase();
  
  if (name.includes("strength") || name.includes("power") || name.includes("weight")) {
    return {
      icon: Dumbbell,
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-100 dark:border-green-900/30",
      text: "text-green-600 dark:text-green-400",
      pillBg: "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/30",
      pillText: "text-green-800 dark:text-green-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider",
      displayName: "Strength"
    };
  }
  
  if (name.includes("mobility") || name.includes("stretch") || name.includes("flexibility") || name.includes("yoga")) {
    return {
      icon: Activity,
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-100 dark:border-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      pillBg: "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/30",
      pillText: "text-blue-800 dark:text-blue-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider",
      displayName: "Mobility"
    };
  }
  
  if (name.includes("cardio") || name.includes("run") || name.includes("cycle") || name.includes("swim") || name.includes("walk")) {
    return {
      icon: Flame,
      bg: "bg-orange-50 dark:bg-orange-950/20",
      border: "border-orange-100 dark:border-orange-900/30",
      text: "text-orange-600 dark:text-orange-400",
      pillBg: "bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/30",
      pillText: "text-orange-850 dark:text-orange-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider",
      displayName: "Cardio"
    };
  }
  
  return {
    icon: Dumbbell,
    bg: "bg-zinc-50 dark:bg-zinc-900/20",
    border: "border-zinc-100 dark:border-zinc-800/30",
    text: "text-zinc-600 dark:text-zinc-400",
    pillBg: "bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/30",
    pillText: "text-zinc-800 dark:text-zinc-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider",
    displayName: category || "Workout"
  };
}

function formatWorkout(workout) {
  const title = workout.title || workout.exercises?.[0]?.exerciseName || "Workout";
  const category = workout.exercises?.[0]?.categoryName || "";
  
  let monthDay = "Today";
  let year = "";
  if (workout.date) {
    const parts = String(workout.date).split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const localDate = new Date(y, m - 1, d);
      monthDay = localDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      year = String(localDate.getFullYear());
    } else {
      monthDay = new Date(workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }

  return {
    id: workout.id,
    title,
    category,
    monthDay,
    year,
    duration: n(workout.durationTotal ?? workout.duration_min),
    calories: n(workout.calories ?? workout.caloriesTotal),
    xp: n(workout.xp ?? workout.xp_earned),
    notes: workout.notes || "",
    date: workout.date,
    intensity: workout.intensity || "med",
    userWeightAtLog: workout.userWeightAtLog,
    exercises: workout.exercises || []
  };
}

function formatDuration(minutes) {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  }
  return `${minutes}m`;
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortOrder, setSortOrder] = useState("date_desc");
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedWorkout(null);
      }
    };
    if (selectedWorkout) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedWorkout]);

  async function loadWorkouts(filters = {}) {
    setLoading(true);
    setError("");

    try {
      const result = await workoutService.getWorkouts({
        limit: 100,
        sort: sortOrder,
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

  const isPartial = (fromDate && !toDate) || (!fromDate && toDate);

  const handleSearch = async (event) => {
    event?.preventDefault();
    if (isPartial) return;
    setIsSearching(true);
    await loadWorkouts({
      from: fromDate || undefined,
      to: toDate || undefined
    });
  };

  const handleClear = async () => {
    setFromDate("");
    setToDate("");
    setIsSearching(true);
    await loadWorkouts();
  };

  const toggleSort = async () => {
    const nextSort = sortOrder === "date_desc" ? "date_asc" : "date_desc";
    setSortOrder(nextSort);
    await loadWorkouts({
      from: fromDate || undefined,
      to: toDate || undefined,
      sort: nextSort
    });
  };

  const totalWorkouts = workouts.length;
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
  const totalXp = workouts.reduce((sum, w) => sum + w.xp, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);

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
        eyebrow={
          <span className="inline-flex items-center gap-1 bg-[#e6f4ea] dark:bg-[#123524] text-[#0f9b73] dark:text-[#2dd4a8] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#c2e7c9] dark:border-[#1d4f36] transform-none">
            <Clock className="w-3.5 h-3.5" />
            History
          </span>
        }
        title="All logged workouts"
        description="Review your past workout sessions, dates, duration, calories, and XP earned."
        action={
          <Link
            to="/log"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg shrink-0"
          >
            <span>+ Log workout</span>
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Workouts Card */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-black/5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/20 text-[#0f9b73] dark:text-[#2dd4a8] border border-green-100 dark:border-green-900/30">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Workouts</p>
            <h4 className="text-2xl font-bold text-text mt-0.5">{totalWorkouts}</h4>
            <p className="text-[11px] text-[#0f9b73] dark:text-[#2dd4a8] font-medium mt-0.5">Sessions loaded</p>
          </div>
        </div>

        {/* Calories Card */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-black/5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Calories</p>
            <h4 className="text-2xl font-bold text-text mt-0.5">{totalCalories.toLocaleString()}</h4>
            <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium mt-0.5">Calories from loaded workouts</p>
          </div>
        </div>

        {/* XP Card */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-black/5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/20 text-[#0f9b73] dark:text-[#2dd4a8] border border-green-100 dark:border-green-900/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">XP Earned</p>
            <h4 className="text-2xl font-bold text-text mt-0.5">{totalXp.toLocaleString()}</h4>
            <p className="text-[11px] text-[#0f9b73] dark:text-[#2dd4a8] font-medium mt-0.5">XP from loaded workouts</p>
          </div>
        </div>

        {/* Total Duration Card */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-black/5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/20 text-[#0f9b73] dark:text-[#2dd4a8] border border-green-100 dark:border-green-900/30">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Duration</p>
            <h4 className="text-2xl font-bold text-text mt-0.5">{formatDuration(totalDuration)}</h4>
            <p className="text-[11px] text-[#0f9b73] dark:text-[#2dd4a8] font-medium mt-0.5">Time from loaded workouts</p>
          </div>
        </div>
      </div>

      {/* Date Filter Card */}
      <form
        onSubmit={handleSearch}
        className="rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-black/5 flex flex-col gap-4 relative overflow-hidden"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/20 text-primary border border-green-100 dark:border-green-900/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text">Date Range</h3>
            <p className="text-xs text-muted mt-0.5">Filter your workouts by a specific date range.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 w-full">
          <div className="flex-1">
            <label
              htmlFor="from-date"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted"
            >
              From
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="hidden md:flex items-center justify-center h-12 pb-3.5 text-primary">
            <ChevronRight className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <label
              htmlFor="to-date"
              className="block text-[10px] font-bold uppercase tracking-wider text-muted"
            >
              To
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              disabled={isSearching}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-bg px-5 py-2.5 text-sm font-semibold text-text hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              type="submit"
              disabled={isSearching || isPartial}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-bright disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? "Searching…" : "Search"}</span>
            </button>
          </div>
        </div>

        {isPartial && (
          <p className="text-xs text-streak font-medium mt-1 animate-fade-in">
            Please fill in both "From" and "To" dates to search.
          </p>
        )}
      </form>

      {/* Table section */}
      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={fromDate && toDate ? "No workouts found in this range" : "No workouts logged yet"}
          description={
            fromDate && toDate
              ? "Try adjusting your dates or logging a new workout for this period."
              : "Log your first workout and it will appear here in your workout history."
          }
          action={
            fromDate && toDate ? (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Clear filter
              </button>
            ) : (
              <Link
                to="/log"
                className="inline-flex rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Log a workout
              </Link>
            )
          }
        />
      ) : (
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-lg shadow-black/5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-widest text-muted">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1.5 hover:text-primary font-bold transition-colors cursor-pointer"
                  >
                    <span>Date</span>
                    {sortOrder === "date_desc" ? (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Workout</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted/80" />
                    Duration
                  </span>
                </th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-muted/80" />
                    Calories
                  </span>
                </th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-muted/80" />
                    XP Earned
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((workout) => {
                const catDetails = getCategoryDetails(workout.category);
                const CatIcon = catDetails.icon;

                return (
                  <tr
                    key={workout.id}
                    className="border-b border-border last:border-b-0 hover:bg-bg/50 cursor-pointer transition-colors focus-visible:bg-bg/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                    onClick={() => setSelectedWorkout(workout)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedWorkout(workout);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${workout.title}`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-bold text-text text-sm leading-tight">
                        {workout.monthDay}
                      </div>
                      <div className="text-[11px] text-muted font-medium mt-0.5">
                        {workout.year}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-text text-sm">{workout.title}</div>
                        {workout.notes && (
                          <div className="text-xs text-muted font-normal mt-0.5 max-w-md truncate">
                            {workout.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={catDetails.pillBg + " " + catDetails.pillText}>
                        {catDetails.displayName}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-muted text-sm font-semibold">
                        <Clock className="w-3.5 h-3.5 text-muted/60" />
                        <span>{workout.duration}m</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-muted text-sm font-semibold">
                        <Flame className="w-3.5 h-3.5 text-orange-500/60" />
                        <span>{workout.calories} kcal</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-muted text-sm font-semibold">
                        <Award className="w-3.5 h-3.5 text-primary/60" />
                        <span>{workout.xp}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-between items-center text-xs text-muted mt-4 px-2">
            <span>Showing {workouts.length} workouts loaded</span>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedWorkout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedWorkout(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border p-6">
              <div className="space-y-1 text-left flex-1 pr-4">
                <h3 id="modal-title" className="text-lg font-bold text-text break-words">
                  {selectedWorkout.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={getCategoryDetails(selectedWorkout.category).pillBg + " " + getCategoryDetails(selectedWorkout.category).pillText}>
                    {getCategoryDetails(selectedWorkout.category).displayName}
                  </span>
                  <span className="text-xs text-muted font-medium">
                    {selectedWorkout.monthDay}, {selectedWorkout.year || new Date(selectedWorkout.date).getFullYear()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkout(null)}
                className="rounded-xl p-2 text-muted hover:bg-bg hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-left">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-bg/40 p-4">
                <div className="text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Duration</span>
                  <span className="mt-1 font-semibold text-text text-sm flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-muted/65" />
                    {selectedWorkout.duration}m
                  </span>
                </div>
                <div className="text-center border-x border-border">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Calories</span>
                  <span className="mt-1 font-semibold text-text text-sm flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500/65" />
                    {selectedWorkout.calories} kcal
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">XP Earned</span>
                  <span className="mt-1 font-semibold text-text text-sm flex items-center justify-center gap-1">
                    <Award className="w-3.5 h-3.5 text-primary/65" />
                    {selectedWorkout.xp}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Intensity</span>
                  <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border bg-surface border-border text-text">
                    {selectedWorkout.intensity}
                  </span>
                </div>
                {selectedWorkout.userWeightAtLog && (
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Weight At Log</span>
                    <span className="mt-1 font-semibold text-text text-sm">{selectedWorkout.userWeightAtLog} kg</span>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              {selectedWorkout.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">Notes</h4>
                  <p className="text-sm text-text bg-bg/30 border border-border p-3.5 rounded-2xl whitespace-pre-wrap break-words leading-relaxed">
                    {selectedWorkout.notes}
                  </p>
                </div>
              )}

              {/* Exercises Section */}
              {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">Exercises</h4>
                  <div className="space-y-4">
                    {selectedWorkout.exercises.map((exercise, idx) => {
                      const hasSets = exercise.sets && exercise.sets.length > 0;
                      return (
                        <div key={exercise.id || idx} className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-text text-sm break-words">{exercise.exerciseName}</h5>
                              {exercise.categoryName && (
                                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-0.5 block">
                                  {exercise.categoryName}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {exercise.duration > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted font-medium bg-bg/50 px-2 py-1 rounded-xl">
                                  <Clock className="w-3 h-3 text-muted/65" />
                                  {exercise.duration}m
                                </span>
                              )}
                            </div>
                          </div>

                          {hasSets ? (
                            <div className="border border-border/80 rounded-xl overflow-hidden">
                              <table className="min-w-full divide-y divide-border/60 text-left text-xs">
                                <thead className="bg-bg/40 font-bold text-muted uppercase tracking-wider text-[10px]">
                                  <tr>
                                    <th className="px-3 py-2">Set</th>
                                    <th className="px-3 py-2 text-right">Reps</th>
                                    <th className="px-3 py-2 text-right">Weight</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 font-medium text-text">
                                  {exercise.sets.map((set, sIdx) => (
                                    <tr key={sIdx}>
                                      <td className="px-3 py-2 text-muted">{sIdx + 1}</td>
                                      <td className="px-3 py-2 text-right">{set.reps} reps</td>
                                      <td className="px-3 py-2 text-right">{set.weight} kg</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
