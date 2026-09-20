import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Upload,
  Calendar as CalendarIcon,
  ChevronRight,
  User,
  X,
  Clipboard,
  ShieldCheck,
  Flag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  activityService,
  ActiveWorkItem,
  WorkloadItem,
  ActivityItem,
  WorkSummaryData,
  WeeklyWorkSummary,
  TodayWorkSummary,
  CompletionTrendPoint,
  StatusDistribution,
  formatDuration
} from '../../services/activityService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<ActiveWorkItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [summary, setSummary] = useState<WorkSummaryData | null>(null);
  const [todaySummary, setTodaySummary] = useState<TodayWorkSummary | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklyWorkSummary | null>(null);
  const [trends, setTrends] = useState<CompletionTrendPoint[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistribution | null>(null);
  const [trendRange, setTrendRange] = useState<'today' | 'week' | 'month'>('week');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedActivityType, setSelectedActivityType] = useState('ALL');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER' || role === 'HR_MANAGER';

  useEffect(() => {
    if (!isManagement) {
      navigate('/my-activity', { replace: true });
      return;
    }
    loadData();
  }, [role, trendRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadActivityFeed();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedDept, selectedRole, selectedStatus, selectedActivityType, page]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sumRes, activeRes, workloadRes, trendsRes] = await Promise.all([
        activityService.getWorkSummary(),
        activityService.getActiveWork(),
        activityService.getTeamWorkload(),
        activityService.getCompletionTrends(trendRange)
      ]);
      setSummary(sumRes.summary);
      setTodaySummary(sumRes.todaySummary);
      setWeeklySummary(sumRes.weeklySummary);
      setActiveTasks(activeRes.activeTasks);
      setWorkload(workloadRes);
      setTrends(trendsRes.trends);
      setStatusDist(trendsRes.statusDistribution);
    } catch (err) {
      console.error('[ActivityPage] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityFeed = async () => {
    try {
      const feedRes = await activityService.getActivityFeed({
        page,
        limit: 20,
        search,
        department: selectedDept,
        role: selectedRole,
        status: selectedStatus,
        activityType: selectedActivityType
      });
      setActivities(feedRes.activities);
      setTotalPages(feedRes.pagination.totalPages || 1);
    } catch (err) {
      console.error('[ActivityPage] Failed to load activity feed:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK_STARTED':
        return <Play size={14} color="#0284C7" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 size={14} color="#16A34A" />;
      case 'TASK_ASSIGNED':
      case 'TASK_CREATED':
        return <Clipboard size={14} color="#D97706" />;
      case 'COMMENT_ADDED':
        return <MessageSquare size={14} color="#8B5CF6" />;
      case 'PROOF_UPLOADED':
      case 'FILE_UPLOADED':
        return <Upload size={14} color="#059669" />;
      case 'PRIORITY_CHANGED':
        return <Flag size={14} color="#EA580C" />;
      case 'DEADLINE_CHANGED':
        return <CalendarIcon size={14} color="#6366F1" />;
      default:
        return <Activity size={14} color="#64748B" />;
    }
  };

  const maxCompletedTrend = useMemo(() => {
    if (!trends || trends.length === 0) return 5;
    return Math.max(5, ...trends.map(t => t.completed));
  }, [trends]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* 1. Header Banner */}
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
              Lavanta Workspace
            </span>
            <Badge variant="green" size="sm">OPERATIONAL MONITORING</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Work Activity & Progress
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Monitor task execution, team workload, and real-time internal workspace activity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadData();
              loadActivityFeed();
            }}
            style={{ gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFilterDrawerOpen(true)}
            style={{ gap: '6px' }}
          >
            <Filter size={14} />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem'
          }}
        >
          {/* Active Tasks */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
              borderLeft: '4px solid #0284C7'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
              Active Tasks
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {summary.activeTasks}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0284C7', marginTop: '4px', fontWeight: 500 }}>
              Currently in progress
            </div>
          </div>

          {/* Pending Tasks */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
              borderLeft: '4px solid #64748B'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
              Pending Tasks
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {summary.pendingTasks}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
              Awaiting start
            </div>
          </div>

          {/* Completed Today */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
              borderLeft: '4px solid #16A34A'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
              Completed Today
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16A34A' }}>
              {summary.completedToday}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', fontWeight: 500 }}>
              Finished within 24h
            </div>
          </div>

          {/* Overdue Tasks */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
              borderLeft: `4px solid ${summary.overdueTasks > 0 ? '#DC2626' : '#94A3B8'}`
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
              Overdue Tasks
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: summary.overdueTasks > 0 ? '#DC2626' : 'var(--color-text-primary)' }}>
              {summary.overdueTasks}
            </div>
            <div style={{ fontSize: '0.75rem', color: summary.overdueTasks > 0 ? '#DC2626' : '#64748B', marginTop: '4px', fontWeight: 500 }}>
              {summary.overdueTasks > 0 ? 'Requires attention' : 'No overdue items'}
            </div>
          </div>

          {/* Tasks Due Today */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
              borderLeft: '4px solid #D97706'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
              Tasks Due Today
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {summary.dueToday}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '4px', fontWeight: 500 }}>
              Deadlines today
            </div>
          </div>

          {/* Completed This Week */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
              borderLeft: '4px solid var(--color-primary-deep)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
              Done This Week
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-deep)' }}>
              {summary.completedThisWeek}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-deep)', marginTop: '4px', fontWeight: 500 }}>
              {weeklySummary ? `${weeklySummary.completionRate}% completion rate` : 'This week'}
            </div>
          </div>
        </div>
      )}

      {/* 3. Active Work (Currently Working) */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#E0F2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Play size={14} color="#0284C7" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Active Work
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Tasks currently marked as In Progress inside the workspace ({activeTasks.length})
              </span>
            </div>
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#FAFBF8',
              borderRadius: '8px',
              border: '1px dashed #E2E8F0'
            }}
          >
            <Clock size={28} color="#94A3B8" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              No active work right now.
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Team members will appear here as soon as they start a task.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1rem'
            }}
          >
            {activeTasks.map(task => (
              <div
                key={task._id}
                onClick={() => navigate(`/tasks/${task._id}`)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Employee Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#EDE9FE',
                        color: '#6D28D9',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      {task.assignedTo?.profilePhoto ? (
                        <img
                          src={task.assignedTo.profilePhoto}
                          alt={task.assignedTo.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        task.assignedTo?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                        {task.assignedTo?.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                        {task.assignedTo?.designation || task.department}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={task.priority === 'HIGH' ? 'warning' : 'neutral'}
                    size="sm"
                  >
                    {task.priority}
                  </Badge>
                </div>

                {/* Task Details */}
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {task.title}
                </div>

                {/* Duration & Timestamps */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284C7', fontWeight: 600 }}>
                    <Clock size={12} />
                    Active: {formatDuration(task.durationMs)}
                  </span>
                  <span>
                    Deadline: {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Team Workload Table */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--color-primary-deep)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Team Workload
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Click an employee to view detailed work history
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Employee</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Role / Dept</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Assigned</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Active</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Completed</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Overdue</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workload.map(item => (
                <tr
                  key={item.user._id}
                  onClick={() => navigate(`/activity/user/${item.user._id}`)}
                  style={{
                    borderBottom: '1px solid #F8FAFC',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#FAFBF8';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#EDE9FE',
                          color: '#6D28D9',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {item.user.profilePhoto ? (
                          <img
                            src={item.user.profilePhoto}
                            alt={item.user.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          item.user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {item.user.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          {item.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {item.user.department}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                      {item.user.role}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                    {item.assigned}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: item.active > 0 ? '#E0F2FE' : '#F1F5F9',
                        color: item.active > 0 ? '#0369A1' : '#64748B',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      {item.active}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: '#DCFCE7',
                        color: '#15803D',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      {item.completed}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: item.overdue > 0 ? '#FEE2E2' : '#F1F5F9',
                        color: item.overdue > 0 ? '#B91C1C' : '#64748B',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      {item.overdue}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/activity/user/${item.user._id}`);
                      }}
                      style={{ fontSize: '0.78rem', gap: '4px' }}
                    >
                      <span>Activity</span>
                      <ChevronRight size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Two Columns: Completion Trends (Chart) & Recent Activity Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Work Completion Trends & Status Distribution */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--color-primary-deep)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Work Completion Trends
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
              {(['today', 'week', 'month'] as const).map(rng => (
                <button
                  key={rng}
                  onClick={() => setTrendRange(rng)}
                  style={{
                    border: 'none',
                    background: trendRange === rng ? '#FFFFFF' : 'transparent',
                    color: trendRange === rng ? 'var(--color-text-primary)' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: trendRange === rng ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {rng.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Bar Chart for Daily Completion */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingBottom: '10px' }}>
              {trends.map((pt, idx) => {
                const heightPercent = Math.max(8, Math.round((pt.completed / maxCompletedTrend) * 100));
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      gap: '6px'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>
                      {pt.completed}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${heightPercent}%`,
                        background: pt.completed > 0 ? 'var(--color-primary)' : '#E2E8F0',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {pt.day.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Status Distribution */}
          {statusDist && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Overall Task Status Distribution
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
                <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>TODO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>{statusDist.TODO}</div>
                </div>
                <div style={{ padding: '8px', background: '#E0F2FE', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#0369A1', fontWeight: 600 }}>IN PROGRESS</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0284C7' }}>{statusDist.IN_PROGRESS}</div>
                </div>
                <div style={{ padding: '8px', background: '#DCFCE7', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#15803D', fontWeight: 600 }}>COMPLETED</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#16A34A' }}>{statusDist.COMPLETED}</div>
                </div>
                <div style={{ padding: '8px', background: '#FEE2E2', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#B91C1C', fontWeight: 600 }}>OVERDUE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#DC2626' }}>{statusDist.OVERDUE}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Recent Team Activity Timeline */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--color-primary-deep)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Recent Team Activity
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Real-time feed
            </span>
          </div>

          {activities.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                background: '#FAFBF8',
                borderRadius: '8px',
                border: '1px dashed #E2E8F0',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)'
              }}
            >
              No activity found matching current criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activities.slice(0, 8).map(act => (
                <div
                  key={act._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#FAFBF8',
                    borderLeft: '3px solid var(--color-primary)'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{getActivityIcon(act.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        {act.actorId?.name || 'User'}
                      </strong>{' '}
                      {act.message.replace(act.actorId?.name || '', '').trim()}
                    </div>
                    {act.taskId && (
                      <div
                        onClick={() => navigate(`/tasks/${act.taskId._id}`)}
                        style={{
                          fontSize: '0.74rem',
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
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Filter Drawer / Modal */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(23, 34, 53, 0.4)',
                backdropFilter: 'blur(2px)',
                zIndex: 100
              }}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '380px',
                background: '#FFFFFF',
                zIndex: 101,
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Filter Activity
                </h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {/* Search */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Search Keyword
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      placeholder="Task, comment, employee..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Department
                  </label>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Departments</option>
                    <option value="Operations">Operations</option>
                    <option value="Formulations">Formulations</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Roles</option>
                    <option value="EMPLOYEE">Employees</option>
                    <option value="INTERN">Interns</option>
                    <option value="MANAGER">Managers</option>
                    <option value="HR">HR</option>
                    <option value="FOUNDER">Founders</option>
                  </select>
                </div>

                {/* Activity Type */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Activity Type
                  </label>
                  <select
                    value={selectedActivityType}
                    onChange={e => setSelectedActivityType(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Activities</option>
                    <option value="TASK_STARTED">Task Started</option>
                    <option value="TASK_COMPLETED">Task Completed</option>
                    <option value="COMMENT_ADDED">Comment Added</option>
                    <option value="PROOF_UPLOADED">Proof Uploaded</option>
                    <option value="TASK_ASSIGNED">Task Assigned</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }}>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setSearch('');
                    setSelectedDept('ALL');
                    setSelectedRole('ALL');
                    setSelectedStatus('ALL');
                    setSelectedActivityType('ALL');
                  }}
                  style={{ flex: 1 }}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  style={{ flex: 1 }}
                >
                  Apply
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
