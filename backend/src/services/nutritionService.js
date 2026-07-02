const { nutritionRepository } = require("../repositories/nutritionRepository");
const { userRepository } = require("../repositories/userRepository");
const { recommendFoods } = require("../utils/nutritionRecommender");
const {
  getMissingNutritionFields,
  buildNutritionPlans,
  calculateMacroTargets,
  buildTimeframeOptions
} = require("../utils/nutritionPlanner");
const { nutritionPlanWorkoutService } = require("./nutritionPlanWorkoutService");

/**
 * Coerce a query value into a finite number, or undefined when absent/invalid.
 */
function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Parse a comma-separated allergies string into a clean list.
 */
function parseAllergies(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value !== "string" || value.trim() === "") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const nutritionService = {
  async listFoods(filters = {}) {
    return nutritionRepository.listFoods(filters);
  },

  async getFood(id) {
    return nutritionRepository.getFoodById(id);
  },

  async getRecommendations(context = {}) {
    const pool = await nutritionRepository.getRecommendationPool(2500);
    return recommendFoods(pool, context);
  },

  /**
   * Build a personalized nutrition plan for an authenticated user by combining
   * their real profile, the deterministic nutrition planner, real workout
   * history windows, and dataset-grounded food recommendations.
   *
   * @param {string} userId
   * @param {object} query validated query params (targetChangeKg, timeframeDays,
   *   mode, goal, dietPreference, allergies, limit)
   */
  async getPlan(userId, query = {}) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      const err = new Error("User not found.");
      err.status = 404;
      throw err;
    }

    const { missingFields, isComplete } = getMissingNutritionFields(user);

    // profile.weightKg/heightCm are derived from the stored user fields.
    const profile = {
      weightKg: user.weight ?? null,
      heightCm: user.height ?? null,
      age: user.age ?? null,
      gender: user.gender ?? null,
      goal: user.goal ?? null,
      activityLevel: user.activityLevel ?? null,
      targetWeight: user.targetWeight ?? null,
      preferredWorkoutType: user.preferredWorkoutType ?? null,
      isIncomplete: !isComplete,
      missingFields
    };

    // --- Incomplete profile: return a minimal, honest response ---
    if (!isComplete) {
      return {
        profile,
        calculations: null,
        requestedPlan: null,
        safePlan: null,
        activePlan: null,
        macros: null,
        windows: null,
        timeframeOptions: null,
        recommendations: [],
        warnings: [
          `Complete your profile to generate a nutrition plan. Missing: ${missingFields.join(", ")}.`
        ],
        notes: [],
        source: "nutrition_foods"
      };
    }

    // --- Complete profile: compute the full plan ---
    const targetChangeKg = toOptionalNumber(query.targetChangeKg);
    const timeframeDays = toOptionalNumber(query.timeframeDays);
    const mode = query.mode === "requested" ? "requested" : "safe";

    const {
      bmr,
      tdee,
      activityFactor,
      calorieFloor,
      safePlan,
      requestedPlan,
      activePlan,
      warnings
    } = buildNutritionPlans({ profile: user, targetChangeKg, timeframeDays, mode });

    const macros = calculateMacroTargets({ profile: user, plan: activePlan });
    const timeframeOptions = buildTimeframeOptions({ profile: user, plan: activePlan });

    // Single 30-day workout query; smaller windows derived in memory.
    const windows = await nutritionPlanWorkoutService.getWorkoutWindowsForUser(userId);
    const todayWorkoutCalories = Math.round(windows.today.totalCaloriesBurned || 0);

    // Today's workout burn increases today's allowance, capped so a big day
    // cannot balloon intake; the weekly plan itself stays balanced.
    const todayAdjustedTarget = Math.round(
      activePlan.calories + Math.min(todayWorkoutCalories * 0.5, 400)
    );

    const notes = [];
    if (todayWorkoutCalories > 0) {
      notes.push(
        "Today workout burn partially increases today's food allowance while the weekly plan remains balanced."
      );
    }

    const allergies = parseAllergies(query.allergies);

    // Recommendations come only from real nutrition_foods rows via the pool.
    const recommendations = await this.getRecommendations({
      goal: query.goal || user.goal,
      workoutType: user.preferredWorkoutType,
      category: user.preferredWorkoutType,
      caloriesBurned: todayWorkoutCalories,
      limit: query.limit || 8,
      // Extra target context passed harmlessly; recommender ignores unknown keys.
      targetCalories: activePlan.calories,
      targetProteinG: macros.proteinG,
      targetCarbsG: macros.carbsG,
      targetFatG: macros.fatG,
      dietPreference: query.dietPreference,
      allergies
    });

    return {
      profile,
      calculations: {
        bmr,
        tdee,
        activityFactor,
        calorieFloor,
        todayWorkoutCalories,
        todayAdjustedTarget
      },
      requestedPlan,
      safePlan,
      activePlan,
      macros,
      windows,
      timeframeOptions,
      recommendations,
      warnings: [...warnings, ...(macros.warnings || [])],
      notes,
      source: "nutrition_foods"
    };
  }
};

module.exports = { nutritionService };
