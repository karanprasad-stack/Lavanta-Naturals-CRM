import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  CheckCircle2,
  Clock,
  Megaphone,
  CheckSquare,
  AlertTriangle,
  Info,
  Trash2,
  ExternalLink,
  Filter,
  MessageSquare
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
    if (filterType === 'MESSAGES') {
      return (
        notif.relatedEntityType === 'CONVERSATION' ||
        notif.relatedEntityType === 'MESSAGE' ||
        notif.type === 'DIRECT_MESSAGE' ||
        notif.type === 'MESSAGE_RECEIVED'
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
      case 'TASK_REASSIGNED':
      case 'TASK_STARTED':
      case 'TASK_COMPLETED':
      case 'TASK_STATUS_CHANGED':
        return <CheckSquare size={17} color="var(--color-primary-deep)" />;
      case 'TASK_OVERDUE':
      case 'TASK_DEADLINE_APPROACHING':
      case 'TASK_DEADLINE_CHANGED':
        return <AlertTriangle size={17} color="#D97706" />;
      case 'ANNOUNCEMENT_IMPORTANT':
        return <Megaphone size={17} color="#C62828" />;
      case 'ANNOUNCEMENT_PUBLISHED':
        return <Megaphone size={17} color="var(--color-primary-deep)" />;
      case 'DIRECT_MESSAGE':
      case 'MESSAGE_RECEIVED':
        return <MessageSquare size={17} color="var(--color-primary-deep)" />;
      default:
        return <Info size={17} color="var(--color-text-secondary)" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }

    if (notif.link) {
      navigate(notif.link);
      return;
    }

    if (notif.relatedEntityType === 'TASK' || notif.taskId) {
      const targetId = notif.relatedEntityId || notif.taskId;
      if (targetId) navigate(`/tasks/${targetId}`);
    } else if (notif.relatedEntityType === 'ANNOUNCEMENT') {
      if (notif.relatedEntityId) navigate(`/announcements/${notif.relatedEntityId}`);
    } else if (notif.relatedEntityType === 'CONVERSATION' || notif.relatedEntityType === 'MESSAGE') {
      if (notif.relatedEntityId) {
        navigate(`/chat?conversationId=${notif.relatedEntityId}`);
      } else {
        navigate('/chat');
      }
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
        className="p-3 sm:p-4 rounded-xl border flex items-start gap-3 transition-colors shadow-xs"
        style={{
          borderColor: 'var(--border-color)',
          background: notif.isRead ? 'var(--bg-surface)' : 'var(--color-primary-subtle)',
          cursor: notif.relatedEntityId || notif.taskId ? 'pointer' : 'default'
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
            background: notif.isRead ? 'var(--color-bg-subtle)' : 'var(--bg-surface)',
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
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

        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="announcement-detail-btn announcement-detail-back-btn w-full sm:w-auto justify-center"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.825rem',
            opacity: unreadCount === 0 ? 0.6 : 1,
            cursor: unreadCount === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <CheckCheck size={15} />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        className="p-2 sm:p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-xs"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'TASKS', label: 'Tasks' },
            { id: 'ANNOUNCEMENTS', label: 'Announcements' },
            { id: 'MESSAGES', label: 'Messages' },
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

        {/* Unread Only Filter Button */}
        <button
          type="button"
          onClick={() => setUnreadOnly(!unreadOnly)}
          className={`notification-unread-btn ${unreadOnly ? 'active' : ''}`}
          aria-pressed={unreadOnly}
        >
          <CheckCircle2 size={14} />
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
            background: 'var(--bg-surface)',
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
