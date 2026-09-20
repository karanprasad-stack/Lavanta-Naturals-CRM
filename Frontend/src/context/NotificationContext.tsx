import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, AppNotification } from '../services/notificationService';
import { getAuthToken } from '../services/apiClient';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (notif: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await notificationService.getNotifications({ limit: 40 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Fail silently if unauthenticated or network drop
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

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    // Poll unread count every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCountOnly();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCountOnly]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, isRead: true, read: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn('Could not mark notification read on backend:', err);
    }
  };

  const markAsUnread = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, isRead: false, read: false, readAt: null } : n))
    );
    setUnreadCount(prev => prev + 1);

    try {
      await notificationService.markAsUnread(id);
    } catch (err) {
      console.warn('Could not mark notification unread on backend:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, read: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Could not mark all notifications read on backend:', err);
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
        addNotification: (notif: any) => {
          const newItem: AppNotification = {
            _id: `notif-${Date.now()}`,
            recipientId: '',
            type: notif.type || 'SYSTEM',
            title: notif.title || 'Alert',
            message: notif.message || '',
            relatedEntityType: 'SYSTEM',
            isRead: false,
            read: false,
            createdAt: new Date().toISOString()
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
