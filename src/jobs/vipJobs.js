import cron from 'node-cron';
import vipService from '../services/vip.service.js'; 
import logger from '../config/logger.js';

class VIPJobs {
  init() {
    // Check for expiring VIP subscriptions (runs daily at 3 AM)
    cron.schedule('0 3 * * *', this.checkExpiringVIPSubscriptions.bind(this));

    // Expire VIP subscriptions (runs daily at 4 AM)
    cron.schedule('0 4 * * *', vipService.checkAndExpireVIPSubscriptions.bind(vipService));

    // Send VIP renewal reminders (runs daily at 10 AM)
    cron.schedule('0 10 * * *', this.sendVIPRenewalReminders.bind(this));

    logger.info('VIP jobs initialized');
  }

  async checkExpiringVIPSubscriptions() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringSubscriptions = await prisma.vipSubscription.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: threeDaysFromNow,
            gt: new Date(), // Still active
          },
          // Only subscriptions that haven't been reminded yet
          NOT: {
            product: {
              notifications: {
                some: {
                  type: 'VIP_EXPIRING',
                  data: {
                    path: ['subscriptionId'],
                    equals: '${id}',
                  },
                },
              },
            },
          },
        },
        include: {
          product: {
            select: {
              title: true,
              ownerId: true,
            },
          },
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      for (const subscription of expiringSubscriptions) {
        const daysUntilExpiration = Math.ceil(
          (new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
        );

        // Send notification
        await notificationService.createNotification(
          subscription.userId,
          'VIP_EXPIRING',
          'VIP Subscription Expiring Soon',
          `Your VIP subscription for "${subscription.product.title}" expires in ${daysUntilExpiration} day(s)`,
          {
            subscriptionId: subscription.id,
            productTitle: subscription.product.title,
            expiresAt: subscription.expiresAt,
            daysUntilExpiration,
            level: subscription.level,
          }
        );

        // Send email reminder
        if (daysUntilExpiration <= 3) {
          await notificationService.sendEmailNotification(
            subscription.userId,
            'VIP Subscription Expiring Soon',
            `Your ${subscription.level} VIP subscription for "${subscription.product.title}" expires in ${daysUntilExpiration} day(s). Renew now to maintain visibility.`,
            {
              subscriptionId: subscription.id,
              productTitle: subscription.product.title,
              expiresAt: subscription.expiresAt,
              level: subscription.level,
            }
          );
        }
      }

      logger.info(`Sent ${expiringSubscriptions.length} VIP expiration reminders`);
    } catch (error) {
      logger.error('Error in checkExpiringVIPSubscriptions:', error);
    }
  }

  async sendVIPRenewalReminders() {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentlyExpiredSubscriptions = await prisma.vipSubscription.findMany({
        where: {
          isActive: false,
          expiresAt: {
            gte: oneDayAgo,
            lt: new Date(),
          },
          // Only send one reminder
          NOT: {
            product: {
              notifications: {
                some: {
                  type: 'VIP_EXPIRED',
                },
              },
            },
          },
        },
        include: {
          product: {
            select: {
              title: true,
              ownerId: true,
            },
          },
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      for (const subscription of recentlyExpiredSubscriptions) {
        // Send renewal reminder
        await notificationService.createNotification(
          subscription.userId,
          'VIP_EXPIRED',
          'VIP Subscription Expired',
          `Your VIP subscription for "${subscription.product.title}" has expired. Renew now to regain visibility.`,
          {
            subscriptionId: subscription.id,
            productTitle: subscription.product.title,
            level: subscription.level,
          }
        );

        // Send email
        await notificationService.sendEmailNotification(
          subscription.userId,
          'VIP Subscription Expired',
          `Your ${subscription.level} VIP subscription for "${subscription.product.title}" has expired. Your product is no longer receiving VIP visibility. Renew now to get back on top!`,
          {
            subscriptionId: subscription.id,
            productTitle: subscription.product.title,
            level: subscription.level,
          }
        );
      }

      logger.info(`Sent ${recentlyExpiredSubscriptions.length} VIP renewal reminders`);
    } catch (error) {
      logger.error('Error in sendVIPRenewalReminders:', error);
    }
  }
}

const vipJobs = new VIPJobs();
export default vipJobs;