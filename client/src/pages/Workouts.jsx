import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Dumbbell,
  Search,
  History
} from "lucide-react";
import workoutService from "../services/workoutService.js";
import WorkoutForm from "../components/workout/WorkoutForm.jsx";
import ConfirmDialog from "../components/modals/ConfirmDialog.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import EmptyState from "../components/common/EmptyState.jsx";

const PAGE_SIZE = 10;
const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "calories_desc", label: "Most calories" },
  { value: "duration_desc", label: "Longest duration" }
];

const INPUT =
  "px-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all";

export default function Workouts() {
  const { categories, refreshAll, push } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    from: "",
    to: "",
    sort: "date_desc",
    page: 1
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [templateInitial, setTemplateInitial] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workoutService.getWorkouts({ ...filters, limit: PAGE_SIZE });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to load workouts.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounce so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  // Open the form pre-filled when navigated from a dashboard template.
  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      setTemplateInitial({
        title: template.title,
        notes: "Logged from a workout template.",
        exercises: template.exercises
      });
      setEditing(null);
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));
  }

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing) {
        await workoutService.updateWorkout(editing.id, payload);
        push("Workout updated.", "success");
      } else {
        await workoutService.createWorkout(payload);
        push("Workout logged successfully.", "success");
      }
      setShowForm(false);
      setEditing(null);
      setTemplateInitial(null);
      await load();
      refreshAll();
    } catch (err) {
      push(err.message || "Failed to save workout.", "info");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await workoutService.deleteWorkout(id);
      push("Workout deleted.", "info");
      await load();
      refreshAll();
    } catch (err) {
      push(err.message || "Failed to delete workout.", "info");
    }
  }

  function startEdit(workout) {
    setEditing(workout);
    setTemplateInitial(null);
    setShowForm(true);
  }

  const formInitial = editing || templateInitial;

  return (
    <div className="space-y-6 text-left text-[#E0E0E0]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif italic text-white">Workout Tracker</h1>
          <p className="text-xs text-white/40">
            Log sessions, exercises, sets and reps, then filter your history.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setTemplateInitial(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-sm text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-white/90 transition-all shadow-xl"
          >
            <Plus className="h-4 w-4" /> Log session
          </button>
        )}
      </div>

      {showForm && (
        <WorkoutForm
          categories={categories}
          initial={formInitial}
          isEditing={Boolean(editing)}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
            setTemplateInitial(null);
          }}
        />
      )}

      {!showForm && (
        <>
          {/* Filters */}
          <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search
                className="absolute left-3 top-2.5 h-4 w-4 text-white/30"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search workouts"
                placeholder="Search title or notes"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                className={`${INPUT} w-full pl-9`}
              />
            </div>
            <select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(e) => setFilter("category", e.target.value)}
              className={`${INPUT} cursor-pointer`}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              aria-label="From date"
              type="date"
              value={filters.from}
              onChange={(e) => setFilter("from", e.target.value)}
              className={INPUT}
            />
            <input
              aria-label="To date"
              type="date"
              value={filters.to}
              onChange={(e) => setFilter("to", e.target.value)}
              className={INPUT}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40">
              <History className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-widest font-mono">
                History{" "}
                {result.total > 0 && <span className="text-white/30">({result.total})</span>}
              </h2>
            </div>
            <select
              aria-label="Sort workouts"
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              className={`${INPUT} cursor-pointer`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <ErrorBanner message={error} onRetry={load} />

          {loading ? (
            <Spinner label="Loading workouts..." className="py-16" />
          ) : result.items.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No workouts found"
              description={
                filters.search || filters.category || filters.from || filters.to
                  ? "Try adjusting or clearing your filters."
                  : "Log your first workout to start tracking trends."
              }
            />
          ) : (
            <div className="space-y-4">
              {result.items.map((workout) => {
                const isExpanded = expandedId === workout.id;
                return (
                  <div
                    key={workout.id}
                    className="bg-[#0E0E0E] border border-white/10 hover:border-white/15 rounded-sm shadow-md overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                      aria-expanded={isExpanded}
                      className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.015] transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white/60 text-[9px] font-mono font-bold uppercase tracking-widest">
                            {workout.date}
                          </span>
                          <h3 className="text-sm font-bold text-white">{workout.title}</h3>
                        </div>
                        {workout.notes && (
                          <p className="text-xs text-white/40 leading-relaxed line-clamp-1">
                            {workout.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="flex items-center gap-6 text-xs font-mono">
                          <div className="text-right">
                            <span className="text-white/30 block text-[8px] uppercase tracking-wider">
                              Duration
                            </span>
                            <span className="font-semibold text-white">
                              {workout.durationTotal}m
                            </span>
                          </div>
                          <div className="text-right border-l border-white/10 pl-6">
                            <span className="text-white/30 block text-[8px] uppercase tracking-wider">
                              Calories
                            </span>
                            <span className="font-semibold text-emerald-400">
                              {workout.caloriesTotal}
                            </span>
                          </div>
                          <div className="text-right border-l border-white/10 pl-6">
                            <span className="text-white/30 block text-[8px] uppercase tracking-wider">
                              Exercises
                            </span>
                            <span className="font-semibold text-white">
                              {workout.exercises.length}
                            </span>
                          </div>
                        </div>
                        <span className="text-white/40">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-white/[0.005] border-t border-white/10 p-5 space-y-4 text-xs text-[#E0E0E0]">
                        {workout.exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 last:pb-0 border-b border-white/5 last:border-b-0"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/50 font-mono text-[9px] uppercase tracking-wider">
                                  {exercise.categoryName}
                                </span>
                                <span className="font-bold text-white">
                                  {exercise.exerciseName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-white/40">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-white/30" />
                                  {exercise.duration} mins
                                </span>
                                <span className="text-white/10">•</span>
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3.5 w-3.5 text-emerald-500" />
                                  {exercise.caloriesBurned} kcal
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              {exercise.sets.map((set, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-white/80"
                                >
                                  Set {sIdx + 1}: <strong className="text-white">{set.reps}</strong>{" "}
                                  × <strong className="text-white">{set.weight}</strong> kg
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="pt-3 flex justify-end gap-5 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => startEdit(workout)}
                            className="text-xs font-serif italic text-white/60 hover:text-white transition-all cursor-pointer underline decoration-white/15 underline-offset-4"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(workout.id)}
                            className="text-xs font-serif italic text-red-400 hover:text-red-300 transition-all cursor-pointer underline decoration-red-900/40 underline-offset-4"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {result.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2 text-xs font-mono">
                  <button
                    type="button"
                    disabled={filters.page <= 1}
                    onClick={() => setFilter("page", filters.page - 1)}
                    className="px-3 py-1.5 rounded-sm border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-white/40">
                    Page {result.page} of {result.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={filters.page >= result.totalPages}
                    onClick={() => setFilter("page", filters.page + 1)}
                    className="px-3 py-1.5 rounded-sm border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this workout?"
        message="This permanently removes the workout and its exercises. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
