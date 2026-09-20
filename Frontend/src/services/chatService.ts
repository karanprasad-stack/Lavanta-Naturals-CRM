import { apiClient } from './apiClient';
import { Conversation, ChatMessage } from '../types/chat';

export interface GetConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface GetMessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  hasMore: boolean;
}

export const chatService = {
  /**
   * Fetch all conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    const res = await apiClient<GetConversationsResponse>('/api/chat/conversations');
    return res.conversations || [];
  },

  /**
   * Get or create a direct conversation with another user
   */
  async getOrCreateDirect(targetUserId: string): Promise<Conversation> {
    const res = await apiClient<{ success: boolean; conversation: Conversation }>(
      '/api/chat/conversations/direct',
      {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      }
    );
    return res.conversation;
  },

  /**
   * Get conversation detail by ID
   */
  async getConversationById(id: string): Promise<Conversation> {
    const res = await apiClient<{ success: boolean; conversation: Conversation }>(
      `/api/chat/conversations/${id}`
    );
    return res.conversation;
  },

  /**
   * Get paginated messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string }
  ): Promise<GetMessagesResponse> {
    const query = new URLSearchParams();
    if (options?.limit) query.append('limit', options.limit.toString());
    if (options?.before) query.append('before', options.before);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient<GetMessagesResponse>(
      `/api/chat/conversations/${conversationId}/messages${queryString}`
    );
  },

  /**
   * Send a message (REST fallback)
   */
  async sendMessage(
    conversationId: string,
    payload: { content: string; messageType?: string; attachments?: any[]; replyTo?: string }
  ): Promise<ChatMessage> {
    const res = await apiClient<{ success: boolean; message: ChatMessage }>(
      `/api/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
    return res.message;
  },

  /**
   * Edit a message (Author only)
   */
  async editMessage(messageId: string, content: string): Promise<ChatMessage> {
    const res = await apiClient<{ success: boolean; message: ChatMessage }>(
      `/api/chat/messages/${messageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content })
      }
    );
    return res.message;
  },

  /**
   * Soft-delete a message (Author only)
   */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient(`/api/chat/messages/${messageId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Mark all unread messages in conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient(`/api/chat/conversations/${conversationId}/read`, {
      method: 'POST'
    });
  },

  /**
   * Get total unread chat messages for header icon badge
   */
  async getUnreadCount(): Promise<number> {
    const res = await apiClient<{ success: boolean; unreadCount: number }>('/api/chat/unread-count');
    return res.unreadCount || 0;
  }
};
