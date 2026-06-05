function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function formatTimestamp(value) {
  if (!value) return "";
  if (typeof value === "string") return new Date(value).toISOString();
  return value.toISOString();
}

function toNumberOrUndefined(value) {
  return value === null || value === undefined ? undefined : Number(value);
}

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.password_hash,
    age: toNumberOrUndefined(row.age),
    gender: row.gender || undefined,
    height: toNumberOrUndefined(row.height),
    weight: toNumberOrUndefined(row.weight),
    targetWeight: toNumberOrUndefined(row.target_weight),
    preferredWorkoutType: row.preferred_workout_type || undefined,
    goal: row.goal || undefined,
    activityLevel: row.activity_level || undefined,
    isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active),
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at)
  };
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug || undefined,
    baseMet: toNumberOrUndefined(row.base_met),
    xpPerMetMin: toNumberOrUndefined(row.xp_per_met_min),
    isCustom: Boolean(row.is_custom)
  };
}

function mapWeightLogRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: formatDate(row.date),
    weight: Number(row.weight),
    bmi: Number(row.bmi),
    notes: row.notes || undefined,
    createdAt: formatTimestamp(row.created_at)
  };
}

function mapInsightRow(row) {
  let recommendations = [];
  if (Array.isArray(row.recommendations)) {
    recommendations = row.recommendations;
  } else if (typeof row.recommendations === "string") {
    try {
      recommendations = JSON.parse(row.recommendations);
    } catch (err) {
      recommendations = [];
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    dateGenerated: formatDate(row.date_generated),
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    workoutCount: Number(row.workout_count),
    totalCalories: Number(row.total_calories),
    totalMinutes: Number(row.total_minutes),
    bmiValue: Number(row.bmi_value),
    currentWeight: Number(row.current_weight),
    summary: row.summary,
    recommendations,
    goalProgress: row.goal_progress,
    createdAt: formatTimestamp(row.created_at)
  };
}

module.exports = {
  formatDate,
  formatTimestamp,
  mapCategoryRow,
  mapInsightRow,
  mapUserRow,
  mapWeightLogRow
};
