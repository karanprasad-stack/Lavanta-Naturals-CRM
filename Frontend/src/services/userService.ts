import { User, UserRole, UserStatus } from '../types';
import { apiClient } from './apiClient';

export interface UserQueryParams {
  search?: string;
  role?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface UserStats {
  total: number;
  employees: number;
  interns: number;
  hrManagers: number;
  founders: number;
  active: number;
  departments: string[];
}

export interface UsersResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  stats: UserStats;
  users: User[];
}

export interface StatsResponse {
  success: boolean;
  stats: UserStats;
  recentUsers: User[];
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: string;
  designation: string;
  joiningDate?: string;
  profilePhoto?: string;
  status?: UserStatus;
  password?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  profilePhoto?: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  role?: UserRole;
  status?: UserStatus;
}

export const userService = {
  /**
   * Fetch team members with search, multi-criteria filtering, and pagination
   */
  async getUsers(params: UserQueryParams = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.role && params.role !== 'all') searchParams.append('role', params.role);
    if (params.department && params.department !== 'all') searchParams.append('department', params.department);
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);

    const queryString = searchParams.toString();
    const endpoint = `/api/users${queryString ? `?${queryString}` : ''}`;
    return apiClient<UsersResponse>(endpoint);
  },

  /**
   * Backwards compatible getAllUsers helper
   */
  async getAllUsers(): Promise<User[]> {
    const res = await this.getUsers({ limit: 100 });
    return res.users;
  },

  /**
   * Fetch real-time aggregated team statistics & recent joiners for dashboards
   */
  async getUserStats(): Promise<StatsResponse> {
    return apiClient<StatsResponse>('/api/users/stats');
  },

  /**
   * Fetch a single employee profile by ID
   */
  async getUserById(id: string): Promise<User> {
    const res = await apiClient<{ success: boolean; user: User }>(`/api/users/${id}`);
    return res.user;
  },

  /**
   * Add a new team member
   */
  async createUser(data: CreateUserData): Promise<User> {
    const res = await apiClient<{ success: boolean; user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.user;
  },

  /**
   * Update team member details
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const res = await apiClient<{ success: boolean; user: User }>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.user;
  }
};
