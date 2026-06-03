/**
 * Streak calculation tests.
 *
 * These cover the pure date math used by the gamification service. Repository
 * tests cover which tables are allowed to feed these dates.
 */

const test = require("node:test");
const assert = require("node:assert");

const { computeStreakStats } = require("../src/utils/streak");

test("current streak increments one day when yesterday and today are active", () => {
  const stats = computeStreakStats(["2026-06-02", "2026-06-03"], new Date(2026, 5, 3));

  assert.strictEqual(stats.currentStreak, 2);
  assert.strictEqual(stats.longestStreak, 2);
  assert.strictEqual(stats.lastActiveDate, "2026-06-03");
});

test("current streak does not bridge a missing calendar day", () => {
  const stats = computeStreakStats(
    ["2026-06-01", "2026-06-03"],
    new Date(2026, 5, 3)
  );

  assert.strictEqual(stats.currentStreak, 1);
  assert.strictEqual(stats.longestStreak, 1);
});

test("yesterday remains an active one-day current streak before today's check-in", () => {
  const stats = computeStreakStats(["2026-06-02"], new Date(2026, 5, 3));

  assert.strictEqual(stats.currentStreak, 1);
  assert.strictEqual(stats.lastActiveDate, "2026-06-02");
});
