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
  return CATEGORY_PROFILES[slug] || CATEGORY_PROFILES[family] || CATEGORY_PROFILES.cardio;
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
  return Math.round(met * Number(weightKg || DEFAULT_WEIGHT_KG) * (minutes / 60));
}

export function estimateXP(subtype, duration, weightKg = DEFAULT_WEIGHT_KG, distanceKm = 0) {
  const minutes = Number(duration || 0);
  if (minutes <= 0) return 0;
  const slug = normalize(subtype);
  const profile = resolveProfile(subtype);
  const kilometres = Number(distanceKm || 0);
  const met = calculateMet(slug, kilometres, minutes, profile.baseMet);
  if (kilometres > 0) return Math.floor(kilometres * met * DISTANCE_XP_FACTOR);
  return Math.floor(minutes * met * profile.xpPerMetMin);
}

export function getProfileWeight(user) {
  return Number(user?.weightKg || user?.weight_kg || user?.weight || DEFAULT_WEIGHT_KG);
}
