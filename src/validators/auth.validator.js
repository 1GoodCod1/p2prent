import { body } from 'express-validator';

export const registerValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name is too long'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name is too long'),
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please provide a valid phone number'),
];

export const loginValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const resetPasswordValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

export const updateProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('First name is too long'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name is too long'),
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please provide a valid phone number'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio is too long'),
];