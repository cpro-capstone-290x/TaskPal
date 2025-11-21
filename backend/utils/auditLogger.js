import { sql } from "../config/db.js";

export async function logAudit(userId, action, metadata = {}) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, metadata)
      VALUES (${userId}, ${action}, ${metadata});
    `;
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
}
 