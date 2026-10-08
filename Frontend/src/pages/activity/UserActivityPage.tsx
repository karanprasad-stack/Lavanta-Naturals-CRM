import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  ArrowLeft,
  Activity,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Upload,
  Calendar,
  ShieldAlert,
  Clipboard
} from 'lucide-react';
import { activityService, UserActivityDetail, ActivityItem } from '../../services/activityService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const UserActivityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<UserActivityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadUserActivity(id);
    }
  }, [id]);

  const loadUserActivity = async (userId: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await activityService.getUserActivity(userId);
      setData(res);
    } catch (err: any) {
      console.error('[UserActivityPage] Error:', err);
      setErrorMessage(err.message || 'You do not have permission to view this employee\'s activity.');
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem 0' }}>
        <div style={{ height: '140px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '300px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
          maxWidth: '600px',
          margin: '2rem auto'
        }}
      >
        <ShieldAlert size={48} color="#DC2626" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Access Restricted
        </h2>
        <p style={{ margin: '8px 0 1.5rem', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
          {errorMessage || 'You are not authorized to view this team member\'s activity.'}
        </p>
        <Button variant="primary" onClick={() => navigate(-1)} style={{ margin: '0 auto' }}>
          Go Back
        </Button>
      </div>
    );
  }

  const { user, summary, activities } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          style={{ gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Activity Overview</span>
        </Button>
      </div>

      {/* 1. Profile Header */}
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
          gap: '1.25rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(22, 163, 74, 0.12)',
              color: 'var(--color-primary-deep)',
              fontWeight: 700,
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid var(--border-color)'
            }}
          >
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {user.name}
              </h1>
              <Badge variant="neutral" size="sm">{user.role}</Badge>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {user.designation || 'Team Member'} • <strong style={{ color: 'var(--color-text-primary)' }}>{user.department}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Work Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.85rem'
        }}
      >
        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Assigned</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>{summary.assigned}</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369A1', textTransform: 'uppercase' }}>In Progress</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0284C7', marginTop: '4px' }}>{summary.inProgress}</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#15803D', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16A34A', marginTop: '4px' }}>{summary.completed}</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#B91C1C', textTransform: 'uppercase' }}>Overdue</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: summary.overdue > 0 ? '#DC2626' : 'var(--color-text-primary)', marginTop: '4px' }}>{summary.overdue}</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Done This Week</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary-deep)', marginTop: '4px' }}>{summary.completedThisWeek}</div>
        </div>
      </div>

      {/* 3. Recent Work Activity Timeline */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <Activity size={16} color="var(--color-primary-deep)" />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Recent Activity Log
          </h2>
        </div>

        {activities.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem'
            }}
          >
            No recorded activity for this team member yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map(act => (
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
                <div style={{ marginTop: '3px' }}>{getActivityIcon(act.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                    {act.message}
                  </div>
                  {act.taskId && (
                    <div
                      onClick={() => navigate(`/tasks/${act.taskId._id}`)}
                      style={{
                        fontSize: '0.75rem',
                        color: '#0284C7',
                        fontWeight: 500,
                        marginTop: '3px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Task: {act.taskId.title}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  <div>{new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                  <div>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
