// controllers/paymentController.js
import Stripe from "stripe";
import { sql } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const host = process.env.FRONTEND_URL || "localhost:5173";

const successUrl = `${protocol}://${host}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
const cancelUrl = `${protocol}://${host}/payment-cancel`;

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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        bookingId: String(bookingId),
      }
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

export const verifyPaymentSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("🔍 Stripe verification session:", session);

    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not verified" });
    }

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      return res.status(400).json({ message: "No booking reference in session" });
    }

    res.json({ bookingId });
  } catch (error) {
    console.error("❌ Stripe verification error:", error);
    res.status(500).json({ message: "Stripe verification failed" });
  }
};

