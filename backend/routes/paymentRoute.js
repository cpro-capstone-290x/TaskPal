// routes/paymentRoute.js
import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";

const router = express.Router();

// ✅ POST /api/payments/create-intent/:bookingId
router.post("/create-intent/:bookingId", createPaymentIntent);

export default router;
