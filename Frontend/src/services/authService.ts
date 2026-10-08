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

export interface RegisterData {
  name: string;
  mobile: string;
  email?: string;
  password: string;
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const data = await apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: identifier.trim(), email: identifier.trim(), password })
    });

    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name.trim(),
        mobile: data.mobile.trim(),
        phone: data.mobile.trim(),
        email: data.email?.trim() || undefined,
        password: data.password
      })
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
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
