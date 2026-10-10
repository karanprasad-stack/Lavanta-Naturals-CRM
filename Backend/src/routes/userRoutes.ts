import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Update own profile
router.put('/users/profile', authenticate, userController.updateProfile);

// Get real-time aggregated team statistics (Accessible to all authenticated users for dashboards)
router.get('/users/stats', authenticate, userController.getStats);

// Get all team members with search, filters, pagination (Accessible to all authenticated team members)
router.get('/users', authenticate, userController.getUsers);

// Get single employee by ID
router.get('/users/:id', authenticate, userController.getUserById);

// Add team member (Restricted to FOUNDER, HR, and MANAGER)
router.post('/users', authenticate, authorize('FOUNDER', 'HR', 'MANAGER'), userController.createUser);

// Update team member (Permission checks performed in controller)
router.patch('/users/:id', authenticate, userController.updateUser);

export default router;
