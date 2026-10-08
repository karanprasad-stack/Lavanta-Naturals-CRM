import { User, UserRole } from '../types';
import { apiClient } from './apiClient';
import { FounderOverviewResponse } from '../types/founder';

export interface FounderDashboardData extends Partial<FounderOverviewResponse> {
  role: 'FOUNDER';
  user: User;
  unreadNotificationsCount?: number;
  companyOverview?: FounderOverviewResponse['companyOverview'];
  workOverview?: FounderOverviewResponse['workOverview'];
  salesOverview?: FounderOverviewResponse['salesOverview'];
  expenseOverview?: FounderOverviewResponse['expenseOverview'];
  teamOverview?: FounderOverviewResponse['teamOverview'];
  teamStats?: {
    total: number;
    employees: number;
    interns: number;
    hrManagers: number;
  };
  announcements?: any[];
  recentActivity?: any[];
  quickActions?: string[];
}

export interface HRDashboardData {
  role: 'HR';
  user: User;
  peopleStats: {
    totalEmployees: number;
    totalInterns: number;
    activeMembers: number;
    newJoiners: number;
  };
  teamDirectoryPreview: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    designation: string;
    joiningDate: string;
    profilePhoto: string;
    status: string;
  }>;
  hrWorkOverview: {
    tasksAssigned: number;
    tasksInProgress: number;
    tasksCompleted: number;
    overdueTasks: number;
  };
  recentJoiners: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    designation: string;
    joiningDate: string;
    profilePhoto: string;
    status: string;
  }>;
  quickActions: string[];
}

export interface ManagerDashboardData {
  role: 'MANAGER';
  user: User;
  teamStats: {
    teamMembers: number;
    employees: number;
    interns: number;
    activeMembers: number;
  };
  teamTaskOverview: {
    assigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    designation: string;
    joiningDate: string;
    profilePhoto: string;
    status: string;
  }>;
  quickActions: string[];
  salesOverview?: {
    totalRevenue: number;
    monthRevenue: number;
    pendingOrders: number;
  };
  expenseOverview?: {
    totalExpenses?: number;
    monthExpenses?: number;
    pendingApprovals?: number;
    departmentExpenses?: number;
  };
  financialOverview?: {
    revenue: number;
    expenses: number;
    operatingDifference: number;
  };
}

export interface EmployeeDashboardData {
  role: 'EMPLOYEE';
  user: User;
  myWork: {
    myTasks: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  todayWork: Array<{
    id: string;
    title: string;
    deadline: string;
  }>;
  announcement?: {
    id: string;
    title: string;
    description: string;
    date: string;
    posterUrl?: string;
    type?: string;
    priority?: string;
    targetAudience?: string;
  };
  recentChat: Array<{
    id: string;
    sender: string;
    text: string;
  }>;
  quickActions: string[];
}

export interface InternDashboardData {
  role: 'INTERN';
  user: User;
  myTasks: {
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  importantTasks: Array<{
    id: string;
    title: string;
    assignedBy: string;
    deadline: string;
    urgency: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
  }>;
  upcoming: Array<{
    id: string;
    title: string;
    date: string;
  }>;
  quickActions: string[];
}

export type DashboardResponse =
  | FounderDashboardData
  | HRDashboardData
  | ManagerDashboardData
  | EmployeeDashboardData
  | InternDashboardData;

export const dashboardService = {
  async getDashboardData(): Promise<DashboardResponse> {
    return apiClient<DashboardResponse>('/api/dashboard');
  }
};
