/**
 * Pure helpers for computing activity streaks from a list of active dates.
 * Kept dependency-free and side-effect-free so it is easy to reason about and test.
 */

function toDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateStr(dateStr) {
  const [year, month, day] = dateStr.split("-").map((part) => parseInt(part, 10));
  return new Date(year, month - 1, day);
}

/**
 * Compute current streak, longest streak, and weekly consistency.
 * @param {string[]} activeDates - Unique "YYYY-MM-DD" strings (any order).
 * @param {Date} [now] - Reference "today" (defaults to current date).
 */
function computeStreakStats(activeDates, now = new Date()) {
  const dateSet = new Set(activeDates);
  const sortedDates = [...dateSet].sort();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = toDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  let currentStreak = 0;
  if (dateSet.has(todayStr) || dateSet.has(yesterdayStr)) {
    const cursor = dateSet.has(todayStr) ? new Date(today) : new Date(yesterday);
    let cursorStr = toDateStr(cursor);
    while (dateSet.has(cursorStr)) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
      cursorStr = toDateStr(cursor);
    }
  }

  let longestStreak = 0;
  if (sortedDates.length > 0) {
    let tempStreak = 0;
    const cursor = parseDateStr(sortedDates[0]);
    while (cursor <= today) {
      if (dateSet.has(toDateStr(cursor))) {
        tempStreak += 1;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  let activeDaysInLast7 = 0;
  for (let i = 0; i < 7; i += 1) {
    const checkpoint = new Date(today);
    checkpoint.setDate(today.getDate() - i);
    if (dateSet.has(toDateStr(checkpoint))) activeDaysInLast7 += 1;
  }
  const weeklyConsistency = Math.round((activeDaysInLast7 / 7) * 100);

  return {
    currentStreak,
    longestStreak,
    weeklyConsistency,
    activeDaysInLast7,
    lastActiveDate: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null
  };
}

function streakMessage(currentStreak) {
  if (currentStreak <= 0) {
    return "Every session helps. Complete a workout today to start a streak.";
  }
  if (currentStreak === 1) {
    return "First step taken. Log tomorrow to start building momentum.";
  }
  if (currentStreak < 4) {
    return "You are building consistency. Stay on target and keep the streak going.";
  }
  if (currentStreak < 7) {
    return "Four or more days in a row. Consistency is becoming part of your routine.";
  }
  if (currentStreak < 14) {
    return "One week milestone reached. Your routine is getting stronger.";
  }
  return "Two weeks or more. Your habit is becoming reliable.";
}

module.exports = { computeStreakStats, streakMessage, toDateStr };
