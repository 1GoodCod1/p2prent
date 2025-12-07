import express from 'express';
const router = express.Router();

// Import all route files
import authRoutes from './auth.routes.js';
// import socialAuthRoutes from './socialAuth.routes.js';
import productRoutes from './product.routes.js';
import rentalRoutes from './rental.route.js';
import vipRoutes from './vip.routes.js';
import reviewRoutes from './review.routes.js';
import withdrawalRoutes from './withdrawal.routes.js';
import ownerStatsRoutes from './ownerStats.routes.js';
import adminRoutes from './admin.routes.js';
import webhookRoutes from './webhook.routes.js';

// Use routes
router.use('/auth', authRoutes);
// router.use('/auth/social', socialAuthRoutes);
router.use('/products', productRoutes);
router.use('/rentals', rentalRoutes);
router.use('/vip', vipRoutes);
router.use('/reviews', reviewRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/owner-stats', ownerStatsRoutes);
router.use('/admin', adminRoutes);
router.use('/webhook', webhookRoutes);

export default router;