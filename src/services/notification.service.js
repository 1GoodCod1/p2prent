import { prisma } from '../config/database.js';
import transporter from '../config/email.js';
import logger from '../config/logger.js';

export class NotificationService {
  async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
        },
      });

      // Send email for important notifications
      if (this.shouldSendEmail(type)) {
        await this.sendEmailNotification(userId, title, message, data);
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  shouldSendEmail(type) {
    const emailTypes = [
      'RENTAL_REQUEST',
      'RENTAL_CONFIRMED',
      'RENTAL_CANCELLED',
      'PAYMENT_RECEIVED',
      'WITHDRAWAL_REQUEST',
    ];
    return emailTypes.includes(type);
  }

  async sendEmailNotification(userId, title, message, data = {}) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      if (!user || !user.email) {
        return;
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">${title}</h2>
            <p>${message}</p>
            ${data.rentalId ? `<p>Rental ID: ${data.rentalId}</p>` : ''}
            ${data.amount ? `<p>Amount: ${data.amount} MDL</p>` : ''}
            ${data.productTitle ? `<p>Product: ${data.productTitle}</p>` : ''}
            <br>
            <p>Best regards,<br>The RentShare Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Email notification sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  async sendRentalRequestNotification(ownerId, rentalId, productTitle) {
    return this.createNotification(
      ownerId,
      'RENTAL_REQUEST',
      'New Rental Request',
      `You have a new rental request for "${productTitle}"`,
      { rentalId, productTitle }
    );
  }

  async sendRentalConfirmedNotification(renterId, rentalId, productTitle) {
    return this.createNotification(
      renterId,
      'RENTAL_CONFIRMED',
      'Rental Confirmed',
      `Your rental request for "${productTitle}" has been confirmed`,
      { rentalId, productTitle }
    );
  }

  async sendRentalCancelledNotification(userId, rentalId, productTitle, reason) {
    return this.createNotification(
      userId,
      'RENTAL_CANCELLED',
      'Rental Cancelled',
      `Rental for "${productTitle}" has been cancelled${reason ? `: ${reason}` : ''}`,
      { rentalId, productTitle, reason }
    );
  }

  async sendPaymentReceivedNotification(ownerId, rentalId, productTitle, amount) {
    return this.createNotification(
      ownerId,
      'PAYMENT_RECEIVED',
      'Payment Received',
      `You have received a payment of ${amount} MDL for "${productTitle}"`,
      { rentalId, productTitle, amount }
    );
  }

  async sendRentalCompletedNotification(renterId, rentalId, productTitle) {
    return this.createNotification(
      renterId,
      'RENTAL_COMPLETED',
      'Rental Completed',
      `Your rental for "${productTitle}" has been completed. Please leave a review.`,
      { rentalId, productTitle }
    );
  }

  async sendReviewReceivedNotification(userId, reviewerName, rating, comment) {
    return this.createNotification(
      userId,
      'REVIEW_RECEIVED',
      'New Review Received',
      `${reviewerName} gave you a ${rating} star review${comment ? `: "${comment}"` : ''}`,
      { reviewerName, rating, comment }
    );
  }

  async sendWithdrawalRequestNotification(userId, amount) {
    return this.createNotification(
      userId,
      'WITHDRAWAL_REQUEST',
      'Withdrawal Request Submitted',
      `Your withdrawal request for ${amount} MDL has been submitted and is being processed`,
      { amount }
    );
  }

  async sendPromotionalNotification(userId, title, message) {
    return this.createNotification(
      userId,
      'PROMOTIONAL',
      title,
      message
    );
  }

  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;

    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        unread: unreadOnly ? total : await prisma.notification.count({
          where: { userId, isRead: false },
        }),
      },
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    logger.info(`Cleaned up ${result.count} old notifications`);
    return result;
  }
}

const notificationService = new NotificationService();
export default notificationService;