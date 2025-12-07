import authService from '../services/auth.service.js';
import { handleValidationError } from '../middleware/validation.js';
import logger from '../config/logger.js';

export class AuthController {
  async register(req, res) {
    try {
      const { user, tokens } = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: {
          user,
          tokens,
        },
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error.message === 'User already exists') {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      const validationError = handleValidationError(error);
      if (validationError) {
        return res.status(validationError.status).json({
          success: false,
          error: validationError.message,
          errors: validationError.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);

      res.json({
        success: true,
        data: {
          user,
          tokens,
        },
        message: 'Login successful',
      });
    } catch (error) {
      logger.error('Login error:', error);

      if (error.message === 'Invalid credentials' || error.message === 'Account is not active') {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmail(token);

      res.json({
        success: true,
        data: result,
        message: 'Email verified successfully',
      });
    } catch (error) {
      logger.error('Email verification error:', error);

      if (error.message === 'Invalid verification token') {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Email verification failed',
      });
    }
  }

  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);

      res.json({
        success: true,
        data: result,
        message: 'If an account exists with this email, you will receive reset instructions',
      });
    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const result = await authService.resetPassword(token, password);

      res.json({
        success: true,
        data: result,
        message: 'Password reset successful',
      });
    } catch (error) {
      logger.error('Password reset error:', error);

      if (error.message === 'Invalid or expired reset token') {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Password reset failed',
      });
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        data: result,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password error:', error);

      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Password change failed',
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: { tokens },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      logger.error('Token refresh error:', error);

      if (error.message === 'Invalid refresh token') {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
      });
    }
  }

  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          bio: true,
          role: true,
          status: true,
          emailVerified: true,
          rating: true,
          totalReviews: true,
          balance: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          user: updatedUser,
        },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
    }
  }

  async logout(req, res) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return success
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }
}

const authController = new AuthController();
export default authController;