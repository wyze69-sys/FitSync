const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapChallengeRow } = require("../utils/rowMappers");

async function getChallenges() {
  const [rows] = await pool.execute(
    "SELECT * FROM challenges ORDER BY start_date DESC, created_at DESC"
  );
  return rows.map(mapChallengeRow);
}

async function getChallengeById(id) {
  const [rows] = await pool.execute(
    "SELECT * FROM challenges WHERE id = ?",
    [id]
  );
  if (rows.length === 0) return null;
  return mapChallengeRow(rows[0]);
}

async function getActiveChallenges() {
  const [rows] = await pool.execute(
    "SELECT * FROM challenges WHERE is_active = TRUE ORDER BY start_date DESC, created_at DESC"
  );
  return rows.map(mapChallengeRow);
}

async function createChallenge(challenge, creatorId = null) {
  const id = createId("chg");
  await pool.execute(
    `INSERT INTO challenges (
      id, title, description, challenge_type, target_value, start_date, end_date, reward_xp, badge_code, is_active, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      challenge.title,
      challenge.description,
      challenge.challengeType,
      challenge.targetValue,
      challenge.startDate,
      challenge.endDate,
      challenge.rewardXp !== undefined ? challenge.rewardXp : 0,
      challenge.badgeCode || null,
      challenge.isActive !== undefined ? (challenge.isActive ? 1 : 0) : 1,
      creatorId
    ]
  );
  return getChallengeById(id);
}

async function updateChallenge(id, updates) {
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.challengeType !== undefined) {
    fields.push("challenge_type = ?");
    values.push(updates.challengeType);
  }
  if (updates.targetValue !== undefined) {
    fields.push("target_value = ?");
    values.push(updates.targetValue);
  }
  if (updates.startDate !== undefined) {
    fields.push("start_date = ?");
    values.push(updates.startDate);
  }
  if (updates.endDate !== undefined) {
    fields.push("end_date = ?");
    values.push(updates.endDate);
  }
  if (updates.rewardXp !== undefined) {
    fields.push("reward_xp = ?");
    values.push(updates.rewardXp);
  }
  if (updates.badgeCode !== undefined) {
    fields.push("badge_code = ?");
    values.push(updates.badgeCode || null);
  }
  if (updates.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(updates.isActive ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE challenges SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      throw new Error("Challenge not found");
    }
  }

  return getChallengeById(id);
}

async function achievementExists(code) {
  const [rows] = await pool.execute(
    "SELECT 1 FROM achievements WHERE code = ? LIMIT 1",
    [code]
  );
  return rows.length > 0;
}

module.exports = {
  challengeRepository: {
    getChallenges,
    getChallengeById,
    getActiveChallenges,
    createChallenge,
    updateChallenge,
    achievementExists
  }
};
