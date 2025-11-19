import { sql } from "../config/db.js";

/* ================================
   CREATE ANNOUNCEMENT
================================ */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, start_at, end_at } = req.body;

    const [newAnnouncement] = await sql`
      INSERT INTO system_announcements (title, message, start_at, end_at)
      VALUES (${title}, ${message}, ${start_at}, ${end_at})
      RETURNING *
    `;

    return res.status(201).json({ success: true, data: newAnnouncement });
  } catch (err) {
    console.error("❌ createAnnouncement:", err);
    return res.status(500).json({ error: "Failed to create announcement" });
  }
};

/* ================================
   GET ACTIVE ANNOUNCEMENT
================================ */
export const getActiveAnnouncement = async (req, res) => {
  try {
    const [announcement] = await sql`
      SELECT *
      FROM system_announcements
      WHERE is_active = true
      ORDER BY start_at DESC
      LIMIT 1
    `;

    return res.status(200).json({ success: true, data: announcement || null });
  } catch (err) {
    console.error("❌ getActiveAnnouncement:", err);
    return res.status(500).json({ error: "Failed to load announcement" });
  }
};

/* ================================
   GET ALL ANNOUNCEMENTS
================================ */
export const getAllAnnouncements = async (req, res) => {
  try {
    const all = await sql`
      SELECT *
      FROM system_announcements
      ORDER BY created_at DESC
    `;

    return res.status(200).json({ success: true, data: all });
  } catch (err) {
    console.error("❌ getAllAnnouncements:", err);
    return res.status(500).json({ error: "Failed to load announcements" });
  }
};

/* ================================
   ACTIVATE ANNOUNCEMENT (real-time)
================================ */
export const activateAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;

    const [updated] = await sql`
      UPDATE system_announcements
      SET is_active = true
      WHERE id = ${announcementId}
      RETURNING *
    `;

    if (!updated)
      return res.status(404).json({ error: "Announcement not found" });

    // 🔥 REAL-TIME BROADCAST
    req.io.emit("announcement:activated", updated);

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ activateAnnouncement:", err);
    return res.status(500).json({ error: "Failed to activate announcement" });
  }
};

/* ================================
   COMPLETE ANNOUNCEMENT (Close it)
================================ */
export const completeAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;

    const [updated] = await sql`
      UPDATE system_announcements
      SET is_active = false
      WHERE id = ${announcementId}
      RETURNING *
    `;

    if (!updated)
      return res.status(404).json({ error: "Announcement not found" });

    // 🔥 REAL-TIME BROADCAST
    req.io.emit("announcement:completed", updated);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ completeAnnouncement:", err);
    return res.status(500).json({ error: "Failed to complete announcement" });
  }
};

/* ================================
   DELETE ANNOUNCEMENT
================================ */
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;

    const [deleted] = await sql`
      DELETE FROM system_announcements
      WHERE id = ${announcementId}
      RETURNING *
    `;

    if (!deleted)
      return res.status(404).json({ error: "Announcement not found" });

    // 🔥 Real-time: remove if currently shown
    req.io.emit("announcement:deleted", announcementId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ deleteAnnouncement:", err);
    return res.status(500).json({ error: "Failed to delete announcement" });
  }
};
