import express from 'express';
const router = express.Router();
import { stripe } from '../config/stripe.js';
import { prisma } from '../config/database.js';
import logger from '../config/logger.js';

// Stripe webhook handler
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object, event.type);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook event:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handlePaymentIntentSucceeded(paymentIntent) {
  const { metadata } = paymentIntent;
  
  if (metadata.type === 'VIP_PURCHASE') {
    // Handle VIP purchase
    const vipService = require('../services/vip.service');
    await vipService.handleVIPPaymentSuccess(paymentIntent.id);
  } else if (metadata.rentalId) {
    // Handle rental payment
    await prisma.rental.update({
      where: { id: metadata.rentalId },
      data: {
        paymentStatus: 'COMPLETED',
        stripePaymentId: paymentIntent.id,
        paidAt: new Date(),
      },
    });

    // Send notification
    const notificationService = require('../services/notification.service');
    await notificationService.sendPaymentReceivedNotification(
      metadata.ownerId,
      metadata.rentalId,
      metadata.productTitle,
      paymentIntent.amount / 100 // Convert from cents
    );
  }

  logger.info(`Payment succeeded: ${paymentIntent.id}`);
}

async function handlePaymentIntentFailed(paymentIntent) {
  const { metadata } = paymentIntent;
  
  if (metadata.rentalId) {
    await prisma.rental.update({
      where: { id: metadata.rentalId },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    // Send notification
    const notificationService = require('../services/notification.service');
    await notificationService.createNotification(
      metadata.renterId,
      'PAYMENT_FAILED',
      'Payment Failed',
      'Your payment failed. Please try again or use a different payment method.',
      { rentalId: metadata.rentalId }
    );
  }

  logger.warn(`Payment failed: ${paymentIntent.id}`);
}

async function handleChargeRefunded(charge) {
  const paymentIntentId = charge.payment_intent;
  
  // Find rental with this payment intent
  const rental = await prisma.rental.findFirst({
    where: { stripePaymentId: paymentIntentId },
  });

  if (rental) {
    await prisma.rental.update({
      where: { id: rental.id },
      data: {
        paymentStatus: 'REFUNDED',
        stripeRefundId: charge.id,
      },
    });

    // Create transaction for refund
    await prisma.transaction.create({
      data: {
        userId: rental.renterId,
        type: 'REFUND',
        amount: rental.totalAmount,
        balance: { increment: rental.totalAmount },
        description: `Refund for rental ${rental.id}`,
        metadata: { chargeId: charge.id, reason: charge.refunds.data[0]?.reason },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notification
    const notificationService = require('../services/notification.service');
    await notificationService.createNotification(
      rental.renterId,
      'PAYMENT_REFUNDED',
      'Payment Refunded',
      `Your payment for rental ${rental.id} has been refunded.`,
      { rentalId: rental.id, amount: rental.totalAmount }
    );
  }

  logger.info(`Charge refunded: ${charge.id}`);
}

async function handleSubscriptionEvent(subscription, eventType) {
  // Handle subscription events if you implement Stripe subscriptions
  logger.info(`Subscription ${eventType}: ${subscription.id}`);
}

export default router;