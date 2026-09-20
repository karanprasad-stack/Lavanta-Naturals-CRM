import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Central role-aware dashboard endpoint
router.get('/dashboard', authenticate, dashboardController.getDashboardData);

export default router;
