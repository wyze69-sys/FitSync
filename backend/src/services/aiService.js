const { Type } = require("@google/genai");
const { AI_CONFIG } = require("../config/ai");
const { insightRepository } = require("../repositories/insightRepository");
const { userRepository } = require("../repositories/userRepository");
const { weightRepository } = require("../repositories/weightRepository");
const { workoutRepository } = require("../repositories/workoutRepository");

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

    const workouts = await workoutRepository.getWorkoutsByUserId(user.id);
    const weightLogs = await weightRepository.getWeightLogsByUserId(user.id);

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentWorkouts = workouts.filter((workout) => new Date(workout.date) >= sevenDaysAgo);
    const totalCalories = recentWorkouts.reduce((sum, workout) => sum + workout.caloriesTotal, 0);
    const totalMinutes = recentWorkouts.reduce((sum, workout) => sum + workout.durationTotal, 0);
    const currentWeight = user.weight || weightLogs[0]?.weight || 70;
    const heightMeters = (user.height || 170) / 100;
    const currentBmi = Number((currentWeight / (heightMeters * heightMeters)).toFixed(1));

    const recentWeights = weightLogs.filter((log) => new Date(log.date) >= sevenDaysAgo);
    let weightProgressSummary = "Stable";
    if (recentWeights.length >= 2) {
      const oldestWeight = recentWeights[recentWeights.length - 1].weight;
      const newestWeight = recentWeights[0].weight;
      const weightDiff = newestWeight - oldestWeight;
      weightProgressSummary = `${weightDiff > 0 ? "+" : ""}${weightDiff.toFixed(1)} kg`;
    }

    const workoutsText = recentWorkouts.length > 0
      ? recentWorkouts
          .map((workout) => {
            const exercises = workout.exercises.map((exercise) => exercise.exerciseName).join(", ");
            return `- Date: ${workout.date}, Workout Title: "${workout.title}", Duration: ${workout.durationTotal}m, Calories: ${workout.caloriesTotal}kcal. Exercises: ${exercises}`;
          })
          .join("\n")
      : "No workouts logged this week.";

    const systemPrompt = `You are a supportive fitness coach. Generate a JSON object with this exact shape:
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
- BMI: ${currentBmi}
- Weight Delta: ${weightProgressSummary}

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
      const activeQuote = recentWorkouts.length > 2
        ? "Your workout consistency is strong and your momentum is building."
        : "You are building the foundation, and every logged effort counts.";

      generatedInsight = {
        summary: `Hey ${user.name}! ${activeQuote} This week, you logged ${recentWorkouts.length} sessions for ${totalMinutes} active minutes and ${totalCalories} estimated calories. Your BMI is ${currentBmi} with body weight at ${currentWeight} kg.`,
        recommendations: [
          `Target at least ${recentWorkouts.length > 2 ? "4" : "3"} sessions this coming week to strengthen routine consistency.`,
          "Support training with protein, hydration, and restorative sleep.",
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
      workoutCount: recentWorkouts.length,
      totalCalories,
      totalMinutes,
      bmiValue: currentBmi,
      currentWeight,
      summary: generatedInsight.summary,
      recommendations: generatedInsight.recommendations,
      goalProgress: generatedInsight.goalProgress
    });
  }
};

module.exports = { aiService };
