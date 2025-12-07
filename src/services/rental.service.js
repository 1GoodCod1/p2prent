import { prisma } from '../config/database.js';
import { stripe } from '../config/stripe.js';
import logger from '../config/logger.js';

import notificationService from './notification.service.js';

export class RentalService {
  async calculateRentalCost(productId, startDate, endDate, insuranceLevel = 'NONE') {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        pricePerDay: true,
        pricePerWeek: true,
        pricePerMonth: true,
        deposit: true,
        minRentalDays: true,
        maxRentalDays: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Validate rental days
    if (totalDays < product.minRentalDays) {
      throw new Error(`Minimum rental period is ${product.minRentalDays} days`);
    }

    if (product.maxRentalDays && totalDays > product.maxRentalDays) {
      throw new Error(`Maximum rental period is ${product.maxRentalDays} days`);
    }

    // Calculate base amount
    let baseAmount = 0;
    let remainingDays = totalDays;

    // Calculate monthly price
    const months = Math.floor(remainingDays / 30);
    if (months > 0 && product.pricePerMonth) {
      baseAmount += months * product.pricePerMonth;
      remainingDays -= months * 30;
    }

    // Calculate weekly price
    const weeks = Math.floor(remainingDays / 7);
    if (weeks > 0 && product.pricePerWeek) {
      baseAmount += weeks * product.pricePerWeek;
      remainingDays -= weeks * 7;
    }

    // Calculate daily price for remaining days
    if (remainingDays > 0) {
      baseAmount += remainingDays * product.pricePerDay;
    }

    // Calculate insurance amount
    let insuranceAmount = 0;
    const insuranceRates = {
      NONE: 0,
      BASIC: 0.05,    // 5%
      PREMIUM: 0.10,  // 10%
      FULL: 0.15,     // 15%
    };

    if (insuranceRates[insuranceLevel]) {
      insuranceAmount = baseAmount * insuranceRates[insuranceLevel];
    }

    // Calculate platform commission (10%)
    const platformCommissionRate = 0.10;
    const platformFee = baseAmount * platformCommissionRate;

    // If product has VIP status, apply 5% discount on commission
    const productWithVIP = await prisma.product.findUnique({
      where: { id: productId },
      select: { vipLevel: true },
    });

    let commissionDiscount = 0;
    if (productWithVIP.vipLevel !== 'NONE') {
      commissionDiscount = platformFee * 0.05;
    }

    const actualPlatformFee = platformFee - commissionDiscount;
    const totalAmount = baseAmount + insuranceAmount + actualPlatformFee;

    return {
      totalDays,
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      insuranceAmount: parseFloat(insuranceAmount.toFixed(2)),
      platformFee: parseFloat(actualPlatformFee.toFixed(2)),
      commissionDiscount: parseFloat(commissionDiscount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      deposit: product.deposit || 0,
    };
  }

  async createRentalRequest(userId, rentalData) {
    const {
      productId,
      startDate,
      endDate,
      insuranceLevel = 'NONE',
      promoCode,
    } = rentalData;

    // Check product availability
    const isAvailable = await this.checkAvailability(productId, startDate, endDate);
    if (!isAvailable) {
      throw new Error('Product is not available for the selected dates');
    }

    // Get product with owner info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Prevent renting own product
    if (product.ownerId === userId) {
      throw new Error('Cannot rent your own product');
    }

    // Calculate cost
    const cost = await this.calculateRentalCost(
      productId,
      startDate,
      endDate,
      insuranceLevel
    );

    // Apply promo code if provided
    let promoDiscount = 0;
    if (promoCode) {
      const discount = await this.applyPromoCode(promoCode, cost.totalAmount);
      if (discount) {
        promoDiscount = discount.amount;
        cost.totalAmount = Math.max(0, cost.totalAmount - discount.amount);
      }
    }

    // Create rental record
    const rental = await prisma.rental.create({
      data: {
        productId,
        renterId: userId,
        ownerId: product.ownerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: cost.totalDays,
        baseAmount: cost.baseAmount,
        insuranceAmount: cost.insuranceAmount,
        platformFee: cost.platformFee,
        totalAmount: cost.totalAmount,
        insuranceLevel,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    // Send notification to owner
    await notificationService.sendRentalRequestNotification(
      product.ownerId,
      rental.id,
      product.title
    );

    logger.info(`Rental request created: ${rental.id} by user ${userId}`);
    return {
      rental,
      cost,
      promoDiscount,
    };
  }

  async checkAvailability(productId, startDate, endDate) {
    const productService = require('./product.service');
    return productService.checkAvailability(productId, startDate, endDate);
  }

  async applyPromoCode(code, amount) {
    const promo = await prisma.promoCode.findUnique({
      where: {
        code,
        isActive: true,
      },
    });

    if (!promo) {
      return null;
    }

    // Check validity dates
    const now = new Date();
    if (promo.startDate && now < promo.startDate) {
      return null;
    }
    if (promo.endDate && now > promo.endDate) {
      return null;
    }

    // Check max uses
    if (promo.maxUses && promo.uses >= promo.maxUses) {
      return null;
    }

    // Check min amount
    if (promo.minAmount && amount < promo.minAmount) {
      return null;
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'PERCENTAGE') {
      discountAmount = amount * (promo.value / 100);
    } else if (promo.type === 'FIXED') {
      discountAmount = Math.min(promo.value, amount);
    }

    // Increment uses
    await prisma.promoCode.update({
      where: { id: promo.id },
      data: { uses: { increment: 1 } },
    });

    return {
      promoCode: promo.code,
      type: promo.type,
      value: promo.value,
      amount: parseFloat(discountAmount.toFixed(2)),
    };
  }

  async confirmRental(rentalId, ownerId) {
    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        ownerId,
        status: 'PENDING',
      },
      include: {
        product: {
          select: {
            title: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!rental) {
      throw new Error('Rental not found or cannot be confirmed');
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Send notification to renter
    await notificationService.sendRentalConfirmedNotification(
      rental.renterId,
      rentalId,
      rental.product.title
    );

    logger.info(`Rental confirmed: ${rentalId} by owner ${ownerId}`);
    return updatedRental;
  }

  async cancelRental(rentalId, userId, reason, isOwner = false) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        product: {
          select: {
            title: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    // Check permissions
    const canCancel = rental.renterId === userId || 
                     rental.ownerId === userId || 
                     isOwner;

    if (!canCancel) {
      throw new Error('You do not have permission to cancel this rental');
    }

    // Check if cancellation is allowed based on status
    const allowedStatuses = ['PENDING', 'CONFIRMED'];
    if (!allowedStatuses.includes(rental.status)) {
      throw new Error(`Cannot cancel rental with status: ${rental.status}`);
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    });

    // Refund payment if already paid
    if (rental.paymentStatus === 'COMPLETED') {
      await this.processRefund(rentalId, 'CANCELLATION');
    }

    // Send notifications
    if (userId === rental.renterId) {
      await notificationService.sendRentalCancelledNotification(
        rental.ownerId,
        rentalId,
        rental.product.title,
        'Renter cancelled the rental'
      );
    } else {
      await notificationService.sendRentalCancelledNotification(
        rental.renterId,
        rentalId,
        rental.product.title,
        'Owner cancelled the rental'
      );
    }

    logger.info(`Rental cancelled: ${rentalId} by user ${userId}`);
    return updatedRental;
  }

  async processPayment(rentalId, userId, paymentMethodId) {
    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        renterId: userId,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
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

    if (!rental) {
      throw new Error('Rental not found or payment cannot be processed');
    }

    try {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(rental.totalAmount * 100), // Convert to cents
        currency: process.env.STRIPE_CURRENCY.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
        description: `Rental: ${rental.product.title}`,
        metadata: {
          rentalId,
          productId: rental.productId,
          renterId: userId,
          ownerId: rental.product.ownerId,
        },
      });

      // Update rental with payment info
      const updatedRental = await prisma.rental.update({
        where: { id: rentalId },
        data: {
          paymentStatus: 'COMPLETED',
          stripePaymentId: paymentIntent.id,
          paidAt: new Date(),
        },
      });

      // Create transaction record for platform fee
      await this.createTransaction(
        rental.product.ownerId,
        'COMMISSION',
        -rental.platformFee,
        `Platform commission for rental ${rentalId}`,
        { rentalId }
      );

      // Send payment notification
      await notificationService.sendPaymentReceivedNotification(
        rental.product.ownerId,
        rentalId,
        rental.product.title,
        rental.totalAmount
      );

      logger.info(`Payment processed for rental ${rentalId}: ${paymentIntent.id}`);
      return {
        rental: updatedRental,
        paymentIntent,
      };
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async startRental(rentalId, ownerId) {
    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        ownerId,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
      },
    });

    if (!rental) {
      throw new Error('Rental not found or cannot be started');
    }

    // Check if rental should start today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(rental.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (today < startDate) {
      throw new Error('Rental cannot start before the scheduled date');
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    logger.info(`Rental started: ${rentalId} by owner ${ownerId}`);
    return updatedRental;
  }

  async completeRental(rentalId, ownerId) {
    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        ownerId,
        status: 'IN_PROGRESS',
      },
      include: {
        product: {
          select: {
            title: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!rental) {
      throw new Error('Rental not found or cannot be completed');
    }

    // Check if rental has ended
    const today = new Date();
    const endDate = new Date(rental.endDate);

    if (today < endDate) {
      throw new Error('Rental cannot be completed before the end date');
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Calculate owner's earnings (total amount - platform fee)
    const ownerEarnings = rental.totalAmount - rental.platformFee;

    // Create transaction for owner's earnings
    await this.createTransaction(
      ownerId,
      'RENTAL_INCOME',
      ownerEarnings,
      `Rental income for ${rental.product.title}`,
      { rentalId }
    );

    // Update owner's balance
    await prisma.user.update({
      where: { id: ownerId },
      data: {
        balance: { increment: ownerEarnings },
      },
    });

    // Send completion notification
    await notificationService.sendRentalCompletedNotification(
      rental.renterId,
      rentalId,
      rental.product.title
    );

    logger.info(`Rental completed: ${rentalId} by owner ${ownerId}`);
    return updatedRental;
  }

  async processRefund(rentalId, reason) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
    });

    if (!rental || !rental.stripePaymentId) {
      throw new Error('Rental not found or no payment to refund');
    }

    try {
      // Create Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: rental.stripePaymentId,
        reason: reason.toLowerCase(),
      });

      // Update rental with refund info
      await prisma.rental.update({
        where: { id: rentalId },
        data: {
          stripeRefundId: refund.id,
          paymentStatus: 'REFUNDED',
        },
      });

      // Create transaction record for refund
      await this.createTransaction(
        rental.renterId,
        'REFUND',
        rental.totalAmount,
        `Refund for rental ${rentalId}`,
        { rentalId, reason }
      );

      logger.info(`Refund processed for rental ${rentalId}: ${refund.id}`);
      return refund;
    } catch (error) {
      logger.error('Refund processing error:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  async createTransaction(userId, type, amount, description, metadata = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    const newBalance = user.balance + amount;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount,
        balance: newBalance,
        description,
        metadata,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return transaction;
  }

  async getUserRentals(userId, filters = {}) {
    const { status, type = 'asRenter', page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (type === 'asRenter') {
      where.renterId = userId;
    } else if (type === 'asOwner') {
      where.ownerId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          ...(type === 'asRenter' ? {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
              },
            },
          } : {
            renter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
              },
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rental.count({ where }),
    ]);

    return {
      rentals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getRentalDetails(rentalId, userId) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        product: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
                phone: true,
              },
            },
            images: true,
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
            phone: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
            phone: true,
          },
        },
        review: true,
      },
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    // Check if user has access to this rental
    const hasAccess = rental.renterId === userId || 
                     rental.ownerId === userId ||
                     (await this.isAdmin(userId));

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return rental;
  }

  async isAdmin(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  }

  async disputeRental(rentalId, userId, reason) {
    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        OR: [
          { renterId: userId },
          { ownerId: userId },
        ],
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      },
    });

    if (!rental) {
      throw new Error('Rental not found or cannot be disputed');
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'DISPUTED',
        cancellationReason: reason,
      },
    });

    // TODO: Notify admin about dispute
    logger.info(`Rental disputed: ${rentalId} by user ${userId}`);
    return updatedRental;
  }

  async extendRental(rentalId, userId, newEndDate) {
    const rental = await prisma.rental.findFirst({
      where: {
        id: rentalId,
        renterId: userId,
        status: 'IN_PROGRESS',
      },
      include: {
        product: true,
      },
    });

    if (!rental) {
      throw new Error('Rental not found or cannot be extended');
    }

    const currentEndDate = new Date(rental.endDate);
    const requestedEndDate = new Date(newEndDate);

    if (requestedEndDate <= currentEndDate) {
      throw new Error('New end date must be after current end date');
    }

    // Check availability for extension period
    const isAvailable = await this.checkAvailability(
      rental.productId,
      currentEndDate.toISOString(),
      requestedEndDate.toISOString()
    );

    if (!isAvailable) {
      throw new Error('Product is not available for the extension period');
    }

    // Calculate additional cost
    const additionalDays = Math.ceil(
      (requestedEndDate - currentEndDate) / (1000 * 60 * 60 * 24)
    );

    let additionalCost = 0;
    if (additionalDays >= 30 && rental.product.pricePerMonth) {
      additionalCost = rental.product.pricePerMonth * Math.floor(additionalDays / 30);
      additionalDays %= 30;
    }
    if (additionalDays >= 7 && rental.product.pricePerWeek) {
      additionalCost += rental.product.pricePerWeek * Math.floor(additionalDays / 7);
      additionalDays %= 7;
    }
    additionalCost += additionalDays * rental.product.pricePerDay;

    // Apply insurance
    if (rental.insuranceLevel !== 'NONE') {
      const insuranceRates = {
        BASIC: 0.05,
        PREMIUM: 0.10,
        FULL: 0.15,
      };
      additionalCost += additionalCost * insuranceRates[rental.insuranceLevel];
    }

    // Add platform fee
    const platformFee = additionalCost * 0.10;
    additionalCost += platformFee;

    // Update rental
    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        endDate: requestedEndDate,
        totalDays: rental.totalDays + additionalDays,
        totalAmount: rental.totalAmount + additionalCost,
        platformFee: rental.platformFee + platformFee,
      },
    });

    return {
      rental: updatedRental,
      additionalDays,
      additionalCost: parseFloat(additionalCost.toFixed(2)),
      requiresPayment: additionalCost > 0,
    };
  }
}

const rentalService = new RentalService();
export default rentalService;