import express from 'express';
import { createReview, getReviewsByProvider } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🟢 Public route: anyone can view reviews for a provider
router.get('/provider/:providerId', getReviewsByProvider);

// 🔒 Protected route: only logged-in users can create reviews
router.post('/', protect, createReview);

export default router;
