import { useState } from "react";
import { Plus, Trash2, Trash, Calendar, Dumbbell } from "lucide-react";
import ErrorBanner from "../common/ErrorBanner.jsx";
import { todayStr } from "../../utils/workoutUtils.js";

function buildInitialExercises(initial, categories) {
  if (initial?.exercises?.length) {
    return initial.exercises.map((exercise) => ({
      categoryId: exercise.categoryId || categories[0]?.id || "cat_1",
      categoryName: exercise.categoryName || categories[0]?.name || "Cardio Training",
      exerciseName: exercise.exerciseName || "",
      duration: (exercise.duration ?? "").toString(),
      caloriesBurned: (exercise.caloriesBurned ?? "").toString(),
      sets: (exercise.sets || [{ reps: "10", weight: "0" }]).map((set) => ({
        reps: (set.reps ?? "").toString(),
        weight: (set.weight ?? "").toString()
      }))
    }));
  }
  const defaultCat = categories[0] || { id: "cat_1", name: "Cardio Training" };
  return [
    {
      categoryId: defaultCat.id,
      categoryName: defaultCat.name,
      exerciseName: "",
      duration: "15",
      caloriesBurned: "100",
      sets: [{ reps: "10", weight: "20" }]
    }
  ];
}

/**
 * Create/edit form for a workout session and its exercises/sets.
 */
export default function WorkoutForm({
  categories,
  initial,
  isEditing,
  submitting,
  onSubmit,
  onCancel
}) {
  const [date, setDate] = useState(initial?.date || todayStr());
  const [title, setTitle] = useState(initial?.title || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [exercises, setExercises] = useState(() => buildInitialExercises(initial, categories));
  const [error, setError] = useState(null);

  function updateExercise(index, field, value) {
    setExercises((current) =>
      current.map((exercise, i) => {
        if (i !== index) return exercise;
        if (field === "categoryId") {
          const category = categories.find((c) => c.id === value);
          return {
            ...exercise,
            categoryId: value,
            categoryName: category ? category.name : "General"
          };
        }
        return { ...exercise, [field]: value };
      })
    );
  }

  function updateSet(exIndex, setIndex, field, value) {
    setExercises((current) =>
      current.map((exercise, i) => {
        if (i !== exIndex) return exercise;
        const sets = exercise.sets.map((set, s) =>
          s === setIndex ? { ...set, [field]: value } : set
        );
        return { ...exercise, sets };
      })
    );
  }

  function addExercise() {
    const defaultCat = categories[0] || { id: "cat_1", name: "Cardio Training" };
    setExercises((current) => [
      ...current,
      {
        categoryId: defaultCat.id,
        categoryName: defaultCat.name,
        exerciseName: "",
        duration: "",
        caloriesBurned: "",
        sets: [{ reps: "", weight: "" }]
      }
    ]);
  }

  function removeExercise(index) {
    setExercises((current) => current.filter((_, i) => i !== index));
  }

  function addSet(exIndex) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i === exIndex
          ? { ...exercise, sets: [...exercise.sets, { reps: "", weight: "" }] }
          : exercise
      )
    );
  }

  function removeSet(exIndex, setIndex) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i === exIndex
          ? { ...exercise, sets: exercise.sets.filter((_, s) => s !== setIndex) }
          : exercise
      )
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (exercises.length === 0) {
      setError("Add at least one exercise to log a workout.");
      return;
    }
    for (let i = 0; i < exercises.length; i += 1) {
      if (!exercises[i].exerciseName.trim()) {
        setError(`Please name exercise #${i + 1}.`);
        return;
      }
    }
    onSubmit({
      date,
      title: title.trim(),
      notes: notes.trim(),
      exercises: exercises.map((exercise) => ({
        categoryId: exercise.categoryId,
        categoryName: exercise.categoryName,
        exerciseName: exercise.exerciseName.trim(),
        duration: Number(exercise.duration) || 0,
        caloriesBurned: Number(exercise.caloriesBurned) || 0,
        sets: exercise.sets.map((set) => ({
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0
        }))
      }))
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0E0E0E] p-6 rounded-sm border border-white/10 shadow-lg space-y-6"
    >
      <div className="border-b border-white/10 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-serif italic text-white flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          {isEditing ? "Edit Workout" : "New Workout Session"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-white/40 hover:text-white underline decoration-white/25 underline-offset-4 font-serif italic cursor-pointer transition-all"
        >
          Discard
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="w-date"
            className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
          >
            Workout Date
          </label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-2.5 h-4 w-4 text-white/30"
              aria-hidden="true"
            />
            <input
              id="w-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="w-title"
            className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
          >
            Workout Title
          </label>
          <input
            id="w-title"
            type="text"
            required
            placeholder="e.g. Upper Body Push, Evening Run"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full px-3.5 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="w-notes"
          className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
        >
          Session Notes (optional)
        </label>
        <input
          id="w-notes"
          type="text"
          placeholder="e.g. Felt strong, hit a personal best on rows."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="block w-full px-3.5 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-t border-white/10 pt-5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Exercises ({exercises.length})
          </h4>
          <button
            type="button"
            onClick={addExercise}
            className="py-1 px-3 border border-white/10 hover:bg-white/5 bg-white/5 rounded-sm text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add exercise
          </button>
        </div>

        {exercises.length === 0 ? (
          <div className="p-8 bg-white/[0.01] text-center rounded-sm border border-dashed border-white/10 text-white/40 text-xs">
            No exercises yet. Click &quot;Add exercise&quot; to begin.
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, exIdx) => (
              <div
                key={exIdx}
                className="p-4 rounded-sm border border-white/15 bg-white/[0.01] space-y-4 relative"
              >
                <button
                  type="button"
                  onClick={() => removeExercise(exIdx)}
                  aria-label={`Remove exercise ${exIdx + 1}`}
                  className="absolute top-4 right-4 text-white/40 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={exercise.categoryId}
                      onChange={(e) => updateExercise(exIdx, "categoryId", e.target.value)}
                      className="block w-full px-2 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none cursor-pointer transition-all"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                      Exercise name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Barbell Squats"
                      value={exercise.exerciseName}
                      onChange={(e) => updateExercise(exIdx, "exerciseName", e.target.value)}
                      className="block w-full px-2.5 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                        Minutes
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="min"
                        value={exercise.duration}
                        onChange={(e) => updateExercise(exIdx, "duration", e.target.value)}
                        className="block w-full px-2 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-center text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                        Calories
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="kcal"
                        value={exercise.caloriesBurned}
                        onChange={(e) => updateExercise(exIdx, "caloriesBurned", e.target.value)}
                        className="block w-full px-2 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-center text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/50 block">
                      Sets &amp; load
                    </span>
                    <button
                      type="button"
                      onClick={() => addSet(exIdx)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition-all"
                    >
                      + Add set
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    {exercise.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className="flex items-center gap-1.5 bg-[#050505] px-2.5 py-1.5 rounded-sm border border-white/10 text-xs text-white"
                      >
                        <span className="font-mono text-[9px] text-white/30 font-semibold">
                          #{setIdx + 1}
                        </span>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="reps"
                          value={set.reps}
                          onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                          className="w-11 px-1 py-0.5 bg-black border border-white/10 rounded-sm text-center text-xs text-white focus:border-white focus:outline-none"
                          aria-label="Reps"
                        />
                        <span className="text-white/40 text-[10px]">reps</span>
                        <span className="text-white/10">|</span>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="kg"
                          value={set.weight}
                          onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                          className="w-11 px-1 py-0.5 bg-black border border-white/10 rounded-sm text-center text-xs text-white focus:border-white focus:outline-none"
                          aria-label="Weight in kg"
                        />
                        <span className="text-white/40 text-[10px]">kg</span>
                        {exercise.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(exIdx, setIdx)}
                            aria-label="Remove set"
                            className="text-white/40 hover:text-red-400 ml-1 cursor-pointer transition-all"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-white text-black font-bold uppercase tracking-widest rounded-sm text-xs transition-all cursor-pointer hover:bg-white/95 disabled:opacity-50"
      >
        {submitting ? "Saving..." : isEditing ? "Update Workout" : "Log Workout"}
      </button>
    </form>
  );
}
