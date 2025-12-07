import { body, param } from 'express-validator';

export const createReviewValidator = [
  param('rentalId')
    .isUUID().withMessage('Invalid rental ID'),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment is too long'),
];