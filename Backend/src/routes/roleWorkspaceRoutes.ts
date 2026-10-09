import { Router } from 'express';
import { roleWorkspaceController } from '../controllers/roleWorkspaceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all configs (Founder) or own role config (Non-Founder)
router.get(['/role-workspace', '/settings/roles/workspace'], roleWorkspaceController.getAllConfigs);

// Get specific role config
router.get(['/role-workspace/:role', '/settings/roles/:role/workspace'], roleWorkspaceController.getRoleConfig);

// Update role config (Founder only) - supports both PATCH and PUT
router.patch('/role-workspace/:role', authorize('FOUNDER'), roleWorkspaceController.updateRoleConfig);
router.patch('/settings/roles/:role/workspace', authorize('FOUNDER'), roleWorkspaceController.updateRoleConfig);
router.put('/settings/roles/:role/workspace', authorize('FOUNDER'), roleWorkspaceController.updateRoleConfig);

// Reset role config to factory default (Founder only)
router.post(['/role-workspace/:role/reset', '/settings/roles/:role/workspace/reset'], authorize('FOUNDER'), roleWorkspaceController.resetRoleConfig);

export default router;
