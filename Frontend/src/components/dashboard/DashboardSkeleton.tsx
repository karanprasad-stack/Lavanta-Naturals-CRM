import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Banner Skeleton */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '50%' }}>
          <div style={{ width: '120px', height: '14px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
          <div style={{ width: '260px', height: '28px', background: '#EAEFE8', borderRadius: '6px' }} className="skeleton-pulse" />
          <div style={{ width: '380px', height: '16px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
        </div>
        <div style={{ width: '140px', height: '36px', background: '#F1F5F0', borderRadius: '6px' }} className="skeleton-pulse" />
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4].map(k => (
          <div
            key={k}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ width: '100px', height: '12px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
            <div style={{ width: '70px', height: '32px', background: '#EAEFE8', borderRadius: '6px' }} className="skeleton-pulse" />
            <div style={{ width: '120px', height: '12px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
          </div>
        ))}
      </div>

      {/* Two-Column Content Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ width: '160px', height: '20px', background: '#EAEFE8', borderRadius: '4px' }} className="skeleton-pulse" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '54px', background: '#FAFBF8', borderRadius: '6px', border: '1px solid #F1F5F0' }} className="skeleton-pulse" />
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ width: '160px', height: '20px', background: '#EAEFE8', borderRadius: '4px' }} className="skeleton-pulse" />
          <div style={{ height: '110px', background: '#FAFBF8', borderRadius: '6px', border: '1px solid #F1F5F0' }} className="skeleton-pulse" />
          <div style={{ height: '110px', background: '#FAFBF8', borderRadius: '6px', border: '1px solid #F1F5F0' }} className="skeleton-pulse" />
        </div>
      </div>
    </div>
  );
};
