import { apiClient } from './apiClient';
import {
  Task,
  TaskCounters,
  TaskActivity,
  TaskComment,
  TaskProofOfWork,
  TaskFilterParams,
  CreateTaskPayload,
  UpdateTaskPayload,
  CompleteTaskPayload
} from '../types/task';

export const taskService = {
  /**
   * Fetch tasks with multi-filters and dynamic role-scoped counters
   */
  async getTasks(filters?: TaskFilterParams): Promise<{ tasks: Task[]; counters: TaskCounters }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== 'ALL' && val !== 'all') {
          params.append(key, val);
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<{ success: boolean; tasks: Task[]; counters: TaskCounters }>(
      `/api/tasks${query}`
    );
    return { tasks: res.tasks, counters: res.counters };
  },

  /**
   * Fetch single task details
   */
  async getTaskById(id: string): Promise<Task> {
    const res = await apiClient<{ success: boolean; task: Task }>(`/api/tasks/${id}`);
    return res.task;
  },

  /**
   * Create a new task (FOUNDER, HR, MANAGER only)
   */
  async createTask(payload: CreateTaskPayload): Promise<{ message: string; task: Task }> {
    return apiClient<{ success: boolean; message: string; task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Edit task metadata
   */
  async updateTask(id: string, payload: UpdateTaskPayload): Promise<{ message: string; task: Task }> {
    return apiClient<{ success: boolean; message: string; task: Task }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Cancel task
   */
  async cancelTask(id: string): Promise<{ message: string; task: Task }> {
    return apiClient<{ success: boolean; message: string; task: Task }>(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Transition task from TODO to IN_PROGRESS
   */
  async startTask(id: string): Promise<{ message: string; task: Task }> {
    return apiClient<{ success: boolean; message: string; task: Task }>(`/api/tasks/${id}/start`, {
      method: 'POST'
    });
  },

  /**
   * Transition task to COMPLETED with optional proof of work
   */
  async completeTask(
    id: string,
    payload?: CompleteTaskPayload
  ): Promise<{ message: string; task: Task }> {
    return apiClient<{ success: boolean; message: string; task: Task }>(
      `/api/tasks/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(payload || {})
      }
    );
  },

  /**
   * Add a collaborative comment
   */
  async addComment(
    id: string,
    message: string
  ): Promise<{ message: string; comments: TaskComment[] }> {
    return apiClient<{ success: boolean; message: string; comments: TaskComment[] }>(
      `/api/tasks/${id}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ message })
      }
    );
  },

  /**
   * Fetch activity timeline
   */
  async getTaskActivity(id: string): Promise<TaskActivity[]> {
    const res = await apiClient<{ success: boolean; activities: TaskActivity[] }>(
      `/api/tasks/${id}/activity`
    );
    return res.activities;
  },

  /**
   * Upload / attach proof of work
   */
  async uploadProofOfWork(
    id: string,
    proofData: { filename: string; fileType: string; size: number; url: string; comment?: string }
  ): Promise<TaskProofOfWork[]> {
    const res = await apiClient<{ success: boolean; message: string; proofOfWork: TaskProofOfWork[] }>(
      `/api/tasks/${id}/proof`,
      {
        method: 'POST',
        body: JSON.stringify(proofData)
      }
    );
    return res.proofOfWork;
  }
};
