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
  hasMoreMessages: boolean;
  isLoadingOlderMessages: boolean;
  totalUnreadCount: number;
  onlineUsers: Set<string>;
  typingUsers: string[]; // Names of users typing in active conversation
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  markConversationAsRead: (id: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  loadOlderMessages: () => Promise<boolean>;
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
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState<boolean>(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingMap, setTypingMap] = useState<Map<string, Set<string>>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  const activeConversationRef = useRef<Conversation | null>(null);
  activeConversationRef.current = activeConversation;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionReqIdRef = useRef<number>(0);

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

      // Auto-select first conversation if in chat page and none selected
      if (!activeConversationRef.current && convs.length > 0) {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/chat')) {
          selectConversation(convs[0]._id || convs[0].id!);
        } else {
          setActiveConversation(convs[0]);
        }
      }
    } catch (err) {
      console.error('[ChatContext] Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  const refreshConversationsRef = useRef(refreshConversations);
  refreshConversationsRef.current = refreshConversations;

  // Mark conversation messages as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      const socket = socketService.getSocket();
      if (socket && socket.connected) {
        socket.emit('message_read', { conversationId });
      }

      const res = await chatService.markAsRead(conversationId);

      // Update local unread state immediately
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId || c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );

      if (typeof res?.unreadCount === 'number') {
        setTotalUnreadCount(res.unreadCount);
      } else {
        const conv = conversations.find(c => (c._id === conversationId || c.id === conversationId));
        setTotalUnreadCount(prev => Math.max(0, prev - (conv?.unreadCount || 0)));
      }
    } catch (err) {
      console.error('[ChatContext] Error marking conversation as read:', err);
    }
  }, [conversations]);

  // 2. Select conversation & load message history
  const selectConversation = async (conversationId: string) => {
    const reqId = ++selectionReqIdRef.current;
    setIsLoadingMessages(true);
    setHasMoreMessages(false);
    try {
      const conv = conversations.find(c => (c._id === conversationId || c.id === conversationId));
      if (conv) {
        setActiveConversation(conv);
      } else {
        const fetched = await chatService.getConversationById(conversationId);
        if (reqId !== selectionReqIdRef.current) return;
        setActiveConversation(fetched);
      }

      // Join room via socket
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('join_conversation', conversationId);
      }

      // Load history
      const res = await chatService.getMessages(conversationId, { limit: 40 });
      if (reqId !== selectionReqIdRef.current) return;
      setMessages(res.messages || []);
      setHasMoreMessages(Boolean(res.hasMore));

      // Mark read when opening/viewing
      await markConversationAsRead(conversationId);
    } catch (err) {
      console.error('[ChatContext] Error selecting conversation:', err);
    } finally {
      if (reqId === selectionReqIdRef.current) {
        setIsLoadingMessages(false);
      }
    }
  };

  // 2b. Load older messages (pagination)
  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    if (!activeConversation || isLoadingOlderMessages || !hasMoreMessages || messages.length === 0) {
      return false;
    }
    const convId = activeConversation._id || activeConversation.id;
    if (!convId) return false;
    const oldestMessage = messages[0];
    const oldestId = oldestMessage._id || oldestMessage.id;
    if (!oldestId) return false;

    setIsLoadingOlderMessages(true);
    try {
      const res = await chatService.getMessages(convId, { limit: 30, before: oldestId });
      if (res.messages && res.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id || m.id));
          const newOlder = res.messages.filter(m => !existingIds.has(m._id || m.id));
          return [...newOlder, ...prev];
        });
        setHasMoreMessages(Boolean(res.hasMore));
        return true;
      } else {
        setHasMoreMessages(false);
        return false;
      }
    } catch (err) {
      console.error('[ChatContext] Error loading older messages:', err);
      return false;
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [activeConversation, isLoadingOlderMessages, hasMoreMessages, messages]);

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

  // 4. Send message: persist through backend first, display immediately, prevent duplicate
  const sendMessage = async (content: string, attachments?: any[], replyTo?: string) => {
    if (!activeConversation) return;

    const convId = activeConversation._id || activeConversation.id!;
    sendTypingStop();

    // Persist message through the existing backend before treating as successfully sent
    const savedMsg = await chatService.sendMessage(convId, { content, attachments, replyTo });

    // Display immediately upon backend confirmation
    setMessages(prev => {
      if (prev.some(m => (m._id || m.id) === (savedMsg._id || savedMsg.id))) return prev;
      return [...prev, savedMsg];
    });

    // Update conversation last-message preview and bump to top
    setConversations(prev => {
      const senderObj = typeof savedMsg.senderId === 'object' && savedMsg.senderId !== null ? (savedMsg.senderId as any) : null;
      const senderName = senderObj?.name || currentUser?.name || 'You';
      const senderId = senderObj?._id || senderObj?.id || currentUser?._id || currentUser?.id;

      const matched = prev.find(c => (c._id === convId || c.id === convId));
      const rest = prev.filter(c => (c._id !== convId && c.id !== convId));
      const updatedConv: Conversation = matched
        ? {
            ...matched,
            lastMessage: {
              text: savedMsg.content,
              senderId,
              senderName,
              createdAt: savedMsg.createdAt
            },
            lastMessageAt: savedMsg.createdAt
          }
        : {
            ...activeConversation,
            lastMessage: {
              text: savedMsg.content,
              senderId,
              senderName,
              createdAt: savedMsg.createdAt
            },
            lastMessageAt: savedMsg.createdAt
          };

      return [updatedConv, ...rest];
    });
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
    if (!isAuthenticated) {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setTotalUnreadCount(0);
      return;
    }

    refreshConversations();

    const socket = socketService.connect();
    const unsubStatus = socketService.onStatusChange(setConnectionStatus);

    if (!socket) return;

    // Handle socket connect / reconnect
    const handleConnect = () => {
      setConnectionStatus('connected');
      const activeId = activeConversationRef.current?._id || activeConversationRef.current?.id;
      if (activeId) {
        socket.emit('join_conversation', activeId);
      }
      chatService.getUnreadCount().then(setTotalUnreadCount).catch(() => {});
    };

    // Incoming unread count updates
    const handleUnreadCountUpdated = (data: {
      unreadCount?: number;
      totalUnread?: number;
      conversationId?: string;
      conversationUnreadCount?: number;
      byConversation?: Record<string, number>;
    }) => {
      const count = typeof data.totalUnread === 'number' ? data.totalUnread : data.unreadCount;
      if (typeof count === 'number') {
        setTotalUnreadCount(count);
      }
      if (data.byConversation) {
        setConversations(prev =>
          prev.map(c => {
            const cid = c._id || c.id;
            if (cid && typeof data.byConversation![cid] === 'number') {
              return { ...c, unreadCount: data.byConversation![cid] };
            }
            return c;
          })
        );
      } else if (data.conversationId && typeof data.conversationUnreadCount === 'number') {
        setConversations(prev =>
          prev.map(c =>
            (c._id === data.conversationId || c.id === data.conversationId)
              ? { ...c, unreadCount: data.conversationUnreadCount! }
              : c
          )
        );
      }
    };

    // Incoming new message
    const handleNewMessage = (data: { conversationId: string; message: ChatMessage }) => {
      const activeId = activeConversationRef.current?._id || activeConversationRef.current?.id;
      const activeIdStr = activeId ? String(activeId) : '';
      const targetConvIdStr = data.conversationId ? String(data.conversationId) : '';

      const msgSender = typeof data.message.senderId === 'object' && data.message.senderId !== null
        ? (data.message.senderId as any)
        : null;
      const extractedSenderId = msgSender ? (msgSender._id || msgSender.id) : (data.message.senderId as string);
      const extractedSenderName = msgSender?.name || 'Team Member';
      const myId = currentUserRef.current?._id || currentUserRef.current?.id;
      const isFromMe = Boolean(extractedSenderId && myId && String(extractedSenderId) === String(myId));

      if (activeIdStr && targetConvIdStr && activeIdStr === targetConvIdStr) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => String(m._id || m.id) === String(data.message._id || data.message.id))) return prev;
          return [...prev, data.message];
        });

        // Mark as read in active conversation if not from me
        if (!isFromMe) {
          socket.emit('message_read', { conversationId: data.conversationId });
        }
      } else {
        // Increment unread count only if message is from another user
        if (!isFromMe) {
          setConversations(prev =>
            prev.map(c => {
              const cid = String(c._id || c.id || '');
              if (cid && cid === targetConvIdStr) {
                return {
                  ...c,
                  lastMessage: {
                    text: data.message.content,
                    senderId: extractedSenderId,
                    senderName: extractedSenderName,
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
      }

      // Re-order active conversation to top
      setConversations(prev => {
        const matched = prev.find(c => String(c._id || c.id || '') === targetConvIdStr);
        if (!matched) return prev;
        const rest = prev.filter(c => c !== matched);
        return [
          {
            ...matched,
            lastMessage: {
              text: data.message.content,
              senderId: extractedSenderId,
              senderName: extractedSenderName,
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

    socket.on('connect', handleConnect);
    socket.on('unread_count_updated', handleUnreadCountUpdated);
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
      socket.off('connect', handleConnect);
      socket.off('unread_count_updated', handleUnreadCountUpdated);
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
  }, [isAuthenticated]);

  // Compute active typing users
  const activeId = activeConversation?._id || activeConversation?.id || '';
  if (typeof window !== 'undefined') {
    (window as any).__activeConvId = activeId;
  }
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
        hasMoreMessages,
        isLoadingOlderMessages,
        totalUnreadCount,
        onlineUsers,
        typingUsers: activeTypingUsers,
        connectionStatus,
        markConversationAsRead,
        selectConversation,
        loadOlderMessages,
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
