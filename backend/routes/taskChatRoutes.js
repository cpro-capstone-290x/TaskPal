import express from 'express';
import { bookTask, negotiateTask, respondNegotiation } from '../controllers/taskChatController.js';

const router = express.Router();

// Route to book a task
router.post('/book', bookTask);
// Route to negotiate a task
router.post('/negotiate', negotiateTask);
// Route to respond to a negotiation
router.post('/respond', respondNegotiation);

export default router;