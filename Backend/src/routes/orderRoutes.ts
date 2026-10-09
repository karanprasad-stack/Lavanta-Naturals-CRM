import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createOrder,
  getOrders,
  getOrderById,
  confirmOrder,
  cancelOrder,
  updateOrderStatus,
  updatePaymentStatus,
  previewOrderImport,
  importOrders
} from '../controllers/orderController.js';

const router = Router();

router.use(authenticate);

// Orders listing and read: FOUNDER, MANAGER, HR, EMPLOYEE
router.get('/orders', authorize('FOUNDER', 'MANAGER', 'HR', 'EMPLOYEE'), getOrders);
router.post('/orders', authorize('FOUNDER', 'MANAGER', 'HR', 'EMPLOYEE'), createOrder);

// Multi-Channel CSV Import endpoints: strictly FOUNDER and MANAGER
router.post('/orders/import/preview', authorize('FOUNDER', 'MANAGER'), previewOrderImport);
router.post('/orders/import', authorize('FOUNDER', 'MANAGER'), importOrders);

router.get('/orders/:id', authorize('FOUNDER', 'MANAGER', 'HR', 'EMPLOYEE'), getOrderById);

// Order lifecycle actions: strictly FOUNDER and MANAGER
router.post('/orders/:id/confirm', authorize('FOUNDER', 'MANAGER'), confirmOrder);
router.post('/orders/:id/cancel', authorize('FOUNDER', 'MANAGER'), cancelOrder);
router.post('/orders/:id/status', authorize('FOUNDER', 'MANAGER'), updateOrderStatus);
router.patch('/orders/:id/payment', authorize('FOUNDER', 'MANAGER'), updatePaymentStatus);

export default router;
