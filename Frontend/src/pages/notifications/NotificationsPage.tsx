import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  Megaphone,
  CheckSquare,
  AlertTriangle,
  Info,
  Trash2,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification } from '../../services/notificationService';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Filter list
  const filteredNotifications = notifications.filter(notif => {
    if (unreadOnly && notif.isRead) return false;
    if (filterType === 'TASKS') {
      return (
        notif.relatedEntityType === 'TASK' ||
        notif.type.startsWith('TASK_') ||
        !!notif.taskId
      );
    }
    if (filterType === 'ANNOUNCEMENTS') {
      return (
        notif.relatedEntityType === 'ANNOUNCEMENT' ||
        notif.type.startsWith('ANNOUNCEMENT_')
      );
    }
    if (filterType === 'SYSTEM') {
      return (
        notif.relatedEntityType === 'SYSTEM' ||
        notif.type === 'SYSTEM'
      );
    }
    return true;
  });

  // Group notifications by: Today, Yesterday, Earlier
  const groupNotifications = (items: AppNotification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: {
      today: AppNotification[];
      yesterday: AppNotification[];
      earlier: AppNotification[];
    } = {
      today: [],
      yesterday: [],
      earlier: []
    };

    items.forEach(item => {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= today) {
        groups.today.push(item);
      } else if (itemDate >= yesterday) {
        groups.yesterday.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  };

  const grouped = groupNotifications(filteredNotifications);

  // Icon selector based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_STARTED':
      case 'TASK_COMPLETED':
      case 'TASK_STATUS_CHANGED':
        return <CheckSquare size={17} color="var(--color-primary-deep)" />;
      case 'TASK_OVERDUE':
      case 'TASK_DEADLINE_APPROACHING':
        return <AlertTriangle size={17} color="#D97706" />;
      case 'ANNOUNCEMENT_IMPORTANT':
        return <Megaphone size={17} color="#C62828" />;
      case 'ANNOUNCEMENT_PUBLISHED':
        return <Megaphone size={17} color="var(--color-primary-deep)" />;
      default:
        return <Info size={17} color="var(--color-text-secondary)" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }

    if (notif.relatedEntityType === 'TASK' || notif.taskId) {
      const targetId = notif.relatedEntityId || notif.taskId;
      if (targetId) navigate(`/tasks/${targetId}`);
    } else if (notif.relatedEntityType === 'ANNOUNCEMENT') {
      if (notif.relatedEntityId) navigate(`/announcements/${notif.relatedEntityId}`);
    }
  };

  const renderNotificationItem = (notif: AppNotification) => {
    const timeFormatted = new Date(notif.createdAt).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div
        key={notif._id}
        onClick={() => handleNotificationClick(notif)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: notif.isRead ? '#FFFFFF' : 'var(--color-primary-subtle)',
          cursor: notif.relatedEntityId || notif.taskId ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow-xs)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-primary-border)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        {/* Icon Avatar */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: notif.isRead ? 'var(--color-bg-subtle)' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          {getNotificationIcon(notif.type)}
        </div>

        {/* Message Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: notif.isRead ? 600 : 700,
                color: 'var(--color-text-primary)'
              }}
            >
              {notif.title}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
              {timeFormatted}
            </span>
          </div>

          <p
            style={{
              fontSize: '0.825rem',
              color: 'var(--color-text-secondary)',
              margin: '3px 0 6px 0',
              lineHeight: 1.45
            }}
          >
            {notif.message}
          </p>

          {/* Quick Target Link indicator */}
          {(notif.relatedEntityId || notif.taskId) && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.725rem',
                color: 'var(--color-primary-deep)',
                fontWeight: 600
              }}
            >
              <span>
                {notif.relatedEntityType === 'TASK' || notif.taskId
                  ? 'View Task Details'
                  : 'View Announcement'}
              </span>
              <ExternalLink size={11} />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {notif.isRead ? (
            <button
              onClick={() => markAsUnread(notif._id)}
              title="Mark as unread"
              style={{
                padding: '5px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                borderRadius: '4px'
              }}
            >
              <Clock size={15} />
            </button>
          ) : (
            <button
              onClick={() => markAsRead(notif._id)}
              title="Mark as read"
              style={{
                padding: '5px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                borderRadius: '4px'
              }}
            >
              <CheckCircle size={15} />
            </button>
          )}

          <button
            onClick={() => deleteNotification(notif._id)}
            title="Delete notification"
            style={{
              padding: '5px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '4px'
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--color-primary)',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.725rem',
                  fontWeight: 700
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
            Personal task reminders, announcement alerts, and company activity.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', padding: '7px 14px' }}
          >
            <CheckCheck size={15} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '0.6rem 0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'TASKS', label: 'Tasks' },
            { id: 'ANNOUNCEMENTS', label: 'Announcements' },
            { id: 'SYSTEM', label: 'System' }
          ].map(tab => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.775rem',
                  fontWeight: isActive ? 600 : 500,
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                  background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                  color: isActive ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.775rem',
            fontWeight: unreadOnly ? 600 : 500,
            border: unreadOnly ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
            background: unreadOnly ? 'var(--color-primary-subtle)' : '#FFFFFF',
            color: unreadOnly ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
            cursor: 'pointer'
          }}
        >
          <span>Unread Only</span>
        </button>
      </div>

      {/* Notifications List Grouped */}
      {filteredNotifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Today Group */}
          {grouped.today.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.6rem',
                  paddingLeft: '4px'
                }}
              >
                Today
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {grouped.today.map(renderNotificationItem)}
              </div>
            </div>
          )}

          {/* Yesterday Group */}
          {grouped.yesterday.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.6rem',
                  paddingLeft: '4px'
                }}
              >
                Yesterday
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {grouped.yesterday.map(renderNotificationItem)}
              </div>
            </div>
          )}

          {/* Earlier Group */}
          {grouped.earlier.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.6rem',
                  paddingLeft: '4px'
                }}
              >
                Earlier
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {grouped.earlier.map(renderNotificationItem)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'var(--color-primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}
          >
            <Bell size={24} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            {unreadOnly ? 'No new notifications' : "You're all caught up."}
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', maxWidth: '340px', margin: 0 }}>
            {unreadOnly
              ? 'There are no pending alerts in your inbox.'
              : 'When tasks are assigned or announcements published, they will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
};
