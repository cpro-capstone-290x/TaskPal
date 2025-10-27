// controllers/paymentController.js
import Stripe from "stripe";
import { sql } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create Stripe Checkout Session
export const createPaymentIntent = async (req, res) => {
  const { bookingId } = req.params;
  console.log("💳 Creating PaymentIntent for booking:", bookingId);

  try {
    // 1️⃣ Fetch booking info
    const result = await sql`
      SELECT * FROM bookings WHERE id = ${bookingId};
    `;

    if (result.length === 0) {
      console.error("❌ Booking not found in DB");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result[0];
    const price = booking.price ? Number(booking.price) * 100 : 5000; // default to $50 if no price

    // 2️⃣ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `TaskPal Service - Booking #${bookingId}`,
              description: booking.notes || "TaskPal booking payment",
            },
            unit_amount: price, // in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success/${bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled/${bookingId}`,
    });

    console.log("✅ Stripe session created:", session.url);
    return res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe Payment Error:", err);
    return res.status(500).json({
      message: "Stripe payment failed",
      error: err.message,
    });
  }
};
