import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";

const router = express.Router();

// POST /api/payments/create-intent
router.post("/create-intent", createPaymentIntent);

export default router;
