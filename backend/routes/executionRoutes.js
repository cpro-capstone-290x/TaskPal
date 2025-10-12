import express from 'express';
import { createExecution, updateExecutionStatus } from '../controllers/executionController.js';


const router = express.Router();

router.post('/', createExecution);
router.put('/:execution_id', updateExecutionStatus);

export default router;