const { Type } = require("@google/genai");
const { AI_CONFIG } = require("../config/ai");
const { calculateBMI } = require("../utils/calculateBMI");
const { insightRepository } = require("../repositories/insightRepository");
const { userRepository } = require("../repositories/userRepository");
const { weightRepository } = require("../repositories/weightRepository");
const { workoutRepository } = require("../repositories/workoutRepository");
const { gamificationService } = require("./gamificationService");

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

const aiService = {
  async getInsightsByUserId(userId) {
    return insightRepository.getInsightsByUserId(userId);
  },

  async generateWeeklyInsight(userId) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new Error("User profile not found.");
    }

    const weeklyStats = await gamificationService.getWeeklyStats(userId);

    const workoutResult = await workoutRepository.getWorkoutsByUserId(user.id, { limit: 100 });
    const workouts = workoutResult.items;
    const weightLogs = await weightRepository.getWeightLogsByUserId(user.id);

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentWorkouts = workouts.filter((workout) => new Date(workout.date) >= sevenDaysAgo);
    const currentWeight = user.weight || weightLogs[0]?.weight || 70;
    const currentBmi = calculateBMI(currentWeight, user.height || 170);

    const recentWeights = weightLogs.filter((log) => new Date(log.date) >= sevenDaysAgo);
    let weightProgressSummary = "Stable";
    if (recentWeights.length >= 2) {
      const oldestWeight = recentWeights[recentWeights.length - 1].weight;
      const newestWeight = recentWeights[0].weight;
      const weightDiff = newestWeight - oldestWeight;
      weightProgressSummary = `${weightDiff > 0 ? "+" : ""}${weightDiff.toFixed(1)} kg`;
    }

    const targetWeightLine = user.targetWeight
      ? `- Target Weight: ${user.targetWeight} kg`
      : "- Target Weight: Not set";

    const workoutsText =
      recentWorkouts.length > 0
        ? recentWorkouts
            .map((workout) => {
              const exercises = workout.exercises
                .map((exercise) => exercise.exerciseName)
                .join(", ");
              return `- Date: ${workout.date}, Workout Title: "${workout.title}", Duration: ${workout.durationTotal}m, Calories: ${workout.caloriesTotal}kcal. Exercises: ${exercises}`;
            })
            .join("\n")
        : "No workouts logged this week.";

    const systemPrompt = `You are a supportive fitness coach. Provide: 1 short summary sentence of the week, then 1-2 motivational sentences. Do not provide medical advice or use fake numbers. Focus on workout consistency, recovery, body-weight trend awareness, streak motivation, and realistic next training steps. Keep goalProgress under 600 characters. Generate a JSON object with this exact shape:
{
  "summary": "A friendly weekly coaching summary.",
  "recommendations": ["tip 1", "tip 2", "tip 3"],
  "goalProgress": "A concise goal progress update."
}`;

    const userPrompt = `
Analyze this athlete training log:
- Name: ${user.name}
- Age: ${user.age || "Not specified"}
- Gender: ${user.gender || "Not specified"}
- Goal: ${user.goal || "General Health"}
- Activity Profile: ${user.activityLevel || "Active"}
- Weight: ${currentWeight} kg
${targetWeightLine}
- BMI: ${currentBmi}
- Weight Delta (7 days): ${weightProgressSummary}
- Current Activity Streak: ${weeklyStats.currentStreak} day(s)
- Days Active This Week: ${weeklyStats.daysActive}
- Total Workouts: ${weeklyStats.totalWorkouts}
- Total Calories: ${weeklyStats.totalCalories} kcal
- Total Minutes: ${weeklyStats.totalMinutes} min (${weeklyStats.totalHours} hrs)
- Total XP: ${weeklyStats.totalXp}
- Top Activity: ${weeklyStats.topActivity}

Weekly Active Workout Logs:
${workoutsText}`;

    let generatedInsight;

    try {
      const genAi = AI_CONFIG.getGeminiClient();
      const response = await genAi.models.generateContent({
        model: AI_CONFIG.modelName,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              goalProgress: { type: Type.STRING }
            },
            required: ["summary", "recommendations", "goalProgress"]
          }
        }
      });

      generatedInsight = JSON.parse(response.text || "{}");
    } catch (err) {
      const activeQuote =
        weeklyStats.totalWorkouts > 2
          ? "Your workout consistency is strong and your momentum is building."
          : "You are building the foundation, and every logged effort counts.";

      generatedInsight = {
        summary: `Hey ${user.name}! ${activeQuote} This week, you logged ${weeklyStats.totalWorkouts} sessions for ${weeklyStats.totalMinutes} active minutes and ${weeklyStats.totalCalories} estimated calories. Your BMI is ${currentBmi} with body weight at ${currentWeight} kg, and your current activity streak is ${weeklyStats.currentStreak} day(s).`,
        recommendations: [
          `Target at least ${weeklyStats.totalWorkouts > 2 ? "4" : "3"} sessions this coming week to strengthen routine consistency.`,
          "Use rest days, hydration, and sleep to support recovery between sessions.",
          "Keep weight check-ins consistent by measuring at similar morning hours."
        ],
        goalProgress: `You are moving in the right direction for your goal of "${user.goal || "General Health"}".`
      };
    }

    return insightRepository.createInsight({
      userId: user.id,
      dateGenerated: dateString(today),
      startDate: dateString(sevenDaysAgo),
      endDate: dateString(today),
      workoutCount: weeklyStats.totalWorkouts,
      totalCalories: weeklyStats.totalCalories,
      totalMinutes: weeklyStats.totalMinutes,
      bmiValue: currentBmi,
      currentWeight,
      summary: generatedInsight.summary,
      recommendations: generatedInsight.recommendations,
      goalProgress: generatedInsight.goalProgress
    });
  }
};

module.exports = { aiService };
