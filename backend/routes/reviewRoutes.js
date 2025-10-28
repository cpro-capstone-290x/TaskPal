import express from 'express';
import {
  createReview,
  getReviewByBooking,
  getReviewsByProvider
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Public — view reviews by provider
router.get('/provider/:providerId', getReviewsByProvider);

// ✅ Public — view review by booking
router.get('/booking/:bookingId', getReviewByBooking);

// 🔒 Auth required — create review
router.post('/', protect, createReview);

export default router;
