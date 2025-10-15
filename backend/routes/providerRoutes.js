import express from 'express';
import { getProviders, getProvider, updateProvider, deleteProvider, getProvidersByServiceType } from '../controllers/providerController.js';

const router = express.Router();
router.get("/service_type/:service_type", getProvidersByServiceType);
router.get("/", getProviders);
router.get("/:id", getProvider);
router.put("/:id", updateProvider);
router.delete("/:id", deleteProvider);


export default router;