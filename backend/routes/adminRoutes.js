import express from 'express';
import { protect, adminAuth } from '../middleware/authMiddleware.js';
import {
  getAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getPendingProviders,
  getProviderForAdmin
} from '../controllers/adminController.js';

const router = express.Router();

router.route("/")
  .get(protect, adminAuth, getAdmins)
  .post(protect, adminAuth, createAdmin);

router.route("/:id")
  .get(protect, adminAuth, getAdmin)
  .put(protect, adminAuth, updateAdmin)
  .delete(protect, adminAuth, deleteAdmin);

router.route("/providers/pending")
  .get(protect, adminAuth, getPendingProviders);

router.route("/providers/:id/review")
  .get(protect, adminAuth, getProviderForAdmin);

export default router;
