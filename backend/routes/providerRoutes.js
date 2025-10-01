import express from 'express';
import { getProviders, getProvider, updateProvider, deleteProvider } from '../controllers/providerController.js';

const router = express.Router();
router.get("/", getProviders);
router.get("/:id", getProvider);
router.put("/:id", updateProvider);
router.delete("/:id", deleteProvider);

export default router;