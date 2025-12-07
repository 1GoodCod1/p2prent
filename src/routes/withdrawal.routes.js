import express from 'express';
const router = express.Router();
import withdrawalController from '../controllers/withdrawal.controller.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

router.use(authenticate, apiLimiter);

router.post('/request', withdrawalController.requestWithdrawal);
router.get('/history', withdrawalController.getUserWithdrawals);
router.get('/stats', withdrawalController.getWithdrawalStats);
router.get('/balance', withdrawalController.getAvailableBalance);
router.post('/:transactionId/cancel', withdrawalController.cancelWithdrawalRequest);

export default router;