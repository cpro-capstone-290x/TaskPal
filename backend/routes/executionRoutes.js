import express from "express";
import { sql } from "../config/db.js";
import {
  createExecution,
  updateExecutionStatus,
} from "../controllers/executionController.js";

const router = express.Router();

router.post("/", createExecution);
router.put("/:execution_id", updateExecutionStatus);
router.get("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await sql`
      SELECT * FROM execution WHERE booking_id = ${bookingId};
    `;

    if (result.length === 0) {
      // ✅ Auto-create if not found
      const booking = await sql`
        SELECT id, client_id, provider_id FROM bookings WHERE id = ${bookingId};
      `;
      if (booking.length === 0)
        return res.status(404).json({ success: false, error: "Booking not found" });

      const payment = await sql`
        SELECT id FROM payments WHERE booking_id = ${bookingId};
      `;
      const payment_id = payment[0]?.id || null;

      const inserted = await sql`
        INSERT INTO execution (booking_id, client_id, provider_id, payment_id)
        VALUES (${bookingId}, ${booking[0].client_id}, ${booking[0].provider_id}, ${payment_id})
        RETURNING *;
      `;
      return res.json({
        success: true,
        message: "Execution record auto-created.",
        data: inserted[0],
      });
    }

    res.json({ success: true, data: result[0] });
  } catch (err) {
    console.error("❌ Error fetching execution:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch execution.",
      details: err.message,
    });
  }
});

// In backend/routes/executionRoutes.js

router.put("/:bookingId/update", async (req, res) => {
  const { bookingId } = req.params;
  const { field } = req.body;
  const allowed = ["validatedcredential", "completedprovider", "completedclient"];
  if (!allowed.includes(field)) return res.status(400).json({ success: false });

  try {
    // ✅ Ensure record exists
    let [execution] = await sql`
      SELECT * FROM execution WHERE booking_id = ${bookingId};
    `;
    
    if (!execution) {
      const [booking] = await sql`
        SELECT client_id, provider_id FROM bookings WHERE id = ${bookingId};
      `;
      const clientId = booking?.client_id;
      const providerId = booking?.provider_id;
      [execution] = await sql`
        INSERT INTO execution (booking_id, client_id, provider_id)
        VALUES (${bookingId}, ${clientId}, ${providerId})
        RETURNING *;
      `;
    }

    // ✅ Update current step
    const updated = await sql`
      UPDATE execution 
      SET ${sql(field)} = 'completed'
      WHERE booking_id = ${bookingId}
      RETURNING *;
    `;

    const updatedExecution = updated[0];

    // ✅ Check if both sides completed
    if (updatedExecution.completedprovider === "completed" &&
        updatedExecution.completedclient === "completed") {
      
      await sql`
        UPDATE bookings
        SET status = 'Completed'
        WHERE id = ${bookingId};
      `;
    }

    res.status(200).json({ success: true, data: updatedExecution });

  } catch (err) {
    console.error("❌ Error updating execution:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});





export default router;
