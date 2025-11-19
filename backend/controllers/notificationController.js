import { sql } from "../config/db.js";

export const getNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await sql`
      SELECT *
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 200
    `;

    return res.json({ data: rows });
  } catch (err) {
    console.error("❌ Error fetching notifications", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const markAllAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = ${userId}
    `;
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("❌ Error marking notifications as read", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const markOneAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // from protect middleware

  try {
    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE id = ${id} AND user_id = ${userId}
    `;
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("❌ Error marking notification as read", err);
    res.status(500).json({ error: "Server error" });
  }
};
