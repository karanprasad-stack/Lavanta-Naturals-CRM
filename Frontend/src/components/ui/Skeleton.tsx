import React from 'react';

export const Skeleton: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '', style }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--border-color)',
        opacity: 0.6,
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style
      }}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
    <Skeleton height="36px" borderRadius="var(--radius-md)" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height="48px" borderRadius="var(--radius-sm)" />
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="luxury-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <Skeleton width="40%" height="16px" />
    <Skeleton width="70%" height="32px" />
    <Skeleton width="90%" height="14px" />
  </div>
);
