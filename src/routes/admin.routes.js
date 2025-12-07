import express from 'express';
const router = express.Router();
import adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { apiLimiter }  from '../middleware/rateLimiter.js';

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));
router.use(apiLimiter)

// ==================== DASHBOARD ====================
router.get('/dashboard', adminController.getDashboardStats);

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.put('/users/:userId/role', adminController.updateUserRole);

// ==================== PRODUCT MODERATION ====================
router.get('/products', adminController.getProductsForModeration);
router.put('/products/:productId/status', adminController.updateProductStatus);

// ==================== REVIEW MODERATION ====================
router.get('/reviews', adminController.getReviewsForModeration);
router.put('/reviews/:reviewId/status', adminController.updateReviewStatus);

// ==================== REPORT MANAGEMENT ====================
router.get('/reports', adminController.getReports);
router.put('/reports/:reportId/status', adminController.updateReportStatus);

// ==================== WITHDRAWAL MANAGEMENT ====================
router.get('/withdrawals', adminController.getWithdrawalRequests);
router.put('/withdrawals/:transactionId/process', adminController.processWithdrawal);

// ==================== PROMO CODE MANAGEMENT ====================
router.get('/promo-codes', adminController.getPromoCodes);
router.post('/promo-codes', adminController.createPromoCode);
router.put('/promo-codes/:id', adminController.updatePromoCode);
router.delete('/promo-codes/:id', adminController.deletePromoCode);

// ==================== SETTINGS MANAGEMENT ====================
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// ==================== RENTAL MANAGEMENT ====================
router.get('/rentals', adminController.getRentalsForAdmin);
router.put('/rentals/:rentalId/status', adminController.updateRentalStatus);

// ==================== EXPORT DATA ====================
router.get('/export', adminController.exportData);

export default router;