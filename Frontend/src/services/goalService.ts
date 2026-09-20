import { apiClient } from './apiClient';
import { TaskUserSummary } from '../types/task';

export type GoalType = 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL';
export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'AT_RISK' | 'PAUSED' | 'CANCELLED';
export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type MetricType = 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'BOOLEAN' | 'COUNT';
export type KeyResultStatus = 'ON_TRACK' | 'AT_RISK' | 'COMPLETED' | 'BEHIND';

export interface GoalComment {
  _id: string;
  author: TaskUserSummary;
  content: string;
  createdAt: string;
}

export interface GoalActivity {
  _id: string;
  goalId: string;
  actorId: TaskUserSummary;
  type: string;
  message: string;
  createdAt: string;
}

export interface RelatedTaskSummary {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  assignedTo?: TaskUserSummary;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface KeyResult {
  _id: string;
  objectiveId: string;
  goalId: string;
  title: string;
  description?: string;
  metricType: MetricType;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number; // 0 to 100
  owner: TaskUserSummary;
  deadline: string;
  status: KeyResultStatus;
  tasks?: RelatedTaskSummary[];
  taskStats?: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export interface Objective {
  _id: string;
  goalId: string;
  title: string;
  description?: string;
  owner: TaskUserSummary;
  contributors?: TaskUserSummary[];
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  weight?: number;
  keyResults: KeyResult[];
  tasks?: RelatedTaskSummary[];
}

export interface Goal {
  _id: string;
  title: string;
  description?: string;
  type: GoalType;
  owner: TaskUserSummary;
  department: string;
  team: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  progress: number;
  priority: GoalPriority;
  createdBy: TaskUserSummary;
  comments?: GoalComment[];
  objectives?: Objective[];
  activities?: GoalActivity[];
  relatedTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingDeadlineGoal {
  _id: string;
  title: string;
  endDate: string;
  daysRemaining: number;
  progress: number;
  status: GoalStatus;
  owner?: TaskUserSummary;
}

export interface GoalSummaryData {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  atRiskGoals: number;
  averageProgress: number;
  upcomingDeadlines: UpcomingDeadlineGoal[];
}

export interface GoalFilterParams {
  type?: string;
  status?: string;
  department?: string;
  owner?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateGoalPayload {
  title: string;
  description?: string;
  type?: GoalType;
  owner?: string;
  department?: string;
  team?: string;
  startDate: string;
  endDate: string;
  priority?: GoalPriority;
  status?: GoalStatus;
}

export interface CreateObjectivePayload {
  title: string;
  description?: string;
  owner?: string;
  contributors?: string[];
  startDate?: string;
  endDate?: string;
  weight?: number;
}

export interface CreateKeyResultPayload {
  title: string;
  description?: string;
  metricType?: MetricType;
  startValue?: number;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  deadline?: string;
  owner?: string;
}

export const goalService = {
  /**
   * Fetch goals list with multi-filters
   */
  async getGoals(params?: GoalFilterParams): Promise<{ goals: Goal[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{ success: boolean; goals: Goal[]; pagination: any }>(`/api/goals${query}`);
    return { goals: res.goals || [], total: res.pagination?.total || 0 };
  },

  /**
   * Fetch single goal with full hierarchy
   */
  async getGoalById(id: string): Promise<Goal> {
    const res = await apiClient<{ success: boolean; goal: Goal }>(`/api/goals/${id}`);
    return res.goal;
  },

  /**
   * Create a new goal
   */
  async createGoal(payload: CreateGoalPayload): Promise<Goal> {
    const res = await apiClient<{ success: boolean; goal: Goal }>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.goal;
  },

  /**
   * Update existing goal
   */
  async updateGoal(id: string, payload: Partial<CreateGoalPayload>): Promise<Goal> {
    const res = await apiClient<{ success: boolean; goal: Goal }>(`/api/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return res.goal;
  },

  /**
   * Delete goal
   */
  async deleteGoal(id: string): Promise<void> {
    await apiClient<{ success: boolean }>(`/api/goals/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Add objective to goal
   */
  async addObjective(goalId: string, payload: CreateObjectivePayload): Promise<Objective> {
    const res = await apiClient<{ success: boolean; objective: Objective }>(`/api/goals/${goalId}/objectives`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.objective;
  },

  /**
   * Add key result to objective
   */
  async addKeyResult(objectiveId: string, payload: CreateKeyResultPayload): Promise<KeyResult> {
    const res = await apiClient<{ success: boolean; keyResult: KeyResult }>(`/api/objectives/${objectiveId}/key-results`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.keyResult;
  },

  /**
   * Update key result progress
   */
  async updateKeyResultProgress(id: string, currentValue: number, note?: string): Promise<KeyResult> {
    const res = await apiClient<{ success: boolean; keyResult: KeyResult }>(`/api/key-results/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ currentValue, note })
    });
    return res.keyResult;
  },

  /**
   * Add comment to goal
   */
  async addComment(goalId: string, content: string): Promise<GoalComment[]> {
    const res = await apiClient<{ success: boolean; comments: GoalComment[] }>(`/api/goals/${goalId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return res.comments || [];
  },

  /**
   * Fetch goal summary counters & upcoming deadlines for dashboards
   */
  async getGoalSummary(): Promise<GoalSummaryData> {
    const res = await apiClient<{ success: boolean; summary: GoalSummaryData }>('/api/goals/summary');
    return res.summary;
  }
};
