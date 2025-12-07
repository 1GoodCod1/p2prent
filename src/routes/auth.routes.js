import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import {
  registerValidator,
  loginValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
} from '../validators/auth.validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, validate(registerValidator), authController.register);
router.post('/login', authLimiter, validate(loginValidator), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(resetPasswordValidator), authController.requestPasswordReset);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileValidator), authController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordValidator), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;