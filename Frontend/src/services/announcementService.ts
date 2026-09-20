import { apiClient } from './apiClient';
import {
  Announcement,
  CreateAnnouncementPayload,
  AnnouncementReadReceipts
} from '../types/announcement';

export interface GetAnnouncementsResponse {
  success: boolean;
  announcements: Announcement[];
  unreadCount: number;
  total: number;
}

export interface GetAnnouncementDetailResponse {
  success: boolean;
  announcement: Announcement;
}

export interface GetReadReceiptsResponse {
  success: boolean;
  readReceipts: AnnouncementReadReceipts;
}

export const announcementService = {
  /**
   * Fetch announcements targeted to the current user
   */
  async getAnnouncements(params?: {
    type?: string;
    priority?: string;
    unreadOnly?: boolean;
    search?: string;
    includeExpired?: boolean;
  }): Promise<GetAnnouncementsResponse> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') query.append('type', params.type);
    if (params?.priority && params.priority !== 'ALL') query.append('priority', params.priority);
    if (params?.unreadOnly) query.append('unreadOnly', 'true');
    if (params?.search) query.append('search', params.search);
    if (params?.includeExpired) query.append('includeExpired', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient<GetAnnouncementsResponse>(`/api/announcements${queryString}`);
  },

  /**
   * Fetch single announcement by ID
   */
  async getAnnouncementById(id: string): Promise<GetAnnouncementDetailResponse> {
    return apiClient<GetAnnouncementDetailResponse>(`/api/announcements/${id}`);
  },

  /**
   * Create and publish announcement
   */
  async createAnnouncement(payload: CreateAnnouncementPayload): Promise<{ success: boolean; announcement: Announcement }> {
    return apiClient<{ success: boolean; announcement: Announcement }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update announcement
   */
  async updateAnnouncement(
    id: string,
    payload: Partial<CreateAnnouncementPayload>
  ): Promise<{ success: boolean; announcement: Announcement }> {
    return apiClient<{ success: boolean; announcement: Announcement }>(`/api/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Archive / delete announcement
   */
  async deleteAnnouncement(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>(`/api/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Mark announcement as read (Idempotent)
   */
  async markAsRead(id: string): Promise<{ success: boolean; readAt: string }> {
    return apiClient<{ success: boolean; readAt: string }>(`/api/announcements/${id}/read`, {
      method: 'POST'
    });
  },

  /**
   * Get read receipts (Leadership & HR only)
   */
  async getReadReceipts(id: string): Promise<GetReadReceiptsResponse> {
    return apiClient<GetReadReceiptsResponse>(`/api/announcements/${id}/read-receipts`);
  }
};
