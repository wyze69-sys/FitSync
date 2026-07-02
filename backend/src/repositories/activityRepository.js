const pool = require("../config/db");

/**
 * Parses a JSON column that may arrive as a string, array, or null.
 * @param {*} value Raw column value.
 * @returns {Array}
 */
function parseTrackingFields(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}

/**
 * Maps an activity_library row into the public camelCase shape consumed by the
 * API and the activity calculator.
 * @param {object} row DB row.
 * @returns {object}
 */
function mapActivityRow(row) {
  if (!row) return null;
  const numOrNull = (v) => (v === null || v === undefined ? null : Number(v));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categorySlug: row.category_slug,
    categoryId: row.category_id || null,
    description: row.description || "",
    baseMet: Number(row.base_met),
    intensityLevel: row.intensity_level,
    calorieMethod: row.calorie_method,
    paceProfile: row.pace_profile || null,
    supportsDistance: Boolean(row.supports_distance),
    supportsDuration: Boolean(row.supports_duration),
    supportsSetsRepsWeight: Boolean(row.supports_sets_reps_weight),
    supportsBodyweight: Boolean(row.supports_bodyweight),
    supportsRepsOnly: Boolean(row.supports_reps_only),
    supportsHoldTime: Boolean(row.supports_hold_time),
    distanceMultiplier: numOrNull(row.distance_multiplier),
    bodyweightFactor: numOrNull(row.bodyweight_factor),
    volumeModifierMin: numOrNull(row.volume_modifier_min),
    volumeModifierMax: numOrNull(row.volume_modifier_max),
    defaultDurationMin: numOrNull(row.default_duration_min),
    equipment: row.equipment || "",
    primaryMuscles: row.primary_muscles || "",
    secondaryMuscles: row.secondary_muscles || "",
    trackingFields: parseTrackingFields(row.tracking_fields),
    calculationNotes: row.calculation_notes || "",
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active)
  };
}

/**
 * Lists active activities, optionally filtered by category slug.
 * @param {object} filters { category, includeInactive }
 * @returns {Promise<object[]>}
 */
async function getActivities(filters = {}) {
  const conditions = [];
  const params = [];

  if (!filters.includeInactive) {
    conditions.push("is_active = TRUE");
  }
  if (filters.category) {
    conditions.push("category_slug = ?");
    params.push(String(filters.category).trim().toLowerCase());
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM activity_library ${whereClause} ORDER BY category_slug ASC, sort_order ASC, name ASC`,
    params
  );
  return rows.map(mapActivityRow);
}

/**
 * Loads a single activity by slug or id.
 * @param {string} slugOrId Activity slug or id.
 * @returns {Promise<object|null>}
 */
async function getActivityBySlug(slugOrId) {
  const key = String(slugOrId || "").trim().toLowerCase();
  if (!key) return null;
  const [rows] = await pool.execute(
    "SELECT * FROM activity_library WHERE slug = ? OR id = ? LIMIT 1",
    [key, key]
  );
  return rows[0] ? mapActivityRow(rows[0]) : null;
}

module.exports = {
  activityRepository: {
    getActivities,
    getActivityBySlug
  },
  mapActivityRow
};
