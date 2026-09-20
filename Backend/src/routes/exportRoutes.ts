import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { exportController } from '../controllers/exportController.js';
import { exportRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/export/:type', authenticate, exportRateLimiter, exportController.exportData);

export default router;
