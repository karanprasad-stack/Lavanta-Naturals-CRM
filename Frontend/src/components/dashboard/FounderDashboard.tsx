import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  ShoppingBag,
  Package,
  Receipt,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Calendar as CalendarIcon,
  CheckCircle2,
  Megaphone,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { FounderDashboardData } from '../../services/dashboardService';
import { calendarService } from '../../services/calendarService';
import { AnyCalendarEntry } from '../../types/calendar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { QuickCreateModal } from '../layout/QuickCreateModal';

interface FounderDashboardProps {
  data: FounderDashboardData;
  onQuickAction?: (actionKey: string) => void;
  onRefresh?: () => void;
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({
  data,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [scheduleEvents, setScheduleEvents] = useState<AnyCalendarEntry[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  // Load compact today schedule (max 3 items)
  useEffect(() => {
    let mounted = true;
    setIsLoadingSchedule(true);
    calendarService
      .getToday()
      .then(evs => {
        if (mounted) {
          setScheduleEvents((evs || []).slice(0, 3));
        }
      })
      .catch(() => {
        if (mounted) setScheduleEvents([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingSchedule(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const firstName = (data.user?.name || 'Founder').split(' ')[0];
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Extract core metrics with safe fallbacks
  const teamMembers = data.companyOverview?.teamMembers ?? data.teamStats?.total ?? 0;
  const activeTasks = data.companyOverview?.activeTasks ?? data.workOverview?.activeTasks ?? 0;
  const overdueTasks = data.companyOverview?.overdueTasks ?? data.workOverview?.overdue ?? 0;
  const pendingOrders = data.companyOverview?.pendingOrders ?? data.salesOverview?.pendingOrders ?? 0;
  const pendingExpenses = data.companyOverview?.pendingExpenses ?? data.expenseOverview?.pendingApproval ?? 0;

  // Work distribution
  const statusDist = data.workOverview?.statusDistribution || {
    TODO: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    OVERDUE: overdueTasks
  };
  const totalTrackedTasks = (statusDist.TODO + statusDist.IN_PROGRESS + statusDist.COMPLETED + statusDist.OVERDUE) || 1;

  // 7-day sales trend
  const salesTrend = data.salesOverview?.salesTrend || [];
  const todayRevenue = data.salesOverview?.todayRevenue ?? 0;
  const monthRevenue = data.salesOverview?.monthRevenue ?? data.salesOverview?.totalRevenue ?? 0;

  // Attention required check
  const attentionItems = [
    {
      id: 'expenses',
      count: pendingExpenses,
      title: 'Pending Expense Claims',
      description: `${pendingExpenses} claim${pendingExpenses > 1 ? 's' : ''} awaiting executive review`,
      status: 'Review Required',
      badgeVariant: 'warning' as const,
      link: '/expenses?status=pending',
      buttonLabel: 'Review Claims'
    },
    {
      id: 'overdue-tasks',
      count: overdueTasks,
      title: 'Overdue Tasks',
      description: `${overdueTasks} task${overdueTasks > 1 ? 's' : ''} past target deadline`,
      status: 'Urgent',
      badgeVariant: 'danger' as const,
      link: '/tasks?status=overdue',
      buttonLabel: 'View Tasks'
    },

    {
      id: 'orders',
      count: pendingOrders,
      title: 'Pending Orders',
      description: `${pendingOrders} order${pendingOrders > 1 ? 's' : ''} awaiting processing`,
      status: 'Processing',
      badgeVariant: 'lavender' as const,
      link: '/orders?status=pending',
      buttonLabel: 'View Orders'
    }
  ].filter(item => item.count > 0);

  // Recent activity (capped at 5)
  const activities = (data.recentActivity || []).slice(0, 5);

  // Latest announcements (capped at 3)
  const announcements = (data.announcements || []).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      {/* 1. Minimal Header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Lavanta Workspace
            </span>
            <Badge variant="green" size="sm">FOUNDER</Badge>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Good morning, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '3px 0 0' }}>
            Everything important happening across Lavanta Naturals.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CalendarIcon size={14} color="var(--color-text-muted)" />
            {todayDate}
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setIsQuickCreateOpen(true)}
          >
            Quick Actions
          </Button>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={onRefresh}
              title="Refresh Dashboard"
            >
              Refresh
            </Button>
          )}
        </div>
      </motion.div>

      {/* 2. Attention Required (Primary Triage Anchor) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: attentionItems.length > 0 ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid var(--border-color)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: attentionItems.length > 0 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(22, 163, 74, 0.12)',
                color: attentionItems.length > 0 ? 'var(--color-danger, #DC2626)' : 'var(--color-primary, #16A34A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {attentionItems.length > 0 ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Attention Required
            </h2>
          </div>

          {attentionItems.length > 0 ? (
            <Badge variant="danger" size="sm">{attentionItems.length} items needing action</Badge>
          ) : (
            <Badge variant="green" size="sm">All Clear</Badge>
          )}
        </div>

        {attentionItems.length === 0 ? (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} color="var(--color-primary)" />
            <span>All company operations are running smoothly — no urgent items requiring executive attention.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {attentionItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.65rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </span>
                    <Badge variant={item.badgeVariant} size="sm">
                      {item.count}
                    </Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {item.description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  style={{ alignSelf: 'flex-start', fontSize: '0.75rem', padding: '3px 8px' }}
                  onClick={() => navigate(item.link)}
                >
                  {item.buttonLabel} →
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Key Metrics (Strictly 6 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {[
          {
            label: 'Team Members',
            value: teamMembers,
            link: '/team',
            icon: <Users size={16} />,
            color: '#16A34A',
            bg: 'rgba(22, 163, 74, 0.12)'
          },
          {
            label: 'Active Tasks',
            value: activeTasks,
            link: '/tasks?status=active',
            icon: <CheckSquare size={16} />,
            color: '#2563EB',
            bg: 'rgba(37, 99, 235, 0.12)'
          },
          {
            label: 'Overdue Tasks',
            value: overdueTasks,
            link: '/tasks?status=overdue',
            icon: <AlertTriangle size={16} />,
            color: overdueTasks > 0 ? '#DC2626' : '#94A3B8',
            bg: overdueTasks > 0 ? 'rgba(220, 38, 38, 0.14)' : 'rgba(148, 163, 184, 0.12)'
          },
          {
            label: 'Pending Orders',
            value: pendingOrders,
            link: '/orders?status=pending',
            icon: <ShoppingBag size={16} />,
            color: '#059669',
            bg: 'rgba(5, 150, 105, 0.12)'
          },

          {
            label: 'Pending Expenses',
            value: pendingExpenses,
            link: '/expenses?status=pending',
            icon: <Receipt size={16} />,
            color: pendingExpenses > 0 ? '#EA580C' : '#94A3B8',
            bg: pendingExpenses > 0 ? 'rgba(234, 88, 12, 0.14)' : 'rgba(148, 163, 184, 0.12)'
          }
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.link)}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {card.label}
              </span>
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Business Snapshot (Single Revenue Chart) & Work Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Left: Revenue Trend (Last 7 Days) */}
        <div
          className="min-w-0"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Revenue — Last 7 Days
              </h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>Today: <strong style={{ color: 'var(--color-text-primary)' }}>₹{todayRevenue.toLocaleString()}</strong></span>
                <span>•</span>
                <span>This Month: <strong style={{ color: 'var(--color-text-primary)' }}>₹{monthRevenue.toLocaleString()}</strong></span>
              </div>
            </div>

            <button
              onClick={() => navigate('/sales')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Sales Hub →
            </button>
          </div>

          <div style={{ height: '160px', width: '100%' }}>
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="founderDashSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16A34A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#founderDashSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                No recent order transactions recorded.
              </div>
            )}
          </div>
        </div>

        {/* Right: Task / Work Summary */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Work Status Distribution
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Completed Today: <strong>{data.workOverview?.completedToday || 0}</strong> tasks
                </p>
              </div>

              <button
                onClick={() => navigate('/tasks')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View Tasks →
              </button>
            </div>

            {/* Proportional visual horizontal progress bar */}
            <div
              style={{
                height: '8px',
                borderRadius: '4px',
                background: 'var(--bg-surface-elevated)',
                display: 'flex',
                overflow: 'hidden',
                margin: '1rem 0'
              }}
            >
              <div style={{ width: `${(statusDist.TODO / totalTrackedTasks) * 100}%`, background: '#94A3B8' }} title={`To Do: ${statusDist.TODO}`} />
              <div style={{ width: `${(statusDist.IN_PROGRESS / totalTrackedTasks) * 100}%`, background: '#3B82F6' }} title={`In Progress: ${statusDist.IN_PROGRESS}`} />
              <div style={{ width: `${(statusDist.COMPLETED / totalTrackedTasks) * 100}%`, background: '#16A34A' }} title={`Completed: ${statusDist.COMPLETED}`} />
              <div style={{ width: `${(statusDist.OVERDUE / totalTrackedTasks) * 100}%`, background: '#DC2626' }} title={`Overdue: ${statusDist.OVERDUE}`} />
            </div>

            {/* 4 Compact pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div
                onClick={() => navigate('/tasks?status=todo')}
                style={{ padding: '8px', borderRadius: '6px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>To Do</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>{statusDist.TODO}</div>
              </div>

              <div
                onClick={() => navigate('/tasks?status=in_progress')}
                style={{ padding: '8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.68rem', color: '#2563EB', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2563EB', marginTop: '2px' }}>{statusDist.IN_PROGRESS}</div>
              </div>

              <div
                onClick={() => navigate('/tasks?status=completed')}
                style={{ padding: '8px', borderRadius: '6px', background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#16A34A', marginTop: '2px' }}>{statusDist.COMPLETED}</div>
              </div>

              <div
                onClick={() => navigate('/tasks?status=overdue')}
                style={{ padding: '8px', borderRadius: '6px', background: statusDist.OVERDUE > 0 ? 'rgba(220, 38, 38, 0.08)' : 'var(--bg-surface-elevated)', border: statusDist.OVERDUE > 0 ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.68rem', color: statusDist.OVERDUE > 0 ? '#DC2626' : 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Overdue</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: statusDist.OVERDUE > 0 ? '#DC2626' : 'var(--color-text-primary)', marginTop: '2px' }}>{statusDist.OVERDUE}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Active assignments monitored company-wide.</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
              Manage Tasks →
            </span>
          </div>
        </div>
      </div>

      {/* 5. Recent Activity & Announcements / Schedule (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Left: Real Unified Recent Activity (Max 5 items) */}
        <div
          className="min-w-0"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Recent Activity
              </h3>
            </div>

            <button
              onClick={() => navigate('/activity')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Activity Hub →
            </button>
          </div>

          {activities.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              No recent operational events recorded yet today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {activities.map((act: any) => (
                <div
                  key={act.id}
                  onClick={() => act.link && navigate(act.link)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    cursor: act.link ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (act.link) e.currentTarget.style.backgroundColor = 'var(--bg-hover-nested, rgba(255,255,255,0.04))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(22, 163, 74, 0.14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)'
                      }}
                    >
                      {act.user?.name?.charAt(0) || 'U'}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {act.message || act.text}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        {act.entityType ? `${act.entityType} • ` : ''}
                        {act.user?.name || 'Staff'}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {act.timestamp ? (
                      act.timestamp.includes('ago')
                        ? act.timestamp
                        : new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Announcements & Today's Schedule (Stacked compact) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Announcements (Latest 2–3) */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Megaphone size={16} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Announcements
                </h3>
              </div>

              <button
                onClick={() => navigate('/announcements')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                All Announcements →
              </button>
            </div>

            {announcements.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                No active company announcements.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {announcements.map((ann: any) => (
                  <div
                    key={ann._id || ann.id}
                    onClick={() => navigate(`/announcements/${ann._id || ann.id}`)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-primary-deep)' }}>
                        {ann.targetAudience}
                      </span>
                      <Badge variant={ann.priority === 'URGENT' ? 'danger' : 'neutral'} size="sm">
                        {ann.priority || 'NORMAL'}
                      </Badge>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                      {ann.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compact Today's Schedule (2–3 events) */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarIcon size={16} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Today's Schedule
                </h3>
              </div>

              <button
                onClick={() => navigate('/calendar')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Calendar →
              </button>
            </div>

            {isLoadingSchedule ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                Loading schedule...
              </div>
            ) : scheduleEvents.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                No events or meetings scheduled for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scheduleEvents.map((ev: any) => (
                  <div
                    key={ev._id || ev.id}
                    onClick={() => navigate('/calendar')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        {ev.type || 'Event'}
                      </div>
                    </div>

                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
                      {ev.startTime || (ev.startDate ? new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </div>
  );
};
