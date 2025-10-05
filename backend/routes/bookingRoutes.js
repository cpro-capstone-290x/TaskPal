// routes/bookingRoutes.js
import express from "express";
import { bookTask, getBookingById, updateBookingPrice, agreeToPrice, downloadAgreement } from "../controllers/bookingController.js";

const router = express.Router();

router.get("/:id", getBookingById);
router.post("/", bookTask);
// routes/bookingRoutes.js
router.put("/:id/price", updateBookingPrice);
router.put("/:id/agree", agreeToPrice);
router.get("/:id/agreement", downloadAgreement);

export default router;
