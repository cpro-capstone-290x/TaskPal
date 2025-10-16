import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getProviders, getProvider, updateProvider, deleteProvider, getProvidersByServiceType, updateProviderStatus } from '../controllers/providerController.js';

const router = express.Router();
router.get("/service_type/:service_type", getProvidersByServiceType);
router.get("/", getProviders);
router.get("/:id", getProvider);
router.put("/:id", updateProvider);
router.delete("/:id", deleteProvider);

router.route('/:id/status').patch(protect, admin, updateProviderStatus);

export default router;