import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory
} from '../controllers/productCategoryController.js';

const router = Router();

// All category routes require authentication
router.use(authenticate);

// Publicly readable for all authenticated team roles
router.get('/product-categories', getProductCategories);

// Category mutations restricted to Founder and Manager
router.post(
  '/product-categories',
  authorize('FOUNDER', 'MANAGER'),
  createProductCategory
);

router.patch(
  '/product-categories/:id',
  authorize('FOUNDER', 'MANAGER'),
  updateProductCategory
);

router.delete(
  '/product-categories/:id',
  authorize('FOUNDER', 'MANAGER'),
  deleteProductCategory
);

export default router;
