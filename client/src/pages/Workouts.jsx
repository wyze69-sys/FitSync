import { Fragment, useState, useEffect, useCallback } from "react";
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
  "px-3 py-2 bg-bg border border-border rounded-sm text-xs text-text focus:border-accent focus:outline-none transition-all";

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
    <div className="space-y-6 text-left text-text">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">Workout Tracker</h1>
          <p className="text-xs text-muted">
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
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-black rounded-sm text-xs font-medium uppercase tracking-widest cursor-pointer transition-all"
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
          <div className="bg-surface border border-border rounded-sm p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search
                className="absolute left-3 top-2.5 h-4 w-4 text-muted"
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
            <div className="flex items-center gap-2 text-muted">
              <History className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-widest font-mono">
                History{" "}
                {result.total > 0 && <span className="text-muted">({result.total})</span>}
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
              <div className="overflow-x-auto rounded-sm border border-border bg-surface">
                <table className="w-full min-w-[760px] text-left text-xs text-text">
                  <thead className="border-b border-border bg-bg font-mono text-[9px] uppercase tracking-widest text-muted">
                    <tr>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Session</th>
                      <th className="p-3 font-semibold text-right">Duration</th>
                      <th className="p-3 font-semibold text-right">Calories</th>
                      <th className="p-3 font-semibold text-right">Exercises</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((workout, index) => {
                      const isExpanded = expandedId === workout.id;
                      return (
                        <Fragment key={workout.id}>
                    <tr
                      className={`border-b border-border transition-all ${
                        index % 2 === 0 ? "bg-surface" : "bg-bg/55"
                      } ${isExpanded ? "text-text" : ""}`}
                    >
                      <td className="p-3 font-mono text-muted">{workout.date}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                          aria-expanded={isExpanded}
                          className="flex items-center gap-2 text-left text-text hover:text-accent transition-all"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-accent" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted" />
                          )}
                          <span>
                            <span className="block font-semibold">{workout.title}</span>
                            {workout.notes && (
                              <span className="block text-[11px] text-muted line-clamp-1">
                                {workout.notes}
                              </span>
                            )}
                          </span>
                        </button>
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-text">
                        {workout.durationTotal}m
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-accent">
                        {workout.caloriesTotal}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-text">
                        {workout.exercises.length}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(workout)}
                            className="px-2 py-1 rounded-sm border border-border text-muted hover:text-text hover:border-accent transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(workout.id)}
                            className="px-2 py-1 rounded-sm border border-border text-muted hover:text-red-300 hover:border-red-900/50 transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-bg border-b border-border">
                        <td colSpan={6} className="p-3">
                          <div className="space-y-3 text-xs text-text">
                            {workout.exercises.map((exercise) => (
                              <div
                                key={exercise.id}
                                className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 last:pb-0 border-b border-border last:border-b-0"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded-sm bg-surface border border-border text-muted font-mono text-[9px] uppercase tracking-wider">
                                      {exercise.categoryName}
                                    </span>
                                    <span className="font-semibold text-text">
                                      {exercise.exerciseName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-muted">
                                    <span className="flex items-center gap-1 font-mono tabular-nums">
                                      <Clock className="h-3 w-3 text-muted" />
                                      {exercise.duration} mins
                                    </span>
                                    <span className="text-border">|</span>
                                    <span className="flex items-center gap-1 font-mono tabular-nums">
                                      <Flame className="h-3.5 w-3.5 text-accent" />
                                      {exercise.caloriesBurned} kcal
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {exercise.sets.map((set, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2.5 py-1 rounded-sm bg-surface border border-border font-mono tabular-nums text-[10px] text-muted"
                                    >
                                      Set {sIdx + 1}:{" "}
                                      <strong className="text-text">{set.reps}</strong> x{" "}
                                      <strong className="text-text">{set.weight}</strong> kg
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {result.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2 text-xs font-mono">
                  <button
                    type="button"
                    disabled={filters.page <= 1}
                    onClick={() => setFilter("page", filters.page - 1)}
                    className="px-3 py-1.5 rounded-sm border border-border text-muted hover:text-text hover:border-accent disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-muted">
                    Page {result.page} of {result.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={filters.page >= result.totalPages}
                    onClick={() => setFilter("page", filters.page + 1)}
                    className="px-3 py-1.5 rounded-sm border border-border text-muted hover:text-text hover:border-accent disabled:opacity-40 cursor-pointer"
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
