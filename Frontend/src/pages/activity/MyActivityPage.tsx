import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Upload,
  Calendar,
  Clipboard,
  ChevronRight,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { activityService, MyActivityData } from '../../services/activityService';
import { Button } from '../../components/ui/Button';

// Compact relative time formatter
function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const MyActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [data, setData] = useState<MyActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMyActivity();
  }, []);

  const loadMyActivity = async () => {
    try {
      setIsLoading(true);
      const res = await activityService.getMyActivity();
      setData(res);
    } catch (err) {
      console.error('[MyActivityPage] Error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMyActivity();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK_STARTED':
        return <Play size={14} color="#0284C7" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 size={14} color="#16A34A" />;
      case 'COMMENT_ADDED':
        return <MessageSquare size={14} color="#8B5CF6" />;
      case 'PROOF_UPLOADED':
        return <Upload size={14} color="#059669" />;
      case 'TASK_ASSIGNED':
      case 'TASK_CREATED':
        return <Clipboard size={14} color="#D97706" />;
      default:
        return <Activity size={14} color="#64748B" />;
    }
  };

  const { todaySummary, recentActivities } = data || {
    todaySummary: { assignedToday: 0, inProgress: 0, completed: 0, pending: 0, overdue: 0 },
    activeTasks: [],
    completedTasks: [],
    overdueTasks: [],
    recentActivities: []
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Header */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Work Activity
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            See your recent workspace actions and deliverable updates.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{ gap: '6px' }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 2. Work Summary Cards (4 High-Level Metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.85rem'
        }}
      >
        {/* In Progress */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Progress
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284C7', marginTop: '2px', lineHeight: 1.1 }}>
              {todaySummary.inProgress}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
            <Clock size={16} />
          </div>
        </div>

        {/* Completed Today */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed Today
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', marginTop: '2px', lineHeight: 1.1 }}>
              {todaySummary.completed}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
            <CheckCircle2 size={16} />
          </div>
        </div>

        {/* Pending */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending (To Do)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B45309', marginTop: '2px', lineHeight: 1.1 }}>
              {todaySummary.pending}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(180, 83, 9, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
            <Clipboard size={16} />
          </div>
        </div>

        {/* Overdue */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overdue
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: todaySummary.overdue > 0 ? '#DC2626' : 'var(--color-text-primary)', marginTop: '2px', lineHeight: 1.1 }}>
              {todaySummary.overdue}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
            <AlertCircle size={16} />
          </div>
        </div>
      </div>

      {/* 3. Recent Personal Activity Timeline */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--color-primary-deep)" />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Recent Activity Timeline
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {recentActivities.length} event{recentActivities.length === 1 ? '' : 's'} logged
          </span>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '1rem 0' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '48px', background: 'var(--bg-surface-elevated, #FAFBF8)', borderRadius: '6px', opacity: 0.6 }} />
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            <Clock size={28} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>No recent activity logged</div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Actions such as starting tasks, uploading proof of work, or commenting will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivities.map(act => (
              <div
                key={act._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface-elevated, #FAFBF8)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {getActivityIcon(act.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                    {act.message}
                  </div>
                  {act.taskId && (
                    <div
                      onClick={() => navigate(`/tasks/${act.taskId?._id}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: '#0284C7',
                        fontWeight: 500,
                        marginTop: '4px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      <span>Task: {act.taskId.title}</span>
                      <ArrowRight size={11} />
                    </div>
                  )}
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {formatRelativeTime(act.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActivityPage;
