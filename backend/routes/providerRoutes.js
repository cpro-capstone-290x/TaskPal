import express from "express";
import multer from "multer";
import { protect, providerAuth, provider, adminAuth } from "../middleware/authMiddleware.js";
import {
  getProviders,
  getProvider,
  updateProvider,
  deleteProvider,
  getProvidersByServiceType,
  updateProviderStatus,
  uploadProviderProfilePicture,
} from "../controllers/providerController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🌐 Public Routes
router.get("/public/service_type/:service_type", getProvidersByServiceType);
router.get("/public/:id", getProvider);
router.get("/", getProviders);
router.get("/service_type/:service_type", getProvidersByServiceType);

// 🔐 Provider Routes (self-access only)
router
  .route("/:id")
  .get(protect, providerAuth, getProvider)
  .put(protect, providerAuth, updateProvider)
  .delete(protect, providerAuth, deleteProvider);

// 🧩 Admin: Update provider status (approve / reject / suspend)
router.route("/:id/status").patch(protect, adminAuth, updateProviderStatus);

// 🖼️ Profile picture upload
router.post(
  "/:providerId/profile-picture",
  protect,
  upload.single("file"),
  uploadProviderProfilePicture
);

export default router;
