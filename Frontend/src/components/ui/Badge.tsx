import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'forest' | 'sage' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'green' | 'lavender' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'forest',
  size = 'md',
  icon,
  className = '',
  style
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { fontSize: '0.675rem', padding: '2px 8px', borderRadius: 'var(--radius-full)' },
    md: { fontSize: '0.75rem', padding: '3px 10px', borderRadius: 'var(--radius-full)' },
    lg: { fontSize: '0.825rem', padding: '4px 12px', borderRadius: 'var(--radius-full)' }
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    green: { background: 'var(--color-soft-green)', color: 'var(--color-primary-deep)', border: '1px solid rgba(105, 196, 63, 0.3)' },
    forest: { background: 'var(--color-soft-green)', color: 'var(--color-primary-deep)', border: '1px solid rgba(105, 196, 63, 0.3)' },
    success: { background: 'var(--color-soft-green)', color: 'var(--color-primary-deep)', border: '1px solid rgba(105, 196, 63, 0.3)' },
    sage: { background: '#F4F5F2', color: 'var(--color-text-secondary)', border: '1px solid var(--border-color)' },
    neutral: { background: '#F4F5F2', color: 'var(--color-text-secondary)', border: '1px solid var(--border-color)' },
    lavender: { background: 'var(--color-soft-lavender)', color: '#7C3AED', border: '1px solid rgba(139, 92, 246, 0.25)' },
    warning: { background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' },
    danger: { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' },
    info: { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' },
    gold: { background: '#FEF9C3', color: '#CA8A04', border: '1px solid #FDE047' }
  };

  return (
    <span
      className={`lavanta-badge badge-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600,
        lineHeight: 1.2,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; type?: 'task' | 'inventory' | 'order' | 'expense' }> = ({
  status
}) => {
  const s = status.toLowerCase();

  if (s === 'completed' || s === 'approved' || s === 'delivered' || s === 'healthy' || s === 'paid' || s === 'in-stock') {
    return <Badge variant="success">{status}</Badge>;
  }
  if (s === 'in-progress' || s === 'in transit' || s === 'under review') {
    return <Badge variant="info">{status}</Badge>;
  }
  if (s === 'delayed' || s === 'low stock' || s === 'low-stock' || s === 'pending' || s === 'at-risk') {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (s === 'urgent' || s === 'rejected' || s === 'out of stock' || s === 'out-of-stock' || s === 'cancelled' || s === 'overdue') {
    return <Badge variant="danger">{status}</Badge>;
  }
  if (s === 'todo' || s === 'scheduled' || s === 'new') {
    return <Badge variant="sage">{status}</Badge>;
  }

  return <Badge variant="forest">{status}</Badge>;
};
