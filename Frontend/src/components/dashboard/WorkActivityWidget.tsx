import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  User,
  Users,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  activityService,
  ActiveWorkItem,
  WorkloadItem,
  ActivityItem,
  formatDuration
} from '../../services/activityService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface WorkActivityWidgetProps {
  maxItems?: number;
}

export const WorkActivityWidget: React.FC<WorkActivityWidgetProps> = ({ maxItems = 4 }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTasks, setActiveTasks] = useState<ActiveWorkItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER' || role === 'HR_MANAGER';

  useEffect(() => {
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (isManagement) {
        const [activeRes, workloadRes, summaryRes, feedRes] = await Promise.all([
          activityService.getActiveWork(),
          activityService.getTeamWorkload(),
          activityService.getWorkSummary(),
          activityService.getActivityFeed({ limit: maxItems })
        ]);
        setActiveTasks(activeRes.activeTasks);
        setWorkload(workloadRes);
        setSummary(summaryRes.summary);
        setRecentActivities(feedRes.activities);
      } else {
        const myData = await activityService.getMyActivity();
        setActiveTasks(myData.activeTasks);
        setSummary(myData.todaySummary);
        setRecentActivities(myData.recentActivities);
      }
    } catch (err) {
      console.error('[WorkActivityWidget] Failed to load activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK_STARTED':
        return <Play size={13} color="#2563EB" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 size={13} color="#16A34A" />;
      case 'PROOF_UPLOADED':
        return <CheckCircle2 size={13} color="#7C3AED" />;
      default:
        return <Activity size={13} color="#475569" />;
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Widget Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(88, 200, 58, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(88, 200, 58, 0.3)'
            }}
          >
            <Activity size={18} color="var(--color-primary-deep)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {isManagement ? 'Work Activity & Team Progress' : 'My Work Activity'}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {isManagement ? 'Tasks in progress and live workload' : "Today's work and task history"}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(isManagement ? '/activity' : '/my-activity')}
          style={{ fontSize: '0.8rem', gap: '6px' }}
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '1rem 0' }}>
          <div style={{ height: '36px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '36px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Metrics Strip */}
          {summary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '8px',
                padding: '10px 12px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  {isManagement ? 'Active Tasks' : 'In Progress'}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0284C7' }}>
                  {isManagement ? summary.activeTasks || 0 : summary.inProgress || 0}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  Done Today
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#16A34A' }}>
                  {summary.completedToday || 0}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  Overdue
                </div>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: (summary.overdueTasks || summary.overdue || 0) > 0 ? '#DC2626' : '#64748B'
                  }}
                >
                  {summary.overdueTasks || summary.overdue || 0}
                </div>
              </div>
              {isManagement && summary.dueToday !== undefined && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Due Today
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#D97706' }}>
                    {summary.dueToday || 0}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Work / In-Progress Tasks */}
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Play size={12} color="#0284C7" />
              <span>Currently Working ({activeTasks.length})</span>
            </div>

            {activeTasks.length === 0 ? (
              <div
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)'
                }}
              >
                No active work in progress right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTasks.slice(0, maxItems).map(task => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, transform 0.15s',
                      gap: '12px'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {task.title}
                        </span>
                        {task.priority === 'HIGH' && (
                          <Badge variant="warning" size="sm">
                            HIGH
                          </Badge>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {isManagement && task.assignedTo && (
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {task.assignedTo.name}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284C7' }}>
                          <Clock size={11} />
                          {formatDuration(task.durationMs)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--color-text-muted)" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Snapshot */}
          {recentActivities.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Activity size={12} color="var(--color-primary-deep)" />
                <span>Recent Work Activity</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentActivities.slice(0, 3).map(act => (
                  <div
                    key={act._id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '0.78rem',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>{getActivityIcon(act.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {act.actorId?.name || 'Team member'}
                      </span>{' '}
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {act.message.replace(act.actorId?.name || '', '').trim()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
