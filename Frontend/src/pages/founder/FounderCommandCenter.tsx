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
    inventoryOverview,
    salesOverview,
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
          background: '#FFFFFF',
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
              background: '#FAFBF8',
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

      {/* 2. Top Company Overview Cards (Clickable) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Team Members', value: companyOverview.teamMembers, url: '/team', color: '#16A34A', bg: '#DCFCE7', icon: <Users size={16} /> },
          { label: 'Active Tasks', value: companyOverview.activeTasks, url: '/tasks', color: '#2563EB', bg: '#DBEAFE', icon: <CheckSquare size={16} /> },
          { label: 'Overdue Tasks', value: companyOverview.overdueTasks, url: '/tasks?status=OVERDUE', color: '#DC2626', bg: '#FEE2E2', icon: <AlertTriangle size={16} /> },
          { label: 'Active Goals', value: companyOverview.activeGoals, url: '/goals', color: '#7C3AED', bg: '#F3E8FF', icon: <Target size={16} /> },
          { label: 'Low Stock', value: companyOverview.lowStock, url: '/inventory?stock=LOW', color: '#D97706', bg: '#FEF3C7', icon: <Package size={16} /> },
          { label: 'Pending Orders', value: companyOverview.pendingOrders, url: '/orders', color: '#059669', bg: '#D1FAE5', icon: <ShoppingBag size={16} /> },
          { label: 'Pending Expenses', value: companyOverview.pendingExpenses, url: '/expenses', color: '#EA580C', bg: '#FFEDD5', icon: <Receipt size={16} /> }
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.url)}
            style={{
              background: '#FFFFFF',
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
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
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
            background: '#FFFFFF',
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
                  contentStyle={{ backgroundColor: '#FAFBF8', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.8rem' }}
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
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Tasks In Progress
            </h3>
            <Badge variant="lavender" size="sm">{activeWork.length} active</Badge>
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
                    background: '#FAFBF8',
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

      {/* 4. Business Overview: Sales & Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Sales & Revenue Trend */}
        <div
          style={{
            background: '#FFFFFF',
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
              onClick={() => navigate('/sales')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Sales Hub →
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
                  contentStyle={{ backgroundColor: '#FAFBF8', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.8rem' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#founderSalesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Low Stock Watchlist
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Total Products: {inventoryOverview.totalProducts} • Out of Stock: {inventoryOverview.outOfStock}
              </p>
            </div>

            <button
              onClick={() => navigate('/inventory')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Inventory →
            </button>
          </div>

          {inventoryOverview.lowStockProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#16A34A', fontSize: '0.85rem' }}>
              All product stocks healthy and above thresholds!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {inventoryOverview.lowStockProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#FAFBF8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      SKU: {p.sku} • Threshold: {p.threshold}
                    </div>
                  </div>

                  <Badge variant={p.stockQuantity === 0 ? 'danger' : 'warning'}>
                    {p.stockQuantity} Left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. People & Goals: Team Breakdown & Active OKRs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Team Overview */}
        <div
          style={{
            background: '#FFFFFF',
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
            <span style={{ fontSize: '0.8rem', background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>Employees: <strong>{teamOverview.employees}</strong></span>
            <span style={{ fontSize: '0.8rem', background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>Interns: <strong>{teamOverview.interns}</strong></span>
            <span style={{ fontSize: '0.8rem', background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>Managers: <strong>{teamOverview.managers}</strong></span>
            <span style={{ fontSize: '0.8rem', background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>HR: <strong>{teamOverview.hr}</strong></span>
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
                  background: '#FAFBF8',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
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
            background: '#FFFFFF',
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
                  background: '#FAFBF8',
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
            background: '#FFFFFF',
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
              onClick={() => navigate('/expenses')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Expenses Ledger →
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
                    background: '#FAFBF8',
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
            background: '#FFFFFF',
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
            <div style={{ padding: '12px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>Recognized Revenue</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#15803D', marginTop: '4px' }}>
                ₹{financialSummary.recognizedRevenue.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>Committed Expenses</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#B91C1C', marginTop: '4px' }}>
                ₹{financialSummary.recognizedExpenses.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: '#FAFBF8', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          background: '#FFFFFF',
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
                background: '#FAFBF8',
                cursor: act.link ? 'pointer' : 'default',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F7F2')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FAFBF8')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
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
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Announcements Summary */}
      <div
        style={{
          background: '#FFFFFF',
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
                background: '#FAFBF8',
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
              background: '#FFFFFF',
              borderRadius: '12px',
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
