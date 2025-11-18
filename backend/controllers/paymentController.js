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

    // --- ✅ START NEW LOGIC ---

    // 1. Get all necessary data from the session
    const bookingId = session.metadata?.bookingId;
    const stripePaymentId = session.payment_intent; // Stripe's payment ID
    const amountPaid = session.amount_total / 100; // Convert from cents to dollars

    if (!bookingId) {
      return res.status(400).json({ message: "No booking reference in session" });
    }

    // 2. Fetch booking details (client_id, provider_id)
    const bookingRows = await sql`
      SELECT client_id, provider_id 
      FROM bookings
      WHERE id = ${bookingId};
    `;

    if (bookingRows.length === 0) {
      console.error(`❌ Booking ${bookingId} not found in DB after payment.`);
      return res.status(404).json({ message: "Booking not found" });
    }

    const { client_id, provider_id } = bookingRows[0];

    // 3. Insert or Update the 'payments' table
    const existing = await sql`
      SELECT * FROM payments WHERE booking_id = ${bookingId};
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE payments
        SET amount = ${amountPaid}, 
            stripe_payment_id = ${stripePaymentId},
            status = 'Paid',
            created_at = NOW()
        WHERE booking_id = ${bookingId};
      `;
    } else {
      await sql`
        INSERT INTO payments (booking_id, client_id, provider_id, amount, stripe_payment_id, status)
        VALUES (${bookingId}, ${client_id}, ${provider_id}, ${amountPaid}, ${stripePaymentId}, 'Paid');
      `;
    }
    console.log(`✅ Payment table updated for booking ${bookingId}.`);

    // 4. Update the 'bookings' table
    await sql`
      UPDATE bookings 
      SET status = 'Paid' 
      WHERE id = ${bookingId};
    `;
    console.log(`✅ Booking table status updated for ${bookingId}.`);
    
    // --- 🔼 END NEW LOGIC ---

    res.json({ bookingId, message: "Payment verified and recorded" });
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
        b.provider_id = ${providerId} AND b.status = 'Paid'
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