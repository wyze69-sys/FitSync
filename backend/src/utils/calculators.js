const DEFAULT_WEIGHT_KG = 70;

/**
 * Identifier stored in every xp breakdown so we can trace which formula
 * generation produced a reward. Matches the "logweb Calculation Guide" PDF.
 */
const FORMULA_VERSION = "logweb_pdf_v1";

/**
 * Strength active-time factor (logweb PDF-compatible adjustment, not a formula
 * change). Resistance training is not continuous effort — sets are separated by
 * rest — so the logged duration overstates the energy cost when treated like
 * cardio. We keep the MET formula intact and scale the duration-derived calories
 * by this factor so strength logging reads realistically. 0.65 sits in the
 * middle of the common 0.55–0.70 "active-time" band for lifting.
 */
const STRENGTH_ACTIVE_TIME_FACTOR = 0.65;

const CATEGORY_PROFILES = {
  cardio: { baseMet: 7.5, xpPerMetMin: 0.18 },
  strength: { baseMet: 6, xpPerMetMin: 0.2 },
  hiit: { baseMet: 8, xpPerMetMin: 0.22 },
  yoga: { baseMet: 4, xpPerMetMin: 0.25 },
  mobility: { baseMet: 2.8, xpPerMetMin: 0.22 },
  sports: { baseMet: 7, xpPerMetMin: 0.2 },
  running: { baseMet: 9.8, xpPerMetMin: 0.18, family: "cardio" },
  cycling: { baseMet: 7.5, xpPerMetMin: 0.18, family: "cardio" },
  walking: { baseMet: 3.5, xpPerMetMin: 0.2, family: "cardio" },
  swimming: { baseMet: 8, xpPerMetMin: 0.18, family: "cardio" },
  "yoga-vinyasa": { baseMet: 4, xpPerMetMin: 0.25, family: "yoga" }
};

/**
 * Default bodyweight movement factors (logweb PDF section 3.2). Used when the
 * activity has no external load but reps are tracked.
 */
const BODYWEIGHT_FACTORS = {
  "push up": 0.65,
  "push-up": 0.65,
  pushup: 0.65,
  "pull up": 1.0,
  "pull-up": 1.0,
  pullup: 1.0,
  plank: 0.3
};

/**
 * Returns the normalized category slug used by reward calculations.
 * @param {object} workout Workout payload or row-like object.
 * @returns {string}
 */
function getCategorySlug(workout = {}) {
  return String(workout.category || workout.categorySlug || workout.slug || "")
    .trim()
    .toLowerCase();
}

/**
 * Returns the workout duration in minutes from supported API field names.
 * @param {object} workout Workout payload or row-like object.
 * @returns {number}
 */
function getDurationMinutes(workout = {}) {
  return Number(workout.duration_min ?? workout.durationMin ?? workout.duration ?? 0) || 0;
}

/**
 * Returns the workout distance in kilometres from supported API field names.
 * @param {object} workout Workout payload or row-like object.
 * @returns {number}
 */
function getDistanceKm(workout = {}) {
  return Number(workout.distance_km ?? workout.distanceKm ?? 0) || 0;
}

/**
 * Resolves a category profile with DB metadata overriding static defaults.
 * @param {string} slug Category slug.
 * @param {object} categoryMeta Optional DB category metadata.
 * @returns {{baseMet: number, xpPerMetMin: number, family?: string}}
 */
function resolveCategoryProfile(slug, categoryMeta = null) {
  const fallback = CATEGORY_PROFILES[slug] || CATEGORY_PROFILES.cardio;
  return {
    baseMet: Number(categoryMeta?.baseMet ?? categoryMeta?.base_met ?? fallback.baseMet),
    xpPerMetMin: Number(categoryMeta?.xpPerMetMin ?? categoryMeta?.xp_per_met_min ?? fallback.xpPerMetMin),
    family: fallback.family || slug
  };
}

/**
 * Looks up a bodyweight movement factor from an exercise name.
 * @param {string} name Exercise name.
 * @returns {number|null}
 */
function bodyweightFactorForName(name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;
  if (BODYWEIGHT_FACTORS[key] !== undefined) return BODYWEIGHT_FACTORS[key];
  for (const [movement, factor] of Object.entries(BODYWEIGHT_FACTORS)) {
    if (key.includes(movement)) return factor;
  }
  return null;
}

/**
 * Calculates MET for cardio workouts with distance-aware speed bands.
 * @param {string} slug Category slug.
 * @param {number} distanceKm Distance in kilometres.
 * @param {number} durationMin Duration in minutes.
 * @param {number} fallbackMet Category fallback MET.
 * @returns {number}
 */
function calculateMet(slug, distanceKm, durationMin, fallbackMet) {
  const speed = durationMin > 0 ? distanceKm / (durationMin / 60) : 0;

  if (slug === "running" || slug === "cardio") {
    if (speed >= 14) return 12.51;
    if (speed >= 12) return 11;
    if (speed >= 10) return 10;
    if (speed >= 8) return 8.29;
    return distanceKm > 0 ? 7 : fallbackMet;
  }

  if (slug === "cycling") {
    if (speed >= 25) return 12;
    if (speed >= 20) return 8;
    if (speed > 15) return 6;
    if (speed >= 10) return 4;
    return 3.5;
  }

  if (slug === "walking") {
    if (speed >= 6.5) return 5;
    if (speed >= 5) return 3.8;
    return 3.5;
  }

  return fallbackMet;
}

/**
 * Strength volume modifier (logweb PDF 3.2). Returns 1 when no meaningful
 * volume is logged, scaling up to ~1.15 for high-volume sessions.
 * @param {number} totalVolumeKg sets * reps * weight (kg).
 * @returns {number}
 */
function volumeModifierForVolume(totalVolumeKg) {
  const volume = Number(totalVolumeKg || 0);
  if (volume <= 0) return 1;
  return 1 + Math.min(volume / 50000, 0.15);
}

/**
 * Calculates workout calories server-side using the logweb PDF MET formula:
 *   calories = MET * 3.5 * weightKg / 200 * minutes
 * Supports cardio distance-only estimation (when a distanceMultiplier exists)
 * and a strength volume modifier when sets/reps/weight are provided.
 * @param {object} workout Workout payload.
 * @param {number} weightKg User weight in kilograms.
 * @param {object} options Optional category metadata, met override, and strength inputs.
 * @returns {number}
 */
function calculateCalories(workout, weightKg = DEFAULT_WEIGHT_KG, options = {}) {
  const slug = getCategorySlug(workout);
  const profile = resolveCategoryProfile(slug, options.categoryMeta);
  const durationMin = getDurationMinutes(workout);
  const distanceKm = getDistanceKm(workout);
  const met = options.met || calculateMet(slug, distanceKm, durationMin, profile.baseMet);
  const w = Number(weightKg || DEFAULT_WEIGHT_KG);

  // Cardio distance-only path: only when no duration but a distance multiplier exists.
  const distanceMultiplier = Number(
    options.distanceMultiplier ??
      options.categoryMeta?.distanceMultiplier ??
      options.categoryMeta?.distance_multiplier ??
      NaN
  );
  if (distanceKm > 0 && durationMin <= 0 && !Number.isNaN(distanceMultiplier)) {
    return Math.round(distanceKm * w * distanceMultiplier);
  }

  // Basic MET formula (PDF section 3).
  let baseCalories = (met * 3.5 * w) / 200 * durationMin;

  // Strength training includes rest between sets, so the full duration is not
  // continuous effort. Scale duration-derived calories by the active-time factor
  // (strength family only — HIIT stays continuous). This is an explainable
  // adjustment layered on top of the PDF MET formula, not a replacement.
  const isStrengthFamily = profile.family === "strength" || slug === "strength";
  if (isStrengthFamily) {
    baseCalories *= STRENGTH_ACTIVE_TIME_FACTOR;
  }

  // Strength volume modifier (PDF section 3.2) when training volume is provided.
  const isStrength = isStrengthFamily || slug === "hiit";
  const totalVolumeKg = Number(options.totalVolumeKg || 0);
  if (isStrength && totalVolumeKg > 0) {
    return Math.round(baseCalories * volumeModifierForVolume(totalVolumeKg));
  }

  return Math.round(baseCalories);
}

/**
 * Maps a weekly streak count to an XP streak bonus (logweb PDF section 4).
 *
 * NOTE: The PDF worked example (page 4) and the required regression test use
 * streakBonus = 10 at weekly streak 3, so the "10" tier spans streaks 1-3.
 * @param {number} weeklyStreak Weekly (not daily) streak count.
 * @returns {number} 0, 10, 15, or 25.
 */
function streakBonusForWeeklyStreak(weeklyStreak) {
  const s = Number(weeklyStreak || 0);
  if (s <= 0) return 0;
  if (s <= 3) return 10;
  if (s <= 5) return 15;
  return 25;
}

/**
 * Cost (in XP) to restore an at-risk weekly streak (logweb PDF section 6.1):
 *   restoreCost = min(150, 50 + 10 * weeklyStreak)
 * @param {number} weeklyStreak Current weekly streak count.
 * @returns {number}
 */
function restoreCostForWeeklyStreak(weeklyStreak) {
  return Math.min(150, 50 + 10 * Number(weeklyStreak || 0));
}

/**
 * Builds the full logweb XP breakdown for a workout (PDF section 4):
 *   finalXp = round(baseCompletionXp + durationXp + intensityXp
 *                   + performanceBonus + streakBonus)
 * Intensity always uses the activity default MET (not the pace-adjusted MET),
 * matching the PDF worked examples.
 * @param {object} workout Workout payload.
 * @param {object} options categoryMeta, defaultMet, distance/strength inputs, weeklyStreak.
 * @returns {object} Detailed xp breakdown including formulaVersion.
 */
function calculateXpBreakdown(workout, options = {}) {
  const slug = getCategorySlug(workout);
  const profile = resolveCategoryProfile(slug, options.categoryMeta);
  const durationMin = getDurationMinutes(workout);
  const distanceKm = getDistanceKm(workout);
  const defaultMet = Number(
    options.defaultMet ?? options.categoryMeta?.baseMet ?? options.categoryMeta?.base_met ?? profile.baseMet
  );
  const weeklyStreak = Number(options.weeklyStreak || 0);

  const baseCompletionXp = 20;
  const durationXp = Math.min(durationMin * 1.2, 90);
  const intensityXp = Math.min(defaultMet * durationMin * 0.15, 60);

  const cardioBonus = Math.min(distanceKm * 4, 40);

  const totalVolumeKg = Number(options.totalVolumeKg || 0);
  const strengthBonus = Math.min(totalVolumeKg / 500, 40);

  const bodyweightFactorRaw = options.bodyweightFactor;
  const hasBodyweightFactor = bodyweightFactorRaw !== undefined && bodyweightFactorRaw !== null;
  const bodyweightFactor = Number(bodyweightFactorRaw || 0);
  const bodyweightReps = Number(options.reps || 0);
  const bodyweightBonus = hasBodyweightFactor
    ? Math.min(bodyweightReps * bodyweightFactor * 0.25, 40)
    : 0;

  const performanceBonus = Math.max(cardioBonus, strengthBonus, bodyweightBonus, 0);
  const streakBonus = streakBonusForWeeklyStreak(weeklyStreak);

  const finalXp = Math.round(
    baseCompletionXp + durationXp + intensityXp + performanceBonus + streakBonus
  );

  const breakdown = {
    baseCompletionXp,
    durationXp,
    intensityXp,
    cardioBonus,
    strengthBonus,
    bodyweightBonus,
    performanceBonus,
    streakBonus,
    finalXp,
    met: defaultMet,
    durationMin,
    weeklyStreak,
    formulaVersion: FORMULA_VERSION
  };
  if (distanceKm > 0) breakdown.distanceKm = distanceKm;
  if (totalVolumeKg > 0) breakdown.totalVolumeKg = totalVolumeKg;
  if (hasBodyweightFactor) breakdown.bodyweightFactor = bodyweightFactor;

  return breakdown;
}

/**
 * Calculates workout XP server-side using the logweb PDF formula.
 * @param {object} workout Workout payload.
 * @param {object} options See calculateXpBreakdown.
 * @returns {number} finalXp
 */
function calculateXP(workout, options = {}) {
  return calculateXpBreakdown(workout, options).finalXp;
}

/**
 * XP required to advance from `level` to the next level (logweb PDF section 5):
 *   xpNeededForNextLevel = 100 + (level * 75) + (level^2 * 15)
 * @param {number} level Current level number.
 * @returns {number}
 */
function xpNeededForNextLevel(level) {
  const l = Number(level || 0);
  return 100 + l * 75 + l * l * 15;
}

/**
 * Cumulative total XP required to reach the start of a given level
 * (logweb PDF section 5). Level 1 = 0, Level 2 = 190, Level 3 = 500, Level 4 = 960.
 * @param {number} level Target level number.
 * @returns {number}
 */
function cumulativeXpForLevel(level) {
  const target = Number(level || 1);
  let total = 0;
  for (let l = 1; l < target; l += 1) {
    total += xpNeededForNextLevel(l);
  }
  return total;
}

module.exports = {
  CATEGORY_PROFILES,
  BODYWEIGHT_FACTORS,
  FORMULA_VERSION,
  STRENGTH_ACTIVE_TIME_FACTOR,
  bodyweightFactorForName,
  calculateCalories,
  calculateMet,
  calculateXP,
  calculateXpBreakdown,
  cumulativeXpForLevel,
  getCategorySlug,
  getDistanceKm,
  getDurationMinutes,
  resolveCategoryProfile,
  restoreCostForWeeklyStreak,
  streakBonusForWeeklyStreak,
  volumeModifierForVolume,
  xpNeededForNextLevel
};
