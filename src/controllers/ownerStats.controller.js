import ownerStatisticsService from '../services/ownerStatistics.service.js';
import logger from '../config/logger.js';

class OwnerStatsController {
  async getOwnerDashboard(req, res) {
    try {
      const ownerId = req.user.id;
      const { timeRange = '30d' } = req.query;

      const dashboard = await ownerStatisticsService.getOwnerDashboard(ownerId, timeRange);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error('Get owner dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard statistics',
      });
    }
  }

  async getProductAnalytics(req, res) {
    try {
      const { productId } = req.params;
      const ownerId = req.user.id;
      const { timeRange = '30d' } = req.query;

      const analytics = await ownerStatisticsService.getProductAnalytics(
        productId,
        ownerId,
        timeRange
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Get product analytics error:', error);

      if (error.message === 'Product not found or access denied') {
        return res.status(404).json({
          success: false,
          error: 'Product not found or access denied',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get product analytics',
      });
    }
  }
}

const ownerStatsController = new OwnerStatsController();
export default ownerStatsController;