import Stripe from "stripe";
import { sql } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create Payment Intent
 * Requires: booking_id, client_id, provider_id
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { booking_id, client_id, provider_id } = req.body;

    // ✅ 1. Validate input
    if (!booking_id || !client_id || !provider_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ 2. Fetch price from DB
    const result = await sql`
      SELECT price 
      FROM bookings 
      WHERE id = ${booking_id}
    `;
    const booking = result[0];
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const agreedPrice = booking.price;
    if (!agreedPrice || agreedPrice <= 0)
      return res.status(400).json({ error: "Invalid price" });

    // ✅ 3. Create Stripe Payment Intent (price in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(agreedPrice * 100),
      currency: "usd",
      metadata: {
        booking_id,
        client_id,
        provider_id,
      },
      description: `Payment for booking #${booking_id}`,
    });

    // ✅ 4. Optionally store in payments table
    await sql`
      INSERT INTO payments (booking_id, client_id, provider_id, amount, stripe_payment_id, status)
      VALUES (${booking_id}, ${client_id}, ${provider_id}, ${agreedPrice}, ${paymentIntent.id}, 'pending')
    `;

    // ✅ 5. Respond with client secret
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: error.message });
  }
};
