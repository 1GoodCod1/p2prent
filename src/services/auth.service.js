import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import transporter from '../config/email.js';
import logger from '../config/logger.js';

class AuthService {
  async register(userData) {
    try {
      const { email, password, firstName, lastName, phone } = userData;

      // Валидация
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Проверка существования пользователя
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Хэширование пароля
      const hashedPassword = await bcrypt.hash(password, 12);

      // Генерация токена верификации
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Создание пользователя
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          verificationToken,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
        },
      });

      // Отправка email (в фоне, не блокируем ответ)
      this.sendVerificationEmail(email, verificationToken).catch(error => {
        logger.error('Failed to send verification email:', error);
      });

      // Генерация токенов
      const tokens = this.generateTokens(user.id);

      return { user, tokens };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Находим пользователя
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active');
      }

      // Проверяем пароль
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Обновляем время последнего входа
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeen: new Date() },
      });

      // Генерируем токены
      const tokens = this.generateTokens(user.id);

      // Убираем пароль из ответа
      const { password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, tokens };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      if (!token) {
        throw new Error('Token is required');
      }

      const user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        throw new Error('Invalid verification token');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          status: 'ACTIVE',
        },
      });

      return { message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Не раскрываем, что пользователь не существует
        return { message: 'If an account exists, you will receive a reset email' };
      }

      // Генерируем токен сброса
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 час

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetExpires,
        },
      });

      // Отправляем email (в фоне)
      this.sendPasswordResetEmail(email, resetToken).catch(error => {
        logger.error('Failed to send reset email:', error);
      });

      return { message: 'Password reset email sent' };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        throw new Error('Token and new password are required');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Хэшируем новый пароль
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetExpires: null,
        },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Current and new password are required');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Проверяем текущий пароль
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Хэшируем новый пароль
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new Error('Invalid token');
      }

      return this.generateTokens(user.id);
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  generateTokens(userId) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async sendVerificationEmail(email, token) {
    if (!process.env.CLIENT_URL || !process.env.EMAIL_FROM) {
      throw new Error('Email configuration is missing');
    }

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email - RentShare',
      html: `
        <h1>Welcome to RentShare!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create an account, you can ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);
  }

  async sendPasswordResetEmail(email, token) {
    if (!process.env.CLIENT_URL || !process.env.EMAIL_FROM) {
      throw new Error('Email configuration is missing');
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password - RentShare',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  }

  // Добавьте метод для валидации токена (полезно для middleware)
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

// Экспортируем экземпляр класса
const authService = new AuthService();
export default authService;