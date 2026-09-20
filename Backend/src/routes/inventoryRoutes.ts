import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getInventory,
  getInventorySummary,
  getLowStockProducts,
  getInventoryHistory,
  recordMovement,
  recordAdjustment,
  getInventoryTrends
} from '../controllers/inventoryController.js';

const router = Router();

router.use(authenticate);

// Inventory reads: FOUNDER, MANAGER, HR
router.get('/inventory', authorize('FOUNDER', 'MANAGER', 'HR'), getInventory);
router.get('/inventory/summary', authorize('FOUNDER', 'MANAGER', 'HR'), getInventorySummary);
router.get('/inventory/low-stock', authorize('FOUNDER', 'MANAGER', 'HR'), getLowStockProducts);
router.get('/inventory/history', authorize('FOUNDER', 'MANAGER', 'HR'), getInventoryHistory);
router.get('/inventory/trends', authorize('FOUNDER', 'MANAGER', 'HR'), getInventoryTrends);

// Stock mutations (movements & adjustments) strictly restricted to FOUNDER and MANAGER
router.post('/inventory/movement', authorize('FOUNDER', 'MANAGER'), recordMovement);
router.post('/inventory/adjust', authorize('FOUNDER', 'MANAGER'), recordAdjustment);

export default router;
