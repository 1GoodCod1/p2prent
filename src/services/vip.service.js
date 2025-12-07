import { prisma } from '../config/database.js';
import {stripe} from '../config/stripe.js';
import logger from '../config/logger.js';

export class VIPService {
  async getVIPPlans() {
    const settings = await prisma.settings.findMany({
      where: {
        key: { in: ['vip_prices', 'vip_benefits'] },
      },
    });

    const vipPrices = settings.find(s => s.key === 'vip_prices')?.value || {};
    const vipBenefits = settings.find(s => s.key === 'vip_benefits')?.value || {};

    return {
      standard: {
        name: 'Standard VIP',
        price: vipPrices.standard || 50,
        duration: 7, // days
        benefits: vipBenefits.standard || [
          '3x more views',
          'Priority in search results',
          'Standard badge',
        ],
      },
      premium: {
        name: 'Premium VIP',
        price: vipPrices.premium || 250,
        duration: 30, // days
        benefits: vipBenefits.premium || [
          '10x more views',
          'Top of category listings',
          'Premium badge',
          'Priority support',
        ],
      },
      maximum: {
        name: 'Maximum VIP',
        price: vipPrices.maximum || 600,
        duration: 90, // days
        benefits: vipBenefits.maximum || [
          '25x more views',
          'Featured on homepage',
          'Maximum badge',
          'Priority support',
          'No commission discount',
        ],
      },
    };
  }

  async purchaseVIP(userId, productId, level) {
    const plans = await this.getVIPPlans();
    const plan = plans[level.toLowerCase()];

    if (!plan) {
      throw new Error('Invalid VIP level');
    }

    // Check if product exists and belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration);

    // Create VIP subscription record
    const subscription = await prisma.vipSubscription.create({
      data: {
        userId,
        productId,
        level: level.toUpperCase(),
        amount: plan.price,
        duration: plan.duration,
        expiresAt,
        isActive: true,
      },
    });

    // Update product VIP status
    await prisma.product.update({
      where: { id: productId },
      data: {
        vipLevel: level.toUpperCase(),
        vipExpiresAt: expiresAt,
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'VIP_PURCHASE',
        amount: -plan.price,
        balance: { decrement: plan.price },
        description: `VIP ${level} subscription for product ${product.title}`,
        metadata: {
          subscriptionId: subscription.id,
          productId,
          level,
          duration: plan.duration,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update user balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: plan.price },
      },
    });

    logger.info(`VIP purchased: ${level} for product ${productId} by user ${userId}`);
    return subscription;
  }

  async createVIPPaymentIntent(userId, productId, level) {
    const plans = await this.getVIPPlans();
    const plan = plans[level.toLowerCase()];

    if (!plan) {
      throw new Error('Invalid VIP level');
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Convert to cents
      currency: process.env.STRIPE_CURRENCY.toLowerCase(),
      metadata: {
        userId,
        productId,
        level,
        type: 'VIP_PURCHASE',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: plan.price,
      level,
      productId,
    };
  }

  async handleVIPPaymentSuccess(paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { userId, productId, level } = paymentIntent.metadata;

    return this.purchaseVIP(userId, productId, level);
  }

  async getProductVIPStatus(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        vipLevel: true,
        vipExpiresAt: true,
        views: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const isActive = product.vipLevel !== 'NONE' && 
                    product.vipExpiresAt && 
                    new Date(product.vipExpiresAt) > new Date();

    return {
      level: product.vipLevel,
      expiresAt: product.vipExpiresAt,
      isActive,
      views: product.views,
      // Calculate boosted views based on VIP level
      boostedViews: this.calculateBoostedViews(product.views, product.vipLevel),
    };
  }

  calculateBoostedViews(views, vipLevel) {
    const multipliers = {
      NONE: 1,
      STANDARD: 3,
      PREMIUM: 10,
      MAXIMUM: 25,
    };

    const multiplier = multipliers[vipLevel] || 1;
    return Math.floor(views * multiplier);
  }

  async getUserVIPSubscriptions(userId) {
    const subscriptions = await prisma.vipSubscription.findMany({
      where: { userId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out expired subscriptions
    const now = new Date();
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.isActive && new Date(sub.expiresAt) > now
    );

    const expiredSubscriptions = subscriptions.filter(sub => 
      !sub.isActive || new Date(sub.expiresAt) <= now
    );

    return {
      active: activeSubscriptions,
      expired: expiredSubscriptions,
      totalSpent: subscriptions.reduce((sum, sub) => sum + sub.amount, 0),
    };
  }

  async checkAndExpireVIPSubscriptions() {
    const now = new Date();
    
    // Find expired subscriptions
    const expiredSubscriptions = await prisma.vipSubscription.findMany({
      where: {
        isActive: true,
        expiresAt: { lte: now },
      },
      include: {
        product: true,
      },
    });

    for (const subscription of expiredSubscriptions) {
      // Update subscription
      await prisma.vipSubscription.update({
        where: { id: subscription.id },
        data: { isActive: false },
      });

      // Update product VIP status
      // Check if there are other active subscriptions for this product
      const activeSubscriptions = await prisma.vipSubscription.findMany({
        where: {
          productId: subscription.productId,
          isActive: true,
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: 'desc' },
        take: 1,
      });

      if (activeSubscriptions.length === 0) {
        // No active subscriptions, remove VIP from product
        await prisma.product.update({
          where: { id: subscription.productId },
          data: {
            vipLevel: 'NONE',
            vipExpiresAt: null,
          },
        });
      } else {
        // Update with the latest active subscription
        const latestSubscription = activeSubscriptions[0];
        await prisma.product.update({
          where: { id: subscription.productId },
          data: {
            vipLevel: latestSubscription.level,
            vipExpiresAt: latestSubscription.expiresAt,
          },
        });
      }

      logger.info(`VIP subscription expired: ${subscription.id} for product ${subscription.productId}`);
    }

    return {
      expiredCount: expiredSubscriptions.length,
      message: `Expired ${expiredSubscriptions.length} VIP subscriptions`,
    };
  }

  async renewVIPSubscription(subscriptionId, userId) {
    const subscription = await prisma.vipSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
      include: {
        product: true,
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Get current plan
    const plans = await this.getVIPPlans();
    const planKey = subscription.level.toLowerCase();
    const plan = plans[planKey];

    if (!plan) {
      throw new Error('Invalid subscription level');
    }

    // Calculate new expiration date
    const currentExpiresAt = new Date(subscription.expiresAt);
    const now = new Date();
    const baseDate = currentExpiresAt > now ? currentExpiresAt : now;
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + plan.duration);

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (user.balance < plan.price) {
      throw new Error('Insufficient balance');
    }

    // Update subscription
    const updatedSubscription = await prisma.vipSubscription.update({
      where: { id: subscriptionId },
      data: {
        expiresAt: newExpiresAt,
        isActive: true,
      },
    });

    // Update product VIP status
    await prisma.product.update({
      where: { id: subscription.productId },
      data: {
        vipLevel: subscription.level,
        vipExpiresAt: newExpiresAt,
      },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'VIP_RENEWAL',
        amount: -plan.price,
        balance: user.balance - plan.price,
        description: `Renewed VIP ${subscription.level} for product ${subscription.product.title}`,
        metadata: {
          subscriptionId: subscription.id,
          productId: subscription.productId,
          level: subscription.level,
          duration: plan.duration,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update user balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: plan.price },
      },
    });

    logger.info(`VIP subscription renewed: ${subscriptionId} for product ${subscription.productId}`);
    return updatedSubscription;
  }

  async cancelVIPSubscription(subscriptionId, userId) {
    const subscription = await prisma.vipSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Check if subscription can be cancelled (e.g., not within 24 hours of expiration)
    const now = new Date();
    const hoursUntilExpiration = (new Date(subscription.expiresAt) - now) / (1000 * 60 * 60);

    if (hoursUntilExpiration < 24) {
      throw new Error('Subscription cannot be cancelled within 24 hours of expiration');
    }

    // Update subscription
    const updatedSubscription = await prisma.vipSubscription.update({
      where: { id: subscriptionId },
      data: { isActive: false },
    });

    // Check if product has other active subscriptions
    const activeSubscriptions = await prisma.vipSubscription.findMany({
      where: {
        productId: subscription.productId,
        isActive: true,
        id: { not: subscriptionId },
      },
    });

    if (activeSubscriptions.length === 0) {
      // No other active subscriptions, remove VIP from product
      await prisma.product.update({
        where: { id: subscription.productId },
        data: {
          vipLevel: 'NONE',
          vipExpiresAt: null,
        },
      });
    }

    logger.info(`VIP subscription cancelled: ${subscriptionId} by user ${userId}`);
    return updatedSubscription;
  }

  async getVIPStatistics() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      popularLevels,
    ] = await Promise.all([
      prisma.vipSubscription.count(),
      prisma.vipSubscription.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.vipSubscription.aggregate({
        _sum: { amount: true },
      }),
      prisma.vipSubscription.groupBy({
        by: ['level'],
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      popularLevels: popularLevels.map(level => ({
        level: level.level,
        count: level._count.id,
        revenue: level._sum.amount,
      })),
    };
  }
}

const vipService = new VIPService();
export default vipService;