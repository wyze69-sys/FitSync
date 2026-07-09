function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    totalXp: toNumberOrUndefined(row.total_xp),
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

function mapTemplateRow(row) {
  if (!row) return null;
  let exercises = [];
  if (Array.isArray(row.exercises)) {
    exercises = row.exercises;
  } else if (typeof row.exercises === "string") {
    try {
      exercises = JSON.parse(row.exercises);
    } catch (err) {
      exercises = [];
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id || undefined,
    categoryName: row.category_name,
    subtype: row.subtype || undefined,
    durationMin: toNumberOrUndefined(row.duration_min),
    exercises,
    isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active),
    sortOrder: toNumberOrUndefined(row.sort_order),
    createdBy: row.created_by || undefined,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at)
  };
}

function mapAchievementRow(row) {
  if (!row) return null;
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    requirementType: row.requirement_type,
    requirementValue: Number(row.requirement_value),
    sortOrder: Number(row.sort_order),
    icon: row.icon || null,
    isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active),
    updatedAt: row.updated_at ? formatTimestamp(row.updated_at) : undefined
  };
}

function mapChallengeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    challengeType: row.challenge_type,
    targetValue: toNumberOrUndefined(row.target_value),
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    rewardXp: toNumberOrUndefined(row.reward_xp),
    badgeCode: row.badge_code || undefined,
    isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active),
    createdBy: row.created_by || undefined,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at)
  };
}

function mapAnnouncementRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    placement: row.placement,
    startAt: row.start_at ? formatTimestamp(row.start_at) : undefined,
    endAt: row.end_at ? formatTimestamp(row.end_at) : undefined,
    isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active),
    createdBy: row.created_by || undefined,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at)
  };
}

function mapFeedbackRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id || null,
    userName: row.user_name || null,
    userEmail: row.user_email || null,
    type: row.type,
    subject: row.subject || "",
    message: row.message,
    status: row.status,
    adminNote: row.admin_note || null,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at)
  };
}

module.exports = {
  formatDate,
  formatTimestamp,
  mapCategoryRow,
  mapInsightRow,
  mapUserRow,
  mapWeightLogRow,
  mapTemplateRow,
  mapAchievementRow,
  mapChallengeRow,
  mapAnnouncementRow,
  mapFeedbackRow
};
