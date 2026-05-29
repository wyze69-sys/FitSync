const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapWeightLogRow } = require("../utils/rowMappers");

async function getWeightLogsByUserId(userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM weight_logs WHERE user_id = ? ORDER BY date DESC, created_at DESC",
    [userId]
  );
  return rows.map(mapWeightLogRow);
}

async function createWeightLog(log) {
  const id = createId("w");

  await pool.execute(
    `INSERT INTO weight_logs (id, user_id, date, weight, bmi, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, log.userId, log.date, log.weight, log.bmi, log.notes || null]
  );

  await pool.execute("UPDATE users SET weight = ? WHERE id = ?", [log.weight, log.userId]);

  const [rows] = await pool.execute("SELECT * FROM weight_logs WHERE id = ?", [id]);
  return mapWeightLogRow(rows[0]);
}

async function deleteWeightLog(id, userId) {
  const [result] = await pool.execute("DELETE FROM weight_logs WHERE id = ? AND user_id = ?", [
    id,
    userId
  ]);
  return result.affectedRows > 0;
}

module.exports = {
  weightRepository: {
    getWeightLogsByUserId,
    createWeightLog,
    deleteWeightLog
  }
};
