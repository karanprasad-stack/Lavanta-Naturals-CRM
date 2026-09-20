import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, ChatMessage } from '../types/chat';
import { chatService } from '../services/chatService';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  totalUnreadCount: number;
  onlineUsers: Set<string>;
  typingUsers: string[]; // Names of users typing in active conversation
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  selectConversation: (id: string) => Promise<void>;
  startDirectChat: (targetUserId: string) => Promise<Conversation>;
  sendMessage: (content: string, attachments?: any[], replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingMap, setTypingMap] = useState<Map<string, Set<string>>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  const activeConversationRef = useRef<Conversation | null>(null);
  activeConversationRef.current = activeConversation;

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Fetch conversations & unread count
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [convs, unread] = await Promise.all([
        chatService.getConversations(),
        chatService.getUnreadCount()
      ]);
      setConversations(convs);
      setTotalUnreadCount(unread);

      // Auto-select first conversation if none selected
      if (!activeConversationRef.current && convs.length > 0) {
        selectConversation(convs[0]._id || convs[0].id!);
      }
    } catch (err) {
      console.error('[ChatContext] Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  // 2. Select conversation & load message history
  const selectConversation = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const conv = conversations.find(c => (c._id === conversationId || c.id === conversationId));
      if (conv) {
        setActiveConversation(conv);
      } else {
        const fetched = await chatService.getConversationById(conversationId);
        setActiveConversation(fetched);
      }

      // Join room via socket
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('join_conversation', conversationId);
      }

      // Load history
      const res = await chatService.getMessages(conversationId, { limit: 40 });
      setMessages(res.messages || []);

      // Mark read
      await chatService.markAsRead(conversationId);
      if (socket) {
        socket.emit('message_read', { conversationId });
      }

      // Update local unread state
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId || c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
      setTotalUnreadCount(prev => Math.max(0, prev - (conv?.unreadCount || 0)));
    } catch (err) {
      console.error('[ChatContext] Error selecting conversation:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 3. Start or open direct chat
  const startDirectChat = async (targetUserId: string): Promise<Conversation> => {
    const conv = await chatService.getOrCreateDirect(targetUserId);
    setConversations(prev => {
      const exists = prev.some(c => (c._id === conv._id || c.id === conv.id));
      return exists ? prev : [conv, ...prev];
    });
    await selectConversation(conv._id || conv.id!);
    return conv;
  };

  // 4. Send message
  const sendMessage = async (content: string, attachments?: any[], replyTo?: string) => {
    if (!activeConversation) return;

    const convId = activeConversation._id || activeConversation.id!;
    const socket = socketService.getSocket();

    sendTypingStop();

    if (socket && socket.connected) {
      // Send through real-time socket
      socket.emit('send_message', {
        conversationId: convId,
        content,
        attachments,
        replyTo
      });
    } else {
      // Fallback through REST API
      const msg = await chatService.sendMessage(convId, { content, attachments, replyTo });
      setMessages(prev => [...prev, msg]);
      await refreshConversations();
    }
  };

  // 5. Edit message
  const editMessage = async (messageId: string, content: string) => {
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socket.emit('edit_message', { messageId, content });
    } else {
      await chatService.editMessage(messageId, content);
      setMessages(prev =>
        prev.map(m => (m._id === messageId ? { ...m, content, isEdited: true, editedAt: new Date().toISOString() } : m))
      );
    }
  };

  // 6. Delete message
  const deleteMessage = async (messageId: string) => {
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socket.emit('delete_message', { messageId });
    } else {
      await chatService.deleteMessage(messageId);
      setMessages(prev =>
        prev.map(m => (m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted.' } : m))
      );
    }
  };

  // 7. Typing Indicator actions
  const sendTypingStart = () => {
    if (!activeConversation) return;
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('typing_start', { conversationId: activeConversation._id || activeConversation.id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 3000);
  };

  const sendTypingStop = () => {
    if (!activeConversation) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('typing_stop', { conversationId: activeConversation._id || activeConversation.id });
    }
  };

  // 8. Connect Socket.IO & Listeners Setup
  useEffect(() => {
    if (!isAuthenticated) return;

    refreshConversations();

    const socket = socketService.connect();
    const unsubStatus = socketService.onStatusChange(setConnectionStatus);

    if (!socket) return;

    // Incoming new message
    const handleNewMessage = (data: { conversationId: string; message: ChatMessage }) => {
      const activeId = activeConversationRef.current?._id || activeConversationRef.current?.id;

      if (activeId === data.conversationId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });

        // Auto mark as read if in the active conversation
        socket.emit('message_read', { conversationId: data.conversationId });
      } else {
        // Increment unread count for that conversation
        setConversations(prev =>
          prev.map(c => {
            if (c._id === data.conversationId || c.id === data.conversationId) {
              return {
                ...c,
                lastMessage: {
                  text: data.message.content,
                  senderId: typeof data.message.senderId === 'object' ? data.message.senderId._id : data.message.senderId,
                  senderName: typeof data.message.senderId === 'object' ? data.message.senderId.name : 'Team Member',
                  createdAt: data.message.createdAt
                },
                lastMessageAt: data.message.createdAt,
                unreadCount: (c.unreadCount || 0) + 1
              };
            }
            return c;
          })
        );
        setTotalUnreadCount(prev => prev + 1);
      }

      // Re-order active conversation to top
      setConversations(prev => {
        const matched = prev.find(c => (c._id === data.conversationId || c.id === data.conversationId));
        if (!matched) return prev;
        const rest = prev.filter(c => c !== matched);
        return [
          {
            ...matched,
            lastMessage: {
              text: data.message.content,
              senderId: typeof data.message.senderId === 'object' ? data.message.senderId._id : data.message.senderId,
              senderName: typeof data.message.senderId === 'object' ? data.message.senderId.name : 'Team Member',
              createdAt: data.message.createdAt
            },
            lastMessageAt: data.message.createdAt
          },
          ...rest
        ];
      });
    };

    // Conversation preview updated from another device/chat
    const handleConversationUpdated = (data: any) => {
      setConversations(prev =>
        prev.map(c => {
          if (c._id === data.conversationId || c.id === data.conversationId) {
            return {
              ...c,
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt
            };
          }
          return c;
        })
      );
    };

    // Online users list & status updates
    const handleOnlineList = (data: { userIds: string[] }) => {
      setOnlineUsers(new Set(data.userIds || []));
    };

    const handleUserOnline = (data: { userId: string }) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    // Typing status
    const handleTypingStart = (data: { conversationId: string; userId: string; userName: string }) => {
      setTypingMap(prev => {
        const next = new Map(prev);
        const users = next.get(data.conversationId) || new Set();
        users.add(data.userName);
        next.set(data.conversationId, users);
        return next;
      });
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      setTypingMap(prev => {
        const next = new Map(prev);
        next.delete(data.conversationId);
        return next;
      });
    };

    // Message edited & deleted
    const handleMessageEdited = (data: { conversationId: string; messageId: string; content: string; editedAt: string }) => {
      setMessages(prev =>
        prev.map(m => (m._id === data.messageId ? { ...m, content: data.content, isEdited: true, editedAt: data.editedAt } : m))
      );
    };

    const handleMessageDeleted = (data: { conversationId: string; messageId: string; content: string; deletedAt: string }) => {
      setMessages(prev =>
        prev.map(m => (m._id === data.messageId ? { ...m, isDeleted: true, content: data.content, deletedAt: data.deletedAt } : m))
      );
    };

    // Read receipts
    const handleReadReceipt = (data: { conversationId: string; userId: string; readAt: string }) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.conversationId === data.conversationId && !m.readBy.includes(data.userId)) {
            return { ...m, readBy: [...m.readBy, data.userId] };
          }
          return m;
        })
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('online_users_list', handleOnlineList);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_read_receipt', handleReadReceipt);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('online_users_list', handleOnlineList);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_read_receipt', handleReadReceipt);
      unsubStatus();
    };
  }, [isAuthenticated, refreshConversations]);

  // Compute active typing users
  const activeId = activeConversation?._id || activeConversation?.id || '';
  const currentTypingSet = typingMap.get(activeId);
  const activeTypingUsers = currentTypingSet ? Array.from(currentTypingSet) : [];

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        totalUnreadCount,
        onlineUsers,
        typingUsers: activeTypingUsers,
        connectionStatus,
        selectConversation,
        startDirectChat,
        sendMessage,
        editMessage,
        deleteMessage,
        sendTypingStart,
        sendTypingStop,
        refreshConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
