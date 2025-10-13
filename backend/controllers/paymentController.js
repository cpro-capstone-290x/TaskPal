import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { booking_id, client_id, provider_id, amount } = req.body;

    if (!booking_id || !client_id || !provider_id || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("💳 Creating payment for:", {
      booking_id,
      client_id,
      provider_id,
      amount,
    });

    // Convert amount to cents (Stripe uses the smallest currency unit)
    const totalAmount = Math.round(parseFloat(amount) * 100);

    // ✅ Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `TaskPal Booking #${booking_id}`,
              description: `Payment to provider ${provider_id}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:5173/payment-success?booking_id=${booking_id}`,
      cancel_url: `http://localhost:5173/payment-cancelled`,
      metadata: {
        booking_id: booking_id.toString(),
        client_id: client_id.toString(),
        provider_id: provider_id.toString(),
      },
    });

    console.log("✅ Stripe session created:", session.url);
    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    res.status(500).json({ error: "Failed to create Stripe checkout session." });
  }
};
