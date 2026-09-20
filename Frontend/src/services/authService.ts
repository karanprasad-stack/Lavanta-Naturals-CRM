import { apiClient, setAuthToken, removeAuthToken, getAuthToken } from './apiClient';
import { User } from '../types';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  profilePhoto?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  },

  async getMe(): Promise<User> {
    const data = await apiClient<{ success: boolean; user: User }>('/api/auth/me', {
      method: 'GET'
    });
    return data.user;
  },

  async updateProfile(updates: ProfileUpdateData): Promise<User> {
    const data = await apiClient<{ success: boolean; message: string; user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      removeAuthToken();
    }
  },

  hasToken(): boolean {
    return !!getAuthToken();
  },

  removeToken(): void {
    removeAuthToken();
  }
};
