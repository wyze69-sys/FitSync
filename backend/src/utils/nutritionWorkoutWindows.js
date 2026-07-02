/**
 * FitSync Nutrition Planner - Workout History Windows (Step 1B)
 *
 * Pure, deterministic helpers that summarize a user's real workout history
 * into fixed time windows (today, last 3 / 7 / 30 days). No database access,
 * no I/O, no randomness. Calorie/duration values come only from the workout
 * records that are passed in - nothing is invented.
 *
 * Workout shape (from workoutRepository.hydrateWorkouts):
 *   {
 *     date: "YYYY-MM-DD",
 *     durationTotal: number,
 *     caloriesTotal: number,
 *     caloriesBurned: number,
 *     calories: number,
 *     exercises: [{ duration: number, ... }]
 *   }
 *
 * All dates are handled as local YYYY-MM-DD strings so no timezone conversion
 * can accidentally shift a workout into a neighboring day.
 */

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Convert a Date (or an already-formatted YYYY-MM-DD string) into a local
 * YYYY-MM-DD string. Uses local calendar parts so the date is never shifted by
 * a UTC offset.
 *
 * @param {Date|string} date
 * @returns {string} YYYY-MM-DD
 */
function toLocalDateString(date = new Date()) {
  if (typeof date === "string") {
    // Trust an already date-only string; otherwise slice a longer ISO string.
    return date.slice(0, 10);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Add (or subtract) a whole number of days to a YYYY-MM-DD string using local
 * calendar math. Returns a YYYY-MM-DD string.
 *
 * @param {string} dateStr YYYY-MM-DD
 * @param {number} deltaDays positive or negative day offset
 * @returns {string} YYYY-MM-DD
 */
function addDays(dateStr, deltaDays) {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Local midnight; noon avoids any DST edge weirdness around midnight.
  const d = new Date(year, month - 1, day, 12, 0, 0, 0);
  d.setDate(d.getDate() + deltaDays);
  return toLocalDateString(d);
}

/**
 * Select the calorie value for a workout using a strict fallback order.
 * Never invents calories - unknown/invalid values resolve to 0.
 *
 * Order: caloriesBurned -> caloriesTotal -> calories -> 0
 *
 * @param {object} workout
 * @returns {number}
 */
function getWorkoutCalories(workout = {}) {
  if (isFiniteNumber(workout.caloriesBurned)) return workout.caloriesBurned;
  if (isFiniteNumber(workout.caloriesTotal)) return workout.caloriesTotal;
  if (isFiniteNumber(workout.calories)) return workout.calories;
  return 0;
}

/**
 * Select the duration (minutes) for a workout.
 * Order: durationTotal -> sum of exercise durations -> 0
 *
 * @param {object} workout
 * @returns {number}
 */
function getWorkoutDuration(workout = {}) {
  if (isFiniteNumber(workout.durationTotal)) return workout.durationTotal;

  if (Array.isArray(workout.exercises) && workout.exercises.length > 0) {
    const sum = workout.exercises.reduce((total, exercise) => {
      const d = Number(exercise?.duration);
      return total + (Number.isFinite(d) ? d : 0);
    }, 0);
    return sum;
  }

  return 0;
}

/**
 * Summarize the workouts that fall within [startDate, endDate] inclusive.
 *
 * @param {Array<object>} workouts workout records (any date range)
 * @param {number} days number of days the window spans (for averages)
 * @param {string} startDate YYYY-MM-DD inclusive lower bound
 * @param {string} endDate YYYY-MM-DD inclusive upper bound
 * @returns {{
 *   days: number, startDate: string, endDate: string, workoutCount: number,
 *   totalCaloriesBurned: number, totalMinutes: number,
 *   averageDailyBurn: number, averageWorkoutBurn: number
 * }}
 */
function summarizeWorkoutWindow(workouts, days, startDate, endDate) {
  const list = Array.isArray(workouts) ? workouts : [];

  let workoutCount = 0;
  let totalCaloriesBurned = 0;
  let totalMinutes = 0;

  for (const workout of list) {
    const workoutDate = toLocalDateString(workout?.date);
    if (!workoutDate) continue;
    // Inclusive string comparison works because dates are zero-padded YYYY-MM-DD.
    if (workoutDate < startDate || workoutDate > endDate) continue;

    workoutCount += 1;
    totalCaloriesBurned += getWorkoutCalories(workout);
    totalMinutes += getWorkoutDuration(workout);
  }

  totalCaloriesBurned = Math.round(totalCaloriesBurned);
  totalMinutes = Math.round(totalMinutes);

  const averageDailyBurn = days > 0 ? Math.round(totalCaloriesBurned / days) : 0;
  const averageWorkoutBurn =
    workoutCount > 0 ? Math.round(totalCaloriesBurned / workoutCount) : 0;

  return {
    days,
    startDate,
    endDate,
    workoutCount,
    totalCaloriesBurned,
    totalMinutes,
    averageDailyBurn,
    averageWorkoutBurn
  };
}

/**
 * Build all workout history windows from a single list of workouts.
 *
 * Windows (all inclusive, ending on todayDate):
 *   today      -> just todayDate               (1 day)
 *   threeDays  -> today and the previous 2 days (3 days)
 *   sevenDays  -> today and the previous 6 days (7 days)
 *   thirtyDays -> today and the previous 29 days (30 days)
 *
 * @param {Array<object>} workouts workout records covering (at least) 30 days
 * @param {Date|string} todayDate reference "today"
 * @returns {{ today, threeDays, sevenDays, thirtyDays }}
 */
function buildWorkoutWindows(workouts, todayDate = new Date()) {
  const endDate = toLocalDateString(todayDate);

  return {
    today: summarizeWorkoutWindow(workouts, 1, endDate, endDate),
    threeDays: summarizeWorkoutWindow(workouts, 3, addDays(endDate, -2), endDate),
    sevenDays: summarizeWorkoutWindow(workouts, 7, addDays(endDate, -6), endDate),
    thirtyDays: summarizeWorkoutWindow(workouts, 30, addDays(endDate, -29), endDate)
  };
}

module.exports = {
  // low-level helpers
  toLocalDateString,
  addDays,
  getWorkoutCalories,
  getWorkoutDuration,
  // window builders
  summarizeWorkoutWindow,
  buildWorkoutWindows
};
