const DEFAULT_WEIGHT_KG = 70;

// Mirrors STRENGTH_ACTIVE_TIME_FACTOR in backend/src/utils/calculators.js so the
// preview estimate and the authoritative backend result stay aligned. Strength
// training has rest between sets, so duration-based calories are scaled down.
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
  "yoga-vinyasa": { baseMet: 4, xpPerMetMin: 0.25, family: "yoga" },
  "yoga-hatha": { baseMet: 2.5, xpPerMetMin: 0.25, family: "yoga" }
};

function normalize(value) {
  return String(value?.slug || value?.categorySlug || value?.name || value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function resolveProfile(subtype) {
  const slug = normalize(subtype);
  const family = normalize(subtype?.categorySlug || subtype?.categoryName || subtype?.category || subtype?.family);
  // Prefer an explicit baseMet from the backend activity library when present.
  if (subtype && Number(subtype.baseMet) > 0) {
    return { baseMet: Number(subtype.baseMet), xpPerMetMin: 0.2, family: family || slug };
  }
  return CATEGORY_PROFILES[slug] || CATEGORY_PROFILES[family] || CATEGORY_PROFILES.cardio;
}

/**
 * True when the activity belongs to the strength family (weighted, bodyweight,
 * or timed-hold logged under the strength category). Used to apply the
 * active-time factor to calorie estimates.
 */
function isStrengthFamily(subtype, slug, profile) {
  const family = normalize(subtype?.categorySlug || subtype?.categoryName || subtype?.family);
  return profile?.family === "strength" || slug === "strength" || family === "strength";
}

function calculateMet(slug, distanceKm, durationMin, fallbackMet) {
  const speedKmh = durationMin > 0 ? distanceKm / (durationMin / 60) : 0;

  if (slug === "running" || slug === "cardio") {
    if (speedKmh >= 14) return 12.51;
    if (speedKmh >= 12) return 11;
    if (speedKmh >= 10) return 10;
    if (speedKmh >= 8) return 8.29;
    return distanceKm > 0 ? 7 : fallbackMet;
  }

  if (slug === "cycling") {
    if (speedKmh >= 25) return 12;
    if (speedKmh >= 20) return 8;
    if (speedKmh > 15) return 6;
    if (speedKmh >= 10) return 4;
    return 3.5;
  }

  if (slug === "walking") {
    if (speedKmh >= 6.5) return 5;
    if (speedKmh >= 5) return 3.8;
    return 3.5;
  }

  return fallbackMet;
}

export function estimateCalories(subtype, duration, weightKg = DEFAULT_WEIGHT_KG, distanceKm = 0) {
  const minutes = Number(duration || 0);
  if (minutes <= 0) return 0;
  const slug = normalize(subtype);
  const profile = resolveProfile(subtype);
  const met = calculateMet(slug, Number(distanceKm || 0), minutes, profile.baseMet);
  // logweb PDF s.3: calories = MET * 3.5 * weightKg / 200 * minutes
  let calories = (met * 3.5 * Number(weightKg || DEFAULT_WEIGHT_KG)) / 200 * minutes;
  // Strength is not continuous effort — apply the active-time factor so the
  // estimate matches the backend and does not read like cardio.
  if (isStrengthFamily(subtype, slug, profile)) {
    calories *= STRENGTH_ACTIVE_TIME_FACTOR;
  }
  return Math.round(calories);
}

export function estimateXP(subtype, duration, weightKg = DEFAULT_WEIGHT_KG, distanceKm = 0) {
  const minutes = Number(duration || 0);
  if (minutes <= 0) return 0;
  const profile = resolveProfile(subtype);
  const kilometres = Number(distanceKm || 0);
  // logweb PDF s.4. Preview estimate only (no weekly streak bonus) — the
  // backend remains the source of truth and recomputes the authoritative XP.
  const baseCompletionXp = 20;
  const durationXp = Math.min(minutes * 1.2, 90);
  const intensityXp = Math.min(profile.baseMet * minutes * 0.15, 60);
  const cardioBonus = Math.min(kilometres * 4, 40);
  const performanceBonus = Math.max(cardioBonus, 0);
  return Math.round(baseCompletionXp + durationXp + intensityXp + performanceBonus);
}

export function getProfileWeight(user) {
  return Number(user?.weightKg || user?.weight_kg || user?.weight || DEFAULT_WEIGHT_KG);
}
