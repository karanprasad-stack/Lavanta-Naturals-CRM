import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Search,
  RefreshCw,
  MessageSquare,
  Upload,
  Calendar as CalendarIcon,
  ChevronRight,
  Clipboard,
  Flag,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  activityService,
  WorkloadItem,
  ActivityItem,
  WorkSummaryData
} from '../../services/activityService';
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

export const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [summary, setSummary] = useState<WorkSummaryData | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('ALL');
  const [selectedUserId, setSelectedUserId] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER' || role === 'HR_MANAGER';

  useEffect(() => {
    if (!isManagement) {
      navigate('/my-activity', { replace: true });
      return;
    }
    loadInitialData();
  }, [role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadActivityFeed();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedActivityType, selectedUserId, dateFilter, page]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [sumRes, workloadRes] = await Promise.all([
        activityService.getWorkSummary(),
        activityService.getTeamWorkload()
      ]);
      setSummary(sumRes.summary);
      setWorkload(workloadRes);
    } catch (err) {
      console.error('[ActivityPage] Failed to load summary data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityFeed = async () => {
    try {
      // Calculate date filters
      let startDate: string | undefined;
      const now = new Date();
      if (dateFilter === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        startDate = startOfToday.toISOString();
      } else if (dateFilter === 'this_week') {
        const dayOfWeek = now.getDay();
        const diff = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
        startDate = startOfWeek.toISOString();
      }

      const feedRes = await activityService.getActivityFeed({
        page,
        limit: 25,
        search,
        activityType: selectedActivityType !== 'ALL' ? selectedActivityType : undefined,
        userId: selectedUserId !== 'ALL' ? selectedUserId : undefined,
        startDate
      });
      setActivities(feedRes.activities);
      setTotalPages(feedRes.pagination?.totalPages || 1);
    } catch (err) {
      console.error('[ActivityPage] Failed to load activity feed:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadInitialData(), loadActivityFeed()]);
    setIsRefreshing(false);
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

  const activeMembersCount = workload.filter(w => w.active > 0).length || workload.length;

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
            See what's happening across your workspace.
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

      {/* 2. Activity Summary Bar (4 High-Level Metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.85rem'
        }}
      >
        {/* Active Work */}
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
              Active Work
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284C7', marginTop: '2px', lineHeight: 1.1 }}>
              {summary?.activeTasks ?? 0}
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
              {summary?.completedToday ?? 0}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
            <CheckCircle2 size={16} />
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
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (summary?.overdueTasks ?? 0) > 0 ? '#DC2626' : 'var(--color-text-primary)', marginTop: '2px', lineHeight: 1.1 }}>
              {summary?.overdueTasks ?? 0}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
            <AlertCircle size={16} />
          </div>
        </div>

        {/* Team Members Active */}
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
              Active Members
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px', lineHeight: 1.1 }}>
              {activeMembersCount}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
            <Users size={16} />
          </div>
        </div>
      </div>

      {/* 3. Minimal Filters Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
          <Search
            size={16}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              outline: 'none',
              background: 'var(--bg-surface-elevated, #FAFBF8)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>

        {/* Activity Type Filter */}
        <select
          value={selectedActivityType}
          onChange={e => setSelectedActivityType(e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem',
            background: 'var(--bg-surface)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">Activity Type: All</option>
          <option value="TASK_STARTED">Task Started</option>
          <option value="TASK_COMPLETED">Task Completed</option>
          <option value="TASK_ASSIGNED">Task Assigned</option>
          <option value="COMMENT_ADDED">Comments</option>
          <option value="PROOF_UPLOADED">Proof Uploaded</option>
        </select>

        {/* User Filter */}
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem',
            background: 'var(--bg-surface)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">Team Member: All</option>
          {workload.map(item => (
            <option key={item.user._id} value={item.user._id}>
              {item.user.name} ({item.user.role})
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value as any)}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem',
            background: 'var(--bg-surface)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">Date: All Time</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
        </select>
      </div>

      {/* 4. Two-Column Layout: Recent Activity Timeline (Left) & Team Workload Summary (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: '1.25rem',
          alignItems: 'start'
        }}
        className="activity-layout-grid"
      >
        {/* Left Column: Recent Activity Timeline */}
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
                Recent Activity
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {activities.length} event{activities.length === 1 ? '' : 's'} logged
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '1rem 0' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ height: '48px', background: 'var(--bg-surface-elevated, #FAFBF8)', borderRadius: '6px', opacity: 0.6 }} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem'
              }}
            >
              <Clock size={28} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>No recent activity found</div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Events will appear here as team members create, update, or complete work items.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    border: '1px solid var(--border-color)',
                    transition: 'border-color 0.15s ease'
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
                      <strong>{act.actorId?.name || 'Team Member'}</strong>{' '}
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {act.message.replace(act.actorId?.name || '', '').trim()}
                      </span>
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

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 8px' }}>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Simple Team Workload Summary */}
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
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Team Workload
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Active tasks per team member
              </span>
            </div>
            <Users size={16} color="var(--color-text-muted)" />
          </div>

          {workload.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              No team members found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {workload.map(item => (
                <div
                  key={item.user._id}
                  onClick={() => navigate(`/activity/user/${item.user._id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated, #FAFBF8)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(22, 163, 74, 0.12)',
                        color: 'var(--color-primary-deep)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
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
                        item.user.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {item.user.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {item.user.designation || item.user.department || item.user.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: item.active > 0 ? 'rgba(2, 132, 199, 0.1)' : 'var(--bg-surface)',
                        color: item.active > 0 ? '#0284C7' : 'var(--color-text-muted)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {item.active} active
                    </span>
                    <ChevronRight size={14} color="var(--color-text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
