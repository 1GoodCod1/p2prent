import { body, param, query } from 'express-validator';

export const createRentalValidator = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isUUID().withMessage('Invalid product ID'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }).withMessage('Start date cannot be in the past'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      return endDate > startDate;
    }).withMessage('End date must be after start date'),
  body('insuranceLevel')
    .optional()
    .isIn(['NONE', 'BASIC', 'PREMIUM', 'FULL']).withMessage('Invalid insurance level'),
  body('promoCode')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Promo code is too long'),
];

export const rentalActionValidator = [
  param('id')
    .isUUID().withMessage('Invalid rental ID'),
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['confirm', 'cancel', 'start', 'complete', 'dispute']).withMessage('Invalid action'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason is too long'),
];

export const rentalQueryValidator = [
  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['asRenter', 'asOwner']).withMessage('Invalid type'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];