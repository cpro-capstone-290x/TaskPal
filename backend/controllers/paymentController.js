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

    // Update the booking in your database!
    try {
      const result = await sql`
        UPDATE bookings 
        SET status = 'paid', stripe_session_id = ${sessionId} 
        WHERE id = ${bookingId}
        RETURNING id;
      `;

      if (result.length === 0) {
        console.error(`❌ Failed to update booking status for ID: ${bookingId}`);
        // Still, the payment was successful, so let the frontend know.
      } else {
        console.log(`✅ Booking ${bookingId} marked as 'paid'.`);
      }
    } catch (dbError) {
      console.error("❌ DB update error after payment:", dbError);
      // Don't fail the request, payment was successful. Log this error.
    }

    res.json({ bookingId });
  } catch (error) {
    console.error("❌ Stripe verification error:", error);
    res.status(500).json({ message: "Stripe verification failed" });
  }
};

// 🌟 NEW: Get Payout History for Logged-in Provider
export const getProviderPaymentHistory = async (req, res) => {
  try {
    // ❗ This assumes you have auth middleware that adds `req.user`
    //    (e.g., from a JWT) with `req.user.id` being the provider's ID.
    const providerId = req.user.id; 

    if (!providerId) {
      return res.status(401).json({ message: "Not authorized. No user ID." });
    }

    // Fetch all 'paid' bookings linked to this provider
    // We also select the user (customer) info to show who booked
    const payouts = await sql`
      SELECT 
        b.id as booking_id, 
        b.price, 
        b.created_at, 
        b.notes,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name
      FROM 
        bookings b
      JOIN 
        users u ON b.client_id = u.id
      WHERE 
        b.provider_id = ${providerId} AND b.status = 'paid'
      ORDER BY 
        b.created_at DESC;
    `;

    res.json(payouts);
  } catch (err) {
    console.error("❌ Error fetching provider payment history:", err);
    res.status(500).json({
      message: "Failed to fetch payment history",
      error: err.message,
    });
  }
};