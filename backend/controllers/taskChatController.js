import { StreamChat } from "stream-chat";
import { sql } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

// Init Stream Chat client
const client = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

console.log("api key:", process.env.STREAM_API_KEY);

export const setupChatRoutes = (app) => {
  app.post("/api/chat/token", (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const token = client.createToken(userId);
    res.json({ token });
  });
};

/**
 * 1. Book a Task
 * Creates a booking in DB + a Stream Chat channel between client & provider
 */
export const bookTask = async (req, res) => {
  try {
    const { task_id, client_id, provider_id, notes, scheduled_date } = req.body;

    // Insert booking in DB
    const [booking] = await sql`
      INSERT INTO bookings (task_id, client_id, provider_id, status, notes, scheduled_date)
      VALUES (${task_id}, ${client_id}, ${provider_id}, 'booked', ${notes}, ${scheduled_date})
      RETURNING *
    `;

    //Ensure Stream users exist
    await client.upsertUser({ id: `user-${client_id}`, role: "user" });
    await client.upsertUser({ id: `provider-${provider_id}`, role: "user" });

    // Prefix IDs so Stream doesn’t see duplicates
    const members = [`user-${client_id}`, `provider-${provider_id}`];

    // ✅ Use created_by_id, not created_by
    const channel = client.channel("messaging", `booking-${booking.id}`, {
      members,
      booking_id: booking.id,
      task_id: booking.task_id,
      status: "booked",
      created_by_id: `user-${client_id}`
    });

    await channel.create();

    res.json({
      success: true,
      booking,
      channel: channel.id
    });
  } catch (err) {
    console.error("❌ Book Task Error:", err);
    res.status(500).json({ error: "Booking failed" });
  }
};


/**
 * 2. Negotiate Task
 * Sends a negotiation message to Stream + saves it in DB
 */
export const negotiateTask = async (req, res) => {
  try {
    const { booking_id, provider_id, proposed_price, message } = req.body;

    // Insert negotiation in DB
    const [negotiation] = await sql`
      INSERT INTO negotiations (booking_id, provider_id, proposed_price, message, status)
      VALUES (${booking_id}, ${provider_id}, ${proposed_price}, ${message}, 'pending')
      RETURNING *
    `;

    // Send Stream message in the booking channel
    const channel = client.channel("messaging", `booking-${booking_id}`);
    const msg = await channel.sendMessage({
      text: message,
      user_id: provider_id.toString(),
      extra_fields: {
        booking_id,
        proposed_price,
        status: "pending"
      }
    });

    res.json({
      success: true,
      negotiation,
      stream_message_id: msg.message.id
    });
  } catch (err) {
    console.error("❌ Negotiate Task Error:", err);
    res.status(500).json({ error: "Negotiation failed" });
  }
};

/**
 * 3. Respond to Negotiation
 * Provider accepts/rejects → updates DB + sends Stream message
 */
export const respondNegotiation = async (req, res) => {
  try {
    const { negotiation_id, provider_id, status, final_price } = req.body;

    // 1. Update DB
    const [updated] = await sql`
      UPDATE negotiations
      SET status = ${status}, final_price = ${final_price}, updated_at = NOW()
      WHERE id = ${negotiation_id}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ error: "Negotiation not found" });
    }

    // 2. Get booking_id for the channel
    const booking_id = updated.booking_id;

    // 3. Ensure provider exists in Stream
    await client.upsertUser({ id: `provider-${provider_id}`, role: "user" });

    // 4. Send Stream Chat message
    const channel = client.channel("messaging", `booking-${booking_id}`);
    const msg = await channel.sendMessage({
      text:
        status === "accepted"
          ? `✅ Offer accepted at $${final_price}`
          : `❌ Offer rejected`,
      user_id: `provider-${provider_id}`, // 👈 prefixed ID
      extra_fields: {
        negotiation_id,
        booking_id,
        status,
        final_price,
      },
    });

    res.json({
      success: true,
      negotiation: updated,
      stream_message_id: msg.message.id,
    });
  } catch (err) {
    console.error("❌ Respond Negotiation Error:", err);
    res.status(500).json({ error: "Response failed" });
  }
};

