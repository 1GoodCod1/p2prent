import { prisma } from '../config/database.js';
import logger from '../config/logger.js';
import notificationService from './notification.service.js';

class WithdrawalService {
  async requestWithdrawal(userId, amount, method, accountDetails) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, email: true, firstName: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check minimum withdrawal amount
    const settings = await prisma.settings.findUnique({
      where: { key: 'withdrawal_minimum' },
    });

    const minimumAmount = settings?.value || 100;
    if (amount < minimumAmount) {
      throw new Error(`Minimum withdrawal amount is ${minimumAmount} MDL`);
    }

    // Check if user has sufficient balance
    if (user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create withdrawal request transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL_REQUEST',
        amount: -amount,
        balance: user.balance - amount,
        description: `Withdrawal request for ${amount} MDL via ${method}`,
        metadata: {
          method,
          accountDetails,
          status: 'pending_admin_review',
        },
        status: 'PENDING',
      },
    });

    // Update user balance (reserve the amount)
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: amount },
      },
    });

    // Send notification to user
    await notificationService.createNotification(
      userId,
      'WITHDRAWAL_REQUEST',
      'Withdrawal Request Submitted',
      `Your withdrawal request for ${amount} MDL has been submitted and is being processed.`,
      { transactionId: transaction.id, amount, method }
    );

    // TODO: Send email to admin about new withdrawal request
    logger.info(`Withdrawal request created: ${transaction.id} by user ${userId}`);
    return transaction;
  }

  async getUserWithdrawals(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: { in: ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_REVERSAL'] },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: { in: ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_REVERSAL'] },
        },
      }),
    ]);

    return {
      withdrawals: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getWithdrawalStats(userId) {
    const [totalWithdrawn, pendingRequests, completedRequests] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL_COMPLETED',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: 'WITHDRAWAL_REQUEST',
          status: 'PENDING',
        },
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: 'WITHDRAWAL_COMPLETED',
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      totalWithdrawn: Math.abs(totalWithdrawn._sum.amount || 0),
      pendingRequests,
      completedRequests,
      availableBalance: await this.getAvailableBalance(userId),
    };
  }

  async getAvailableBalance(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.balance;
  }

  async cancelWithdrawalRequest(transactionId, userId) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        type: 'WITHDRAWAL_REQUEST',
        status: 'PENDING',
      },
    });

    if (!transaction) {
      throw new Error('Withdrawal request not found or cannot be cancelled');
    }

    // Return money to user balance
    const amount = Math.abs(transaction.amount);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
      },
    });

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'CANCELLED',
        metadata: {
          ...transaction.metadata,
          cancelledAt: new Date().toISOString(),
          cancelledBy: 'user',
        },
      },
    });

    // Create reversal transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL_CANCELLED',
        amount,
        balance: { increment: amount },
        description: `Withdrawal request cancelled, ${amount} MDL returned to balance`,
        metadata: {
          originalTransactionId: transactionId,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notification
    await notificationService.createNotification(
      userId,
      'WITHDRAWAL_CANCELLED',
      'Withdrawal Request Cancelled',
      `Your withdrawal request for ${amount} MDL has been cancelled. The amount has been returned to your balance.`,
      { transactionId, amount }
    );

    logger.info(`Withdrawal request cancelled: ${transactionId} by user ${userId}`);
    return updatedTransaction;
  }
}

const withdrawalService = new WithdrawalService();
export default withdrawalService;