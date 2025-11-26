import express from 'express';
import { protect, adminAuth } from '../middleware/authMiddleware.js';
import {
  getAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getPendingProviders,
  getProviderForAdmin,
  getAllProviders,
  getAllUsers,
  getAllBookings,
  getDashboardStats
} from '../controllers/adminController.js';

const router = express.Router();


router.route("/stats")
  .get(protect, adminAuth, getDashboardStats);
// 1. SPECIFIC PROVIDER ROUTES (Must come BEFORE /:id)
router.route("/providers")
  .get(protect, adminAuth, getAllProviders);

router.route("/providers/pending")
  .get(protect, adminAuth, getPendingProviders);

router.route("/providers/:id/review")
  .get(protect, adminAuth, getProviderForAdmin);

router.route("/users")
  .get(protect, adminAuth, getAllUsers);

router.route("/bookings")
.get(protect, adminAuth, getAllBookings);


// 2. ADMIN COLLECTION ROUTES
router.route("/")
  .get(protect, adminAuth, getAdmins)
  .post(protect, adminAuth, createAdmin);


// 3. GENERIC ID ROUTES (Must be LAST)
// Any route defined below this line will never be reached because /:id catches it first.
router.route("/:id")
  .get(protect, adminAuth, getAdmin)
  .put(protect, adminAuth, updateAdmin)
  .delete(protect, adminAuth, deleteAdmin);

export default router;