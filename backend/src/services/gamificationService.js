const { gamificationRepository } = require("../repositories/gamificationRepository");
const { computeStreakStats, streakMessage, toDateStr } = require("../utils/streak");

/**
 * Build the full gamification summary for a user: streak stats, weekly totals,
 * and the achievement (badge) list. Persists the streak and unlocks any newly
 * earned achievements so the data is available to admins and the AI insight.
 */
async function buildSummary(userId) {
  const activeDates = await gamificationRepository.getActivityDates(userId);
  const stats = computeStreakStats(activeDates);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekly = await gamificationRepository.getWeeklyWorkoutTotals(
    userId,
    toDateStr(sevenDaysAgo)
  );

  await gamificationRepository.upsertStreak(
    userId,
    stats.currentStreak,
    stats.longestStreak,
    stats.lastActiveDate
  );

  const catalog = await gamificationRepository.getAchievementCatalog();
  const unlocked = await gamificationRepository.getUnlockedAchievements(userId);

  const newlyUnlocked = [];
  for (const achievement of catalog) {
    const qualifies =
      achievement.requirementType === "streak" &&
      stats.longestStreak >= achievement.requirementValue;
    if (qualifies && !unlocked.has(achievement.code)) {
      const inserted = await gamificationRepository.unlockAchievement(userId, achievement.code);
      if (inserted) newlyUnlocked.push(achievement);
    }
  }

  const badges = catalog.map((achievement) => ({
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    requirement: `${achievement.requirementValue}-Day Streak`,
    value: achievement.requirementValue,
    isUnlocked:
      stats.longestStreak >= achievement.requirementValue || unlocked.has(achievement.code),
    unlockedAt: unlocked.get(achievement.code) || null
  }));

  return {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    weeklyConsistency: stats.weeklyConsistency,
    activeDaysInLast7: stats.activeDaysInLast7,
    lastActiveDate: stats.lastActiveDate,
    totalWorkoutsThisWeek: weekly.workoutCount,
    totalMinutesThisWeek: weekly.totalMinutes,
    totalCaloriesThisWeek: weekly.totalCalories,
    streakMessage: streakMessage(stats.currentStreak),
    badges,
    newlyUnlocked: newlyUnlocked.map((achievement) => ({
      code: achievement.code,
      name: achievement.name,
      description: achievement.description
    }))
  };
}

const gamificationService = {
  async getSummary(userId) {
    return buildSummary(userId);
  },

  async recordCheckin(userId, type) {
    const today = toDateStr(new Date());
    const created = await gamificationRepository.addCheckin(
      userId,
      today,
      type || "Wellness check-in"
    );
    const summary = await buildSummary(userId);
    return { ...summary, checkinCreated: created, alreadyCheckedIn: !created };
  },

  async getStatistics() {
    return gamificationRepository.getStreakStatistics();
  }
};

module.exports = { gamificationService };
