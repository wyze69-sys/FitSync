const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapInsightRow } = require("../utils/rowMappers");

async function getInsightsByUserId(userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM ai_insights WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows.map(mapInsightRow);
}

async function createInsight(insight) {
  const id = createId("ins");

  await pool.execute(
    `INSERT INTO ai_insights (
       id, user_id, date_generated, start_date, end_date, workout_count, total_calories,
       total_minutes, bmi_value, current_weight, summary, recommendations, goal_progress
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      insight.userId,
      insight.dateGenerated,
      insight.startDate,
      insight.endDate,
      insight.workoutCount,
      insight.totalCalories,
      insight.totalMinutes,
      insight.bmiValue,
      insight.currentWeight,
      insight.summary,
      JSON.stringify(insight.recommendations || []),
      insight.goalProgress
    ]
  );

  const [rows] = await pool.execute("SELECT * FROM ai_insights WHERE id = ?", [id]);
  return mapInsightRow(rows[0]);
}

module.exports = {
  insightRepository: {
    getInsightsByUserId,
    createInsight
  }
};
