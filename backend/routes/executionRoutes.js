import express from "express";
import { sql } from "../config/db.js";
import {
  getExecutionByBooking,
  createExecutionIfMissing,
  updateExecutionField
} from "../controllers/executionController.js";

const router = express.Router();

// Create execution manually (rarely needed)
router.post("/", createExecutionIfMissing);

// Get execution by bookingId
router.get("/:bookingId", getExecutionByBooking);

// Update a single field: validatedcredential / completedprovider / completedclient
router.put("/:bookingId/update", updateExecutionField);

export default router;
