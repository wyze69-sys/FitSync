const test = require("node:test");
const assert = require("node:assert");

const {
  ACTIVITY_LIBRARY,
  CALORIE_METHODS,
  INTENSITY_LEVELS,
  activitiesForCategory
} = require("../src/data/activityLibrary");
const {
  computeActivityWorkout,
  validateActivityInputs
} = require("../src/utils/activityCalculator");

const MAIN_CATEGORIES = ["strength", "cardio", "hiit", "yoga", "mobility", "sports"];

function bySlug(slug) {
  const activity = ACTIVITY_LIBRARY.find((a) => a.slug === slug);
  assert.ok(activity, `activity ${slug} should exist`);
  return activity;
}

// ---------------------------------------------------------------------------
// 1. Each main category has at least 15 active activities.
// ---------------------------------------------------------------------------
test("each category has at least 15 active activities", () => {
  for (const category of MAIN_CATEGORIES) {
    const activities = activitiesForCategory(category);
    assert.ok(
      activities.length >= 15,
      `${category} should have >= 15 activities, found ${activities.length}`
    );
  }
  assert.ok(ACTIVITY_LIBRARY.length >= 90, `library should hold >= 90 activities, found ${ACTIVITY_LIBRARY.length}`);
});

// ---------------------------------------------------------------------------
// 2. Every activity carries the required calculation metadata.
// ---------------------------------------------------------------------------
test("every activity has the required metadata fields", () => {
  const seenSlugs = new Set();
  for (const activity of ACTIVITY_LIBRARY) {
    assert.ok(activity.slug, "slug is required");
    assert.ok(!seenSlugs.has(activity.slug), `slug ${activity.slug} must be unique`);
    seenSlugs.add(activity.slug);

    assert.ok(activity.name, `${activity.slug} needs a name`);
    assert.ok(MAIN_CATEGORIES.includes(activity.categorySlug), `${activity.slug} needs a valid category`);
    assert.ok(Number(activity.baseMet) > 0, `${activity.slug} needs a positive baseMet`);
    assert.ok(CALORIE_METHODS.includes(activity.calorieMethod), `${activity.slug} needs a valid calorieMethod`);
    assert.ok(INTENSITY_LEVELS.includes(activity.intensityLevel), `${activity.slug} needs a valid intensity`);
    assert.ok(Array.isArray(activity.trackingFields) && activity.trackingFields.length > 0, `${activity.slug} needs trackingFields`);
  }
});

// ---------------------------------------------------------------------------
// 3. Running uses distance + duration + pace-adjusted MET.
// ---------------------------------------------------------------------------
test("running calculation uses distance, duration and pace-adjusted MET", () => {
  const running = bySlug("running");
  const result = computeActivityWorkout(running, { duration_min: 40, distance_km: 10 }, 70, { weeklyStreak: 0 });
  // 15 km/h pace -> MET 12.51 -> 613 kcal; matches the logweb PDF running example.
  assert.strictEqual(result.met, 12.51);
  assert.strictEqual(result.calories, 613);
  assert.strictEqual(result.xp, 167);
  assert.strictEqual(result.xpBreakdown.cardioBonus, 40);
});

// ---------------------------------------------------------------------------
// 4. Barbell Curl uses sets * reps * weight volume.
// ---------------------------------------------------------------------------
test("barbell curl calculation uses strength volume", () => {
  const curl = bySlug("barbell-curl");
  const result = computeActivityWorkout(curl, { duration_min: 30, sets: 3, reps: 12, weight: 20 }, 70);
  assert.strictEqual(result.totalVolumeKg, 720);
  // base 128.625 * strength active-time factor 0.65 = 83.61 * volume modifier 1.0144 -> 85
  assert.strictEqual(result.calories, 85);
  assert.strictEqual(result.xpBreakdown.totalVolumeKg, 720);
  assert.ok(result.xpBreakdown.strengthBonus > 0);
});

// ---------------------------------------------------------------------------
// 5. Push Up uses bodyweightFactor for the performance bonus.
// ---------------------------------------------------------------------------
test("push up calculation uses bodyweight factor", () => {
  const pushUp = bySlug("push-up");
  const result = computeActivityWorkout(pushUp, { duration_min: 15, reps: 40 }, 70);
  assert.strictEqual(result.calories, 48); // 4*3.5*70/200*15=73.5 -> *0.65 strength factor = 48
  assert.strictEqual(result.xpBreakdown.bodyweightFactor, 0.65);
  assert.strictEqual(result.xpBreakdown.bodyweightBonus, 6.5);
  assert.strictEqual(result.xp, 54);
});

// ---------------------------------------------------------------------------
// 6. Plank supports hold time (calories derived from the hold duration).
// ---------------------------------------------------------------------------
test("plank calculation supports hold time", () => {
  const plank = bySlug("plank");
  const result = computeActivityWorkout(plank, { holdTime: 120 }, 70);
  assert.strictEqual(result.durationMin, 2); // 120s -> 2 min
  assert.strictEqual(result.calories, 5); // 3.3*3.5*70/200*2=8.085 -> *0.65 strength factor = 5
  assert.ok(result.xpBreakdown.bodyweightBonus > 0, "hold time should drive a bodyweight bonus");
});

// ---------------------------------------------------------------------------
// 7. Yoga uses duration-only MET (no distance / volume).
// ---------------------------------------------------------------------------
test("yoga calculation uses duration-only MET", () => {
  const hatha = bySlug("hatha-yoga");
  const result = computeActivityWorkout(hatha, { duration_min: 45 }, 70);
  assert.strictEqual(result.met, 2.8);
  assert.strictEqual(result.calories, 154);
  assert.strictEqual(result.xp, 93);
  assert.strictEqual(result.totalVolumeKg, 0);
});

// ---------------------------------------------------------------------------
// 8. Sports use a sport-specific MET over duration.
// ---------------------------------------------------------------------------
test("sports calculation uses sport MET over duration", () => {
  const basketball = bySlug("basketball");
  const result = computeActivityWorkout(basketball, { duration_min: 60 }, 70);
  assert.strictEqual(result.met, 6.5);
  assert.strictEqual(result.calories, 478);
  assert.strictEqual(result.xp, 151);
});

// ---------------------------------------------------------------------------
// 9. Validation rejects missing required fields per activity type.
// ---------------------------------------------------------------------------
test("validation rejects missing required fields", () => {
  assert.ok(validateActivityInputs(bySlug("running"), { distance_km: 5 }), "running needs duration");
  assert.ok(validateActivityInputs(bySlug("barbell-curl"), { duration_min: 30, sets: 3, reps: 12 }), "curl needs weight");
  assert.ok(validateActivityInputs(bySlug("plank"), {}), "plank needs hold time");
  assert.ok(validateActivityInputs(bySlug("push-up"), { duration_min: 15 }), "push up needs reps");

  // Valid payloads return null (no error).
  assert.strictEqual(validateActivityInputs(bySlug("running"), { duration_min: 40, distance_km: 10 }), null);
  assert.strictEqual(validateActivityInputs(bySlug("barbell-curl"), { duration_min: 30, sets: 3, reps: 12, weight: 20 }), null);
  assert.strictEqual(validateActivityInputs(bySlug("plank"), { holdTime: 60 }), null);
  assert.strictEqual(validateActivityInputs(bySlug("hatha-yoga"), { duration_min: 30 }), null);
});

// ---------------------------------------------------------------------------
// 10. XP breakdown always includes formulaVersion and the major fields.
// ---------------------------------------------------------------------------
test("xp breakdown includes formulaVersion and all major fields", () => {
  const result = computeActivityWorkout(bySlug("vinyasa-yoga"), { duration_min: 45 }, 70, { weeklyStreak: 0 });
  const b = result.xpBreakdown;
  assert.strictEqual(b.formulaVersion, "logweb_pdf_v1");
  for (const key of [
    "baseCompletionXp",
    "durationXp",
    "intensityXp",
    "cardioBonus",
    "strengthBonus",
    "bodyweightBonus",
    "performanceBonus",
    "streakBonus",
    "finalXp"
  ]) {
    assert.ok(b[key] !== undefined, `breakdown should include ${key}`);
  }
});
