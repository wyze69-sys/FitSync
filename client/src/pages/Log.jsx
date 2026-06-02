import { Fragment, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { ChevronDown, ChevronUp, Clock, Dumbbell, Flame, Plus, Scale, Search, X } from "lucide-react";
import workoutService from "../services/workoutService.js";
import progressService from "../services/progressService.js";
import WorkoutForm from "../components/workout/WorkoutForm.jsx";
import ConfirmDialog from "../components/modals/ConfirmDialog.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { todayStr } from "../utils/workoutUtils.js";

const INPUT =
  "block w-full px-3 py-2 bg-bg border border-border rounded-sm text-xs text-text focus:border-accent focus:outline-none transition-all";

function WeightLogForm({ onSubmit, onCancel, submitting, error }) {
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ date, weight: Number(weight), notes: notes.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-text flex items-center gap-2">
          <Scale className="h-4 w-4 text-accent" aria-hidden="true" /> Log Weight
        </h3>
        <button type="button" onClick={onCancel} className="text-muted hover:text-text">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="weight-date" className="block text-[10px] font-mono font-bold text-muted uppercase tracking-widest mb-1.5">
            Date
          </label>
          <input
            id="weight-date"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`${INPUT} font-mono tabular-nums`}
          />
        </div>
        <div>
          <label htmlFor="weight-value" className="block text-[10px] font-mono font-bold text-muted uppercase tracking-widest mb-1.5">
            Weight (kg)
          </label>
          <input
            id="weight-value"
            type="number"
            min="1"
            step="0.1"
            required
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            className={`${INPUT} font-mono tabular-nums`}
          />
        </div>
      </div>
      <div>
        <label htmlFor="weight-notes" className="block text-[10px] font-mono font-bold text-muted uppercase tracking-widest mb-1.5">
          Notes (optional)
        </label>
        <textarea
          id="weight-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className={INPUT}
          placeholder="Morning weigh-in, after workout, etc."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-sm border border-border text-xs text-muted hover:text-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-sm bg-accent text-black text-xs font-medium uppercase tracking-widest disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save weight"}
        </button>
      </div>
    </form>
  );
}

export default function Log() {
  const { categories, refreshAll, push } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [templateInitial, setTemplateInitial] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [weightError, setWeightError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workoutService.getWorkouts({ search, limit: 50 });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to load workouts.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      setTemplateInitial({
        title: template.title,
        notes: "Logged from a workout template.",
        exercises: template.exercises
      });
      setEditing(null);
      setModalMode("workout");
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    if (location.state?.open) {
      setEditing(null);
      setTemplateInitial(null);
      setModalMode(location.state.open);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  function openModal(mode) {
    setEditing(null);
    setTemplateInitial(null);
    setWeightError(null);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
    setTemplateInitial(null);
    setWeightError(null);
  }

  async function handleWorkoutSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing) {
        await workoutService.updateWorkout(editing.id, payload);
        push("Workout updated.", "success");
      } else {
        await workoutService.createWorkout(payload);
        push("Workout logged successfully.", "success");
      }
      closeModal();
      await load();
      refreshAll();
    } catch (err) {
      push(err.message || "Failed to save workout.", "info");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWeightSubmit(payload) {
    setWeightError(null);
    if (!payload.weight || payload.weight <= 0) {
      setWeightError("Please enter a positive weight.");
      return;
    }
    setSubmitting(true);
    try {
      await progressService.createWeightLog(payload);
      push(`Logged ${payload.weight} kg.`, "success");
      closeModal();
      refreshAll();
    } catch (err) {
      setWeightError(err.message || "Failed to save weight log.");
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
    setModalMode("workout");
  }

  const formInitial = editing || templateInitial;

  return (
    <div className="space-y-6 text-left text-text pb-20">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text">Log</h1>
        <p className="text-xs text-muted">Search workouts, then use one button to log a workout or weight.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search workouts"
          placeholder="Search workouts"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${INPUT} pl-9`}
        />
      </div>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <Spinner label="Loading workouts..." className="py-16" />
      ) : result.items.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts found"
          description={search ? "Try a different search." : "Tap + to log your first workout."}
        />
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-surface">
          <table className="w-full min-w-[680px] text-left text-xs text-text">
            <thead className="border-b border-border bg-bg font-mono text-[9px] uppercase tracking-widest text-muted">
              <tr>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Workout</th>
                <th className="p-3 font-semibold text-right">Duration</th>
                <th className="p-3 font-semibold text-right">Calories</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((workout, index) => {
                const isExpanded = expandedId === workout.id;
                return (
                  <Fragment key={workout.id}>
                    <tr className={`border-b border-border ${index % 2 === 0 ? "bg-surface" : "bg-bg/55"}`}>
                      <td className="p-3 font-mono tabular-nums text-muted">{workout.date}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                          className="flex items-center gap-2 text-left text-text hover:text-accent"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                          <span>
                            <span className="block font-semibold">{workout.title}</span>
                            {workout.notes && <span className="block text-[11px] text-muted line-clamp-1">{workout.notes}</span>}
                          </span>
                        </button>
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums">{workout.durationTotal}m</td>
                      <td className="p-3 text-right font-mono tabular-nums text-accent">{workout.caloriesTotal}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(workout)} className="px-2 py-1 rounded-sm border border-border text-muted hover:text-text hover:border-accent">
                            Edit
                          </button>
                          <button type="button" onClick={() => setPendingDelete(workout.id)} className="px-2 py-1 rounded-sm border border-border text-muted hover:text-red-300 hover:border-red-900/50">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-bg border-b border-border">
                        <td colSpan={5} className="p-3">
                          <div className="space-y-3">
                            {(workout.exercises || []).map((exercise) => (
                              <div key={exercise.id} className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 last:pb-0 border-b border-border last:border-b-0">
                                <div>
                                  <div className="font-semibold text-text">{exercise.exerciseName}</div>
                                  <div className="text-[11px] text-muted flex items-center gap-3 mt-1">
                                    <span>{exercise.categoryName}</span>
                                    <span className="flex items-center gap-1 font-mono tabular-nums"><Clock className="h-3 w-3" /> {exercise.duration}m</span>
                                    <span className="flex items-center gap-1 font-mono tabular-nums"><Flame className="h-3 w-3 text-accent" /> {exercise.caloriesBurned} kcal</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(exercise.sets || []).map((set, setIndex) => (
                                    <span key={setIndex} className="px-2.5 py-1 rounded-sm bg-surface border border-border font-mono tabular-nums text-[10px] text-muted">
                                      Set {setIndex + 1}: <strong className="text-text">{set.reps}</strong> x <strong className="text-text">{set.weight}</strong> kg
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
      )}

      <button
        type="button"
        onClick={() => openModal("chooser")}
        aria-label="Open log options"
        className="fixed bottom-20 md:bottom-8 right-6 h-14 w-14 rounded-sm bg-accent text-black flex items-center justify-center z-40 transition-all active:scale-95 border border-accent shadow-[0_16px_36px_rgba(0,0,0,0.42)]"
      >
        <Plus className="h-7 w-7 stroke-[3]" />
      </button>

      {modalMode && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-end md:items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="bg-surface w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-sm border border-border p-5" onClick={(event) => event.stopPropagation()}>
            {modalMode === "chooser" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-text">What would you like to log?</h2>
                  <button type="button" onClick={closeModal} className="text-muted hover:text-text"><X className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setModalMode("workout")} className="p-5 rounded-sm bg-bg border border-border hover:border-accent text-left">
                    <Dumbbell className="h-5 w-5 text-accent mb-3" />
                    <div className="font-semibold text-text">Log Workout</div>
                    <div className="text-xs text-muted mt-1">Add exercises, sets, duration, and calories.</div>
                  </button>
                  <button type="button" onClick={() => setModalMode("weight")} className="p-5 rounded-sm bg-bg border border-border hover:border-accent text-left">
                    <Scale className="h-5 w-5 text-accent mb-3" />
                    <div className="font-semibold text-text">Log Weight</div>
                    <div className="text-xs text-muted mt-1">Record today&apos;s body weight.</div>
                  </button>
                </div>
              </div>
            )}
            {modalMode === "workout" && (
              <WorkoutForm
                categories={categories}
                initial={formInitial}
                isEditing={Boolean(editing)}
                submitting={submitting}
                onSubmit={handleWorkoutSubmit}
                onCancel={closeModal}
              />
            )}
            {modalMode === "weight" && (
              <WeightLogForm
                submitting={submitting}
                error={weightError}
                onSubmit={handleWeightSubmit}
                onCancel={closeModal}
              />
            )}
          </div>
        </div>
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
