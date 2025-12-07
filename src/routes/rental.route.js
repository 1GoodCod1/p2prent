import express from 'express';
const router = express.Router();
import rentalController from '../controllers/rental.controller.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  createRentalValidator,
  rentalActionValidator,
  rentalQueryValidator,
} from '../validators/rental.validator.js';

// Calculate rental cost (public)
router.get('/:productId/calculate', rentalController.calculateRentalCost);
// Protected routes
router.post('/', authenticate, apiLimiter, validate(createRentalValidator), rentalController.createRentalRequest);

router.post('/:id/confirm', authenticate, rentalController.confirmRental);

router.post('/:id/cancel', authenticate, rentalController.cancelRental);

router.post('/:id/payment', authenticate, rentalController.processPayment);

router.post('/:id/start', authenticate, rentalController.startRental);

router.post('/:id/complete', authenticate, rentalController.completeRental);

router.post('/:id/dispute', authenticate, rentalController.disputeRental);

router.post('/:id/extend', authenticate, rentalController.extendRental);

router.get('/user/rentals', authenticate, validate(rentalQueryValidator), rentalController.getUserRentals);

router.get('/:id', authenticate, rentalController.getRentalDetails);

export default router;