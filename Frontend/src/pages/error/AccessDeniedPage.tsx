import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem 1rem'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <ShieldAlert size={32} />
      </div>

      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#DC2626',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}
      >
        403 Access Denied
      </span>

      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.5rem'
        }}
      >
        Restricted Workspace Resource
      </h1>

      <p
        style={{
          fontSize: '0.925rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '480px',
          lineHeight: 1.5,
          margin: '0 0 1.75rem'
        }}
      >
        You do not have administrative permissions or role clearance to access this area.
        If you believe this is an error, please contact your workspace administrator.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="outline"
          size="md"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<Home size={16} />}
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
