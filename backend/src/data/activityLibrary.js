/**
 * FitSync Activity Library — canonical activity definitions.
 *
 * This module is the single source of truth for the seed data that populates
 * the `activity_library` database table (see utils/bootstrap.js). It is plain
 * data with no I/O so it can also be imported directly by unit tests without a
 * database connection.
 *
 * Calorie methods (all remain compatible with the logweb PDF MET formula):
 *   - met_duration        : calories = MET * 3.5 * weightKg / 200 * minutes
 *   - distance_met        : MET adjusted by pace (distance + duration), MET fallback otherwise
 *   - distance_multiplier : calories = distanceKm * weightKg * distanceMultiplier (distance-only fallback)
 *   - strength_volume     : met_duration calories * volume modifier (sets*reps*weight)
 *   - bodyweight_volume   : met_duration calories; XP performance bonus from reps * bodyweightFactor
 *   - timed_hold          : met_duration calories using hold time; XP bonus from hold * bodyweightFactor
 *   - sport_met_duration  : met_duration calories using a sport-specific MET
 *
 * XP always uses the global logweb PDF XP formula (see utils/calculators.js).
 */

const CATEGORY_IDS = {
  cardio: "cat_cardio",
  strength: "cat_strength",
  hiit: "cat_hiit",
  yoga: "cat_yoga",
  mobility: "cat_mobility",
  sports: "cat_sports"
};

const CALORIE_METHODS = [
  "met_duration",
  "distance_met",
  "distance_multiplier",
  "strength_volume",
  "bodyweight_volume",
  "timed_hold",
  "sport_met_duration"
];

const INTENSITY_LEVELS = ["low", "moderate", "high", "very_high"];

/**
 * Builds a fully-defaulted activity record from a compact definition.
 * @param {string} slug Unique activity slug.
 * @param {string} name Display name.
 * @param {string} categorySlug One of the six main category slugs.
 * @param {object} o Overrides.
 * @returns {object}
 */
function def(slug, name, categorySlug, o = {}) {
  return {
    id: o.id || `act_${slug.replace(/-/g, "_")}`,
    slug,
    name,
    categorySlug,
    categoryId: CATEGORY_IDS[categorySlug] || null,
    description: o.description || name,
    baseMet: o.baseMet,
    intensityLevel: o.intensityLevel || "moderate",
    calorieMethod: o.calorieMethod || "met_duration",
    paceProfile: o.paceProfile || null,
    supportsDistance: o.supportsDistance === true,
    supportsDuration: o.supportsDuration !== false,
    supportsSetsRepsWeight: o.supportsSetsRepsWeight === true,
    supportsBodyweight: o.supportsBodyweight === true,
    supportsRepsOnly: o.supportsRepsOnly === true,
    supportsHoldTime: o.supportsHoldTime === true,
    distanceMultiplier: o.distanceMultiplier ?? null,
    bodyweightFactor: o.bodyweightFactor ?? null,
    volumeModifierMin: o.volumeModifierMin ?? null,
    volumeModifierMax: o.volumeModifierMax ?? null,
    defaultDurationMin: o.defaultDurationMin ?? 30,
    equipment: o.equipment || "none",
    primaryMuscles: o.primaryMuscles || "",
    secondaryMuscles: o.secondaryMuscles || "",
    trackingFields: o.trackingFields || ["duration"],
    calculationNotes: o.calculationNotes || "",
    sortOrder: o.sortOrder ?? 0,
    isActive: o.isActive !== false
  };
}

// Reusable tracking-field presets.
const T_DURATION = ["duration"];
const T_DISTANCE = ["duration", "distance"];
const T_STRENGTH = ["duration", "sets", "reps", "weight"];
const T_BODYWEIGHT = ["duration", "reps"];
const T_HOLD = ["duration", "holdTime"];
const T_REPS = ["duration", "reps"];

// ---------------------------------------------------------------------------
// STRENGTH (weighted lifts use strength_volume; calisthenics use bodyweight)
// ---------------------------------------------------------------------------
const STRENGTH = [
  def("barbell-bench-press", "Barbell Bench Press", "strength", { baseMet: 5.0, intensityLevel: "moderate", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, volumeModifierMin: 1.0, volumeModifierMax: 1.15, equipment: "barbell", primaryMuscles: "chest", secondaryMuscles: "triceps,shoulders", trackingFields: T_STRENGTH }),
  def("dumbbell-bench-press", "Dumbbell Bench Press", "strength", { baseMet: 5.0, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, volumeModifierMin: 1.0, volumeModifierMax: 1.15, equipment: "dumbbell", primaryMuscles: "chest", secondaryMuscles: "triceps,shoulders", trackingFields: T_STRENGTH }),
  def("incline-dumbbell-press", "Incline Dumbbell Press", "strength", { baseMet: 5.0, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "dumbbell", primaryMuscles: "upper chest", secondaryMuscles: "shoulders,triceps", trackingFields: T_STRENGTH }),
  def("barbell-squat", "Barbell Squat", "strength", { baseMet: 6.0, intensityLevel: "high", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "barbell", primaryMuscles: "quadriceps,glutes", secondaryMuscles: "hamstrings,core", trackingFields: T_STRENGTH }),
  def("deadlift", "Deadlift", "strength", { baseMet: 6.0, intensityLevel: "high", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "barbell", primaryMuscles: "back,glutes,hamstrings", secondaryMuscles: "core,forearms", trackingFields: T_STRENGTH }),
  def("romanian-deadlift", "Romanian Deadlift", "strength", { baseMet: 5.5, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "barbell", primaryMuscles: "hamstrings,glutes", secondaryMuscles: "lower back", trackingFields: T_STRENGTH }),
  def("leg-press", "Leg Press", "strength", { baseMet: 5.0, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "machine", primaryMuscles: "quadriceps,glutes", secondaryMuscles: "hamstrings", trackingFields: T_STRENGTH }),
  def("lunges", "Lunges", "strength", { baseMet: 4.5, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "dumbbell", primaryMuscles: "quadriceps,glutes", secondaryMuscles: "hamstrings,calves", trackingFields: T_STRENGTH }),
  def("shoulder-press", "Shoulder Press", "strength", { baseMet: 5.0, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "dumbbell", primaryMuscles: "shoulders", secondaryMuscles: "triceps", trackingFields: T_STRENGTH }),
  def("lateral-raise", "Lateral Raise", "strength", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "dumbbell", primaryMuscles: "lateral deltoids", secondaryMuscles: "traps", trackingFields: T_STRENGTH }),
  def("barbell-curl", "Barbell Curl", "strength", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, volumeModifierMin: 1.0, volumeModifierMax: 1.15, equipment: "barbell", primaryMuscles: "biceps", secondaryMuscles: "forearms", trackingFields: T_STRENGTH, calculationNotes: "calories use base MET * duration with a volume modifier from sets*reps*weight" }),
  def("dumbbell-curl", "Dumbbell Curl", "strength", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "dumbbell", primaryMuscles: "biceps", secondaryMuscles: "forearms", trackingFields: T_STRENGTH }),
  def("triceps-pushdown", "Triceps Pushdown", "strength", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "cable", primaryMuscles: "triceps", secondaryMuscles: "", trackingFields: T_STRENGTH }),
  def("lat-pulldown", "Lat Pulldown", "strength", { baseMet: 5.0, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "cable", primaryMuscles: "lats", secondaryMuscles: "biceps", trackingFields: T_STRENGTH }),
  def("seated-row", "Seated Row", "strength", { baseMet: 5.0, calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "cable", primaryMuscles: "mid back,lats", secondaryMuscles: "biceps", trackingFields: T_STRENGTH }),
  def("push-up", "Push Up", "strength", { baseMet: 4.0, calorieMethod: "bodyweight_volume", supportsBodyweight: true, supportsRepsOnly: true, bodyweightFactor: 0.65, equipment: "none", primaryMuscles: "chest,triceps", secondaryMuscles: "shoulders,core", trackingFields: T_BODYWEIGHT, calculationNotes: "XP performance bonus from reps * bodyweightFactor" }),
  def("pull-up", "Pull Up", "strength", { baseMet: 5.0, calorieMethod: "bodyweight_volume", supportsBodyweight: true, supportsRepsOnly: true, bodyweightFactor: 1.0, equipment: "pull-up bar", primaryMuscles: "lats,back", secondaryMuscles: "biceps,forearms", trackingFields: T_BODYWEIGHT }),
  def("glute-bridge", "Glute Bridge", "strength", { baseMet: 4.0, calorieMethod: "bodyweight_volume", supportsBodyweight: true, supportsRepsOnly: true, bodyweightFactor: 0.4, equipment: "none", primaryMuscles: "glutes", secondaryMuscles: "hamstrings,core", trackingFields: T_BODYWEIGHT }),
  def("calf-raise", "Calf Raise", "strength", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "bodyweight_volume", supportsBodyweight: true, supportsRepsOnly: true, bodyweightFactor: 0.2, equipment: "none", primaryMuscles: "calves", secondaryMuscles: "", trackingFields: T_BODYWEIGHT }),
  def("plank", "Plank", "strength", { baseMet: 3.3, intensityLevel: "low", calorieMethod: "timed_hold", supportsHoldTime: true, supportsBodyweight: true, bodyweightFactor: 0.3, equipment: "none", primaryMuscles: "core", secondaryMuscles: "shoulders,glutes", trackingFields: T_HOLD, calculationNotes: "calories use hold time; XP bonus scales with hold seconds * bodyweightFactor" })
];

// ---------------------------------------------------------------------------
// CARDIO (distance_met for distance sports; pace adjusts MET where supported)
// ---------------------------------------------------------------------------
const CARDIO = [
  def("running", "Running", "cardio", { baseMet: 9.8, intensityLevel: "high", calorieMethod: "distance_met", paceProfile: "running", supportsDistance: true, distanceMultiplier: 1.03, equipment: "none", primaryMuscles: "legs", secondaryMuscles: "core", trackingFields: T_DISTANCE, calculationNotes: "MET adjusted by pace when distance and duration are present" }),
  def("jogging", "Jogging", "cardio", { baseMet: 7.0, calorieMethod: "distance_met", paceProfile: "running", supportsDistance: true, distanceMultiplier: 0.9, primaryMuscles: "legs", trackingFields: T_DISTANCE }),
  def("walking", "Walking", "cardio", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "distance_met", paceProfile: "walking", supportsDistance: true, distanceMultiplier: 0.53, primaryMuscles: "legs", trackingFields: T_DISTANCE }),
  def("hiking", "Hiking", "cardio", { baseMet: 6.0, calorieMethod: "distance_met", paceProfile: "walking", supportsDistance: true, distanceMultiplier: 0.7, primaryMuscles: "legs", secondaryMuscles: "core", trackingFields: T_DISTANCE }),
  def("treadmill-running", "Treadmill Running", "cardio", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "distance_met", paceProfile: "running", supportsDistance: true, equipment: "treadmill", primaryMuscles: "legs", trackingFields: T_DISTANCE }),
  def("cycling-outdoor", "Cycling Outdoor", "cardio", { baseMet: 7.5, calorieMethod: "distance_met", paceProfile: "cycling", supportsDistance: true, distanceMultiplier: 0.28, equipment: "bicycle", primaryMuscles: "legs", trackingFields: T_DISTANCE }),
  def("stationary-bike", "Stationary Bike", "cardio", { baseMet: 6.8, calorieMethod: "met_duration", equipment: "stationary bike", primaryMuscles: "legs", trackingFields: T_DURATION }),
  def("swimming-freestyle", "Swimming Freestyle", "cardio", { baseMet: 8.3, intensityLevel: "high", calorieMethod: "distance_met", supportsDistance: true, distanceMultiplier: 2.5, equipment: "pool", primaryMuscles: "full body", trackingFields: T_DISTANCE }),
  def("rowing-machine", "Rowing Machine", "cardio", { baseMet: 7.0, calorieMethod: "distance_met", supportsDistance: true, equipment: "rower", primaryMuscles: "back,legs", secondaryMuscles: "arms,core", trackingFields: T_DISTANCE }),
  def("elliptical", "Elliptical", "cardio", { baseMet: 5.0, calorieMethod: "met_duration", equipment: "elliptical", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("stair-climber", "Stair Climber", "cardio", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "met_duration", equipment: "stair machine", primaryMuscles: "legs,glutes", trackingFields: T_DURATION }),
  def("jump-rope", "Jump Rope", "cardio", { baseMet: 11.0, intensityLevel: "very_high", calorieMethod: "met_duration", equipment: "jump rope", primaryMuscles: "legs,calves", secondaryMuscles: "shoulders", trackingFields: T_DURATION }),
  def("boxing-cardio", "Boxing Cardio", "cardio", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "met_duration", equipment: "none", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("dance-cardio", "Dance Cardio", "cardio", { baseMet: 7.3, calorieMethod: "met_duration", equipment: "none", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("sprint-intervals", "Sprint Intervals", "cardio", { baseMet: 12.0, intensityLevel: "very_high", calorieMethod: "met_duration", equipment: "none", primaryMuscles: "legs", trackingFields: T_DURATION }),
  def("brisk-walking", "Brisk Walking", "cardio", { baseMet: 4.3, intensityLevel: "low", calorieMethod: "distance_met", paceProfile: "walking", supportsDistance: true, distanceMultiplier: 0.55, primaryMuscles: "legs", trackingFields: T_DISTANCE }),
  def("incline-walking", "Incline Walking", "cardio", { baseMet: 5.3, calorieMethod: "met_duration", equipment: "treadmill", primaryMuscles: "legs,glutes", trackingFields: T_DURATION }),
  def("skipping", "Skipping", "cardio", { baseMet: 11.0, intensityLevel: "very_high", calorieMethod: "met_duration", equipment: "jump rope", primaryMuscles: "legs,calves", trackingFields: T_DURATION })
];

// ---------------------------------------------------------------------------
// HIIT (mostly duration-based, high MET; a few support reps / volume)
// ---------------------------------------------------------------------------
const HIIT = [
  def("burpees", "Burpees", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "bodyweight_volume", supportsBodyweight: true, supportsRepsOnly: true, bodyweightFactor: 0.6, equipment: "none", primaryMuscles: "full body", trackingFields: T_BODYWEIGHT }),
  def("mountain-climbers", "Mountain Climbers", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "met_duration", primaryMuscles: "core,legs", trackingFields: T_DURATION }),
  def("jump-squats", "Jump Squats", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "bodyweight_volume", supportsBodyweight: true, supportsRepsOnly: true, bodyweightFactor: 0.5, primaryMuscles: "legs,glutes", trackingFields: T_BODYWEIGHT }),
  def("high-knees", "High Knees", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "met_duration", primaryMuscles: "legs,core", trackingFields: T_DURATION }),
  def("battle-ropes", "Battle Ropes", "hiit", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "met_duration", equipment: "battle ropes", primaryMuscles: "shoulders,arms,core", trackingFields: T_DURATION }),
  def("kettlebell-swings", "Kettlebell Swings", "hiit", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "kettlebell", primaryMuscles: "glutes,hamstrings", secondaryMuscles: "core,shoulders", trackingFields: T_STRENGTH }),
  def("box-jumps", "Box Jumps", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "bodyweight_volume", supportsBodyweight: true, supportsRepsOnly: true, bodyweightFactor: 0.6, equipment: "plyo box", primaryMuscles: "legs,glutes", trackingFields: T_BODYWEIGHT }),
  def("jumping-jacks", "Jumping Jacks", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("hiit-sprint-intervals", "Sprint Intervals", "hiit", { baseMet: 12.0, intensityLevel: "very_high", calorieMethod: "met_duration", primaryMuscles: "legs", trackingFields: T_DURATION }),
  def("plank-jacks", "Plank Jacks", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "met_duration", primaryMuscles: "core,shoulders", trackingFields: T_DURATION }),
  def("skater-jumps", "Skater Jumps", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "met_duration", primaryMuscles: "legs,glutes", trackingFields: T_DURATION }),
  def("medicine-ball-slams", "Medicine Ball Slams", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "met_duration", equipment: "medicine ball", primaryMuscles: "core,shoulders", trackingFields: T_DURATION }),
  def("thrusters", "Thrusters", "hiit", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "strength_volume", supportsSetsRepsWeight: true, equipment: "barbell", primaryMuscles: "legs,shoulders", secondaryMuscles: "core", trackingFields: T_STRENGTH }),
  def("air-bike-intervals", "Air Bike Intervals", "hiit", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "met_duration", equipment: "air bike", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("rowing-intervals", "Rowing Intervals", "hiit", { baseMet: 8.5, intensityLevel: "high", calorieMethod: "met_duration", equipment: "rower", primaryMuscles: "back,legs", trackingFields: T_DURATION }),
  def("tabata-circuit", "Tabata Circuit", "hiit", { baseMet: 10.0, intensityLevel: "very_high", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("emom-circuit", "EMOM Circuit", "hiit", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("amrap-circuit", "AMRAP Circuit", "hiit", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION })
];

// ---------------------------------------------------------------------------
// YOGA (duration-based, low-to-moderate MET; Yoga Sculpt allows light weight)
// ---------------------------------------------------------------------------
const YOGA = [
  def("hatha-yoga", "Hatha Yoga", "yoga", { baseMet: 2.8, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("vinyasa-yoga", "Vinyasa Yoga", "yoga", { baseMet: 4.0, calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("power-yoga", "Power Yoga", "yoga", { baseMet: 5.0, calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("yin-yoga", "Yin Yoga", "yoga", { baseMet: 2.0, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("restorative-yoga", "Restorative Yoga", "yoga", { baseMet: 1.8, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("ashtanga-yoga", "Ashtanga Yoga", "yoga", { baseMet: 5.0, calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("hot-yoga", "Hot Yoga", "yoga", { baseMet: 5.0, calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("gentle-yoga", "Gentle Yoga", "yoga", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("sun-salutation-flow", "Sun Salutation Flow", "yoga", { baseMet: 4.0, calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("balance-flow", "Balance Flow", "yoga", { baseMet: 3.0, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "core,legs", trackingFields: T_DURATION }),
  def("core-yoga", "Core Yoga", "yoga", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "core", trackingFields: T_DURATION }),
  def("stretch-yoga", "Stretch Yoga", "yoga", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("breathwork-session", "Breathwork Session", "yoga", { baseMet: 1.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "diaphragm", trackingFields: T_DURATION }),
  def("mobility-yoga", "Mobility Yoga", "yoga", { baseMet: 2.8, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("yoga-sculpt", "Yoga Sculpt", "yoga", { baseMet: 4.5, calorieMethod: "met_duration", supportsSetsRepsWeight: true, equipment: "light dumbbell", primaryMuscles: "full body", trackingFields: ["duration", "sets", "reps", "weight"], calculationNotes: "duration-based MET; optional light weights tracked but calories stay MET-duration" }),
  def("prenatal-yoga", "Prenatal Yoga", "yoga", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("meditation-flow", "Meditation Flow", "yoga", { baseMet: 1.3, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "none", trackingFields: T_DURATION })
];

// ---------------------------------------------------------------------------
// MOBILITY (duration-based, low MET; a couple support reps / distance)
// ---------------------------------------------------------------------------
const MOBILITY = [
  def("dynamic-warmup", "Dynamic Warmup", "mobility", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("static-stretching", "Static Stretching", "mobility", { baseMet: 2.3, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("foam-rolling", "Foam Rolling", "mobility", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", equipment: "foam roller", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("hip-mobility", "Hip Mobility", "mobility", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "hips", trackingFields: T_DURATION }),
  def("shoulder-mobility", "Shoulder Mobility", "mobility", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "shoulders", trackingFields: T_DURATION }),
  def("ankle-mobility", "Ankle Mobility", "mobility", { baseMet: 2.3, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "ankles", trackingFields: T_DURATION }),
  def("thoracic-mobility", "Thoracic Mobility", "mobility", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "upper back", trackingFields: T_DURATION }),
  def("hamstring-stretch", "Hamstring Stretch", "mobility", { baseMet: 2.3, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "hamstrings", trackingFields: T_DURATION }),
  def("quad-stretch", "Quad Stretch", "mobility", { baseMet: 2.3, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "quadriceps", trackingFields: T_DURATION }),
  def("calf-stretch", "Calf Stretch", "mobility", { baseMet: 2.3, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "calves", trackingFields: T_DURATION }),
  def("wrist-mobility", "Wrist Mobility", "mobility", { baseMet: 2.0, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "wrists,forearms", trackingFields: T_DURATION }),
  def("neck-mobility", "Neck Mobility", "mobility", { baseMet: 2.0, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "neck", trackingFields: T_DURATION }),
  def("lower-back-mobility", "Lower Back Mobility", "mobility", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "lower back", trackingFields: T_DURATION }),
  def("rehab-band-work", "Rehab Band Work", "mobility", { baseMet: 3.0, intensityLevel: "low", calorieMethod: "met_duration", supportsRepsOnly: true, equipment: "resistance band", primaryMuscles: "varies", trackingFields: T_REPS }),
  def("active-recovery-walk", "Active Recovery Walk", "mobility", { baseMet: 3.0, intensityLevel: "low", calorieMethod: "distance_met", paceProfile: "walking", supportsDistance: true, distanceMultiplier: 0.5, primaryMuscles: "legs", trackingFields: T_DISTANCE }),
  def("mobility-circuit", "Mobility Circuit", "mobility", { baseMet: 3.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("joint-cars", "Joint CARs", "mobility", { baseMet: 2.5, intensityLevel: "low", calorieMethod: "met_duration", primaryMuscles: "joints", trackingFields: T_DURATION })
];

// ---------------------------------------------------------------------------
// SPORTS (sport_met_duration; some support optional distance)
// ---------------------------------------------------------------------------
const SPORTS = [
  def("basketball", "Basketball", "sports", { baseMet: 6.5, calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("soccer", "Soccer", "sports", { baseMet: 7.0, calorieMethod: "sport_met_duration", supportsDistance: true, distanceMultiplier: 0.9, primaryMuscles: "legs", trackingFields: T_DISTANCE }),
  def("tennis", "Tennis", "sports", { baseMet: 7.3, calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("badminton", "Badminton", "sports", { baseMet: 5.5, calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("volleyball", "Volleyball", "sports", { baseMet: 4.0, intensityLevel: "low", calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("table-tennis", "Table Tennis", "sports", { baseMet: 4.0, intensityLevel: "low", calorieMethod: "sport_met_duration", primaryMuscles: "upper body", trackingFields: T_DURATION }),
  def("futsal", "Futsal", "sports", { baseMet: 7.0, calorieMethod: "sport_met_duration", primaryMuscles: "legs", trackingFields: T_DURATION }),
  def("boxing", "Boxing", "sports", { baseMet: 9.0, intensityLevel: "high", calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("martial-arts", "Martial Arts", "sports", { baseMet: 10.0, intensityLevel: "high", calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("climbing", "Climbing", "sports", { baseMet: 8.0, intensityLevel: "high", calorieMethod: "sport_met_duration", equipment: "wall", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("skateboarding", "Skateboarding", "sports", { baseMet: 5.0, calorieMethod: "sport_met_duration", equipment: "skateboard", primaryMuscles: "legs,core", trackingFields: T_DURATION }),
  def("golf-walking", "Golf Walking", "sports", { baseMet: 4.3, intensityLevel: "low", calorieMethod: "sport_met_duration", supportsDistance: true, distanceMultiplier: 0.5, primaryMuscles: "full body", trackingFields: T_DISTANCE }),
  def("frisbee", "Frisbee", "sports", { baseMet: 3.0, intensityLevel: "low", calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("rugby", "Rugby", "sports", { baseMet: 8.3, intensityLevel: "high", calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("baseball", "Baseball", "sports", { baseMet: 5.0, calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("pickleball", "Pickleball", "sports", { baseMet: 5.0, calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("squash", "Squash", "sports", { baseMet: 12.0, intensityLevel: "very_high", calorieMethod: "sport_met_duration", primaryMuscles: "full body", trackingFields: T_DURATION }),
  def("recreational-swimming", "Recreational Swimming", "sports", { baseMet: 6.0, calorieMethod: "sport_met_duration", supportsDistance: true, distanceMultiplier: 2.0, equipment: "pool", primaryMuscles: "full body", trackingFields: T_DISTANCE })
];

const ACTIVITY_LIBRARY = [...STRENGTH, ...CARDIO, ...HIIT, ...YOGA, ...MOBILITY, ...SPORTS].map(
  (activity, index) => ({ ...activity, sortOrder: activity.sortOrder || index })
);

/**
 * Returns all active activities for a given category slug.
 * @param {string} categorySlug Category slug.
 * @returns {object[]}
 */
function activitiesForCategory(categorySlug) {
  return ACTIVITY_LIBRARY.filter(
    (activity) => activity.categorySlug === categorySlug && activity.isActive
  );
}

module.exports = {
  ACTIVITY_LIBRARY,
  CATEGORY_IDS,
  CALORIE_METHODS,
  INTENSITY_LEVELS,
  activitiesForCategory
};
