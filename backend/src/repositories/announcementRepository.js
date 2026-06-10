const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapAnnouncementRow } = require("../utils/rowMappers");

function formatDateTimeForDb(value) {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function getAnnouncements() {
  const [rows] = await pool.execute(
    "SELECT * FROM announcements ORDER BY created_at DESC"
  );
  return rows.map(mapAnnouncementRow);
}

async function getAnnouncementById(id) {
  const [rows] = await pool.execute(
    "SELECT * FROM announcements WHERE id = ?",
    [id]
  );
  if (rows.length === 0) return null;
  return mapAnnouncementRow(rows[0]);
}

async function getActiveAnnouncements(audienceList, nowStr) {
  const [rows] = await pool.query(
    `SELECT * FROM announcements
     WHERE is_active = TRUE
       AND (start_at IS NULL OR start_at <= ?)
       AND (end_at IS NULL OR end_at >= ?)
       AND audience IN (${audienceList.map(() => "?").join(", ")})
     ORDER BY created_at DESC`,
    [nowStr, nowStr, ...audienceList]
  );
  return rows.map(mapAnnouncementRow);
}

async function createAnnouncement(data, creatorId = null) {
  const id = createId("ann");
  await pool.execute(
    `INSERT INTO announcements (
      id, title, body, audience, placement, start_at, end_at, is_active, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.body,
      data.audience || "users",
      data.placement || "dashboard",
      formatDateTimeForDb(data.startAt),
      formatDateTimeForDb(data.endAt),
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      creatorId
    ]
  );
  return getAnnouncementById(id);
}

async function updateAnnouncement(id, updates) {
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.body !== undefined) {
    fields.push("body = ?");
    values.push(updates.body);
  }
  if (updates.audience !== undefined) {
    fields.push("audience = ?");
    values.push(updates.audience);
  }
  if (updates.placement !== undefined) {
    fields.push("placement = ?");
    values.push(updates.placement);
  }
  if (updates.startAt !== undefined) {
    fields.push("start_at = ?");
    values.push(formatDateTimeForDb(updates.startAt));
  }
  if (updates.endAt !== undefined) {
    fields.push("end_at = ?");
    values.push(formatDateTimeForDb(updates.endAt));
  }
  if (updates.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(updates.isActive ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE announcements SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      throw new Error("Announcement not found");
    }
  }

  return getAnnouncementById(id);
}

async function deleteAnnouncement(id) {
  const [result] = await pool.execute(
    "DELETE FROM announcements WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  announcementRepository: {
    getAnnouncements,
    getAnnouncementById,
    getActiveAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  }
};
