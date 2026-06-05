import { memo } from "react";

const INPUT_CLASS = "mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";
const CARDIO_CATEGORIES = new Set(["cardio", "sports"]);

/**
 * Returns whether the category needs a distance field.
 * @param {string} slug Category slug.
 * @returns {boolean}
 */
function needsDistance(slug) {
  return CARDIO_CATEGORIES.has(slug);
}

/**
 * Workout logging form with server-calculated reward preview copy.
 * @param {object} props Component props.
 * @returns {JSX.Element}
 */
function WorkoutForm({ form, selectedCategory, preview, canSubmit, submitting, onChange, onSubmit }) {
  const showDistance = needsDistance(selectedCategory?.slug);

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm text-zinc-900 dark:text-zinc-100">
          Date
          <input type="date" name="date" value={form.date} onChange={onChange} className={INPUT_CLASS} />
        </label>
        <label className="text-sm text-zinc-900 dark:text-zinc-100">
          Duration (minutes)
          <input type="number" name="duration" min="1" inputMode="numeric" value={form.duration} onChange={onChange} placeholder="45" className={INPUT_CLASS} />
        </label>
        {showDistance && (
          <label className="text-sm text-zinc-900 dark:text-zinc-100">
            Distance (km)
            <input type="number" name="distance" min="0.1" step="0.1" inputMode="decimal" value={form.distance} onChange={onChange} placeholder="5.0" className={INPUT_CLASS} />
          </label>
        )}
        <label className="text-sm text-zinc-900 dark:text-zinc-100">
          Intensity
          <select name="intensity" value={form.intensity} onChange={onChange} className={INPUT_CLASS}>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm text-zinc-900 dark:text-zinc-100">
        Notes
        <textarea name="notes" value={form.notes} onChange={onChange} rows="3" placeholder="Optional details about the session" className={INPUT_CLASS} />
      </label>

      <div className="mt-4 flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-500" aria-live="polite">
          Preview: about {preview.xp} XP and {preview.calories} calories. Final values are calculated on the server.
        </p>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded-lg border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-100 dark:text-zinc-100 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950"
        >
          {submitting ? "Logging…" : "Log workout"}
        </button>
      </div>
    </form>
  );
}

export { needsDistance };
export default memo(WorkoutForm);
