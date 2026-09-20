import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  CheckCircle2
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
  CartesianGrid
} from 'recharts';
import { salesService } from '../../services/salesService';
import { SalesSummary, SalesTrendPoint, TopProduct } from '../../types/sales';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../context/ToastContext';

export const SalesDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [trends, setTrends] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, trendData, topProdData] = await Promise.all([
        salesService.getSalesSummary(),
        salesService.getSalesTrends(timeRange),
        salesService.getTopProducts(5)
      ]);
      setSummary(sumData);
      setTrends(trendData);
      setTopProducts(topProdData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load sales dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  if (loading && !summary) {
    return (
      <div style={{ padding: '5rem 0', display: 'flex', justifyContent: 'center' }}>
        <Loading size="lg" message="Loading real-time sales intelligence..." />
      </div>
    );
  }

  const revenue = summary?.revenue || { today: 0, thisWeek: 0, thisMonth: 0, total: 0 };
  const orders = summary?.orders || { today: 0, thisWeek: 0, thisMonth: 0, total: 0, recognized: 0 };
  const statusBreakdown = summary?.statusBreakdown || { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };

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
              backgroundColor: '#E8F5E9',
              color: '#2E7D32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Sales & Commercial Performance
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Real-time recognized revenue, order volume, Average Order Value (AOV), and top-selling Ayurvedic catalog items
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            icon={<ShoppingBag size={16} />}
            onClick={() => navigate('/orders')}
          >
            View Orders Table
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/orders/new')}
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Revenue */}
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TOTAL RECOGNIZED REVENUE</span>
            <DollarSign size={16} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.5rem' }}>
            ₹{revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>
            Confirmed, Shipped & Delivered orders
          </div>
        </div>

        {/* This Month Revenue */}
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>THIS MONTH'S SALES</span>
            <Calendar size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E3A8A', marginTop: '0.5rem' }}>
            ₹{revenue.thisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            {orders.thisMonth} orders booked this month
          </div>
        </div>

        {/* This Week / Today */}
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>THIS WEEK REVENUE</span>
            <Clock size={16} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#5B21B6', marginTop: '0.5rem' }}>
            ₹{revenue.thisWeek.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Today: ₹{revenue.today.toLocaleString()} ({orders.today} orders)
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>AVERAGE ORDER VALUE</span>
            <Award size={16} color="#D97706" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#92400E', marginTop: '0.5rem' }}>
            ₹{(summary?.averageOrderValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Across {orders.recognized} recognized fulfillments
          </div>
        </div>
      </div>

      {/* Order Status Funnel Ribbon */}
      <div className="luxury-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.75rem' }}>
          LIVE ORDER FULFILLMENT PIPELINE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: '#FEF3C7', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>Pending</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#B45309' }}>{statusBreakdown.pending}</div>
          </div>
          <div style={{ background: '#EDE9FE', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DDD6FE' }}>
            <div style={{ fontSize: '0.75rem', color: '#5B21B6', fontWeight: 600 }}>Processing</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6D28D9' }}>{statusBreakdown.processing}</div>
          </div>
          <div style={{ background: '#E0F2FE', padding: '0.75rem', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
            <div style={{ fontSize: '0.75rem', color: '#075985', fontWeight: 600 }}>Shipped</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0284C7' }}>{statusBreakdown.shipped}</div>
          </div>
          <div style={{ background: '#DCFCE7', padding: '0.75rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Delivered</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#15803D' }}>{statusBreakdown.delivered}</div>
          </div>
          <div style={{ background: '#FFE4E6', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FECDD3' }}>
            <div style={{ fontSize: '0.75rem', color: '#9F1239', fontWeight: 600 }}>Cancelled</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#BE123C' }}>{statusBreakdown.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="luxury-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Sales Revenue & Booking Velocity
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              Confirmed revenue progression over time
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

        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="salesRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Recognized Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2E7D32"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesRevGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Leaderboard */}
      <div className="luxury-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Top Selling Ayurvedic Formulations
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Ranked by Confirmed Revenue</span>
        </div>

        {topProducts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
            No sales recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Rank</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Product Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Units Sold</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Orders</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, index) => (
                  <tr key={p.productId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.9rem 1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#111827' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#6B7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.sku}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 500 }}>
                      {p.unitsSold} units
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: '#6B7280' }}>
                      {p.ordersCount}
                    </td>
                    <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{p.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
