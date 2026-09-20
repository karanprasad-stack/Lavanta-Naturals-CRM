import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Sparkles size={32} color="var(--color-sage)" />,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`luxury-card ${className}`}
      style={{
        padding: '3.5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--color-soft-sage)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.35rem',
          color: 'var(--color-primary)',
          marginBottom: '0.4rem'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          maxWidth: '380px',
          marginBottom: actionLabel ? '1.5rem' : 0
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
