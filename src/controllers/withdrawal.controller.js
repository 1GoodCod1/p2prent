import withdrawalService from '../services/withdrawal.service.js';
import { handleValidationError } from '../middleware/validation.js';
import logger from '../config/logger.js';

class WithdrawalController {
  async requestWithdrawal(req, res) {
    try {
      const userId = req.user.id;
      const { amount, method, accountDetails } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
      }

      if (!method || !['bank_transfer', 'paypal', 'credit_card'].includes(method)) {
        return res.status(400).json({
          success: false,
          error: 'Valid withdrawal method is required',
        });
      }

      if (!accountDetails) {
        return res.status(400).json({
          success: false,
          error: 'Account details are required',
        });
      }

      const transaction = await withdrawalService.requestWithdrawal(
        userId,
        amount,
        method,
        accountDetails
      );

      res.status(201).json({
        success: true,
        data: { transaction },
        message: 'Withdrawal request submitted successfully',
      });
    } catch (error) {
      logger.error('Request withdrawal error:', error);

      if (error.message.includes('Minimum withdrawal amount') ||
          error.message.includes('Insufficient balance')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to submit withdrawal request',
      });
    }
  }

  async getUserWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await withdrawalService.getUserWithdrawals(userId, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get user withdrawals error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get withdrawal history',
      });
    }
  }

  async getWithdrawalStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await withdrawalService.getWithdrawalStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get withdrawal stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get withdrawal statistics',
      });
    }
  }

  async getAvailableBalance(req, res) {
    try {
      const userId = req.user.id;
      const balance = await withdrawalService.getAvailableBalance(userId);

      res.json({
        success: true,
        data: { balance },
      });
    } catch (error) {
      logger.error('Get available balance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available balance',
      });
    }
  }

  async cancelWithdrawalRequest(req, res) {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      const transaction = await withdrawalService.cancelWithdrawalRequest(transactionId, userId);

      res.json({
        success: true,
        data: { transaction },
        message: 'Withdrawal request cancelled successfully',
      });
    } catch (error) {
      logger.error('Cancel withdrawal request error:', error);

      if (error.message === 'Withdrawal request not found or cannot be cancelled') {
        return res.status(404).json({
          success: false,
          error: 'Withdrawal request not found or cannot be cancelled',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel withdrawal request',
      });
    }
  }
}

const withdrawalController = new WithdrawalController();
export default withdrawalController;