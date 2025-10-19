import express from 'express';
import { protect, provider, providerAuth } from '../middleware/authMiddleware.js';
import { getProviders, getProvider, updateProvider, deleteProvider, getProvidersByServiceType, updateProviderStatus } from '../controllers/providerController.js';

const router = express.Router();
router.get("/service_type/:service_type", getProvidersByServiceType);
router.get("/", getProviders);
router.route("/:id")
    .get(protect, providerAuth, getProvider)     // View own profile
    .put(protect, providerAuth, updateProvider)  // Edit own profile
    .delete(protect, providerAuth, deleteProvider); // Delete own profile

router.route('/:id/status').patch(protect, provider, updateProviderStatus);

export default router;