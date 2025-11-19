import { sql } from "../config/db.js";

/* -------------------------------------------------------------------------- */
/* Get execution by bookingId                                                 */
/* -------------------------------------------------------------------------- */
export const getExecutionByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await sql`
      SELECT * FROM execution WHERE booking_id = ${bookingId};
    `;

    // --------------------------
    // If not found → Auto-create
    // --------------------------
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

      // Payment lookup
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
/* Create execution manually                                                  */
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
      VALUES (${booking_id}, ${booking.client_id}, ${booking.provider_id}, ${payment?.id || 0})
      RETURNING *
    `;

    res.json({ success: true, data: created });
  } catch (err) {
    console.error("❌ Error creating execution:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Update a single execution field                                            */
/* -------------------------------------------------------------------------- */
export const updateExecutionField = async (req, res) => {
  const { bookingId } = req.params;
  const { field } = req.body;

  const allowed = ["validatedcredential", "completedprovider", "completedclient"];
  if (!allowed.includes(field))
    return res.status(400).json({
      success: false,
      error: "Invalid field",
    });

  try {
    const [updated] = await sql`
      UPDATE execution
      SET ${sql(field)} = 'completed'
      WHERE booking_id = ${bookingId}
      RETURNING *
    `;

    // If provider + client both completed → mark booking done
    if (
      updated.completedprovider === "completed" &&
      updated.completedclient === "completed"
    ) {
      await sql`
        UPDATE bookings
        SET status = 'Completed'
        WHERE id = ${bookingId}
      `;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Error updating execution:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
