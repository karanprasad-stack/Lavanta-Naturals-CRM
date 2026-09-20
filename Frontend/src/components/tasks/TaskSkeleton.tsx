import React from 'react';

export const TaskSkeleton: React.FC<{ view?: 'table' | 'kanban' | 'detail' }> = ({ view = 'table' }) => {
  if (view === 'kanban') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3, 4, 5].map(col => (
          <div
            key={col}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              minHeight: '400px'
            }}
          >
            <div style={{ width: '100px', height: '16px', background: '#EAEFE8', borderRadius: '4px' }} className="skeleton-pulse" />
            {[1, 2, 3].map(card => (
              <div
                key={card}
                style={{
                  height: '110px',
                  background: '#FAFBF8',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                className="skeleton-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (view === 'detail') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ height: '90px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} className="skeleton-pulse" />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ height: '380px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} className="skeleton-pulse" />
          <div style={{ height: '380px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} className="skeleton-pulse" />
        </div>
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ height: '48px', background: '#FAFBF8', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 1.5rem' }}>
        <div style={{ width: '40%', height: '14px', background: '#EAEFE8', borderRadius: '4px' }} className="skeleton-pulse" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-color)' }}>
        {[1, 2, 3, 4, 5, 6].map(row => (
          <div
            key={row}
            style={{
              height: '64px',
              background: '#FFFFFF',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ width: '30%', height: '16px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
            <div style={{ width: '15%', height: '16px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
            <div style={{ width: '12%', height: '16px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
            <div style={{ width: '15%', height: '16px', background: '#F1F5F0', borderRadius: '4px' }} className="skeleton-pulse" />
            <div style={{ width: '10%', height: '24px', background: '#EAEFE8', borderRadius: '12px' }} className="skeleton-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};
