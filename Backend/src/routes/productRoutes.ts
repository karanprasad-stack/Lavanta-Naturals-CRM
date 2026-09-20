import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = Router();

router.use(authenticate);

// List & Detail readable by all authenticated team roles
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Creation, Updates and Archiving/Deletion restricted to Founder and Manager
router.post('/products', authorize('FOUNDER', 'MANAGER'), createProduct);
router.patch('/products/:id', authorize('FOUNDER', 'MANAGER'), updateProduct);
router.delete('/products/:id', authorize('FOUNDER', 'MANAGER'), deleteProduct);

export default router;
