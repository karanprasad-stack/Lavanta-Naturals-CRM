import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  submitExpense,
  approveExpense,
  rejectExpense,
  payExpense,
  cancelExpense,
  getExpenseSummary,
  getExpenseReceipt
} from '../controllers/expenseController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const router = Router();

router.use(authenticate);

// Expense reads & submission accessible to all active roles (scoped inside controller)
router.get('/expenses', getExpenses);
router.get('/expenses/summary', getExpenseSummary);
router.get('/expenses/:id', getExpenseById);
router.get('/expenses/:id/receipt', getExpenseReceipt);

router.post('/expenses', upload.single('receipt'), createExpense);
router.post('/expenses/:id/submit', submitExpense);
router.post('/expenses/:id/cancel', cancelExpense);

// Approval & Rejection: strictly FOUNDER, MANAGER, HR
router.post('/expenses/:id/approve', authorize('FOUNDER', 'MANAGER', 'HR'), approveExpense);
router.post('/expenses/:id/reject', authorize('FOUNDER', 'MANAGER', 'HR'), rejectExpense);

// Mark as Paid: strictly FOUNDER
router.post('/expenses/:id/pay', authorize('FOUNDER'), payExpense);

export default router;
