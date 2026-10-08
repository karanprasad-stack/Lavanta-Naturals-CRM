import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LavantaLogo } from '../../components/ui/LavantaLogo';

interface ModulePlaceholderProps {
  moduleName: string;
  description: string;
  category?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleName,
  description,
  category = 'Future Module'
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2.5rem',
          maxWidth: '560px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}
      >
        <LavantaLogo variant="brand-image" size="md" />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-soft-green)',
            color: 'var(--color-primary-deep)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          <Clock size={13} />
          <span>Scheduled for Next Module</span>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            {moduleName}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0.75rem 0 0' }}>
            {description}
          </p>
        </div>

        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%'
          }}
        >
          <ShieldCheck size={16} color="var(--color-primary)" />
          <span>Phase 1 Core Foundation, User Authentication & RBAC are active.</span>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: '0.5rem' }}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
