import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer
} from '../controllers/customerController.js';

const router = Router();

router.use(authenticate);

router.post('/customers', createCustomer);
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.patch('/customers/:id', updateCustomer);

export default router;
