import express from 'express';
const router = express.Router();
// import reviewController from '../controllers/reviews.controller.js';
// import { validate } from '../middleware/validation.js';
// import { authenticate } from '../middleware/auth.js';
// import { reviewLimiter } from '../middleware/rateLimiter.js';
// import { createReviewValidator } from '../validators/review.validator.js';
//
// // Public routes
// router.get('/product/:productId', reviewController.getProductReviews);
// router.get('/user/:userId', reviewController.getUserPublicReviews);
//
// // Protected routes
// router.post('/:rentalId', authenticate, reviewLimiter, validate(createReviewValidator), reviewController.createReview);
//
// router.put('/:id', authenticate, reviewController.updateReview);
// router.delete('/:id', authenticate, reviewController.deleteReview);
// router.post('/:id/report', authenticate, reviewController.reportReview);
// router.get('/user/stats', authenticate, reviewController.getUserReviewStats);
// router.get('/user/history', authenticate, reviewController.getUserReviewHistory);

export default router;