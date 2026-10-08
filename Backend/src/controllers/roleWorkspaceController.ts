import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import {
  RoleWorkspaceConfigModel,
  DEFAULT_ROLE_WORKSPACE_CONFIGS,
  MANDATORY_SIDEBAR_MODULES,
  SidebarModuleKey,
  DashboardWidgetKey
} from '../models/RoleWorkspaceConfig.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { io } from '../socket/index.js';

const VALID_ROLES: UserRole[] = ['FOUNDER', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN'];

/**
 * Helper to ensure a role configuration exists in MongoDB; if not, creates with defaults.
 */
async function getOrCreateRoleConfig(role: UserRole) {
  let config = await RoleWorkspaceConfigModel.findOne({ role });
  if (!config) {
    const defaults = DEFAULT_ROLE_WORKSPACE_CONFIGS[role];
    config = await RoleWorkspaceConfigModel.create({
      role,
      sidebarModules: defaults.sidebarModules,
      dashboardWidgets: defaults.dashboardWidgets
    });
  }
  return config;
}

/**
 * Formats a Mongoose document or default object into clean plain JSON with Maps converted to plain objects.
 */
function formatConfig(doc: any) {
  const sidebarModules: Record<string, boolean> = {};
  const dashboardWidgets: Record<string, boolean> = {};

  if (doc.sidebarModules instanceof Map) {
    doc.sidebarModules.forEach((val: boolean, key: string) => {
      sidebarModules[key] = val;
    });
  } else if (doc.sidebarModules && typeof doc.sidebarModules === 'object') {
    Object.assign(sidebarModules, doc.sidebarModules);
  }

  if (doc.dashboardWidgets instanceof Map) {
    doc.dashboardWidgets.forEach((val: boolean, key: string) => {
      dashboardWidgets[key] = val;
    });
  } else if (doc.dashboardWidgets && typeof doc.dashboardWidgets === 'object') {
    Object.assign(dashboardWidgets, doc.dashboardWidgets);
  }

  // Ensure mandatory modules are always true
  const role = doc.role as UserRole;
  const mandatory = (MANDATORY_SIDEBAR_MODULES as Record<string, SidebarModuleKey[]>)[role];
  if (mandatory) {
    mandatory.forEach((m: SidebarModuleKey) => {
      sidebarModules[m] = true;
    });
  }

  return {
    role: doc.role,
    sidebarModules,
    dashboardWidgets,
    mandatoryModules: mandatory || [],
    updatedAt: doc.updatedAt || new Date()
  };
}

export const roleWorkspaceController = {
  /**
   * GET /api/role-workspace
   * Founder: returns all role workspace configurations
   * Other roles: returns only their own role configuration
   */
  async getAllConfigs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const isFounder = user.role === 'FOUNDER';

      if (isFounder) {
        const configs = await Promise.all(
          VALID_ROLES.map(async (r: UserRole) => {
            const doc = await getOrCreateRoleConfig(r);
            return formatConfig(doc);
          })
        );

        res.status(200).json({
          success: true,
          data: configs
        });
        return;
      }

      // Non-Founder gets only their assigned role config
      const doc = await getOrCreateRoleConfig(user.role as UserRole);
      res.status(200).json({
        success: true,
        data: [formatConfig(doc)]
      });
    } catch (error: any) {
      console.error('[RoleWorkspaceController] Error in getAllConfigs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve workspace configurations',
        error: error.message
      });
    }
  },

  /**
   * GET /api/role-workspace/:role
   * Retrieve workspace config for a specific role
   */
  async getRoleConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const requestedRole = (req.params.role || '').toUpperCase() as UserRole;

      if (!VALID_ROLES.includes(requestedRole)) {
        res.status(400).json({
          success: false,
          message: `Invalid role specified. Valid roles: ${VALID_ROLES.join(', ')}`
        });
        return;
      }

      // Non-founders can only query their own role
      if (user.role !== 'FOUNDER' && user.role !== requestedRole) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only view the workspace configuration for your own role.'
        });
        return;
      }

      const doc = await getOrCreateRoleConfig(requestedRole);
      res.status(200).json({
        success: true,
        data: formatConfig(doc)
      });
    } catch (error: any) {
      console.error('[RoleWorkspaceController] Error in getRoleConfig:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve role workspace configuration',
        error: error.message
      });
    }
  },

  /**
   * PATCH /api/role-workspace/:role
   * Founder-only: update workspace configuration for a role
   */
  async updateRoleConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      // Strictly verify Founder role
      if (user.role !== 'FOUNDER') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only Founder can modify role workspace configurations.'
        });
        return;
      }

      const role = (req.params.role || '').toUpperCase() as UserRole;
      if (!VALID_ROLES.includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid role specified: ${role}`
        });
        return;
      }

      const { sidebarModules = {}, dashboardWidgets = {} } = req.body;

      // Enforce mandatory modules: cannot be set to false
      const mandatory = (MANDATORY_SIDEBAR_MODULES as Record<string, SidebarModuleKey[]>)[role] || [];
      const sanitizedSidebarModules = { ...sidebarModules };
      mandatory.forEach((mod: SidebarModuleKey) => {
        sanitizedSidebarModules[mod] = true;
      });

      // Find or create existing config
      let config = await RoleWorkspaceConfigModel.findOne({ role });
      if (!config) {
        config = new RoleWorkspaceConfigModel({
          role,
          sidebarModules: sanitizedSidebarModules,
          dashboardWidgets,
          updatedBy: user._id
        });
      } else {
        config.sidebarModules = sanitizedSidebarModules;
        config.dashboardWidgets = dashboardWidgets;
        config.updatedBy = user._id;
      }

      await config.save();

      // Log Security Audit Event
      await logAuditEvent(req, {
        action: 'WORKSPACE_CONFIG_UPDATED',
        entityType: 'RoleWorkspaceConfig',
        entityId: role,
        metadata: {
          role,
          updatedBy: user.email,
          sidebarModules: sanitizedSidebarModules,
          dashboardWidgets
        }
      });

      // Notify clients over Socket.IO if available
      try {
        if (io) {
          io.emit('workspace:config_updated', {
            role,
            config: formatConfig(config)
          });
        }
      } catch (sockErr) {
        // Socket broadcast error shouldn't fail HTTP response
      }

      res.status(200).json({
        success: true,
        message: `Workspace configuration for ${role} updated successfully`,
        data: formatConfig(config)
      });
    } catch (error: any) {
      console.error('[RoleWorkspaceController] Error in updateRoleConfig:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update workspace configuration',
        error: error.message
      });
    }
  },

  /**
   * POST /api/role-workspace/:role/reset
   * Founder-only: reset role configuration to factory defaults
   */
  async resetRoleConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      // Strictly verify Founder role
      if (user.role !== 'FOUNDER') {
        res.status(403).json({
          success: false,
          message: 'Access denied: Only Founder can reset role workspace configurations.'
        });
        return;
      }

      const role = (req.params.role || '').toUpperCase() as UserRole;
      if (!VALID_ROLES.includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid role specified: ${role}`
        });
        return;
      }

      const defaults = (DEFAULT_ROLE_WORKSPACE_CONFIGS as Record<string, any>)[role];

      let config = await RoleWorkspaceConfigModel.findOne({ role });
      if (!config) {
        config = new RoleWorkspaceConfigModel({
          role,
          sidebarModules: defaults.sidebarModules,
          dashboardWidgets: defaults.dashboardWidgets,
          updatedBy: user._id
        });
      } else {
        config.sidebarModules = defaults.sidebarModules;
        config.dashboardWidgets = defaults.dashboardWidgets;
        config.updatedBy = user._id;
      }

      await config.save();

      // Log Security Audit Event
      await logAuditEvent(req, {
        action: 'WORKSPACE_CONFIG_UPDATED',
        entityType: 'RoleWorkspaceConfig',
        entityId: role,
        metadata: {
          role,
          actionType: 'RESET_TO_DEFAULT',
          updatedBy: user.email
        }
      });

      // Notify clients over Socket.IO if available
      try {
        if (io) {
          io.emit('workspace:config_updated', {
            role,
            config: formatConfig(config)
          });
        }
      } catch (sockErr) {
        // Socket broadcast error shouldn't fail HTTP response
      }

      res.status(200).json({
        success: true,
        message: `Workspace configuration for ${role} reset to default`,
        data: formatConfig(config)
      });
    } catch (error: any) {
      console.error('[RoleWorkspaceController] Error in resetRoleConfig:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset workspace configuration',
        error: error.message
      });
    }
  }
};
