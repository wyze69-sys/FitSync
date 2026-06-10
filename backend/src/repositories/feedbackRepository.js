const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapFeedbackRow } = require("../utils/rowMappers");

const VALID_STATUSES = ["new", "in_progress", "resolved", "archived"];
const VALID_TYPES = ["bug", "feature", "general"];

/**
 * Returns a filtered list of feedback joined with user name/email.
 * @param {{ status?: string, type?: string }} filters
 */
async function getFeedbackList(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.status && VALID_STATUSES.includes(filters.status)) {
    conditions.push("f.status = ?");
    params.push(filters.status);
  }

  if (filters.type && VALID_TYPES.includes(filters.type)) {
    conditions.push("f.type = ?");
    params.push(filters.type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
       f.id,
       f.user_id,
       u.name AS user_name,
       u.email AS user_email,
       f.type,
       f.subject,
       f.message,
       f.status,
       f.admin_note,
       f.created_at,
       f.updated_at
     FROM user_feedback f
     LEFT JOIN users u ON u.id = f.user_id
     ${where}
     ORDER BY f.created_at DESC`,
    params
  );

  return rows.map(mapFeedbackRow);
}

/**
 * Returns a single feedback record by id with user info.
 * @param {string} id
 */
async function getFeedbackById(id) {
  const [rows] = await pool.execute(
    `SELECT
       f.id,
       f.user_id,
       u.name AS user_name,
       u.email AS user_email,
       f.type,
       f.subject,
       f.message,
       f.status,
       f.admin_note,
       f.created_at,
       f.updated_at
     FROM user_feedback f
     LEFT JOIN users u ON u.id = f.user_id
     WHERE f.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  return mapFeedbackRow(rows[0]);
}

/**
 * Creates a new feedback record submitted by a user.
 * @param {{ type: string, subject: string, message: string }} data
 * @param {string|null} userId
 */
async function createFeedback(data, userId = null) {
  const id = createId("fb");
  await pool.execute(
    `INSERT INTO user_feedback (id, user_id, type, subject, message, status)
     VALUES (?, ?, ?, ?, ?, 'new')`,
    [
      id,
      userId,
      data.type || "general",
      data.subject || "",
      data.message
    ]
  );
  return getFeedbackById(id);
}

/**
 * Updates status and/or admin_note on a feedback record.
 * @param {string} id
 * @param {{ status?: string, adminNote?: string }} updates
 */
async function updateFeedback(id, updates) {
  const fields = [];
  const values = [];

  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.adminNote !== undefined) {
    fields.push("admin_note = ?");
    values.push(updates.adminNote);
  }

  if (fields.length > 0) {
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE user_feedback SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      throw new Error("Feedback record not found");
    }
  }

  return getFeedbackById(id);
}

/**
 * Returns count per status across all feedback records.
 */
async function getFeedbackStatusCounts() {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS total FROM user_feedback GROUP BY status`
  );
  const counts = { new: 0, in_progress: 0, resolved: 0, archived: 0 };
  for (const row of rows) {
    if (counts[row.status] !== undefined) {
      counts[row.status] = Number(row.total);
    }
  }
  return counts;
}

module.exports = {
  feedbackRepository: {
    getFeedbackList,
    getFeedbackById,
    createFeedback,
    updateFeedback,
    getFeedbackStatusCounts
  }
};
