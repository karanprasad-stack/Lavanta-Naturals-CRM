import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from './User.js';

export { UserRole };

export interface IRoleWorkspaceConfig extends Document {
  role: UserRole;
  sidebarModules: Record<string, boolean>;
  dashboardWidgets: Record<string, boolean>;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Standard module keys matching the CRM layout and user prompt
 */
export const ALL_SIDEBAR_MODULE_KEYS = [
  // Workspace
  'dashboard',
  'tasks',
  'workActivity',
  'goals',
  'calendar',
  // Catalog & Sales
  'products',
  'orders',
  'salesAnalytics',
  'financials',
  'expenses',
  // Communication
  'companyChat',
  'announcements',
  'notifications',
  // Company & Operations
  'team',
  'securityAudit',
  'systemStatus',
  'profile',
  'settings'
] as const;

export type SidebarModuleKey = typeof ALL_SIDEBAR_MODULE_KEYS[number];

/**
 * Dashboard widget keys
 */
export const ALL_DASHBOARD_WIDGET_KEYS = [
  'activeTasks',
  'overdueTasks',
  'activeGoals',
  'pendingOrders',
  'pendingExpenses',
  'workStatus',
  'tasksInProgress',
  'revenueOperations',
  'teamMembers'
] as const;

export type DashboardWidgetKey = typeof ALL_DASHBOARD_WIDGET_KEYS[number];

/**
 * Mandatory modules per role that cannot be turned OFF by the Founder
 */
export const MANDATORY_SIDEBAR_MODULES: Record<UserRole, SidebarModuleKey[]> = {
  FOUNDER: ['dashboard', 'notifications', 'profile'],
  HR: ['dashboard', 'tasks', 'team', 'notifications', 'profile'],
  MANAGER: ['dashboard', 'tasks', 'team', 'notifications', 'profile'],
  EMPLOYEE: ['dashboard', 'tasks', 'notifications', 'profile'],
  INTERN: ['dashboard', 'tasks', 'notifications', 'profile']
};

/**
 * Factory defaults for each role
 */
export const DEFAULT_ROLE_WORKSPACE_CONFIGS: Record<
  UserRole,
  {
    sidebarModules: Record<SidebarModuleKey, boolean>;
    dashboardWidgets: Record<DashboardWidgetKey, boolean>;
  }
> = {
  FOUNDER: {
    sidebarModules: {
      dashboard: true,
      tasks: true,
      workActivity: true,
      goals: true,
      calendar: true,
      products: true,
      orders: true,
      salesAnalytics: true,
      financials: true,
      expenses: true,
      companyChat: true,
      announcements: true,
      notifications: true,
      team: true,
      securityAudit: true,
      systemStatus: true,
      profile: true,
      settings: true
    },
    dashboardWidgets: {
      activeTasks: true,
      overdueTasks: true,
      activeGoals: true,
      pendingOrders: true,
      pendingExpenses: true,
      workStatus: true,
      tasksInProgress: true,
      revenueOperations: true,
      teamMembers: true
    }
  },
  HR: {
    sidebarModules: {
      dashboard: true,
      tasks: true,
      workActivity: true,
      goals: true,
      calendar: true,
      products: false,
      orders: false,
      salesAnalytics: false,
      financials: false,
      expenses: true,
      companyChat: true,
      announcements: true,
      notifications: true,
      team: true,
      securityAudit: true,
      systemStatus: false,
      profile: true,
      settings: true
    },
    dashboardWidgets: {
      activeTasks: true,
      overdueTasks: true,
      activeGoals: true,
      pendingOrders: false,
      pendingExpenses: true,
      workStatus: true,
      tasksInProgress: true,
      revenueOperations: false,
      teamMembers: true
    }
  },
  MANAGER: {
    sidebarModules: {
      dashboard: true,
      tasks: true,
      workActivity: true,
      goals: true,
      calendar: true,
      products: true,
      orders: true,
      salesAnalytics: true,
      financials: false,
      expenses: true,
      companyChat: true,
      announcements: true,
      notifications: true,
      team: true,
      securityAudit: false,
      systemStatus: false,
      profile: true,
      settings: true
    },
    dashboardWidgets: {
      activeTasks: true,
      overdueTasks: true,
      activeGoals: true,
      pendingOrders: true,
      pendingExpenses: true,
      workStatus: true,
      tasksInProgress: true,
      revenueOperations: true,
      teamMembers: true
    }
  },
  EMPLOYEE: {
    sidebarModules: {
      dashboard: true,
      tasks: true,
      workActivity: true,
      goals: true,
      calendar: true,
      products: false,
      orders: false,
      salesAnalytics: false,
      financials: false,
      expenses: false,
      companyChat: true,
      announcements: true,
      notifications: true,
      team: false,
      securityAudit: false,
      systemStatus: false,
      profile: true,
      settings: true
    },
    dashboardWidgets: {
      activeTasks: true,
      overdueTasks: false,
      activeGoals: true,
      pendingOrders: false,
      pendingExpenses: false,
      workStatus: true,
      tasksInProgress: true,
      revenueOperations: false,
      teamMembers: false
    }
  },
  INTERN: {
    sidebarModules: {
      dashboard: true,
      tasks: true,
      workActivity: false,
      goals: false,
      calendar: true,
      products: false,
      orders: false,
      salesAnalytics: false,
      financials: false,
      expenses: false,
      companyChat: true,
      announcements: true,
      notifications: true,
      team: false,
      securityAudit: false,
      systemStatus: false,
      profile: true,
      settings: false
    },
    dashboardWidgets: {
      activeTasks: true,
      overdueTasks: false,
      activeGoals: false,
      pendingOrders: false,
      pendingExpenses: false,
      workStatus: true,
      tasksInProgress: true,
      revenueOperations: false,
      teamMembers: false
    }
  }
};

const RoleWorkspaceConfigSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      enum: ['FOUNDER', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN'],
      trim: true,
      index: true
    },
    sidebarModules: {
      type: Map,
      of: Boolean,
      default: {}
    },
    dashboardWidgets: {
      type: Map,
      of: Boolean,
      default: {}
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  {
    timestamps: true
  }
);

export const RoleWorkspaceConfigModel = mongoose.model<IRoleWorkspaceConfig>(
  'RoleWorkspaceConfig',
  RoleWorkspaceConfigSchema
);
