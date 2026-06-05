const DEFAULT_WEIGHT_KG = 70;
const DISTANCE_XP_FACTOR = 0.8;

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
 * Calculates workout calories server-side using MET, weight, and duration.
 * @param {object} workout Workout payload.
 * @param {number} weightKg User weight in kilograms.
 * @param {object} options Optional category metadata.
 * @returns {number}
 */
function calculateCalories(workout, weightKg = DEFAULT_WEIGHT_KG, options = {}) {
  const slug = getCategorySlug(workout);
  const profile = resolveCategoryProfile(slug, options.categoryMeta);
  const durationMin = getDurationMinutes(workout);
  const distanceKm = getDistanceKm(workout);
  const met = options.met || calculateMet(slug, distanceKm, durationMin, profile.baseMet);
  return Math.round(met * Number(weightKg || DEFAULT_WEIGHT_KG) * (durationMin / 60));
}

/**
 * Calculates workout XP server-side using duration, distance, and category effort.
 * @param {object} workout Workout payload.
 * @param {object} options Optional category metadata and multiplier.
 * @returns {number}
 */
function calculateXP(workout, options = {}) {
  const slug = getCategorySlug(workout);
  const profile = resolveCategoryProfile(slug, options.categoryMeta);
  const durationMin = getDurationMinutes(workout);
  const distanceKm = getDistanceKm(workout);
  const met = options.met || calculateMet(slug, distanceKm, durationMin, profile.baseMet);
  const multiplier = Number(options.multiplier || 1);

  if (distanceKm > 0) {
    return Math.floor(distanceKm * met * DISTANCE_XP_FACTOR * multiplier);
  }

  return Math.floor(durationMin * met * profile.xpPerMetMin * multiplier);
}

module.exports = {
  CATEGORY_PROFILES,
  calculateCalories,
  calculateMet,
  calculateXP,
  getCategorySlug,
  getDistanceKm,
  getDurationMinutes,
  resolveCategoryProfile
};
