import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight, DollarSign, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExpenseWidgetProps {
  expenseOverview?: {
    totalExpenses?: number;
    monthExpenses?: number;
    pendingApprovals?: number;
    departmentExpenses?: number;
  };
}

export const ExpenseWidget: React.FC<ExpenseWidgetProps> = ({ expenseOverview }) => {
  const navigate = useNavigate();

  const month = expenseOverview?.monthExpenses || expenseOverview?.departmentExpenses || 0;
  const pending = expenseOverview?.pendingApprovals || 0;

  return (
    <div className="luxury-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Receipt size={18} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Operating Expenses
          </h3>
        </div>

        <button
          onClick={() => navigate('/expenses')}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>Month Expenses</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#B91C1C', marginTop: '2px' }}>
            ₹{month.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => navigate('/expenses?status=pending')}
          style={{
            background: pending > 0 ? '#FEF3C7' : '#F9FAFB',
            padding: '0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            border: pending > 0 ? '1px solid #FCD34D' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
          title="Click to review pending expense claims"
        >
          <div style={{ fontSize: '0.7rem', color: pending > 0 ? '#92400E' : '#6B7280', textTransform: 'uppercase' }}>
            Pending Review
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: pending > 0 ? '#B45309' : '#374151', marginTop: '2px' }}>
            {pending} claims
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          variant="outline"
          size="sm"
          style={{ flex: 1 }}
          onClick={() => navigate('/expenses?status=pending')}
        >
          Review Claims
        </Button>
        <Button
          variant="primary"
          size="sm"
          style={{ flex: 1 }}
          onClick={() => navigate('/expenses/new')}
        >
          + Submit Claim
        </Button>
      </div>
    </div>
  );
};
