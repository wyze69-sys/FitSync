const pool = require("../config/db");
const { mapAchievementRow } = require("../utils/rowMappers");

async function getBadges() {
  const [rows] = await pool.execute(
    "SELECT * FROM achievements ORDER BY sort_order ASC, code ASC"
  );
  return rows.map(mapAchievementRow);
}

async function getBadgeByCode(code) {
  const [rows] = await pool.execute(
    "SELECT * FROM achievements WHERE code = ?",
    [code]
  );
  if (rows.length === 0) return null;
  return mapAchievementRow(rows[0]);
}

async function createBadge(badge) {
  await pool.execute(
    `INSERT INTO achievements (
      code, name, description, requirement_type, requirement_value, icon, sort_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      badge.code,
      badge.name,
      badge.description,
      badge.requirementType,
      badge.requirementValue,
      badge.icon || null,
      badge.sortOrder !== undefined ? badge.sortOrder : 0,
      badge.isActive !== undefined ? (badge.isActive ? 1 : 0) : 1
    ]
  );

  return getBadgeByCode(badge.code);
}

async function updateBadge(code, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.requirementType !== undefined) {
    fields.push("requirement_type = ?");
    values.push(updates.requirementType);
  }
  if (updates.requirementValue !== undefined) {
    fields.push("requirement_value = ?");
    values.push(updates.requirementValue);
  }
  if (updates.icon !== undefined) {
    fields.push("icon = ?");
    values.push(updates.icon || null);
  }
  if (updates.sortOrder !== undefined) {
    fields.push("sort_order = ?");
    values.push(updates.sortOrder);
  }
  if (updates.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(updates.isActive ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(code);
    const [result] = await pool.execute(
      `UPDATE achievements SET ${fields.join(", ")} WHERE code = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error("Achievement badge not found");
    }
  }

  return getBadgeByCode(code);
}

async function updateBadgeStatus(code, isActive) {
  const [result] = await pool.execute(
    "UPDATE achievements SET is_active = ? WHERE code = ?",
    [isActive ? 1 : 0, code]
  );

  if (result.affectedRows === 0) {
    throw new Error("Achievement badge not found");
  }

  return getBadgeByCode(code);
}

module.exports = {
  achievementRepository: {
    getBadges,
    getBadgeByCode,
    createBadge,
    updateBadge,
    updateBadgeStatus
  }
};
