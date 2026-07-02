const test = require("node:test");
const assert = require("node:assert");

const { awardStreakBadges } = require("../src/services/gamificationService");
const { gamificationRepository } = require("../src/repositories/gamificationRepository");
const { computeStreakStats } = require("../src/utils/streak");

/**
 * Installs a fake unlockAchievement that simulates the real INSERT IGNORE
 * behavior: the first unlock of a given code returns true (a row was inserted),
 * any repeat returns false (row already exists). Returns helpers to inspect
 * what happened and to restore the original implementation.
 */
function mockUnlock() {
  const original = gamificationRepository.unlockAchievement;
  const stored = new Set();
  const calls = [];

  gamificationRepository.unlockAchievement = async (userId, code) => {
    calls.push({ userId, code });
    const key = `${userId}:${code}`;
    if (stored.has(key)) return false; // already unlocked -> INSERT IGNORE no-op
    stored.add(key);
    return true;
  };

  return {
    stored,
    calls,
    restore() {
      gamificationRepository.unlockAchievement = original;
    }
  };
}

/**
 * Builds an array of N consecutive "YYYY-MM-DD" active dates ending today,
 * so computeStreakStats reports a daily currentStreak of exactly N.
 */
function consecutiveDaysEndingToday(n, now = new Date()) {
  const dates = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < n; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

test("daily streak 3 unlocks streak_3 only", async () => {
  const mock = mockUnlock();
  try {
    const awarded = await awardStreakBadges("user-a", 3);
    assert.deepStrictEqual(awarded, ["streak_3"]);
    assert.ok(mock.stored.has("user-a:streak_3"));
    assert.ok(!mock.stored.has("user-a:streak_7"));
  } finally {
    mock.restore();
  }
});

test("daily streak 7 unlocks streak_3 and streak_7", async () => {
  const mock = mockUnlock();
  try {
    const awarded = await awardStreakBadges("user-b", 7);
    assert.deepStrictEqual(awarded, ["streak_3", "streak_7"]);
    assert.ok(mock.stored.has("user-b:streak_3"));
    assert.ok(mock.stored.has("user-b:streak_7"));
    assert.ok(!mock.stored.has("user-b:streak_14"));
  } finally {
    mock.restore();
  }
});

test("daily streak 30 unlocks every streak badge", async () => {
  const mock = mockUnlock();
  try {
    const awarded = await awardStreakBadges("user-c", 30);
    assert.deepStrictEqual(awarded, ["streak_3", "streak_7", "streak_14", "streak_30"]);
  } finally {
    mock.restore();
  }
});

test("repeated calls do not duplicate unlocks", async () => {
  const mock = mockUnlock();
  try {
    const first = await awardStreakBadges("user-d", 7);
    assert.deepStrictEqual(first, ["streak_3", "streak_7"]);

    // Second call at the same streak should award nothing new.
    const second = await awardStreakBadges("user-d", 7);
    assert.deepStrictEqual(second, []);

    // Still only one stored row per code.
    assert.strictEqual([...mock.stored].filter((k) => k.startsWith("user-d:")).length, 2);
  } finally {
    mock.restore();
  }
});

test("daily streak below 3 unlocks nothing", async () => {
  const mock = mockUnlock();
  try {
    const awarded = await awardStreakBadges("user-e", 2);
    assert.deepStrictEqual(awarded, []);
    assert.strictEqual(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});

// Day-based threshold behavior: feed real consecutive daily activity through
// computeStreakStats (the same source buildSummary uses) and confirm the daily
// streak count — not a weekly count — drives which badges unlock.
test("award uses DAILY streak from computeStreakStats (7 consecutive days -> streak_3 + streak_7)", async () => {
  const mock = mockUnlock();
  try {
    const activeDates = consecutiveDaysEndingToday(7);
    const stats = computeStreakStats(activeDates);
    assert.strictEqual(stats.currentStreak, 7, "7 consecutive days should be a 7-DAY streak");

    const awarded = await awardStreakBadges("user-f", stats.currentStreak);
    assert.deepStrictEqual(awarded, ["streak_3", "streak_7"]);
    assert.ok(!mock.stored.has("user-f:streak_14"));
  } finally {
    mock.restore();
  }
});

test("award uses DAILY streak: 3 consecutive days unlocks only streak_3", async () => {
  const mock = mockUnlock();
  try {
    const stats = computeStreakStats(consecutiveDaysEndingToday(3));
    assert.strictEqual(stats.currentStreak, 3);

    const awarded = await awardStreakBadges("user-g", stats.currentStreak);
    assert.deepStrictEqual(awarded, ["streak_3"]);
  } finally {
    mock.restore();
  }
});
