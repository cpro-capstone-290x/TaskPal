import express from 'express';
import { protect, provider, providerAuth } from '../middleware/authMiddleware.js';
import {
  getProviders,
  getProvider,
  updateProvider,
  deleteProvider,
  getProvidersByServiceType,
  updateProviderStatus,
} from '../controllers/providerController.js';

const router = express.Router();

// 🌐 Public routes — no token needed
router.get("/public/:id", getProvider);
router.get("/public/service_type/:service_type", getProvidersByServiceType);

// Service type listing
router.get("/service_type/:service_type", getProvidersByServiceType);

// Provider listing
router.get("/", getProviders);

// Protected routes (for provider self-management)
router
  .route("/:id")
  .get(protect, providerAuth, getProvider)     // View own profile
  .put(protect, providerAuth, updateProvider)  // Edit own profile
  .delete(protect, providerAuth, deleteProvider); // Delete own profile

// Admin-only provider status update
router
  .route("/:id/status")
  .patch(protect, provider, updateProviderStatus);

export default router;
