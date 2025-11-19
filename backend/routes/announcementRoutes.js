import express from "express";
import { protect, adminAuth } from "../middleware/authMiddleware.js";
import {
  createAnnouncement,
  getActiveAnnouncement,
  getAllAnnouncements,
  activateAnnouncement,
  completeAnnouncement,
  deleteAnnouncement
} from "../controllers/announcementController.js";

const router = express.Router();

router.post("/create", protect, adminAuth, createAnnouncement);
router.get("/active", getActiveAnnouncement);
router.get("/allannouncement", protect, adminAuth, getAllAnnouncements);

router.patch("/:id/activate", protect, adminAuth, activateAnnouncement);
router.patch("/:id/complete", protect, adminAuth, completeAnnouncement);
router.delete("/:id", protect, adminAuth, deleteAnnouncement);

export default router;
