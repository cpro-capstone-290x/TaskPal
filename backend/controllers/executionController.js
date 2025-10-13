import { sql } from "../config/db.js";

export const createExecution = async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, error: "Missing booking_id" });
    }

    // 🔹 Get booking info
    const booking = await sql`
      SELECT id, client_id, provider_id FROM bookings WHERE id = ${booking_id};
    `;

    if (booking.length === 0) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    const { client_id, provider_id } = booking[0];

    // 🔹 Get payment info
    const payment = await sql`
      SELECT id FROM payments WHERE booking_id = ${booking_id};
    `;
    const payment_id = payment[0]?.id || null;

    // 🔹 Check if execution already exists
    const existing = await sql`
      SELECT * FROM execution WHERE booking_id = ${booking_id};
    `;
    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Execution already exists",
        data: existing[0],
      });
    }

    // 🔹 Create new execution
    const result = await sql`
      INSERT INTO execution (booking_id, client_id, provider_id, payment_id)
      VALUES (${booking_id}, ${client_id}, ${provider_id}, ${payment_id})
      RETURNING *;
    `;

    res.status(201).json({
      success: true,
      message: "✅ Execution record created successfully",
      data: result[0],
    });
  } catch (err) {
    console.error("❌ Error creating execution:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create execution",
      details: err.message,
    });
  }
};

export const updateExecutionStatus = async (req, res) => {
  try {
    const { execution_id } = req.params;
    const { validatedCredential, completedProvider, completedClient } = req.body;
    const [execution] = await sql`UPDATE execution SET validatedCredential = ${validatedCredential}, completedProvider = ${completedProvider}, completedClient = ${completedClient} WHERE id = ${execution_id} RETURNING *`;
    if (!execution) {
      return res.status(404).json({ message: "Execution not found" });
    }
    res.status(200).json({ message: "Execution updated successfully", execution });
  } catch (error) {
    console.error("Error updating execution status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}