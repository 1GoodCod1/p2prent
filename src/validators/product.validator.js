import { body, param, query } from 'express-validator';

export const createProductValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('categoryId')
    .notEmpty().withMessage('Category is required')
    .isUUID().withMessage('Invalid category ID'),
  body('pricePerDay')
    .isFloat({ min: 1 }).withMessage('Price per day must be at least 1 MDL'),
  body('pricePerWeek')
    .optional()
    .isFloat({ min: 1 }).withMessage('Price per week must be at least 1 MDL'),
  body('pricePerMonth')
    .optional()
    .isFloat({ min: 1 }).withMessage('Price per month must be at least 1 MDL'),
  body('condition')
    .notEmpty().withMessage('Condition is required')
    .isIn(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).withMessage('Invalid condition'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Brand is too long'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Model is too long'),
  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid year'),
  body('dimensions')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Dimensions are too long'),
  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('Weight must be positive'),
  body('rules')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Rules are too long'),
  body('deposit')
    .optional()
    .isFloat({ min: 0 }).withMessage('Deposit must be positive'),
  body('maxRentalDays')
    .optional()
    .isInt({ min: 1 }).withMessage('Maximum rental days must be at least 1'),
  body('minRentalDays')
    .optional()
    .isInt({ min: 1 }).withMessage('Minimum rental days must be at least 1'),
];

export const updateProductValidator = [
  param('id')
    .isUUID().withMessage('Invalid product ID'),
  ...createProductValidator.map(validation => validation.optional()),
];

export const productQueryValidator = [
  query('categoryId')
    .optional()
    .isUUID().withMessage('Invalid category ID'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be positive'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be positive'),
  query('condition')
    .optional()
    .isIn(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).withMessage('Invalid condition'),
  query('location')
    .optional()
    .isLength({ max: 100 }).withMessage('Location is too long'),
  query('radius')
    .optional()
    .isFloat({ min: 0 }).withMessage('Radius must be positive'),
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('sortBy')
    .optional()
    .isIn(['price', 'rating', 'createdAt', 'views']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('vipOnly')
    .optional()
    .isBoolean().withMessage('vipOnly must be boolean'),
  query('availableFrom')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  query('availableTo')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
];