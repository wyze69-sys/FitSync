/**
 * FitSync Nutrition Planner - Workout Window Service (Step 1B)
 *
 * Thin service layer that fetches a user's real workout history ONCE for the
 * widest (30-day) window and derives the smaller windows from that same data
 * using the pure helpers in nutritionWorkoutWindows.js.
 *
 * This will later be consumed by /api/nutrition/plan (not added in this step).
 */

const { workoutRepository } = require("../repositories/workoutRepository");
const {
  toLocalDateString,
  addDays,
  buildWorkoutWindows
} = require("../utils/nutritionWorkoutWindows");

/**
 * Fetch the last 30 days of workouts for a user (single query) and build the
 * today / 3-day / 7-day / 30-day summary windows.
 *
 * @param {string} userId
 * @param {Date|string} [todayDate=new Date()] reference "today"
 * @returns {Promise<{
 *   today, threeDays, sevenDays, thirtyDays
 * }>}
 */
async function getWorkoutWindowsForUser(userId, todayDate = new Date()) {
  const endDate = toLocalDateString(todayDate);
  const startDate = addDays(endDate, -29); // inclusive 30-day window

  // Single database read covers every window; smaller windows are filtered
  // in memory from these items.
  const result = await workoutRepository.getWorkoutsByUserId(userId, {
    from: startDate,
    to: endDate,
    sort: "date_desc",
    limit: 100
  });

  const items = Array.isArray(result?.items) ? result.items : [];
  return buildWorkoutWindows(items, todayDate);
}

module.exports = {
  nutritionPlanWorkoutService: {
    getWorkoutWindowsForUser
  }
};
