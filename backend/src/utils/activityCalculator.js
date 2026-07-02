/**
 * Activity-aware calorie/XP computation.
 *
 * This module sits ON TOP of utils/calculators.js (the logweb PDF engine). It
 * never re-implements the PDF formulas — it only resolves the right MET and
 * inputs from an activity-library record and delegates to calculateCalories /
 * calculateXpBreakdown so the PDF behavior stays identical for category-only
 * logging.
 */

const {
  calculateCalories,
  calculateXpBreakdown,
  calculateMet
} = require("./calculators");

const PACE_PROFILES = new Set(["running", "cycling", "walking"]);

/**
 * Coerces a value to a finite, non-negative number (0 when invalid).
 * @param {*} value Raw value.
 * @returns {number}
 */
function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Reads a metadata field accepting both camelCase (data module / API) and
 * snake_case (DB row) spellings.
 * @param {object} activity Activity record.
 * @param {string} camel camelCase key.
 * @param {string} snake snake_case key.
 * @returns {*}
 */
function field(activity, camel, snake) {
  return activity[camel] ?? activity[snake];
}

/**
 * Normalizes raw workout inputs into the canonical numeric shape.
 * @param {object} inputs Raw inputs (mixed casing).
 * @returns {{durationMin:number,distanceKm:number,sets:number,reps:number,weight:number,holdSec:number}}
 */
function normalizeInputs(inputs = {}) {
  return {
    durationMin: num(inputs.durationMin ?? inputs.duration_min ?? inputs.duration),
    distanceKm: num(inputs.distanceKm ?? inputs.distance_km ?? inputs.distance),
    sets: num(inputs.sets),
    reps: num(inputs.reps),
    weight: num(inputs.weight),
    holdSec: num(inputs.holdSec ?? inputs.holdTime ?? inputs.hold_time)
  };
}

/**
 * Returns the list of tracking fields that MUST be supplied for an activity,
 * derived from its calorie method (single source of truth for validation).
 * @param {object} activity Activity record.
 * @returns {string[]}
 */
function requiredFieldsFor(activity) {
  const method = field(activity, "calorieMethod", "calorie_method") || "met_duration";
  if (method === "distance_multiplier") return ["distance"];
  if (method === "strength_volume") return ["duration", "sets", "reps", "weight"];
  if (method === "bodyweight_volume") return ["duration", "reps"];
  if (method === "timed_hold") return ["holdTime"];
  return ["duration"];
}

/**
 * Validates raw inputs against an activity's required fields.
 * @param {object} activity Activity record.
 * @param {object} inputs Raw inputs.
 * @returns {string|null} Error message, or null when valid.
 */
function validateActivityInputs(activity, inputs = {}) {
  const v = normalizeInputs(inputs);
  const required = requiredFieldsFor(activity);
  const name = activity.name || activity.slug || "activity";

  for (const f of required) {
    if (f === "duration" && v.durationMin <= 0) {
      return `Duration is required for ${name}.`;
    }
    if (f === "distance" && v.distanceKm <= 0) {
      return `Distance is required for ${name}.`;
    }
    if (f === "sets" && v.sets <= 0) {
      return `Sets are required for ${name}.`;
    }
    if (f === "reps" && v.reps <= 0) {
      return `Reps are required for ${name}.`;
    }
    if (f === "weight" && v.weight <= 0) {
      return `Weight is required for ${name}.`;
    }
    if (f === "holdTime" && v.holdSec <= 0) {
      return `Hold time is required for ${name}.`;
    }
  }
  return null;
}

/**
 * Resolves the calorie MET for an activity. distance_met activities with a
 * supported pace profile get a pace-adjusted MET; everything else uses baseMet.
 * @param {object} activity Activity record.
 * @param {{distanceKm:number,durationMin:number}} v Normalized inputs.
 * @returns {number}
 */
function resolveCalorieMet(activity, v) {
  const baseMet = Number(field(activity, "baseMet", "base_met")) || 0;
  const method = field(activity, "calorieMethod", "calorie_method");
  const paceProfile = field(activity, "paceProfile", "pace_profile");

  if (method === "distance_met" && PACE_PROFILES.has(paceProfile) && v.distanceKm > 0 && v.durationMin > 0) {
    return calculateMet(paceProfile, v.distanceKm, v.durationMin, baseMet);
  }
  return baseMet;
}

/**
 * Computes the full server-side reward for a selected activity.
 *
 * @param {object} activity Activity-library record (camelCase or DB row).
 * @param {object} inputs Raw workout inputs.
 * @param {number} weightKg User weight in kilograms.
 * @param {object} [options] { weeklyStreak }
 * @returns {{calories:number, xp:number, xpBreakdown:object, met:number, totalVolumeKg:number, durationMin:number}}
 */
function computeActivityWorkout(activity, inputs, weightKg, options = {}) {
  const v = normalizeInputs(inputs);
  const method = field(activity, "calorieMethod", "calorie_method") || "met_duration";
  const baseMet = Number(field(activity, "baseMet", "base_met")) || 0;
  const categorySlug = field(activity, "categorySlug", "category_slug") || "";
  const weeklyStreak = Number(options.weeklyStreak || 0);

  // Effective duration: timed holds without a separate duration use hold time.
  let durationMin = v.durationMin;
  if (method === "timed_hold" && durationMin <= 0 && v.holdSec > 0) {
    durationMin = v.holdSec / 60;
  }

  const totalVolumeKg = v.sets > 0 && v.reps > 0 && v.weight > 0 ? v.sets * v.reps * v.weight : 0;
  const bodyweightFactorRaw = field(activity, "bodyweightFactor", "bodyweight_factor");
  const hasBodyweightFactor = bodyweightFactorRaw !== null && bodyweightFactorRaw !== undefined;
  const bodyweightFactor = Number(bodyweightFactorRaw) || 0;

  const calorieMet = resolveCalorieMet(activity, { distanceKm: v.distanceKm, durationMin });

  // Build the workout payload understood by the PDF calculators.
  const workout = {
    category: categorySlug,
    duration_min: durationMin,
    distance_km: v.distanceKm
  };

  // Calorie options. categoryMeta carries the resolved MET so the strength
  // family check inside calculateCalories still applies the volume modifier.
  const calorieOptions = { met: calorieMet, categoryMeta: { baseMet: calorieMet } };
  const distanceMultiplier = field(activity, "distanceMultiplier", "distance_multiplier");
  if (distanceMultiplier !== null && distanceMultiplier !== undefined) {
    calorieOptions.distanceMultiplier = Number(distanceMultiplier);
  }
  if (method === "strength_volume" && totalVolumeKg > 0) {
    calorieOptions.totalVolumeKg = totalVolumeKg;
  }

  const calories = calculateCalories(workout, weightKg, calorieOptions);

  // XP options. Intensity uses the activity default MET (not pace-adjusted),
  // matching the PDF worked examples. Performance bonus derives from the
  // method-appropriate input only.
  const xpOptions = {
    defaultMet: baseMet,
    categoryMeta: { baseMet },
    weeklyStreak
  };
  if (totalVolumeKg > 0) xpOptions.totalVolumeKg = totalVolumeKg;
  if (method === "bodyweight_volume" && hasBodyweightFactor) {
    xpOptions.bodyweightFactor = bodyweightFactor;
    xpOptions.reps = v.reps;
  }
  if (method === "timed_hold" && hasBodyweightFactor) {
    // Hold seconds act as the "reps" driver so longer holds earn more bonus.
    xpOptions.bodyweightFactor = bodyweightFactor;
    xpOptions.reps = v.holdSec;
  }

  const xpBreakdown = calculateXpBreakdown(workout, xpOptions);

  return {
    calories,
    xp: xpBreakdown.finalXp,
    xpBreakdown,
    met: calorieMet,
    totalVolumeKg,
    durationMin
  };
}

module.exports = {
  computeActivityWorkout,
  validateActivityInputs,
  requiredFieldsFor,
  resolveCalorieMet,
  normalizeInputs
};
