import { sql } from "../config/db.js";

/* -------------------------------------------------------------------------- */
/* Helper: Save Notification to DB + Emit Socket                              */
/* -------------------------------------------------------------------------- */
async function notifyExecutionEvent(req, targetUserId, bookingId, title, message) {
  try {
    // 1️⃣ Save notification into DB
    const [saved] = await sql`
      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (${targetUserId}, 'execution', ${title}, ${message}, ${bookingId})
      RETURNING *;
    `;

    const payload = {
      id: saved.id,
      type: "execution",
      title,
      message,
      booking_id: bookingId,
      timestamp: saved.created_at,
      read: false,
    };

    // 2️⃣ Send Socket Event
    req.io.to(`user-${targetUserId}`).emit("execution_update", payload);
    console.log(`📩 Execution Notification sent to user-${targetUserId}`);

  } catch (err) {
    console.error("❌ Failed to send execution notification:", err);
  }
}


/* -------------------------------------------------------------------------- */
/* Get Execution by Booking ID                                                */
/* -------------------------------------------------------------------------- */
export const getExecutionByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await sql`
      SELECT * FROM execution WHERE booking_id = ${bookingId};
    `;

    if (result.length === 0) {
      const booking = await sql`
        SELECT id, client_id, provider_id 
        FROM bookings 
        WHERE id = ${bookingId};
      `;

      if (booking.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Booking not found"
        });
      }

      const payment = await sql`
        SELECT id FROM payments WHERE booking_id = ${bookingId};
      `;

      const payment_id = payment.length > 0 ? payment[0].id : null;

      const inserted = await sql`
        INSERT INTO execution (booking_id, client_id, provider_id, payment_id)
        VALUES (${bookingId}, ${booking[0].client_id}, ${booking[0].provider_id}, ${payment_id})
        RETURNING *;
      `;

      return res.json({
        success: true,
        message: "Execution created automatically",
        data: inserted[0]
      });
    }

    res.json({ success: true, data: result[0] });

  } catch (err) {
    console.error("❌ Error fetching execution:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch execution",
      detail: err.message
    });
  }
};


/* -------------------------------------------------------------------------- */
/* Create Execution Manually                                                  */
/* -------------------------------------------------------------------------- */
export const createExecutionIfMissing = async (req, res) => {
  const { booking_id } = req.body;

  try {
    const [exists] = await sql`
      SELECT * FROM execution WHERE booking_id = ${booking_id}
    `;

    if (exists)
      return res.json({ success: true, message: "Already exists", data: exists });

    const [booking] = await sql`
      SELECT client_id, provider_id FROM bookings WHERE id = ${booking_id}
    `;

    const [payment] = await sql`
      SELECT id FROM payments WHERE booking_id = ${booking_id}
    `;

    const [created] = await sql`
      INSERT INTO execution (booking_id, client_id, provider_id, payment_id)
      VALUES (${booking_id}, ${booking.client_id}, ${booking.provider_id}, ${payment?.id || null})
      RETURNING *
    `;

    res.json({ success: true, data: created });
  } catch (err) {
    console.error("❌ Error creating execution:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


/* -------------------------------------------------------------------------- */
/* Update Execution Field + Notify                                            */
/* -------------------------------------------------------------------------- */
export const updateExecutionField = async (req, res) => {
  try {
    const { field } = req.body;
    const { bookingId } = req.params;

    const allowedFields = ['validatedcredential', 'completedprovider', 'completedclient'];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field." });
    }

    let updated;

    // 🔵 PROVIDER validated upon arrival
    if (field === 'validatedcredential') {
      updated = await sql`
        UPDATE execution
        SET validatedcredential = 'completed'
        WHERE booking_id = ${bookingId}
        RETURNING *;
      `;

      const exec = updated[0];
      await notifyExecutionEvent(
        req,
        exec.client_id,
        bookingId,
        "Provider Validated Arrival",
        "Your provider has validated the service and started the job."
      );
    }

    // 🟢 PROVIDER marks work completed
    else if (field === 'completedprovider') {
      updated = await sql`
        UPDATE execution
        SET completedprovider = 'completed'
        WHERE booking_id = ${bookingId}
        RETURNING *;
      `;

      const exec = updated[0];
      await notifyExecutionEvent(
        req,
        exec.client_id,
        bookingId,
        "Provider Completed the Task",
        "Your provider has marked the task as completed. Please review and confirm."
      );
    }

    // 🟣 CLIENT confirms completion
    else if (field === 'completedclient') {
      updated = await sql`
        UPDATE execution
        SET completedclient = 'completed'
        WHERE booking_id = ${bookingId}
        RETURNING *;
      `;

      const exec = updated[0];
      await notifyExecutionEvent(
        req,
        exec.provider_id,
        bookingId,
        "Client Confirmed Completion",
        "Your client has confirmed the job as completed."
      );
    }


    if (!updated || updated.length === 0) {
      console.error(`❌ Record not found for booking_id: ${bookingId}`);
      return res.status(404).json({ error: "Booking ID not found in Execution table" });
    }

    return res.json({ success: true, data: updated[0] });

  } catch (error) {
    console.error("❌ Execution update error:", error);
    return res.status(500).json({
      error: "Failed to update execution field",
      details: error.message,
    });
  }
};
