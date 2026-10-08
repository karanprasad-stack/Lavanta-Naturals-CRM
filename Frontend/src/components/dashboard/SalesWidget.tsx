import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, TrendingUp, ArrowRight, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';

interface SalesWidgetProps {
  salesOverview?: {
    totalRevenue?: number;
    monthRevenue?: number;
    pendingOrders?: number;
  };
}

export const SalesWidget: React.FC<SalesWidgetProps> = ({ salesOverview }) => {
  const navigate = useNavigate();

  const total = salesOverview?.totalRevenue || 0;
  const month = salesOverview?.monthRevenue || 0;
  const pending = salesOverview?.pendingOrders || 0;

  return (
    <div className="luxury-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#E8F5E9',
            color: '#2E7D32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingBag size={18} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Sales & Orders
          </h3>
        </div>

        <button
          onClick={() => navigate('/orders')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>Total Sales</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
            ₹{total.toLocaleString()}
          </div>
        </div>

        <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>This Month</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E3A8A', marginTop: '2px' }}>
            ₹{month.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => navigate('/orders?status=pending')}
          style={{
            background: pending > 0 ? '#FEF3C7' : '#F9FAFB',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            border: pending > 0 ? '1px solid #FCD34D' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
          title="Click to view pending orders"
        >
          <div style={{ fontSize: '0.7rem', color: pending > 0 ? '#92400E' : '#6B7280', textTransform: 'uppercase' }}>Pending</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: pending > 0 ? '#B45309' : '#374151', marginTop: '2px' }}>
            {pending}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          variant="outline"
          size="sm"
          style={{ flex: 1 }}
          onClick={() => navigate('/sales')}
        >
          Analytics
        </Button>
        <Button
          variant="primary"
          size="sm"
          style={{ flex: 1 }}
          onClick={() => navigate('/orders/new')}
        >
          + New Order
        </Button>
      </div>
    </div>
  );
};
