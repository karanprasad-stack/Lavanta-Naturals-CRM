import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Percent,
  Wallet
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { financeService } from '../../services/financeService';
import { FinanceSummary, FinanceTrendPoint, ExpenseBreakdownResponse } from '../../types/finance';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const FinancePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeRole } = useAuth();

  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [trends, setTrends] = useState<FinanceTrendPoint[]>([]);
  const [breakdown, setBreakdown] = useState<ExpenseBreakdownResponse | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  const canAccess = activeRole === 'FOUNDER' || activeRole === 'MANAGER';

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [sumData, trendData, breakData] = await Promise.all([
        financeService.getFinanceSummary(),
        financeService.getFinanceTrends(timeRange),
        financeService.getExpenseBreakdown()
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setBreakdown(breakData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load financial intelligence', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadFinanceData();
    }
  }, [canAccess, timeRange]);

  if (!canAccess) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <AlertCircle size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          Financial Intelligence Restricted
        </h2>
        <p style={{ color: '#6B7280', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
          Access to company financial summaries, recognized revenue, and operating margin analytics is reserved for Founder and Management roles.
        </p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div style={{ padding: '5rem 0', display: 'flex', justifyContent: 'center' }}>
        <Loading size="lg" message="Synthesizing company financial overview..." />
      </div>
    );
  }

  const netDiff = summary?.netOperatingDifference || 0;
  const isPositiveMargin = netDiff >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#EDE9FE',
              color: '#6D28D9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Financial Performance & Margins
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Executive comparison of recognized customer revenue vs committed operational expenditures
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={<ShoppingBag size={16} />}
            onClick={() => navigate('/sales')}
          >
            Sales Dashboard
          </Button>
          <Button
            variant="primary"
            icon={<Receipt size={16} />}
            onClick={() => navigate('/expenses')}
          >
            Expense Claims
          </Button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Recognized Revenue */}
          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Recognized Revenue</span>
              <TrendingUp size={16} color="#16A34A" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#15803D', marginTop: '0.4rem' }}>
              ₹{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
              This month: ₹{summary.monthRevenue.toLocaleString()}
            </div>
          </div>

          {/* Committed Expenses */}
          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Committed Expenses</span>
              <Receipt size={16} color="#DC2626" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#B91C1C', marginTop: '0.4rem' }}>
              ₹{summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
              This month: ₹{summary.monthExpenses.toLocaleString()}
            </div>
          </div>

          {/* Net Operating Difference */}
          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Operating Margin / Net</span>
              {isPositiveMargin ? <ArrowUpRight size={16} color="#16A34A" /> : <ArrowDownRight size={16} color="#DC2626" />}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: isPositiveMargin ? '#15803D' : '#B91C1C', marginTop: '0.4rem' }}>
              {isPositiveMargin ? '+' : ''}₹{netDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: isPositiveMargin ? '#16A34A' : '#DC2626', marginTop: '0.25rem', fontWeight: 600 }}>
              {summary.operatingMarginPercent}% Operating Margin
            </div>
          </div>

          {/* Cash Outflow vs Pending */}
          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Cash Outflow</span>
              <Wallet size={16} color="#4F46E5" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#312E81', marginTop: '0.4rem' }}>
              ₹{summary.cashOutflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '0.25rem' }}>
              Pending review: ₹{summary.pendingExpenses.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Chart: Revenue vs Expenses */}
      <div className="luxury-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Operating Revenue vs Expense Progression
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              Realized revenue compared with approved expenditures
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem', background: '#F3F4F6', padding: '3px', borderRadius: '8px' }}>
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: timeRange === r ? '#FFFFFF' : 'transparent',
                  color: timeRange === r ? 'var(--color-primary)' : '#6B7280',
                  boxShadow: timeRange === r ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getDate()} ${d.toLocaleDateString(undefined, { month: 'short' })}`;
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `₹${Number(val).toLocaleString()}`,
                  name === 'revenue' ? 'Sales Revenue' : 'Expenses'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Legend formatter={(val) => (val === 'revenue' ? 'Recognized Revenue' : 'Committed Expenses')} />
              <Bar dataKey="revenue" fill="#15803D" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown by Category */}
      <div className="luxury-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Operational Expenditure Breakdown
            </h3>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Total: ₹{(breakdown?.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {!breakdown || breakdown.categories.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
            No committed expenses recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Proportion</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Claims Count</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Share (%)</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Total Expenditure</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.categories.map((cat) => (
                  <tr key={cat.category} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.9rem 1.5rem', fontWeight: 600, color: '#111827' }}>
                      {cat.category}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', width: '220px' }}>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(cat.percentage, 100)}%`,
                            height: '100%',
                            backgroundColor: 'var(--color-primary)',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#6B7280' }}>
                      {cat.count} claims
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#374151' }}>
                      {cat.percentage}%
                    </td>
                    <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{cat.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
