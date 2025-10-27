// routes/paymentRoute.js
import express from "express";
import { createPaymentIntent, verifyPaymentSession } from "../controllers/paymentController.js";

const router = express.Router();

// ✅ POST /api/payments/create-intent/:bookingId
router.post("/create-intent/:bookingId", createPaymentIntent);
router.get("/verify/:sessionId", verifyPaymentSession);

export default router;
