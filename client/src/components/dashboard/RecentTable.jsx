import { memo } from "react";

const DATE_FORMATTER = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

/**
 * Formats an ISO date for the recent workout table.
 * @param {string} value ISO date string.
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return "—";
  return DATE_FORMATTER.format(new Date(`${value}T00:00:00`));
}

/**
 * Resolves the first exercise on a workout for row metadata.
 * @param {object} workout Workout record.
 * @returns {object}
 */
function getPrimaryExercise(workout) {
  return workout.exercises?.[0] || {};
}

/**
 * Renders recent workouts in a plain accessible table.
 * @param {{workouts: Array<object>}} props Component props.
 * @returns {JSX.Element}
 */
function RecentTable({ workouts }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Recent workouts</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500 dark:text-zinc-500">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Exercise</th>
              <th className="px-4 py-2 font-medium">Cal</th>
              <th className="px-4 py-2 font-medium">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {workouts.map((workout) => {
              const exercise = getPrimaryExercise(workout);
              return (
                <tr key={workout.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatDate(workout.date)}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{exercise.categoryName || "—"}</td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{exercise.exerciseName || workout.title}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-500 dark:text-zinc-500">{workout.calories || workout.caloriesBurned || 0}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-500 dark:text-zinc-500">{workout.xp || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(RecentTable);
