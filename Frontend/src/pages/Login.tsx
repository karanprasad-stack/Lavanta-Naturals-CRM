import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Users,
  ClipboardList,
  Briefcase,
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { LavantaLogo } from '../components/ui/LavantaLogo';

type WorkspaceRole = 'FOUNDER' | 'HR' | 'MANAGER' | 'EMPLOYEE' | 'INTERN';

interface RoleOption {
  role: WorkspaceRole;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultEmail: string;
}

const WORKSPACE_ROLES: RoleOption[] = [
  {
    role: 'FOUNDER',
    label: 'Founder',
    description: 'Full company access',
    icon: Crown,
    defaultEmail: 'founder@lavantanaturals.com'
  },
  {
    role: 'HR',
    label: 'HR',
    description: 'People & HR operations',
    icon: Users,
    defaultEmail: 'hr@lavantanaturals.com'
  },
  {
    role: 'MANAGER',
    label: 'Manager',
    description: 'Team & task management',
    icon: ClipboardList,
    defaultEmail: 'manager@lavantanaturals.com'
  },
  {
    role: 'EMPLOYEE',
    label: 'Employee',
    description: 'Your work & workspace',
    icon: Briefcase,
    defaultEmail: 'employee@lavantanaturals.com'
  },
  {
    role: 'INTERN',
    label: 'Intern',
    description: 'Assigned work & workspace',
    icon: GraduationCap,
    defaultEmail: 'intern@lavantanaturals.com'
  }
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('FOUNDER');
  const [email, setEmail] = useState('founder@lavantanaturals.com');
  const [password, setPassword] = useState('Lavanta@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSelectRole = (option: RoleOption) => {
    setSelectedRole(option.role);
    setEmail(option.defaultEmail);
    setPassword('Lavanta@2026');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF' }}>
      {/* Left Brand Showcase — Lavanta Naturals Aesthetic */}
      <div
        style={{
          flex: '1',
          background: 'linear-gradient(180deg, #FAFBF8 0%, #F4F7F2 100%)',
          borderRight: '1px solid var(--border-color)',
          padding: '3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
        className="brand-showcase-panel"
      >
        <div>
          <LavantaLogo size="lg" />
        </div>

        <div style={{ maxWidth: '480px', margin: '2rem 0' }}>
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
              letterSpacing: '0.05em',
              marginBottom: '1.25rem'
            }}
          >
            Internal Operations & Workspace
          </div>

          <h1
            style={{
              fontSize: '2.15rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.25,
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}
          >
            Clean skincare rituals formulated with science and nature.
          </h1>

          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2.25rem'
            }}
          >
            Unified internal platform connecting founder strategy, team operations, deliverables, and secure workspace communications.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
              <CheckCircle2 size={16} color="var(--color-primary)" />
              <span>5 Workspace Roles</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
              <CheckCircle2 size={16} color="var(--color-primary)" />
              <span>Task Management</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
              <CheckCircle2 size={16} color="var(--color-primary)" />
              <span>Broadcast Notices</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
              <CheckCircle2 size={16} color="var(--color-primary)" />
              <span>Real-Time Team Chat</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          © 2026 Lavanta Naturals Inc. All rights reserved. Private employee workspace.
        </div>
      </div>

      {/* Right Login Experience */}
      <div
        style={{
          flex: '1.15',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem 2.5rem',
          background: '#FFFFFF'
        }}
      >
        <div style={{ width: '100%', maxWidth: '520px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
              <LavantaLogo variant="mark" size="md" />
            </div>
            <h2
              style={{
                fontSize: '1.85rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              Sign in to Lavanta
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.925rem',
                margin: '0.5rem 0 0'
              }}
            >
              Select your workspace role to continue
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                background: '#FFF5F5',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#DC2626',
                fontSize: '0.85rem',
                marginBottom: '1.5rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Selector Section — 5 Role Cards */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem'
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                Workspace Role
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
                Selected: {selectedRole}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.65rem'
              }}
            >
              {WORKSPACE_ROLES.map(option => {
                const isSelected = selectedRole === option.role;
                const IconComponent = option.icon;

                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => handleSelectRole(option)}
                    style={{
                      background: isSelected ? 'var(--color-soft-green)' : '#FFFFFF',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(105, 196, 63, 0.18)' : 'none',
                      position: 'relative'
                    }}
                    className="role-card"
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isSelected ? '#FFFFFF' : 'var(--color-bg)',
                        border: isSelected ? '1px solid rgba(105, 196, 63, 0.3)' : '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        marginBottom: '0.6rem',
                        transition: 'color 0.15s ease'
                      }}
                    >
                      <IconComponent size={20} />
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.925rem',
                        color: isSelected ? 'var(--color-primary-deep)' : 'var(--color-text-primary)',
                        marginBottom: '0.2rem'
                      }}
                    >
                      {option.label}
                    </div>

                    <div
                      style={{
                        fontSize: '0.725rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.3
                      }}
                    >
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px'
                }}
              >
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="var(--color-text-secondary)"
                  style={{ position: 'absolute', left: '12px', top: '12px' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@lavantanaturals.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#FFFFFF',
                    color: 'var(--color-text-primary)',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px'
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="var(--color-text-secondary)"
                  style={{ position: 'absolute', left: '12px', top: '12px' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#FFFFFF',
                    color: 'var(--color-text-primary)',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              isLoading={isLoading}
              icon={<ArrowRight size={16} />}
              style={{
                marginTop: '0.25rem',
                width: '100%',
                fontWeight: 600,
                fontSize: '0.95rem',
                padding: '0.75rem 1.25rem'
              }}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Security & System Architecture Footer Note */}
          <div
            style={{
              marginTop: '1.75rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)'
            }}
          >
            <ShieldCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              Role-based access is validated by server authentication. Stored database privileges determine active permissions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
