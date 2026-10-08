import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getFinanceSummary,
  getFinanceTrends,
  getExpenseBreakdown,
  getChannelProfitability
} from '../controllers/financeController.js';

const router = Router();

router.use(authenticate);

// Financial analytics strictly restricted to FOUNDER and MANAGER
router.get('/finance/summary', authorize('FOUNDER', 'MANAGER'), getFinanceSummary);
router.get('/finance/trends', authorize('FOUNDER', 'MANAGER'), getFinanceTrends);
router.get('/finance/expense-breakdown', authorize('FOUNDER', 'MANAGER'), getExpenseBreakdown);
router.get('/finance/channel-profitability', authorize('FOUNDER', 'MANAGER'), getChannelProfitability);

export default router;
