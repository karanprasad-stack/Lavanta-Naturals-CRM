import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getSalesSummary,
  getSalesTrends,
  getTopProducts
} from '../controllers/salesController.js';

const router = Router();

router.use(authenticate);

// Sales metrics restricted to FOUNDER and MANAGER (plus HR for high-level top products)
router.get('/sales/summary', authorize('FOUNDER', 'MANAGER'), getSalesSummary);
router.get('/sales/trends', authorize('FOUNDER', 'MANAGER'), getSalesTrends);
router.get('/sales/top-products', authorize('FOUNDER', 'MANAGER', 'HR'), getTopProducts);

export default router;
