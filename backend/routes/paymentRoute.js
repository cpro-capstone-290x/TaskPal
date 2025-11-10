// routes/paymentRoute.js
import express from "express";
import { createPaymentIntent, verifyPaymentSession, getProviderPaymentHistory } from "../controllers/paymentController.js";
import { protect, provider, user } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ POST /api/payments/create-intent/:bookingId
router.post("/create-intent/:bookingId", protect, user, createPaymentIntent);
router.get("/verify/:sessionId", verifyPaymentSession);
router.get("/my-history", protect, provider, getProviderPaymentHistory);

export default router;
