import { apiClient } from './apiClient';

export interface AppNotification {
  _id: string;
  recipientId: string;
  sender?: {
    _id: string;
    name: string;
    role: string;
    profilePhoto?: string;
  } | null;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string;
  relatedEntityId?: string | null;
  taskId?: string | null;
  link?: string | null;
  isRead: boolean;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(params?: {
    type?: string;
    entityType?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') query.append('type', params.type);
    if (params?.entityType && params.entityType !== 'ALL') query.append('entityType', params.entityType);
    if (params?.unreadOnly) query.append('unreadOnly', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient<{ success: boolean; notifications: AppNotification[]; unreadCount: number }>(
      `/api/notifications${queryString}`
    );
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient<{ success: boolean; unreadCount: number }>(
      '/api/notifications/unread-count'
    );
    return res.unreadCount || 0;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAsUnread(id: string): Promise<void> {
    await apiClient(`/api/notifications/${id}/unread`, { method: 'PATCH' });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient('/api/notifications/read-all', { method: 'PATCH' });
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient(`/api/notifications/${id}`, { method: 'DELETE' });
  }
};
