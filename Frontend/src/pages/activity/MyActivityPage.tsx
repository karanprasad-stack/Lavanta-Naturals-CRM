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
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { activityService, MyActivityData, formatDuration } from '../../services/activityService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const MyActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [data, setData] = useState<MyActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'overdue'>('active');

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
        <div style={{ height: '120px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '240px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const { todaySummary, activeTasks, completedTasks, overdueTasks, recentActivities } = data || {
    todaySummary: { assignedToday: 0, inProgress: 0, completed: 0, pending: 0, overdue: 0 },
    activeTasks: [],
    completedTasks: [],
    overdueTasks: [],
    recentActivities: []
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* 1. Header */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Personal Workspace
            </span>
            <Badge variant="green" size="sm">MY WORK</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            My Activity & Work Status
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Track your tasks in progress, completed milestones, and recent workspace actions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadMyActivity}
          style={{ gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 2. Today's Work Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem'
        }}
      >
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', borderLeft: '4px solid #64748B' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Assigned Today</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>{todaySummary.assignedToday}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', borderLeft: '4px solid #0284C7' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369A1', textTransform: 'uppercase' }}>In Progress</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0284C7', marginTop: '4px' }}>{todaySummary.inProgress}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#15803D', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16A34A', marginTop: '4px' }}>{todaySummary.completed}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#B45309', textTransform: 'uppercase' }}>Pending (TODO)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>{todaySummary.pending}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', borderLeft: `4px solid ${todaySummary.overdue > 0 ? '#DC2626' : '#94A3B8'}` }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#B91C1C', textTransform: 'uppercase' }}>Overdue</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: todaySummary.overdue > 0 ? '#DC2626' : '#64748B', marginTop: '4px' }}>{todaySummary.overdue}</div>
        </div>
      </div>

      {/* 3. Task Tabs: Active Work, Completed, Overdue */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              border: 'none',
              background: activeTab === 'active' ? '#E0F2FE' : 'transparent',
              color: activeTab === 'active' ? '#0369A1' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Play size={14} />
            <span>Currently Working ({activeTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              border: 'none',
              background: activeTab === 'completed' ? '#DCFCE7' : 'transparent',
              color: activeTab === 'completed' ? '#15803D' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={14} />
            <span>Completed Tasks ({completedTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            style={{
              border: 'none',
              background: activeTab === 'overdue' ? '#FEE2E2' : 'transparent',
              color: activeTab === 'overdue' ? '#B91C1C' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertCircle size={14} />
            <span>Overdue ({overdueTasks.length})</span>
          </button>
        </div>

        {/* Tab 1: Active Work */}
        {activeTab === 'active' && (
          <div>
            {activeTasks.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '8px', color: '#64748B', fontSize: '0.85rem' }}>
                You have no tasks in progress right now. Pick a task from "My Tasks" and click "Start Task" to begin!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeTasks.map(task => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      background: '#FFFFFF',
                      transition: 'border-color 0.15s, transform 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                          {task.title}
                        </span>
                        <Badge variant={task.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                          {task.priority}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: '#0284C7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          Active duration: {formatDuration(task.durationMs)}
                        </span>
                        <span>Deadline: {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#94A3B8" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Completed Tasks */}
        {activeTab === 'completed' && (
          <div>
            {completedTasks.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '8px', color: '#64748B', fontSize: '0.85rem' }}>
                No completed tasks found in history yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedTasks.map(task => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      background: '#FFFFFF'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                          {task.title}
                        </span>
                        <Badge variant="green" size="sm">COMPLETED</Badge>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '12px' }}>
                        <span>Completed: {task.completedAt ? new Date(task.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently'}</span>
                        {task.durationMs && (
                          <span style={{ color: '#16A34A', fontWeight: 600 }}>
                            Duration: {formatDuration(task.durationMs)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#94A3B8" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Overdue Tasks */}
        {activeTab === 'overdue' && (
          <div>
            {overdueTasks.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '8px', color: '#16A34A', fontSize: '0.85rem' }}>
                Awesome! You have zero overdue tasks!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overdueTasks.map(task => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #FEE2E2',
                      cursor: 'pointer',
                      background: '#FFF5F5'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#B91C1C' }}>
                          {task.title}
                        </span>
                        <Badge variant="warning" size="sm">OVERDUE</Badge>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#B91C1C' }}>
                        Passed deadline: {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#B91C1C" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Recent Personal Activity Timeline */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <Activity size={18} color="var(--color-primary-deep)" />
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Recent Activity Log
          </h2>
        </div>

        {recentActivities.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '8px', color: '#64748B', fontSize: '0.85rem' }}>
            No recent actions logged yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivities.map(act => (
              <div
                key={act._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#FAFBF8',
                  borderLeft: '3px solid var(--color-primary)'
                }}
              >
                <div style={{ marginTop: '2px' }}>{getActivityIcon(act.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                    {act.message}
                  </div>
                  {act.taskId && (
                    <div
                      onClick={() => navigate(`/tasks/${act.taskId._id}`)}
                      style={{
                        fontSize: '0.78rem',
                        color: '#0284C7',
                        fontWeight: 500,
                        marginTop: '2px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Task: {act.taskId.title}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
