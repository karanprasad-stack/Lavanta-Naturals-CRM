import { apiClient } from './apiClient';
import { TaskUserSummary, TaskPriority, TaskStatus } from '../types/task';

export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_CANCELLED'
  | 'COMMENT_ADDED'
  | 'FILE_UPLOADED'
  | 'PROOF_UPLOADED'
  | 'DEADLINE_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'STATUS_CHANGED';

export interface ActivityTaskSummary {
  _id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  department?: string;
  assignedTo?: string;
}

export interface ActivityItem {
  _id: string;
  taskId: ActivityTaskSummary;
  actorId: TaskUserSummary;
  type: ActivityType;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WorkSummaryData {
  activeTasks: number;
  pendingTasks: number;
  completedToday: number;
  overdueTasks: number;
  dueToday: number;
  completedThisWeek: number;
}

export interface TodayWorkSummary {
  assignedToday: number;
  startedToday: number;
  completedToday: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface WeeklyWorkSummary {
  assignedThisWeek: number;
  startedThisWeek: number;
  completedThisWeek: number;
  overdueTasks: number;
  completionRate: number;
}

export interface ActiveWorkItem {
  _id: string;
  title: string;
  description?: string;
  assignedTo: TaskUserSummary;
  assignedBy?: TaskUserSummary;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  startedAt: string;
  durationMs: number | null;
  isActive: boolean;
}

export interface WorkloadItem {
  user: TaskUserSummary;
  assigned: number;
  active: number;
  completed: number;
  overdue: number;
}

export interface CompletionTrendPoint {
  date: string;
  day: string;
  completed: number;
}

export interface StatusDistribution {
  TODO: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  OVERDUE: number;
  CANCELLED: number;
}

export interface UserActivityDetail {
  user: TaskUserSummary & { joiningDate?: string; status?: string };
  summary: {
    assigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completedThisWeek: number;
    completedThisMonth: number;
  };
  activities: ActivityItem[];
}

export interface MyActivityData {
  todaySummary: {
    assignedToday: number;
    inProgress: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  activeTasks: (ActiveWorkItem & { durationMs: number | null })[];
  completedTasks: any[];
  overdueTasks: any[];
  recentActivities: ActivityItem[];
}

export interface ActivityFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  department?: string;
  role?: string;
  status?: string;
  priority?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Format milliseconds into human-readable task duration:
 * e.g. "35 min", "2h 15m", "1d 3h", or "Not started"
 */
export function formatDuration(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined || durationMs < 0) {
    return 'Not started';
  }

  const totalMinutes = Math.floor(durationMs / 60000);
  if (totalMinutes < 1) {
    return 'Just started';
  }
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  if (totalHours < 24) {
    return remainingMins > 0 ? `${totalHours}h ${remainingMins}m` : `${totalHours}h`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  return remainingHours > 0 ? `${totalDays}d ${remainingHours}h` : `${totalDays}d`;
}

export const activityService = {
  /**
   * Fetch paginated activity feed with multi-criteria filters
   */
  async getActivityFeed(params?: ActivityFilterParams): Promise<{
    activities: ActivityItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{
      success: boolean;
      activities: ActivityItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/activity${query}`);
    return { activities: res.activities || [], pagination: res.pagination };
  },

  /**
   * Fetch work summary overview counters & daily/weekly metrics
   */
  async getWorkSummary(): Promise<{
    summary: WorkSummaryData;
    todaySummary: TodayWorkSummary;
    weeklySummary: WeeklyWorkSummary;
  }> {
    const res = await apiClient<{
      success: boolean;
      summary: WorkSummaryData;
      todaySummary: TodayWorkSummary;
      weeklySummary: WeeklyWorkSummary;
    }>('/api/activity/summary');
    return {
      summary: res.summary,
      todaySummary: res.todaySummary,
      weeklySummary: res.weeklySummary
    };
  },

  /**
   * Fetch currently active work (tasks having status = IN_PROGRESS)
   */
  async getActiveWork(): Promise<{ activeTasks: ActiveWorkItem[]; total: number }> {
    const res = await apiClient<{
      success: boolean;
      activeTasks: ActiveWorkItem[];
      total: number;
    }>('/api/activity/active');
    return { activeTasks: res.activeTasks || [], total: res.total || 0 };
  },

  /**
   * Fetch team workload aggregation (Assigned, Active, Completed, Overdue)
   */
  async getTeamWorkload(): Promise<WorkloadItem[]> {
    const res = await apiClient<{ success: boolean; workload: WorkloadItem[] }>('/api/activity/workload');
    return res.workload || [];
  },

  /**
   * Fetch completion trends and status distribution
   */
  async getCompletionTrends(range: 'today' | 'week' | 'month' = 'week'): Promise<{
    trends: CompletionTrendPoint[];
    statusDistribution: StatusDistribution;
  }> {
    const res = await apiClient<{
      success: boolean;
      trends: CompletionTrendPoint[];
      statusDistribution: StatusDistribution;
    }>(`/api/activity/trends?range=${range}`);
    return {
      trends: res.trends || [],
      statusDistribution: res.statusDistribution || { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0, CANCELLED: 0 }
    };
  },

  /**
   * Fetch user activity detail by ID (Founder, HR, or Manager of team)
   */
  async getUserActivity(userId: string): Promise<UserActivityDetail> {
    const res = await apiClient<{
      success: boolean;
      user: TaskUserSummary;
      summary: any;
      activities: ActivityItem[];
    }>(`/api/activity/user/${userId}`);
    return {
      user: res.user,
      summary: res.summary,
      activities: res.activities || []
    };
  },

  /**
   * Fetch authenticated user's own activity (Employees / Interns)
   */
  async getMyActivity(): Promise<MyActivityData> {
    const res = await apiClient<{
      success: boolean;
      todaySummary: any;
      activeTasks: any[];
      completedTasks: any[];
      overdueTasks: any[];
      recentActivities: ActivityItem[];
    }>('/api/activity/my');
    return {
      todaySummary: res.todaySummary,
      activeTasks: res.activeTasks || [],
      completedTasks: res.completedTasks || [],
      overdueTasks: res.overdueTasks || [],
      recentActivities: res.recentActivities || []
    };
  }
};
