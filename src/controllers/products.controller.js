import productService from '../services/products.service.js';
import { handleValidationError } from '../middleware/validation.js';
import logger from '../config/logger.js';

export class ProductController {
  async createProduct(req, res) {
    try {
      const userId = req.user.id;
      const productData = req.body;
      const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

      const product = await productService.createProduct(userId, productData, images);

      res.status(201).json({
        success: true,
        data: { product },
        message: 'Product created successfully',
      });
    } catch (error) {
      logger.error('Create product error:', error);

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
        error: 'Failed to create product',
      });
    }
  }

  async getProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const product = await productService.getProductById(id, userId);

      res.json({
        success: true,
        data: { product },
      });
    } catch (error) {
      logger.error('Get product error:', error);

      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get product',
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const product = await productService.updateProduct(id, userId, updateData);

      res.json({
        success: true,
        data: { product },
        message: 'Product updated successfully',
      });
    } catch (error) {
      logger.error('Update product error:', error);

      if (error.message === 'Product not found or you are not the owner') {
        return res.status(404).json({
          success: false,
          error: 'Product not found or you are not the owner',
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
        error: 'Failed to update product',
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await productService.deleteProduct(id, userId);

      res.json({
        success: true,
        data: result,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      logger.error('Delete product error:', error);

      if (error.message === 'Product not found or you are not the owner') {
        return res.status(404).json({
          success: false,
          error: 'Product not found or you are not the owner',
        });
      }

      if (error.message === 'Cannot delete product with active rentals') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete product with active rentals',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
      });
    }
  }

  async searchProducts(req, res) {
    try {
      const filters = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await productService.searchProducts(filters, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Search products error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search products',
      });
    }
  }

  async getUserProducts(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const products = await productService.getUserProducts(userId, status);

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      logger.error('Get user products error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user products',
      });
    }
  }

  async toggleFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const result = await productService.toggleFavorite(userId, productId);

      res.json({
        success: true,
        data: result,
        message: result.favorited ? 'Product added to favorites' : 'Product removed from favorites',
      });
    } catch (error) {
      logger.error('Toggle favorite error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update favorites',
      });
    }
  }

  async getUserFavorites(req, res) {
    try {
      const userId = req.user.id;
      const products = await productService.getUserFavorites(userId);

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      logger.error('Get user favorites error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get favorites',
      });
    }
  }

  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { status } = req.body;

      const product = await productService.updateProductStatus(id, userId, status);

      res.json({
        success: true,
        data: { product },
        message: 'Product status updated successfully',
      });
    } catch (error) {
      logger.error('Update product status error:', error);

      if (error.message === 'Product not found or you are not the owner') {
        return res.status(404).json({
          success: false,
          error: 'Product not found or you are not the owner',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update product status',
      });
    }
  }

  async addProductImages(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

      const result = await productService.addProductImages(id, userId, images);

      res.json({
        success: true,
        data: result,
        message: 'Images added successfully',
      });
    } catch (error) {
      logger.error('Add product images error:', error);

      if (error.message === 'Product not found or you are not the owner') {
        return res.status(404).json({
          success: false,
          error: 'Product not found or you are not the owner',
        });
      }

      if (error.message === 'Maximum 5 images allowed per product') {
        return res.status(400).json({
          success: false,
          error: 'Maximum 5 images allowed per product',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add images',
      });
    }
  }

  async getProductStatistics(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const statistics = await productService.getProductStatistics(id, userId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      logger.error('Get product statistics error:', error);

      if (error.message === 'Product not found or you are not the owner') {
        return res.status(404).json({
          success: false,
          error: 'Product not found or you are not the owner',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get product statistics',
      });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await productService.getCategories();

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get categories',
      });
    }
  }

  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const isAvailable = await productService.checkAvailability(id, startDate, endDate);

      res.json({
        success: true,
        data: { isAvailable },
      });
    } catch (error) {
      logger.error('Check availability error:', error);

      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to check availability',
      });
    }
  }

  async getRelatedProducts(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 4;

      const products = await productService.getRelatedProducts(id, limit);

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      logger.error('Get related products error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get related products',
      });
    }
  }
}

const productController = new ProductController();
export default productController;