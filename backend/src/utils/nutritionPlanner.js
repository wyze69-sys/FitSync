/**
 * FitSync Nutrition Planner (Step 1A)
 *
 * Deterministic, pure calculation logic for turning a user's profile into
 * calorie and macro targets. No database access, no I/O, no randomness.
 *
 * Profile field names follow the FitSync app shape produced by mapUserRow:
 *   { weight, height, age, gender, goal, activityLevel, targetWeight, ... }
 *
 * Units:
 *   weight / targetWeight -> kilograms (kg)
 *   height                -> centimeters (cm)
 *   age                   -> years
 *
 * All exported functions are pure so they can be unit tested without a DB.
 */

// Energy density of body mass: ~7700 kcal per 1 kg of body weight.
const KCAL_PER_KG = 7700;

// Calorie floors below which a plan is considered unsafe.
const CALORIE_FLOOR = {
  male: 1500,
  female: 1200,
  other: 1400
};

// Activity multipliers for the Mifflin-St Jeor TDEE calculation.
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  "lightly active": 1.375,
  "moderately active": 1.55,
  active: 1.725,
  "very active": 1.9
};

// Default daily calorie adjustments (kcal/day) used when the caller does not
// provide an explicit targetChangeKg + timeframe.
const DEFAULT_LOSE_DEFICIT = 400;
const DEFAULT_GAIN_SURPLUS = 250;

const REQUIRED_FIELDS = ["weight", "height", "age", "gender", "goal", "activityLevel"];

/**
 * Normalize a free-text goal string into a coarse goal type.
 * Returns one of: "lose", "gain", "maintain".
 */
function normalizeGoal(goal) {
  const g = String(goal || "").toLowerCase();
  if (g.includes("lose") || g.includes("loss") || g.includes("cut")) return "lose";
  if (g.includes("gain") || g.includes("muscle") || g.includes("bulk") || g.includes("build")) {
    return "gain";
  }
  // "maintain fitness", "improve fitness", unknown -> maintain
  return "maintain";
}

/**
 * Normalize a gender string. Anything that is not male/female is treated as
 * "other" so downstream lookups always resolve.
 */
function normalizeGender(gender) {
  const g = String(gender || "").toLowerCase().trim();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  return "other";
}

/**
 * Detect which required nutrition fields are missing from a profile.
 * A field is missing when it is undefined, null, empty string, or (for
 * numeric fields) not a finite positive number.
 *
 * @returns {{ isComplete: boolean, missingFields: string[] }}
 */
function getMissingNutritionFields(profile = {}) {
  const numericFields = new Set(["weight", "height", "age"]);
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = profile[field];
    if (value === undefined || value === null || value === "") return true;
    if (numericFields.has(field)) {
      const num = Number(value);
      return !Number.isFinite(num) || num <= 0;
    }
    return false;
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}

/**
 * Basal Metabolic Rate using the Mifflin-St Jeor equation.
 *
 *   Male:   10*kg + 6.25*cm - 5*age + 5
 *   Female: 10*kg + 6.25*cm - 5*age - 161
 *   Other/unknown: neutral average of the male and female formulas.
 *     Because the male/female formulas differ only by a constant (+5 vs -161),
 *     the average constant is (5 + -161) / 2 = -78.
 *
 * @returns {number} BMR rounded to the nearest integer.
 */
function calculateBmr(profile = {}) {
  const weightKg = Number(profile.weight);
  const heightCm = Number(profile.height);
  const age = Number(profile.age);
  const gender = normalizeGender(profile.gender);

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  let bmr;
  if (gender === "male") {
    bmr = base + 5;
  } else if (gender === "female") {
    bmr = base - 161;
  } else {
    // Neutral average of the +5 (male) and -161 (female) constants.
    bmr = base - 78;
  }

  return Math.round(bmr);
}

/**
 * Resolve an activity multiplier for a FitSync activity label.
 * Case-insensitive and whitespace-tolerant. Unknown values fall back to
 * sedentary (1.2) as the safest, lowest-burn assumption.
 *
 * @returns {number}
 */
function getActivityFactor(activityLevel) {
  const key = String(activityLevel || "").toLowerCase().trim();
  return ACTIVITY_FACTORS[key] || ACTIVITY_FACTORS.sedentary;
}

/**
 * Total Daily Energy Expenditure = BMR * activity factor.
 *
 * @returns {{ activityFactor: number, tdee: number, bmr: number }}
 */
function calculateTdee(profile = {}) {
  const bmr = calculateBmr(profile);
  const activityFactor = getActivityFactor(profile.activityLevel);
  const tdee = Math.round(bmr * activityFactor);
  return { activityFactor, tdee, bmr };
}

/**
 * Classify how safe a rate of weight change is.
 *
 * Weight loss thresholds (kg/week):
 *   <= 1.0        -> safe
 *   > 1.0, <= 1.5 -> aggressive
 *   > 1.5         -> high_risk
 *
 * Weight gain thresholds (kg/week):
 *   <= 0.5        -> safe
 *   > 0.5, <= 0.75 -> caution
 *   > 0.75, <= 1.0 -> aggressive
 *   > 1.0         -> high_risk
 *
 * @param {{ goal?: string, targetChangeKg?: number, timeframeDays?: number }} args
 * @returns {{ safetyStatus: string, weeklyRateKg: number, direction: string }}
 */
function classifyGoalSafety({ goal, targetChangeKg, timeframeDays } = {}) {
  const goalType = normalizeGoal(goal);

  // Direction: prefer the sign of targetChangeKg, else infer from goal.
  let direction = "maintain";
  if (typeof targetChangeKg === "number" && targetChangeKg !== 0) {
    direction = targetChangeKg < 0 ? "lose" : "gain";
  } else if (goalType === "lose" || goalType === "gain") {
    direction = goalType;
  }

  let weeklyRateKg = 0;
  if (
    typeof targetChangeKg === "number" &&
    typeof timeframeDays === "number" &&
    timeframeDays > 0
  ) {
    weeklyRateKg = (Math.abs(targetChangeKg) / timeframeDays) * 7;
  }

  let safetyStatus = "safe";
  if (weeklyRateKg === 0) {
    safetyStatus = "safe";
  } else if (direction === "lose") {
    if (weeklyRateKg <= 1.0) safetyStatus = "safe";
    else if (weeklyRateKg <= 1.5) safetyStatus = "aggressive";
    else safetyStatus = "high_risk";
  } else if (direction === "gain") {
    if (weeklyRateKg <= 0.5) safetyStatus = "safe";
    else if (weeklyRateKg <= 0.75) safetyStatus = "caution";
    else if (weeklyRateKg <= 1.0) safetyStatus = "aggressive";
    else safetyStatus = "high_risk";
  }

  return {
    safetyStatus,
    weeklyRateKg: Math.round(weeklyRateKg * 100) / 100,
    direction
  };
}

function getCalorieFloor(gender) {
  return CALORIE_FLOOR[normalizeGender(gender)];
}

/**
 * Build safe + requested calorie plans for the given profile and target.
 *
 * Sign convention for targetChangeKg:
 *   negative -> weight loss (calorie deficit)
 *   positive -> weight gain (calorie surplus)
 *
 * When targetChangeKg is not provided, goal-based defaults are used:
 *   lose     -> -DEFAULT_LOSE_DEFICIT kcal/day
 *   gain     -> +DEFAULT_GAIN_SURPLUS kcal/day
 *   maintain -> 0 kcal/day
 *
 * @param {{
 *   profile: object,
 *   targetChangeKg?: number,
 *   timeframeDays?: number,
 *   mode?: "safe" | "requested"
 * }} args
 * @returns {{
 *   tdee: number,
 *   bmr: number,
 *   activityFactor: number,
 *   calorieFloor: number,
 *   safePlan: object,
 *   requestedPlan: object,
 *   activePlan: object,
 *   warnings: string[]
 * }}
 */
function buildNutritionPlans({ profile = {}, targetChangeKg, timeframeDays, mode = "safe" } = {}) {
  const { tdee, bmr, activityFactor } = calculateTdee(profile);
  const goalType = normalizeGoal(profile.goal);
  const calorieFloor = getCalorieFloor(profile.gender);
  const warnings = [];

  const hasExplicitTarget =
    typeof targetChangeKg === "number" &&
    typeof timeframeDays === "number" &&
    timeframeDays > 0;

  // --- Requested plan: exactly what the user asked for (or goal default) ---
  let requestedAdjustment; // kcal/day, signed (negative = deficit)
  let requestedChangeKg;
  let requestedTimeframeDays = hasExplicitTarget ? timeframeDays : 7;

  if (hasExplicitTarget) {
    requestedChangeKg = targetChangeKg;
    requestedAdjustment = (targetChangeKg * KCAL_PER_KG) / timeframeDays;
  } else if (goalType === "lose") {
    requestedAdjustment = -DEFAULT_LOSE_DEFICIT;
    requestedChangeKg = (requestedAdjustment * requestedTimeframeDays) / KCAL_PER_KG;
  } else if (goalType === "gain") {
    requestedAdjustment = DEFAULT_GAIN_SURPLUS;
    requestedChangeKg = (requestedAdjustment * requestedTimeframeDays) / KCAL_PER_KG;
  } else {
    requestedAdjustment = 0;
    requestedChangeKg = 0;
  }

  const requestedCalories = Math.round(tdee + requestedAdjustment);

  const requestedSafety = classifyGoalSafety({
    goal: profile.goal,
    targetChangeKg: hasExplicitTarget ? targetChangeKg : requestedChangeKg,
    timeframeDays: requestedTimeframeDays
  });

  let requestedSafetyStatus = requestedSafety.safetyStatus;

  // Requested plan honors the request even if it dips below the calorie floor,
  // but is flagged high_risk and a warning is added.
  if (requestedCalories < calorieFloor) {
    requestedSafetyStatus = "high_risk";
    warnings.push(
      `Requested target of ${requestedCalories} kcal/day is below the safe ${calorieFloor} kcal/day floor for your profile.`
    );
  }

  if (requestedSafetyStatus === "aggressive" || requestedSafetyStatus === "high_risk") {
    if (requestedSafety.direction === "gain") {
      warnings.push(
        "Requested surplus is aggressive and may lead to excess fat gain and be hard to sustain."
      );
    } else if (requestedSafety.direction === "lose") {
      warnings.push(
        "Requested deficit is aggressive and may be difficult to sustain or risk muscle loss."
      );
    }
  } else if (requestedSafetyStatus === "caution" && requestedSafety.direction === "gain") {
    warnings.push("Requested surplus is slightly above the recommended muscle-gain rate.");
  }

  const requestedPlan = {
    label: "Requested",
    dailyCalorieAdjustment: Math.round(requestedAdjustment),
    calories: requestedCalories,
    requestedCalories,
    targetChangeKg: Math.round(requestedChangeKg * 100) / 100,
    timeframeDays: requestedTimeframeDays,
    weeklyRateKg: requestedSafety.weeklyRateKg,
    direction: requestedSafety.direction,
    safetyStatus: requestedSafetyStatus
  };

  // --- Safe plan: clamp adjustment so the rate is safe and above the floor ---
  let safeAdjustment = requestedAdjustment;
  const direction = requestedSafety.direction;

  // Cap the rate to the safe weekly limit for the direction.
  const safeWeeklyLimitKg = direction === "gain" ? 0.5 : direction === "lose" ? 1.0 : 0;
  if (safeWeeklyLimitKg > 0) {
    const maxDailyAdjustmentMagnitude = (safeWeeklyLimitKg / 7) * KCAL_PER_KG;
    if (Math.abs(safeAdjustment) > maxDailyAdjustmentMagnitude) {
      safeAdjustment =
        direction === "lose" ? -maxDailyAdjustmentMagnitude : maxDailyAdjustmentMagnitude;
    }
  }

  let safeCalories = Math.round(tdee + safeAdjustment);

  // Clamp to the calorie floor.
  if (safeCalories < calorieFloor) {
    safeCalories = calorieFloor;
    safeAdjustment = safeCalories - tdee;
    if (!warnings.some((w) => w.includes("floor"))) {
      warnings.push(
        `Safe plan clamped to the ${calorieFloor} kcal/day floor for your profile.`
      );
    }
  }

  const safeChangeKg =
    (safeAdjustment * requestedTimeframeDays) / KCAL_PER_KG;
  const safeSafety = classifyGoalSafety({
    goal: profile.goal,
    targetChangeKg: safeChangeKg,
    timeframeDays: requestedTimeframeDays
  });

  const safePlan = {
    label: "Safe",
    dailyCalorieAdjustment: Math.round(safeAdjustment),
    calories: safeCalories,
    requestedCalories: safeCalories,
    targetChangeKg: Math.round(safeChangeKg * 100) / 100,
    timeframeDays: requestedTimeframeDays,
    weeklyRateKg: safeSafety.weeklyRateKg,
    direction: safeSafety.direction,
    safetyStatus: safeSafety.safetyStatus
  };

  // --- Active plan selection ---
  // Default to the safe plan. Only follow the requested plan when the caller
  // explicitly asks for "requested" mode (warnings still surface any risk).
  const activePlan = mode === "requested" ? requestedPlan : safePlan;

  return {
    tdee,
    bmr,
    activityFactor,
    calorieFloor,
    goalType,
    safePlan,
    requestedPlan,
    activePlan,
    warnings
  };
}

/**
 * Calculate macro targets for a given plan.
 *
 * Protein per kg of body weight and fat as a % of calories depend on goal;
 * carbohydrate fills the remaining calories.
 *
 *   lose:     protein 1.8 g/kg, fat 25% kcal
 *   gain:     protein 2.0 g/kg, fat 25% kcal
 *   maintain: protein 1.6 g/kg, fat 28% kcal (mid of 25-30%)
 *
 * Calories per gram: protein 4, carbs 4, fat 9.
 * If carbs would be negative/too low they are clamped and a warning is added.
 *
 * @param {{ profile: object, plan: object }} args
 * @returns {{
 *   calories: number, proteinG: number, carbsG: number, fatG: number,
 *   proteinPct: number, carbsPct: number, fatPct: number, warnings: string[]
 * }}
 */
function calculateMacroTargets({ profile = {}, plan = {} } = {}) {
  const warnings = [];
  const calories = Number(plan.calories) || 0;
  const weightKg = Number(profile.weight) || 0;
  const goalType = normalizeGoal(profile.goal);

  let proteinPerKg;
  let fatPctOfCalories;
  if (goalType === "lose") {
    proteinPerKg = 1.8;
    fatPctOfCalories = 0.25;
  } else if (goalType === "gain") {
    proteinPerKg = 2.0;
    fatPctOfCalories = 0.25;
  } else {
    proteinPerKg = 1.6;
    fatPctOfCalories = 0.28;
  }

  let proteinG = Math.round(proteinPerKg * weightKg);
  let fatG = Math.round((calories * fatPctOfCalories) / 9);

  const proteinCals = proteinG * 4;
  const fatCals = fatG * 9;
  let carbCals = calories - proteinCals - fatCals;
  let carbsG = Math.round(carbCals / 4);

  // Clamp carbs if the protein + fat targets already exceed the calorie budget.
  const MIN_CARBS_G = 50;
  if (carbsG < MIN_CARBS_G) {
    warnings.push(
      "Carbohydrate target is very low for this calorie budget; consider reducing protein/fat or raising calories."
    );
    if (carbsG < 0) {
      carbsG = Math.max(0, MIN_CARBS_G);
    }
  }

  const proteinPct = calories > 0 ? Math.round(((proteinG * 4) / calories) * 100) : 0;
  const fatPct = calories > 0 ? Math.round(((fatG * 9) / calories) * 100) : 0;
  const carbsPct = calories > 0 ? Math.round(((carbsG * 4) / calories) * 100) : 0;

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    proteinPct,
    carbsPct,
    fatPct,
    warnings
  };
}

/**
 * Build timeframe snapshot options (1 day, 3 days, 1 week, 1 month) for a plan.
 * Each snapshot projects the total calorie budget and expected weight change
 * at the plan's daily adjustment, and re-classifies safety for that window.
 *
 * @param {{ profile: object, plan: object }} args
 * @returns {Array<{
 *   label: string, days: number, targetCaloriesTotal: number,
 *   expectedWeightChangeKg: number, safetyStatus: string, note: string
 * }>}
 */
function buildTimeframeOptions({ profile = {}, plan = {} } = {}) {
  const dailyCalories = Number(plan.calories) || 0;
  const dailyAdjustment = Number(plan.dailyCalorieAdjustment) || 0;

  const windows = [
    { label: "1 day", days: 1 },
    { label: "3 days", days: 3 },
    { label: "1 week", days: 7 },
    { label: "1 month", days: 30 }
  ];

  return windows.map(({ label, days }) => {
    const targetCaloriesTotal = Math.round(dailyCalories * days);
    const expectedWeightChangeKg =
      Math.round(((dailyAdjustment * days) / KCAL_PER_KG) * 100) / 100;

    const { safetyStatus } = classifyGoalSafety({
      goal: profile.goal,
      targetChangeKg: expectedWeightChangeKg,
      timeframeDays: days
    });

    let note;
    if (expectedWeightChangeKg < 0) {
      note = `Projected loss of ${Math.abs(expectedWeightChangeKg)} kg over ${label}.`;
    } else if (expectedWeightChangeKg > 0) {
      note = `Projected gain of ${expectedWeightChangeKg} kg over ${label}.`;
    } else {
      note = `Weight maintenance over ${label}.`;
    }

    return {
      label,
      days,
      targetCaloriesTotal,
      expectedWeightChangeKg,
      safetyStatus,
      note
    };
  });
}

module.exports = {
  // constants (exported for tests / reuse)
  KCAL_PER_KG,
  CALORIE_FLOOR,
  ACTIVITY_FACTORS,
  // helpers
  normalizeGoal,
  normalizeGender,
  getCalorieFloor,
  // core API
  getMissingNutritionFields,
  calculateBmr,
  getActivityFactor,
  calculateTdee,
  classifyGoalSafety,
  buildNutritionPlans,
  calculateMacroTargets,
  buildTimeframeOptions
};
