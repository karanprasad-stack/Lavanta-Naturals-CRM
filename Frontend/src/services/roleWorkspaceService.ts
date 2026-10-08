import { apiClient } from './apiClient';
import { UserRole } from '../types';

export interface RoleWorkspaceConfig {
  role: UserRole;
  sidebarModules: Record<string, boolean>;
  dashboardWidgets: Record<string, boolean>;
  mandatoryModules: string[];
  updatedAt?: string;
}

export interface ModuleDefinition {
  key: string;
  label: string;
  description: string;
  category: 'WORKSPACE' | 'CATALOG & SALES' | 'FINANCE' | 'COMMUNICATION' | 'COMPANY';
  to: string;
}

export interface WidgetDefinition {
  key: string;
  label: string;
  description: string;
  category: 'Metrics' | 'Activity' | 'Operations';
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  // Workspace
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Role-customized daily operational dashboard and personal overview.',
    category: 'WORKSPACE',
    to: '/dashboard'
  },
  {
    key: 'tasks',
    label: 'Tasks',
    description: 'Task board, assignment tracking, subtasks, and proof of work submission.',
    category: 'WORKSPACE',
    to: '/tasks'
  },
  {
    key: 'workActivity',
    label: 'Work Activity',
    description: 'Time tracking, activity logs, work verification, and productivity timeline.',
    category: 'WORKSPACE',
    to: '/activity'
  },
  {
    key: 'goals',
    label: 'Goals & OKRs',
    description: 'Company, team, and personal strategic objectives and key results.',
    category: 'WORKSPACE',
    to: '/goals'
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'Company schedules, batch manufacturing dates, and meeting schedules.',
    category: 'WORKSPACE',
    to: '/calendar'
  },

  // Catalog & Sales
  {
    key: 'products',
    label: 'Products',
    description: 'Product master catalog, formulation SKUs, categories, and pricing.',
    category: 'CATALOG & SALES',
    to: '/products'
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'Unified multi-channel sales order register (Website, Amazon, Flipkart).',
    category: 'CATALOG & SALES',
    to: '/orders'
  },
  {
    key: 'salesAnalytics',
    label: 'Sales Analytics',
    description: 'Revenue trends, top products, and multi-channel commercial analytics.',
    category: 'CATALOG & SALES',
    to: '/sales'
  },

  // Finance
  {
    key: 'expenses',
    label: 'Expenses',
    description: 'Business expenditure, marketplace fees, receipts, and approval workflows.',
    category: 'FINANCE',
    to: '/expenses'
  },
  {
    key: 'financials',
    label: 'Financials',
    description: 'Executive financial consolidation: Orders revenue vs Business expenses.',
    category: 'FINANCE',
    to: '/finance'
  },

  // Communication
  {
    key: 'companyChat',
    label: 'Company Chat',
    description: 'Direct team messaging, department channels, and real-time collaboration.',
    category: 'COMMUNICATION',
    to: '/chat'
  },
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Company-wide notices, product launches, and urgent broadcast updates.',
    category: 'COMMUNICATION',
    to: '/announcements'
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Real-time alerts, approval requests, system alerts, and task updates.',
    category: 'COMMUNICATION',
    to: '/notifications'
  },

  // Company
  {
    key: 'team',
    label: 'Team',
    description: 'Employee directory, department rosters, team profiles, and invitations.',
    category: 'COMPANY',
    to: '/team'
  },
  {
    key: 'securityAudit',
    label: 'Security Audit',
    description: 'End-to-end security logs, authentication records, and configuration audit trail.',
    category: 'COMPANY',
    to: '/audit'
  },
  {
    key: 'systemStatus',
    label: 'System Status',
    description: 'Database health, API latency, background workers, and memory usage.',
    category: 'COMPANY',
    to: '/system'
  },
  {
    key: 'profile',
    label: 'Profile',
    description: 'Personal user settings, credentials, role designation, and avatar.',
    category: 'COMPANY',
    to: '/profile'
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Company preferences, theme customization, and role workspace controls.',
    category: 'COMPANY',
    to: '/settings'
  }
];

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    key: 'teamMembers',
    label: 'Team Overview',
    description: 'Active team member count, online presence, and departmental breakdown.',
    category: 'Metrics'
  },
  {
    key: 'activeTasks',
    label: 'Active Tasks',
    description: 'Total active tasks currently assigned across this workspace.',
    category: 'Activity'
  },
  {
    key: 'overdueTasks',
    label: 'Overdue Tasks Alert',
    description: 'Count and quick access to delayed or past-deadline tasks.',
    category: 'Activity'
  },
  {
    key: 'activeGoals',
    label: 'Strategic Goals / OKRs',
    description: 'High-level objective progress summary and milestone tracking.',
    category: 'Metrics'
  },
  {
    key: 'pendingOrders',
    label: 'Pending Orders Queue',
    description: 'Commercial sales orders awaiting confirmation or fulfillment.',
    category: 'Operations'
  },
  {
    key: 'pendingExpenses',
    label: 'Pending Expense Claims',
    description: 'Submitted operational expenses requiring manager or founder approval.',
    category: 'Operations'
  },
  {
    key: 'workStatus',
    label: 'Task Velocity Distribution',
    description: 'Visual breakdown of tasks across Todo, In-Progress, and Completed.',
    category: 'Activity'
  },
  {
    key: 'tasksInProgress',
    label: 'Active Workstream Feed',
    description: 'Real-time feed of tasks currently being worked on by team members.',
    category: 'Activity'
  },
  {
    key: 'revenueOperations',
    label: 'Recognized Revenue Overview',
    description: 'Executive revenue figure and commercial booking velocity summary.',
    category: 'Metrics'
  }
];

export const roleWorkspaceService = {
  /**
   * Get workspace config for a specific role
   */
  async getRoleConfig(role: string): Promise<RoleWorkspaceConfig> {
    const res = await apiClient<{ success: boolean; data: RoleWorkspaceConfig }>(
      `/api/settings/roles/${role}/workspace`
    );
    return res.data;
  },

  /**
   * Get all role workspace configs (Founder only)
   */
  async getAllRoleConfigs(): Promise<Record<string, RoleWorkspaceConfig>> {
    const res = await apiClient<{ success: boolean; data: Record<string, RoleWorkspaceConfig> }>(
      '/api/settings/roles/workspace'
    );
    return res.data;
  },

  async getAllConfigs(): Promise<RoleWorkspaceConfig[]> {
    const res = await apiClient<{ success: boolean; data: Record<string, RoleWorkspaceConfig> }>(
      '/api/settings/roles/workspace'
    );
    return Object.values(res.data || {});
  },

  /**
   * Update role workspace config (Founder only)
   */
  async updateRoleConfig(
    role: string,
    payload: {
      sidebarModules: Record<string, boolean>;
      dashboardWidgets: Record<string, boolean>;
    }
  ): Promise<RoleWorkspaceConfig> {
    const res = await apiClient<{ success: boolean; data: RoleWorkspaceConfig }>(
      `/api/settings/roles/${role}/workspace`,
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      }
    );
    return res.data;
  },

  /**
   * Reset role workspace config to factory defaults (Founder only)
   */
  async resetRoleConfig(role: string): Promise<RoleWorkspaceConfig> {
    const res = await apiClient<{ success: boolean; data: RoleWorkspaceConfig }>(
      `/api/settings/roles/${role}/workspace/reset`,
      {
        method: 'POST'
      }
    );
    return res.data;
  }
};
