// routes/bookingRoutes.js
import express from "express";
import { sql } from "../config/db.js"; // ✅ ADD THIS IMPORT
import {
  bookTask,
  getBookingById,
  updateBookingPrice,
  agreeToPrice,
  downloadAgreement,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ GET /api/bookings?client_id=1  or  /api/bookings?provider_id=2
router.get("/", async (req, res) => {
  try {
    const { client_id, provider_id, status } = req.query;
    let result;

    if (client_id) {
      result = await sql`
        SELECT 
          b.*, 
          p.name AS provider_name,
          p.service_type AS provider_service,
          p.provider_type AS provider_type
        FROM bookings b
        LEFT JOIN providers p ON b.provider_id = p.id
        WHERE b.client_id = ${client_id}
        ${status ? sql`AND b.status = ${status}` : sql``}
        ORDER BY b.created_at DESC;
      `;
    } else if (provider_id) {
      result = await sql`
        SELECT 
          b.*, 
          u.first_name AS client_first_name,
          u.last_name AS client_last_name
        FROM bookings b
        LEFT JOIN users u ON b.client_id = u.id
        WHERE b.provider_id = ${provider_id}
        ${status ? sql`AND b.status = ${status}` : sql``}
        ORDER BY b.created_at DESC;
      `;
    } else {
      result = await sql`
        SELECT 
          b.*, 
          p.name AS provider_name
        FROM bookings b
        LEFT JOIN providers p ON b.provider_id = p.id
        ${status ? sql`WHERE b.status = ${status}` : sql``}
        ORDER BY b.created_at DESC;
      `;
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});


// ✅ Existing routes
router.get("/:id", protect, getBookingById);
router.post("/", bookTask);
router.put("/:id/price", updateBookingPrice);
router.put("/:id/agree", agreeToPrice);
router.get("/:id/agreement", downloadAgreement);
// ✅ NEW ROUTE to mark booking as Paid and record payment details
router.put("/:id/paid", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const body = req.body || {};

    const amount = Number(body.amount) || 0;
    const stripe_payment_id = body.stripe_payment_id || null;

    // 1️⃣ Fetch booking details to get client/provider IDs
    const bookingRows = await sql`
      SELECT client_id, provider_id
      FROM bookings
      WHERE id = ${bookingId};
    `;

    if (bookingRows.length === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const { client_id, provider_id } = bookingRows[0];

    // 2️⃣ Check if a payment already exists for this booking
    const existing = await sql`
      SELECT * FROM payments WHERE booking_id = ${bookingId};
    `;

    let paymentResult;

    if (existing.length > 0) {
      // 3️⃣ Update existing record
      paymentResult = await sql`
        UPDATE payments
        SET amount = ${amount},
            stripe_payment_id = ${stripe_payment_id},
            status = 'Paid',
            created_at = NOW()
        WHERE booking_id = ${bookingId}
        RETURNING *;
      `;
    } else {
      // 4️⃣ Insert new payment record
      paymentResult = await sql`
        INSERT INTO payments (booking_id, client_id, provider_id, amount, stripe_payment_id, status)
        VALUES (${bookingId}, ${client_id}, ${provider_id}, ${amount}, ${stripe_payment_id}, 'Paid')
        RETURNING *;
      `;
    }

    // 5️⃣ Update booking status
    await sql`
      UPDATE bookings
      SET status = 'Paid'
      WHERE id = ${bookingId};
    `;

    return res.json({
      success: true,
      message: "✅ Payment recorded successfully",
      payment: paymentResult[0],
    });

  } catch (err) {
    console.error("❌ Error updating booking:", err);
    return res.status(500).json({
      error: "Failed to record payment",
      details: err.message,
    });
  }
});


export default router;
