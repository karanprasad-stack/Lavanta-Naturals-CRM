import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { founderController } from '../controllers/founderController.js';

const router = Router();

// Strict Founder-only access
router.get(
  '/founder/overview',
  authenticate,
  requireRole(['FOUNDER']),
  founderController.getOverview
);

export default router;
