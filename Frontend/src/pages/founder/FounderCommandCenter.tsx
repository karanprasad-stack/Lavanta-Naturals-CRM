import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  Target,
  Package,
  ShoppingBag,
  Receipt,
  DollarSign,
  TrendingUp,
  Activity,
  Megaphone,
  Plus,
  ArrowRight,
  Clock,
  Check,
  X,
  Calendar as CalendarIcon,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { founderService } from '../../services/founderService';
import { expenseService } from '../../services/expenseService';
import { FounderOverviewResponse } from '../../types/founder';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { QuickCreateModal } from '../../components/layout/QuickCreateModal';

export const FounderCommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<FounderOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Rejection modal state
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await founderService.getOverview();
      setData(res);
    } catch (err: any) {
      console.error('[FounderCommandCenter] Failed to fetch overview:', err);
      showToast(err?.message || 'Failed to load executive overview', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const firstName = currentUser?.name?.split(' ')[0] || 'Founder';
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleApproveExpense = async (expenseId: string) => {
    setProcessingAction(true);
    try {
      await expenseService.approveExpense(expenseId);
      showToast('Expense claim approved successfully', 'success');
      fetchOverview();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to approve expense', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingExpenseId || !rejectionReason.trim()) return;
    setProcessingAction(true);
    try {
      await expenseService.rejectExpense(rejectingExpenseId, rejectionReason.trim());
      showToast('Expense claim rejected', 'info');
      setRejectingExpenseId(null);
      setRejectionReason('');
      fetchOverview();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to reject expense', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '4rem 1rem' }}>
        <Loading message="Assembling executive command center..." />
      </div>
    );
  }

  const {
    companyOverview,
    workOverview,
    teamOverview,
    activeWork,
    goalsOverview,
    salesOverview,
    salesByChannel = [],
    recentOrders = [],
    recentExpenses = [],
    expenseOverview,
    financialSummary,
    announcements,
    recentActivity
  } = data;

  const taskDistData = [
    { name: 'To Do', count: workOverview.statusDistribution.TODO, color: '#94A3B8' },
    { name: 'In Progress', count: workOverview.statusDistribution.IN_PROGRESS, color: '#3B82F6' },
    { name: 'Completed', count: workOverview.statusDistribution.COMPLETED, color: '#16A34A' },
    { name: 'Overdue', count: workOverview.statusDistribution.OVERDUE, color: '#DC2626' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2.5rem' }}>
      {/* 1. Command Center Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Company Command Center
            </span>
            <Badge variant="green" size="sm">FOUNDER</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Good morning, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Everything important happening across Lavanta Naturals.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
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
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setIsQuickCreateOpen(true)}
          >
            Quick Actions
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw size={15} />}
            onClick={fetchOverview}
            title="Refresh Metrics"
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* 2. Top Executive Business Overview Cards (Clickable to canonical modules) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          {
            label: 'Total Sales',
            value: `₹${(financialSummary.recognizedRevenue || 0).toLocaleString()}`,
            url: '/sales',
            color: '#16A34A',
            bg: 'rgba(22, 163, 74, 0.14)',
            icon: <DollarSign size={16} />
          },
          {
            label: 'Total Orders',
            value: salesOverview?.totalOrders ?? companyOverview?.totalOrders ?? 0,
            url: '/orders',
            color: '#2563EB',
            bg: 'rgba(37, 99, 235, 0.14)',
            icon: <ShoppingBag size={16} />
          },
          {
            label: 'Pending Orders',
            value: companyOverview.pendingOrders ?? 0,
            url: '/orders?status=pending',
            color: '#059669',
            bg: 'rgba(5, 150, 105, 0.14)',
            icon: <Clock size={16} />
          },
          {
            label: 'Total Expenses',
            value: `₹${(financialSummary.recognizedExpenses || 0).toLocaleString()}`,
            url: '/expenses',
            color: '#EA580C',
            bg: 'rgba(234, 88, 12, 0.14)',
            icon: <Receipt size={16} />
          },
          {
            label: 'Active Tasks',
            value: companyOverview.activeTasks,
            url: '/tasks?status=active',
            color: '#7C3AED',
            bg: 'rgba(124, 58, 237, 0.14)',
            icon: <CheckSquare size={16} />
          },
          {
            label: 'Team Members',
            value: companyOverview.teamMembers,
            url: '/team',
            color: '#0D9488',
            bg: 'rgba(13, 148, 136, 0.14)',
            icon: <Users size={16} />
          }
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.url)}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.15rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {card.label}
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Work Overview: Task Status & Active Work in Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Task Status Distribution */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Work Status Distribution
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Completed Today: <strong>{workOverview.completedToday}</strong> tasks
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              View Tasks →
            </button>
          </div>

          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} tasks`, 'Count']}
                  contentStyle={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--color-text-primary)', fontSize: '0.8rem' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {taskDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Work ("Tasks In Progress") */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Tasks In Progress
              </h3>
              <Badge variant="lavender" size="sm">{activeWork.length} active</Badge>
            </div>
            <button
              onClick={() => navigate('/tasks?status=active')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              View Tasks →
            </button>
          </div>

          {activeWork.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No tasks currently in progress.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeWork.map(task => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {task.assignedTo?.name || 'Unassigned'} • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'neutral'}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Business Overview: Multi-Channel Sales & Recent Transactions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Sales Trend and Sales by Channel Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Sales & Revenue Trend */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Revenue Operations (Last 7 Days)
                </h3>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>Today: <strong>₹{salesOverview.todayRevenue.toLocaleString()}</strong></span>
                  <span>This Month: <strong>₹{salesOverview.monthRevenue.toLocaleString()}</strong></span>
                </div>
              </div>

              <button
                onClick={() => navigate('/sales-analytics')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Analytics →
              </button>
            </div>

            <div style={{ height: '170px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesOverview.salesTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="founderSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--color-text-primary)', fontSize: '0.8rem' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#founderSalesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Channel Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Sales by Sales Channel
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Commercial share across Website, Amazon, Flipkart
                </p>
              </div>
              <button
                onClick={() => navigate('/sales-analytics')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Channel Details →
              </button>
            </div>

            {salesByChannel.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No channel sales recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {salesByChannel.map((ch) => (
                  <div
                    key={ch.channel}
                    onClick={() => navigate('/sales-analytics')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                        {ch.displayName}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-deep)' }}>
                        ₹{ch.revenue.toLocaleString()} ({ch.sharePercent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(ch.sharePercent, 100)}%`,
                          height: '100%',
                          backgroundColor: (ch as any).color || 'var(--color-primary)',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders and Recent Expenses Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Recent Orders Widget */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Recent Sales Orders
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Latest multi-channel booking transactions
                </p>
              </div>
              <button
                onClick={() => navigate('/orders')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View Orders →
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No customer orders booked yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => navigate(`/orders/${ord.id}`)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                          {ord.orderNumber}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16A34A', fontWeight: 600 }}>
                          {ord.salesChannel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {ord.customerName} {ord.externalOrderId ? `• Ext: ${ord.externalOrderId}` : ''}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                        ₹{ord.total.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: ord.orderStatus === 'DELIVERED' ? '#15803D' : '#D97706', fontWeight: 600 }}>
                        {ord.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses Widget */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Recent Expenses
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Latest operational and platform costs
                </p>
              </div>
              <button
                onClick={() => navigate('/expenses')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View Expenses →
              </button>
            </div>

            {recentExpenses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No expense entries recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => navigate(`/expenses/${exp.id}`)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                          {exp.title}
                        </span>
                        {exp.salesChannel && exp.salesChannel !== 'GENERAL' && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#EA580C', fontWeight: 600 }}>
                            {exp.salesChannel}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {exp.category} • by {exp.submittedByName}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#DC2626' }}>
                        ₹{exp.amount.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: exp.status === 'PAID' ? '#15803D' : '#D97706', fontWeight: 600 }}>
                        {exp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. People & Goals: Team Breakdown & Active OKRs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Team Overview */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Team Distribution & Recent Joiners
            </h3>
            <button
              onClick={() => navigate('/team')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Directory →
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', color: 'var(--color-text-secondary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Employees: <strong>{teamOverview.employees}</strong></span>
            <span style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', color: 'var(--color-text-secondary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Interns: <strong>{teamOverview.interns}</strong></span>
            <span style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', color: 'var(--color-text-secondary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Managers: <strong>{teamOverview.managers}</strong></span>
            <span style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', color: 'var(--color-text-secondary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>HR: <strong>{teamOverview.hr}</strong></span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {teamOverview.recentJoiners.map(m => (
              <div
                key={m._id}
                onClick={() => navigate(`/team/${m._id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--color-text-primary)' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {m.role} • {m.department}
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Joined {m.joiningDate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Goals & OKRs */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Strategic Goals & OKRs
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Avg Progress: <strong>{goalsOverview.averageProgress}%</strong> • At Risk: <strong>{goalsOverview.atRisk}</strong>
              </p>
            </div>
            <button
              onClick={() => navigate('/goals')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Goals →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {goalsOverview.topActiveGoals.map(g => (
              <div
                key={g.id}
                onClick={() => navigate(`/goals/${g.id}`)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                    {g.title}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-deep)' }}>
                    {g.progress}%
                  </span>
                </div>

                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${g.progress}%`,
                      height: '100%',
                      background: g.status === 'AT_RISK' ? '#DC2626' : 'var(--color-primary)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Expenses & Financial Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Pending Expense Approvals with Quick Actions */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Pending Expense Approvals
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {expenseOverview.pendingApproval} awaiting executive review
              </p>
            </div>
            <button
              onClick={() => navigate('/expenses?status=pending')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Review Expenses →
            </button>
          </div>

          {expenseOverview.pendingApprovalsList.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              All submitted expenses have been reviewed.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {expenseOverview.pendingApprovalsList.map(exp => (
                <div
                  key={exp.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      {exp.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {exp.submittedBy?.name || 'Staff'} • ₹{exp.amount.toLocaleString()} • {exp.category}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleApproveExpense(exp.id)}
                      disabled={processingAction}
                      style={{
                        background: '#DCFCE7',
                        border: '1px solid #86EFAC',
                        color: '#15803D',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={13} />
                      Approve
                    </button>

                    <button
                      onClick={() => setRejectingExpenseId(exp.id)}
                      disabled={processingAction}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        color: '#DC2626',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <X size={13} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compact Operational Financial Summary */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Operational Financial Summary
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Recognized operations to date (internal non-audited)
              </p>
            </div>
            <button
              onClick={() => navigate('/finance')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Financials →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>Recognized Revenue</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary-deep)', marginTop: '4px' }}>
                ₹{financialSummary.recognizedRevenue.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>Committed Expenses</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FF8585', marginTop: '4px' }}>
                ₹{financialSummary.recognizedExpenses.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Net Operating Difference</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: financialSummary.netOperatingDifference >= 0 ? '#15803D' : '#DC2626', marginTop: '2px' }}>
                {financialSummary.netOperatingDifference >= 0 ? '+' : ''}₹{financialSummary.netOperatingDifference.toLocaleString()}
              </div>
            </div>

            <Badge variant={financialSummary.netOperatingDifference >= 0 ? 'forest' : 'danger'}>
              {financialSummary.netOperatingDifference >= 0 ? 'Operating Surplus' : 'Operating Deficit'}
            </Badge>
          </div>
        </div>
      </div>

      {/* 7. Company Unified Activity Timeline */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--color-primary-deep)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Company-Wide Operational Activity Timeline
            </h3>
          </div>
          <button
            onClick={() => navigate('/activity')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Activity Hub →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentActivity.map(act => (
            <div
              key={act.id}
              onClick={() => act.link && navigate(act.link)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface-elevated)',
                cursor: act.link ? 'pointer' : 'default',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover-nested)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--color-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {act.user.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {act.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    {act.entityType} • {act.user.name} ({act.user.role || 'Staff'})
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(act.timestamp || act.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Announcements Summary */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={18} color="var(--color-primary-deep)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Latest Company Announcements
            </h3>
          </div>
          <button
            onClick={() => navigate('/announcements')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            All Announcements →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {announcements.map(ann => (
            <div
              key={ann._id}
              onClick={() => navigate(`/announcements/${ann._id}`)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface-elevated)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-deep)' }}>
                  {ann.targetAudience}
                </span>
                <Badge variant={ann.priority === 'URGENT' ? 'danger' : 'neutral'} size="sm">
                  {ann.priority}
                </Badge>
              </div>

              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                {ann.title}
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Published {new Date(ann.createdAt).toLocaleDateString()} by {ann.authorId?.name || 'Workspace'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />

      {/* Rejection Reason Dialog Modal */}
      {rejectingExpenseId && (
        <div
          className="overlay-backdrop"
          onClick={() => setRejectingExpenseId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-strong)',
              padding: '1.5rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Reject Expense Claim
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Provide a clear reason explaining why this reimbursement cannot be approved.
            </p>

            <textarea
              className="input-field"
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Missing valid tax invoice or exceeds departmental limit"
              style={{ width: '100%', marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingExpenseId(null)}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || processingAction}
              >
                {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
