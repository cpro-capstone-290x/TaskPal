import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/:userId", protect, getNotifications);
router.put("/:userId/mark-all", protect, markAllAsRead);
router.put("/read/:id", protect, markOneAsRead);

export default router;
