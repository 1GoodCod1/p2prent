import rentalService from '../services/rental.service.js';
import { handleValidationError } from '../middleware/validation.js';
import logger from '../config/logger.js';

export class RentalController {
  async calculateRentalCost(req, res) {
    try {
      const { productId } = req.params;
      const { startDate, endDate, insuranceLevel = 'NONE' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const cost = await rentalService.calculateRentalCost(
        productId,
        startDate,
        endDate,
        insuranceLevel
      );

      res.json({
        success: true,
        data: cost,
      });
    } catch (error) {
      logger.error('Calculate rental cost error:', error);

      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      if (error.message.includes('Minimum rental period') || 
          error.message.includes('Maximum rental period')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to calculate rental cost',
      });
    }
  }

  async createRentalRequest(req, res) {
    try {
      const userId = req.user.id;
      const rentalData = req.body;

      const result = await rentalService.createRentalRequest(userId, rentalData);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Rental request created successfully',
      });
    } catch (error) {
      logger.error('Create rental request error:', error);

      if (error.message === 'Product is not available for the selected dates') {
        return res.status(400).json({
          success: false,
          error: 'Product is not available for the selected dates',
        });
      }

      if (error.message === 'Cannot rent your own product') {
        return res.status(400).json({
          success: false,
          error: 'You cannot rent your own product',
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
        error: 'Failed to create rental request',
      });
    }
  }

  async confirmRental(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const rental = await rentalService.confirmRental(id, ownerId);

      res.json({
        success: true,
        data: { rental },
        message: 'Rental confirmed successfully',
      });
    } catch (error) {
      logger.error('Confirm rental error:', error);

      if (error.message === 'Rental not found or cannot be confirmed') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found or cannot be confirmed',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to confirm rental',
      });
    }
  }

  async cancelRental(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      const rental = await rentalService.cancelRental(id, userId, reason);

      res.json({
        success: true,
        data: { rental },
        message: 'Rental cancelled successfully',
      });
    } catch (error) {
      logger.error('Cancel rental error:', error);

      if (error.message === 'Rental not found') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found',
        });
      }

      if (error.message === 'You do not have permission to cancel this rental') {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to cancel this rental',
        });
      }

      if (error.message.includes('Cannot cancel rental with status')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel rental',
      });
    }
  }

  async processPayment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { paymentMethodId } = req.body;

      const result = await rentalService.processPayment(id, userId, paymentMethodId);

      res.json({
        success: true,
        data: result,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      logger.error('Process payment error:', error);

      if (error.message === 'Rental not found or payment cannot be processed') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found or payment cannot be processed',
        });
      }

      if (error.message.includes('Payment failed')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Payment processing failed',
      });
    }
  }

  async startRental(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const rental = await rentalService.startRental(id, ownerId);

      res.json({
        success: true,
        data: { rental },
        message: 'Rental started successfully',
      });
    } catch (error) {
      logger.error('Start rental error:', error);

      if (error.message === 'Rental not found or cannot be started') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found or cannot be started',
        });
      }

      if (error.message === 'Rental cannot start before the scheduled date') {
        return res.status(400).json({
          success: false,
          error: 'Rental cannot start before the scheduled date',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to start rental',
      });
    }
  }

  async completeRental(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const rental = await rentalService.completeRental(id, ownerId);

      res.json({
        success: true,
        data: { rental },
        message: 'Rental completed successfully',
      });
    } catch (error) {
      logger.error('Complete rental error:', error);

      if (error.message === 'Rental not found or cannot be completed') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found or cannot be completed',
        });
      }

      if (error.message === 'Rental cannot be completed before the end date') {
        return res.status(400).json({
          success: false,
          error: 'Rental cannot be completed before the end date',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to complete rental',
      });
    }
  }

  async getUserRentals(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await rentalService.getUserRentals(userId, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get user rentals error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user rentals',
      });
    }
  }

  async getRentalDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const rental = await rentalService.getRentalDetails(id, userId);

      res.json({
        success: true,
        data: { rental },
      });
    } catch (error) {
      logger.error('Get rental details error:', error);

      if (error.message === 'Rental not found') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found',
        });
      }

      if (error.message === 'Access denied') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get rental details',
      });
    }
  }

  async disputeRental(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      const rental = await rentalService.disputeRental(id, userId, reason);

      res.json({
        success: true,
        data: { rental },
        message: 'Rental dispute submitted successfully',
      });
    } catch (error) {
      logger.error('Dispute rental error:', error);

      if (error.message === 'Rental not found or cannot be disputed') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found or cannot be disputed',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to submit dispute',
      });
    }
  }

  async extendRental(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { endDate } = req.body;

      const result = await rentalService.extendRental(id, userId, endDate);

      res.json({
        success: true,
        data: result,
        message: result.requiresPayment 
          ? 'Rental extension calculated. Please make payment to confirm.' 
          : 'Rental extended successfully',
      });
    } catch (error) {
      logger.error('Extend rental error:', error);

      if (error.message === 'Rental not found or cannot be extended') {
        return res.status(404).json({
          success: false,
          error: 'Rental not found or cannot be extended',
        });
      }

      if (error.message === 'New end date must be after current end date') {
        return res.status(400).json({
          success: false,
          error: 'New end date must be after current end date',
        });
      }

      if (error.message === 'Product is not available for the extension period') {
        return res.status(400).json({
          success: false,
          error: 'Product is not available for the extension period',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to extend rental',
      });
    }
  }
}

const rentalController = new RentalController();
export default rentalController;