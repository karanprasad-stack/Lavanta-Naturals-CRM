import React from 'react';
import {
  CheckSquare,
  Play,
  CheckCircle2,
  Paperclip,
  MessageSquare,
  Clock,
  UserPlus,
  AlertCircle,
  Activity
} from 'lucide-react';
import { TaskActivity } from '../../types/task';

interface TaskActivityTimelineProps {
  activities: TaskActivity[];
}

export const TaskActivityTimeline: React.FC<TaskActivityTimelineProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
      case 'TASK_ASSIGNED':
        return <UserPlus size={14} color="var(--color-primary-deep)" />;
      case 'TASK_STARTED':
        return <Play size={14} color="#6D28D9" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 size={14} color="#16A34A" />;
      case 'PROOF_UPLOADED':
      case 'FILE_UPLOADED':
        return <Paperclip size={14} color="#B45309" />;
      case 'COMMENT_ADDED':
        return <MessageSquare size={14} color="var(--color-text-secondary)" />;
      default:
        return <Activity size={14} color="var(--color-text-secondary)" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'TASK_COMPLETED':
        return '#DCFCE7';
      case 'TASK_STARTED':
        return '#EDE9FE';
      case 'PROOF_UPLOADED':
        return '#FEF3C7';
      default:
        return 'var(--color-soft-green)';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Vertical line indicator */}
      <div
        style={{
          position: 'absolute',
          left: '17px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          background: 'var(--border-color)',
          zIndex: 0
        }}
      />

      {activities.map((act, idx) => {
        const dateObj = new Date(act.createdAt);
        return (
          <div
            key={act._id || idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '0.65rem 0',
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Icon Bubble */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: getActivityBadgeColor(act.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid var(--bg-surface, #FFFFFF)'
              }}
            >
              {getActivityIcon(act.type)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, marginTop: '4px' }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-primary)', fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {act.message}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at{' '}
                {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
