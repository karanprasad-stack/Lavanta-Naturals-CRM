import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, AppNotification } from '../services/notificationService';
import { getAuthToken } from '../services/apiClient';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socketService';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (notif: Partial<AppNotification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch notifications:', err);
    }
  }, []);

  const fetchUnreadCountOnly = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Fail silently
    }
  }, []);

  // Sync on login / user change / logout
  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id;
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      setUnreadCount(0);
      currentUserIdRef.current = null;
      return;
    }

    if (currentUserIdRef.current !== userId) {
      currentUserIdRef.current = userId;
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, currentUser?.id, currentUser?._id, fetchNotifications]);

  // Real-time socket event listeners and window focus reconciler
  useEffect(() => {
    const token = getAuthToken();
    if (!token || !isAuthenticated) return;

    // Connect socket or get existing
    const socket = socketService.connect();

    const handleNewNotification = (newNotif: AppNotification) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    };

    const handleUnreadCountUpdated = (data: { unreadCount: number }) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    const handleSocketConnect = () => {
      fetchUnreadCountOnly();
    };

    if (socket) {
      socket.on('notification_created', handleNewNotification);
      socket.on('unread_count_updated', handleUnreadCountUpdated);
      socket.on('connect', handleSocketConnect);
    }

    // Reconcile on window focus (near-real-time catchup)
    const onFocus = () => {
      fetchUnreadCountOnly();
    };
    window.addEventListener('focus', onFocus);

    // Light periodic polling (every 45s) as a safety net
    const interval = setInterval(() => {
      fetchUnreadCountOnly();
    }, 45000);

    return () => {
      if (socket) {
        socket.off('notification_created', handleNewNotification);
        socket.off('unread_count_updated', handleUnreadCountUpdated);
        socket.off('connect', handleSocketConnect);
      }
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [isAuthenticated, currentUser?.id, fetchUnreadCountOnly]);

  const markAsRead = async (id: string) => {
    // Snapshot for rollback
    const prevNotifications = [...notifications];
    const prevCount = unreadCount;

    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n =>
        n._id === id
          ? { ...n, isRead: true, read: true, readAt: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn('Could not mark notification read on backend:', err);
      // Rollback on failure
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  };

  const markAsUnread = async (id: string) => {
    const prevNotifications = [...notifications];
    const prevCount = unreadCount;

    setNotifications(prev =>
      prev.map(n =>
        n._id === id
          ? { ...n, isRead: false, read: false, readAt: null }
          : n
      )
    );
    setUnreadCount(prev => prev + 1);

    try {
      await notificationService.markAsUnread(id);
    } catch (err) {
      console.warn('Could not mark notification unread on backend:', err);
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  };

  const markAllAsRead = async () => {
    const prevNotifications = [...notifications];
    const prevCount = unreadCount;

    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        isRead: true,
        read: true,
        readAt: new Date().toISOString()
      }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Could not mark all notifications read on backend:', err);
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  };

  const deleteNotification = async (id: string) => {
    const target = notifications.find(n => n._id === id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (target && !target.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.warn('Could not delete notification on backend:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
        addNotification: (notif: Partial<AppNotification>) => {
          const newItem: AppNotification = {
            _id: notif._id || `notif-${Date.now()}`,
            recipientId: notif.recipientId || '',
            sender: notif.sender || null,
            type: notif.type || 'SYSTEM',
            title: notif.title || 'Alert',
            message: notif.message || '',
            relatedEntityType: notif.relatedEntityType || 'SYSTEM',
            relatedEntityId: notif.relatedEntityId || null,
            link: notif.link || null,
            isRead: false,
            read: false,
            createdAt: notif.createdAt || new Date().toISOString()
          };
          setNotifications(prev => [newItem, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
