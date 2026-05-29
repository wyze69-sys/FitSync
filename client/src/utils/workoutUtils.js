/**
 * Date helpers shared by the workout and progress views.
 *
 * Note: streak, badge, and check-in logic used to live here and was persisted
 * only in localStorage. That has moved to the backend (gamification service +
 * MySQL) so streaks and achievements persist across devices.
 */

/**
 * Format a date value as YYYY-MM-DD in the user's local timezone.
 */
export function formatDateStr(dateVal) {
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    return dateVal;
  }
  const date = new Date(dateVal);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Today's date as a YYYY-MM-DD string (used as the default for log forms).
 */
export function todayStr() {
  return formatDateStr(new Date());
}
