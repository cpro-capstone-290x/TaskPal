import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getAdmins, getAdmin, createAdmin, updateAdmin, deleteAdmin, getPendingProviders, getProviderForAdmin } from '../controllers/adminController.js';

const router = express.Router();
router.route("/")
    .get(protect, admin, getAdmins)
    .post(protect, admin, createAdmin);

router.route("/:id")
    .get(protect, admin, getAdmin)
    .put(protect, admin, updateAdmin)
    .delete(protect, admin, deleteAdmin);

router.route('/providers/pending').get(protect, admin, getPendingProviders);

router.route('/providers/:id/review').get(protect, admin, getProviderForAdmin);

export default router;