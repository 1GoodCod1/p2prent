import cron from 'node-cron';
import { prisma } from '../config/database.js';
import logger from '../config/logger.js';
import notificationService from '../services/notification.service.js';

class RentalJobs {
  init() {
    // Check for upcoming rentals (runs every hour)
    cron.schedule('0 * * * *', this.checkUpcomingRentals.bind(this));

    // Check for overdue rentals (runs every 6 hours)
    cron.schedule('0 */6 * * *', this.checkOverdueRentals.bind(this));

    // Process automatic rental completions (runs daily at midnight)
    cron.schedule('0 0 * * *', this.autoCompleteRentals.bind(this));

    // Clean up old pending rentals (runs daily at 2 AM)
    cron.schedule('0 2 * * *', this.cleanupPendingRentals.bind(this));

    logger.info('Rental jobs initialized');
  }

  async checkUpcomingRentals() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingRentals = await prisma.rental.findMany({
        where: {
          status: 'CONFIRMED',
          startDate: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
          // Only rentals that haven't been notified yet
          NOT: {
            notifications: {
              some: {
                type: 'UPCOMING_RENTAL',
                data: {
                  path: ['reminderType'],
                  equals: '24h',
                },
              },
            },
          },
        },
        include: {
          renter: true,
          owner: true,
          product: {
            select: {
              title: true,
            },
          },
        },
      });

      for (const rental of upcomingRentals) {
        // Send notification to renter
        await notificationService.createNotification(
          rental.renterId,
          'UPCOMING_RENTAL',
          'Rental Reminder',
          `Your rental for "${rental.product.title}" starts tomorrow`,
          {
            rentalId: rental.id,
            productTitle: rental.product.title,
            startDate: rental.startDate,
            reminderType: '24h',
          }
        );

        // Send notification to owner
        await notificationService.createNotification(
          rental.ownerId,
          'UPCOMING_RENTAL',
          'Rental Reminder',
          `You have a rental starting tomorrow for "${rental.product.title}"`,
          {
            rentalId: rental.id,
            productTitle: rental.product.title,
            startDate: rental.startDate,
            reminderType: '24h',
          }
        );
      }

      logger.info(`Sent ${upcomingRentals.length} upcoming rental reminders`);
    } catch (error) {
      logger.error('Error in checkUpcomingRentals:', error);
    }
  }

  async checkOverdueRentals() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueRentals = await prisma.rental.findMany({
        where: {
          status: 'IN_PROGRESS',
          endDate: {
            lt: today,
          },
          // Only rentals that haven't been notified yet
          NOT: {
            notifications: {
              some: {
                type: 'OVERDUE_RENTAL',
              },
            },
          },
        },
        include: {
          renter: true,
          product: {
            select: {
              title: true,
            },
          },
        },
      });

      for (const rental of overdueRentals) {
        // Calculate overdue days
        const overdueDays = Math.ceil((today - new Date(rental.endDate)) / (1000 * 60 * 60 * 24));

        // Send notification to renter
        await notificationService.createNotification(
          rental.renterId,
          'OVERDUE_RENTAL',
          'Overdue Rental',
          `Your rental for "${rental.product.title}" is ${overdueDays} day(s) overdue. Please return the item or contact the owner.`,
          {
            rentalId: rental.id,
            productTitle: rental.product.title,
            overdueDays,
            endDate: rental.endDate,
          }
        );

        // Send email to owner
        await notificationService.sendEmailNotification(
          rental.ownerId,
          'Overdue Rental Alert',
          `Rental for "${rental.product.title}" is ${overdueDays} day(s) overdue.`,
          {
            rentalId: rental.id,
            productTitle: rental.product.title,
            overdueDays,
            renterName: `${rental.renter.firstName} ${rental.renter.lastName}`,
          }
        );
      }

      logger.info(`Found ${overdueRentals.length} overdue rentals`);
    } catch (error) {
      logger.error('Error in checkOverdueRentals:', error);
    }
  }

  async autoCompleteRentals() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const rentalsToComplete = await prisma.rental.findMany({
        where: {
          status: 'IN_PROGRESS',
          endDate: {
            lt: yesterday,
          },
        },
        include: {
          product: {
            select: {
              title: true,
              ownerId: true,
            },
          },
        },
      });

      for (const rental of rentalsToComplete) {
        try {
          // Mark rental as completed
          await prisma.rental.update({
            where: { id: rental.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });

          // Calculate owner's earnings
          const ownerEarnings = rental.totalAmount - rental.platformFee;

          // Create transaction for owner's earnings
          await prisma.transaction.create({
            data: {
              userId: rental.ownerId,
              type: 'RENTAL_INCOME',
              amount: ownerEarnings,
              balance: { increment: ownerEarnings },
              description: `Auto-completed rental for ${rental.product.title}`,
              metadata: { rentalId: rental.id, autoCompleted: true },
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });

          // Update owner's balance
          await prisma.user.update({
            where: { id: rental.ownerId },
            data: {
              balance: { increment: ownerEarnings },
            },
          });

          // Send notification
          await notificationService.createNotification(
            rental.ownerId,
            'RENTAL_AUTO_COMPLETED',
            'Rental Auto-Completed',
            `Rental for "${rental.product.title}" has been automatically marked as completed`,
            {
              rentalId: rental.id,
              productTitle: rental.product.title,
            }
          );

          logger.info(`Auto-completed rental: ${rental.id}`);
        } catch (error) {
          logger.error(`Failed to auto-complete rental ${rental.id}:`, error);
        }
      }

      logger.info(`Auto-completed ${rentalsToComplete.length} rentals`);
    } catch (error) {
      logger.error('Error in autoCompleteRentals:', error);
    }
  }

  async cleanupPendingRentals() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago

      const pendingRentals = await prisma.rental.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      for (const rental of pendingRentals) {
        try {
          // Cancel old pending rentals
          await prisma.rental.update({
            where: { id: rental.id },
            data: {
              status: 'CANCELLED',
              cancellationReason: 'Automatically cancelled due to inactivity',
            },
          });

          logger.info(`Cleaned up pending rental: ${rental.id}`);
        } catch (error) {
          logger.error(`Failed to clean up rental ${rental.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${pendingRentals.length} pending rentals`);
    } catch (error) {
      logger.error('Error in cleanupPendingRentals:', error);
    }
  }
}

const rentalJobs = new RentalJobs();
export default rentalJobs;