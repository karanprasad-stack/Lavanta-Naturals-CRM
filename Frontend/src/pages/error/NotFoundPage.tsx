import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
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
          backgroundColor: '#E8F5E9',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <Compass size={32} />
      </div>

      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--color-primary-deep)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}
      >
        404 Not Found
      </span>

      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 0.5rem'
        }}
      >
        Page Not Found
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
        The page you are looking for might have been moved, renamed, or is temporarily unavailable.
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
