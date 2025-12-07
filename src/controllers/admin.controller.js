import adminService from '../services/admin.service.js';
import { handleValidationError } from '../middleware/validation.js';
import logger from '../config/logger.js';

class AdminController {
  // ==================== DASHBOARD ====================
  async getDashboardStats(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const stats = await adminService.getDashboardStats(timeRange);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard statistics',
      });
    }
  }

  // ==================== USER MANAGEMENT ====================
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = req.query;

      const result = await adminService.getUsers(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users',
      });
    }
  }

  async getUserDetails(req, res) {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserDetails(userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error('Get user details error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get user details',
      });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;

      if (!status || !['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required (ACTIVE, SUSPENDED, BANNED)',
        });
      }

      const user = await adminService.updateUserStatus(userId, status, reason);

      res.json({
        success: true,
        data: { user },
        message: `User status updated to ${status}`,
      });
    } catch (error) {
      logger.error('Update user status error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      if (error.message === 'Cannot modify admin users') {
        return res.status(403).json({
          success: false,
          error: 'Cannot modify admin users',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update user status',
      });
    }
  }

  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role, reason } = req.body;

      if (!role || !['USER', 'OWNER', 'ADMIN'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Valid role is required (USER, OWNER, ADMIN)',
        });
      }

      const user = await adminService.updateUserRole(userId, role, reason);

      res.json({
        success: true,
        data: { user },
        message: `User role updated to ${role}`,
      });
    } catch (error) {
      logger.error('Update user role error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      if (error.message === 'Cannot remove admin role from admin user') {
        return res.status(403).json({
          success: false,
          error: 'Cannot remove admin role from admin user',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update user role',
      });
    }
  }

  // ==================== PRODUCT MODERATION ====================
  async getProductsForModeration(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = req.query;

      const result = await adminService.getProductsForModeration(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get products for moderation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get products',
      });
    }
  }

  async updateProductStatus(req, res) {
    try {
      const { productId } = req.params;
      const { status, reason } = req.body;

      if (!status || !['ACTIVE', 'INACTIVE', 'BANNED', 'DRAFT'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required (ACTIVE, INACTIVE, BANNED, DRAFT)',
        });
      }

      const product = await adminService.updateProductStatus(productId, status, reason);

      res.json({
        success: true,
        data: { product },
        message: `Product status updated to ${status}`,
      });
    } catch (error) {
      logger.error('Update product status error:', error);

      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update product status',
      });
    }
  }

  // ==================== REVIEW MODERATION ====================
  async getReviewsForModeration(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = req.query;

      const result = await adminService.getReviewsForModeration(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get reviews for moderation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get reviews',
      });
    }
  }

  async updateReviewStatus(req, res) {
    try {
      const { reviewId } = req.params;
      const { isActive, reason } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isActive must be a boolean',
        });
      }

      const review = await adminService.updateReviewStatus(reviewId, isActive, reason);

      res.json({
        success: true,
        data: { review },
        message: `Review ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      logger.error('Update review status error:', error);

      if (error.message === 'Review not found') {
        return res.status(404).json({
          success: false,
          error: 'Review not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update review status',
      });
    }
  }

  // ==================== REPORT MANAGEMENT ====================
  async getReports(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = req.query;

      const result = await adminService.getReports(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get reports',
      });
    }
  }

  async updateReportStatus(req, res) {
    try {
      const { reportId } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;

      if (!status || !['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required',
        });
      }

      const report = await adminService.updateReportStatus(reportId, status, adminId, notes);

      res.json({
        success: true,
        data: { report },
        message: `Report status updated to ${status}`,
      });
    } catch (error) {
      logger.error('Update report status error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json({
          success: false,
          error: 'Report not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update report status',
      });
    }
  }

  // ==================== WITHDRAWAL MANAGEMENT ====================
  async getWithdrawalRequests(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = req.query;

      const result = await adminService.getWithdrawalRequests(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get withdrawal requests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get withdrawal requests',
      });
    }
  }

  async processWithdrawal(req, res) {
    try {
      const { transactionId } = req.params;
      const { status, notes } = req.body;

      if (!status || !['PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required (PROCESSING, COMPLETED, FAILED)',
        });
      }

      const transaction = await adminService.processWithdrawal(transactionId, status, notes);

      res.json({
        success: true,
        data: { transaction },
        message: `Withdrawal ${status.toLowerCase()}`,
      });
    } catch (error) {
      logger.error('Process withdrawal error:', error);

      if (error.message === 'Withdrawal request not found') {
        return res.status(404).json({
          success: false,
          error: 'Withdrawal request not found',
        });
      }

      if (error.message === 'Withdrawal request has already been processed') {
        return res.status(400).json({
          success: false,
          error: 'Withdrawal request has already been processed',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to process withdrawal',
      });
    }
  }

  // ==================== PROMO CODE MANAGEMENT ====================
  async getPromoCodes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = req.query;

      const result = await adminService.getPromoCodes(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get promo codes error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get promo codes',
      });
    }
  }

  async createPromoCode(req, res) {
    try {
      const promoCode = await adminService.createPromoCode(req.body);

      res.status(201).json({
        success: true,
        data: { promoCode },
        message: 'Promo code created successfully',
      });
    } catch (error) {
      logger.error('Create promo code error:', error);

      if (error.message === 'Promo code already exists') {
        return res.status(400).json({
          success: false,
          error: 'Promo code already exists',
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
        error: 'Failed to create promo code',
      });
    }
  }

  async updatePromoCode(req, res) {
    try {
      const { id } = req.params;
      const promoCode = await adminService.updatePromoCode(id, req.body);

      res.json({
        success: true,
        data: { promoCode },
        message: 'Promo code updated successfully',
      });
    } catch (error) {
      logger.error('Update promo code error:', error);

      if (error.message === 'Promo code not found') {
        return res.status(404).json({
          success: false,
          error: 'Promo code not found',
        });
      }

      if (error.message === 'Promo code already exists') {
        return res.status(400).json({
          success: false,
          error: 'Promo code already exists',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update promo code',
      });
    }
  }

  async deletePromoCode(req, res) {
    try {
      const { id } = req.params;
      const result = await adminService.deletePromoCode(id);

      res.json({
        success: true,
        data: result,
        message: 'Promo code deleted successfully',
      });
    } catch (error) {
      logger.error('Delete promo code error:', error);

      if (error.message === 'Promo code not found') {
        return res.status(404).json({
          success: false,
          error: 'Promo code not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete promo code',
      });
    }
  }

  // ==================== SETTINGS MANAGEMENT ====================
  async getSettings(req, res) {
    try {
      const settings = await adminService.getSettings();

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get settings',
      });
    }
  }

  async updateSettings(req, res) {
    try {
      const updates = req.body;
      const results = await adminService.updateSettings(updates);

      res.json({
        success: true,
        data: { results },
        message: 'Settings updated successfully',
      });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settings',
      });
    }
  }

  // ==================== RENTAL MANAGEMENT ====================
  async getRentalsForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = req.query;

      const result = await adminService.getRentalsForAdmin(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get rentals for admin error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get rentals',
      });
    }
  }

  async updateRentalStatus(req, res) {
    try {
      const { rentalId } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required',
        });
      }

      const rental = await adminService.updateRentalStatus(rentalId, status, reason);

      res.json({
        success: true,
        data: { rental },
        message: `Rental status updated to ${status}`,
      });
    } catch (error) {
      logger.error('Update rental status error:', error);

      if (error.message === 'Rental not found') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update rental status',
      });
    }
  }

  // ==================== EXPORT DATA ====================
  async exportData(req, res) {
    try {
      const { type, startDate, endDate } = req.query;
      
      let data;
      const filename = `rentshare-${type}-${new Date().toISOString().split('T')[0]}.json`;

      switch (type) {
        case 'users':
          data = await prisma.user.findMany({
            where: {
              createdAt: {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined,
              },
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              createdAt: true,
              lastSeen: true,
            },
          });
          break;

        case 'rentals':
          data = await prisma.rental.findMany({
            where: {
              createdAt: {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined,
              },
            },
            include: {
              product: {
                select: { title: true },
              },
              renter: {
                select: { firstName: true, lastName: true, email: true },
              },
              owner: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          });
          break;

        case 'transactions':
          data = await prisma.transaction.findMany({
            where: {
              createdAt: {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined,
              },
            },
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid export type',
          });
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Export data error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export data',
      });
    }
  }
}

const adminController = new AdminController();
export default adminController;