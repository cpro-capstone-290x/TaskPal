import express from "express";
import { protect, provider, providerAuth } from "../middleware/authMiddleware.js";
import {
  getProviders,
  getProvider,
  updateProvider,
  deleteProvider,
  getProvidersByServiceType,
  updateProviderStatus,
} from "../controllers/providerController.js";

const router = express.Router();

// 🌐 Public routes — no token needed
router.get("/public/:id", getProvider);
router.get("/public/service_type/:service_type", getProvidersByServiceType);

// General listing
router.get("/", getProviders);
router.get("/service_type/:service_type", getProvidersByServiceType);

// 🔐 Provider self-management
router.route("/:id")
  .get(protect, providerAuth, getProvider)
  .put(protect, providerAuth, updateProvider)
  .delete(protect, providerAuth, deleteProvider);

// 🔒 Admin-only status updates
router.route("/:id/status").patch(protect, provider, updateProviderStatus);

export default router;
