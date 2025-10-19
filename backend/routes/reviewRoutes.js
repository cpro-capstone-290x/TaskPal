import express from 'express';
import { createReview, getReviewsByProvider } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/provider/:providerId', protect, getReviewsByProvider);

export default router;

