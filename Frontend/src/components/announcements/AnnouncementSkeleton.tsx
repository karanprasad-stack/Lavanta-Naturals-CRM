import React from 'react';

export const AnnouncementCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div
        className="skeleton-shimmer"
        style={{
          width: '100%',
          height: '140px',
          background: 'var(--color-bg-subtle)'
        }}
      />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton-shimmer" style={{ width: '60px', height: '18px', borderRadius: '4px' }} />
          <div className="skeleton-shimmer" style={{ width: '70px', height: '18px', borderRadius: '12px' }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: '85%', height: '18px', borderRadius: '4px' }} />
        <div className="skeleton-shimmer" style={{ width: '100%', height: '14px', borderRadius: '4px' }} />
        <div className="skeleton-shimmer" style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div className="skeleton-shimmer" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
          <div className="skeleton-shimmer" style={{ width: '75px', height: '24px', borderRadius: '6px' }} />
        </div>
      </div>
    </div>
  );
};

export const AnnouncementDetailSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      <div className="skeleton-shimmer" style={{ width: '120px', height: '32px', borderRadius: '6px' }} />
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        <div className="skeleton-shimmer" style={{ width: '100%', height: '260px' }} />
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton-shimmer" style={{ width: '80px', height: '22px', borderRadius: '6px' }} />
            <div className="skeleton-shimmer" style={{ width: '90px', height: '22px', borderRadius: '6px' }} />
          </div>
          <div className="skeleton-shimmer" style={{ width: '75%', height: '28px', borderRadius: '4px' }} />
          <div className="skeleton-shimmer" style={{ width: '50%', height: '16px', borderRadius: '4px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
            <div className="skeleton-shimmer" style={{ width: '100%', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer" style={{ width: '95%', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer" style={{ width: '90%', height: '14px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
