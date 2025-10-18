import express from 'express';
import { createReview, getReviewsByProvider } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', createReview);
router.get('/provider/:providerId', getReviewsByProvider);

export default router;

