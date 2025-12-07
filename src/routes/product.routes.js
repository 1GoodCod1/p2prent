import express from 'express';
const router = express.Router();
import productController from '../controllers/products.controller.js';
import { validate } from '../middleware/validation.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { apiLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import {
  createProductValidator,
  updateProductValidator,
  productQueryValidator,
} from '../validators/product.validator.js';

// Public routes
router.get('/search', validate(productQueryValidator), optionalAuth, productController.searchProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', optionalAuth, productController.getProduct);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id/availability', productController.checkAvailability);

// Protected routes
router.post(
  '/',
  authenticate,
  apiLimiter,
  upload.array('images', 5),
  validate(createProductValidator),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  validate(updateProductValidator),
  productController.updateProduct
);

router.delete('/:id', authenticate, productController.deleteProduct);
router.get('/user/products', authenticate, productController.getUserProducts);
router.post('/:productId/favorite', authenticate, productController.toggleFavorite);
router.get('/user/favorites', authenticate, productController.getUserFavorites);
router.put('/:id/status', authenticate, productController.updateProductStatus);
router.post(
  '/:id/images',
  authenticate,
  uploadLimiter,
  upload.array('images', 5),
  productController.addProductImages
);
router.get('/:id/statistics', authenticate, productController.getProductStatistics);

export default router;