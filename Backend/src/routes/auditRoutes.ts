import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { auditController } from '../controllers/auditController.js';

const router = Router();

// Restricted to FOUNDER and HR
router.get(
  '/audit',
  authenticate,
  requireRole(['FOUNDER', 'HR']),
  auditController.getAuditLogs
);

export default router;
