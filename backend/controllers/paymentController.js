// controllers/paymentController.js
import crypto from "crypto";
import Stripe from "stripe";
import { sql } from "../config/db.js";
import { logAudit } from "../utils/auditLogger.js";
import logger from "../utils/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const host = process.env.FRONTEND_URL || "localhost:5173";

const successUrl = `${protocol}://${host}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
const cancelUrl = `${protocol}://${host}/payment-cancel`;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const getTraceId = (req = {}) =>
  req.traceId ||
  req.headers?.["x-request-id"] ||
  crypto.randomUUID();


/* -------------------------------------------------------------------------- */
/* ✅ Create Stripe Checkout Session                                          */
/* -------------------------------------------------------------------------- */

export const createPaymentIntent = async (req, res) => {
  const traceId = getTraceId(req);
  const { bookingId } = req.params;

  logger.info("Payment intent creation initiated", {
    traceId,
    bookingId,
  });

  try {
    // 1️⃣ Fetch booking info
    const result = await sql`
      SELECT id, client_id, provider_id, price, notes, status
      FROM bookings 
      WHERE id = ${bookingId};
    `;

    if (result.length === 0) {
      logger.warn("Booking not found for payment intent creation", {
        traceId,
        bookingId,
      });
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result[0];
    const priceCents = booking.price ? Number(booking.price) * 100 : 5000; // default $50

    logger.info("Booking loaded for payment", {
      traceId,
      bookingId: booking.id,
      client_id: booking.client_id,
      provider_id: booking.provider_id,
      price: booking.price,
      priceCents,
      status: booking.status,
    });

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
            unit_amount: priceCents, // in cents
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        bookingId: String(bookingId),
      },
    });

    logger.info("Stripe Checkout session created", {
      traceId,
      bookingId,
      stripeSessionId: session.id,
      mode: session.mode,
    });

    // Audit: Payment session created
    await logAudit(booking.client_id, "PAYMENT_SESSION_CREATED", {
      bookingId,
      provider_id: booking.provider_id,
      stripeSessionId: session.id,
      amount: priceCents / 100,
    });

    return res.json({ url: session.url });
  } catch (err) {
    logger.error("Stripe payment intent creation error", {
      traceId,
      bookingId,
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      message: "Stripe payment failed",
      error: err.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/* ✅ Verify Stripe Checkout Session & Record Payment                         */
/* -------------------------------------------------------------------------- */

export const verifyPaymentSession = async (req, res) => {
  const traceId = getTraceId(req);
  const { sessionId } = req.params;

  logger.info("Stripe payment verification initiated", {
    traceId,
    sessionId,
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    logger.info("Stripe session retrieved", {
      traceId,
      sessionId,
      payment_status: session.payment_status,
      mode: session.mode,
    });

    if (!session || session.payment_status !== "paid") {
      logger.warn("Stripe payment not verified or not paid", {
        traceId,
        sessionId,
        payment_status: session?.payment_status,
      });
      return res.status(400).json({ message: "Payment not verified" });
    }

    // 1️⃣ Get data from session
    const bookingId = session.metadata?.bookingId;
    const stripePaymentId = session.payment_intent;
    const amountPaid = session.amount_total / 100; // cents → dollars

    if (!bookingId) {
      logger.error("Payment session missing bookingId in metadata", {
        traceId,
        sessionId,
      });
      return res
        .status(400)
        .json({ message: "No booking reference in session" });
    }

    // 2️⃣ Fetch booking details
    const bookingRows = await sql`
      SELECT id, client_id, provider_id 
      FROM bookings
      WHERE id = ${bookingId};
    `;

    if (bookingRows.length === 0) {
      logger.error("Booking not found in DB after successful payment", {
        traceId,
        bookingId,
        sessionId,
      });
      return res.status(404).json({ message: "Booking not found" });
    }

    const { client_id, provider_id } = bookingRows[0];

    logger.info("Booking loaded for payment verification", {
      traceId,
      bookingId,
      client_id,
      provider_id,
      stripePaymentId,
      amountPaid,
    });

    // 3️⃣ Insert or Update the 'payments' table
    const existing = await sql`
      SELECT id, status 
      FROM payments 
      WHERE booking_id = ${bookingId};
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

      logger.info("Existing payment record updated", {
        traceId,
        bookingId,
        paymentId: existing[0].id,
        status: "Paid",
        amount: amountPaid,
      });
    } else {
      const inserted = await sql`
        INSERT INTO payments (booking_id, client_id, provider_id, amount, stripe_payment_id, status)
        VALUES (${bookingId}, ${client_id}, ${provider_id}, ${amountPaid}, ${stripePaymentId}, 'Paid')
        RETURNING id;
      `;

      logger.info("New payment record inserted", {
        traceId,
        bookingId,
        paymentId: inserted[0].id,
        status: "Paid",
        amount: amountPaid,
      });
    }

    // 4️⃣ Update the 'bookings' table
    await sql`
      UPDATE bookings 
      SET status = 'Paid', updated_at = NOW()
      WHERE id = ${bookingId};
    `;

    logger.info("Booking status updated to Paid", {
      traceId,
      bookingId,
      client_id,
      provider_id,
    });

    // 🧾 Audit logs: payment success
    await logAudit(client_id, "PAYMENT_SUCCESS", {
      bookingId,
      amount: amountPaid,
      stripePaymentId,
      as: "client",
    });
    await logAudit(provider_id, "PAYMENT_SUCCESS_PROVIDER", {
      bookingId,
      amount: amountPaid,
      stripePaymentId,
      as: "provider",
    });

    res.json({ bookingId, message: "Payment verified and recorded" });
  } catch (error) {
    logger.error("Stripe verification error", {
      traceId,
      sessionId,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Stripe verification failed" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🌟 Get Payout History for Logged-in Provider                               */
/* -------------------------------------------------------------------------- */

export const getProviderPaymentHistory = async (req, res) => {
  const traceId = getTraceId(req);

  try {
    const providerId = req.user?.id;

    if (!providerId) {
      logger.warn("Provider payment history request without auth", {
        traceId,
      });
      return res
        .status(401)
        .json({ message: "Not authorized. No user ID." });
    }

    logger.info("Provider payment history requested", {
      traceId,
      providerId,
    });

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

    logger.info("Provider payment history fetched", {
      traceId,
      providerId,
      totalRecords: payouts.length,
    });

    // (Optional) Audit: provider viewed payout history
    await logAudit(providerId, "PAYOUT_HISTORY_VIEWED", {
      records: payouts.length,
    });

    res.json(payouts);
  } catch (err) {
    logger.error("Error fetching provider payment history", {
      traceId,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      message: "Failed to fetch payment history",
      error: err.message,
    });
  }
};
