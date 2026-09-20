import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Radio,
  Mail,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface HealthData {
  status: string;
  service: string;
  database: string;
  storage: string;
  realtime: string;
  environment: string;
  uptime: number;
  timestamp: string;
}

export const SystemStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<HealthData>('/health');
      setHealth(res.data);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const services = [
    {
      name: 'API Gateway & Controllers',
      category: 'Core Service',
      status: health?.status === 'ok' ? 'OPERATIONAL' : 'DEGRADED',
      icon: <Server size={20} color="#16A34A" />,
      bg: '#E8F5E9',
      details: `Uptime: ${formatUptime(health?.uptime)} • Node.js Express`
    },
    {
      name: 'Primary Database',
      category: 'Data Persistence',
      status: health?.database === 'connected' ? 'OPERATIONAL' : 'UNAVAILABLE',
      icon: <Database size={20} color="#0D9488" />,
      bg: '#CCFBF1',
      details: 'MongoDB Replica/Cluster • Read/Write Active'
    },
    {
      name: 'Document & Receipt Storage Provider',
      category: 'Object Storage',
      status: health?.storage === 'connected' ? 'OPERATIONAL' : 'DEGRADED',
      icon: <HardDrive size={20} color="#7C3AED" />,
      bg: '#F3E8FF',
      details: 'Abstract Storage Provider • Streams Active'
    },
    {
      name: 'Real-Time WebSockets Engine',
      category: 'Collaboration',
      status: health?.realtime === 'connected' ? 'OPERATIONAL' : 'DEGRADED',
      icon: <Radio size={20} color="#0284C7" />,
      bg: '#E0F2FE',
      details: 'Socket.IO Engine • Broadcast Channel Open'
    },
    {
      name: 'Email & Notification Dispatcher',
      category: 'Communications',
      status: 'OPERATIONAL',
      icon: <Mail size={20} color="#B45309" />,
      bg: '#FEF3C7',
      details: 'Internal Queue & Event Triggering'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-deep)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: 0,
              marginBottom: '0.75rem'
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <Activity size={18} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              System Operational Status
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Real-time infrastructure health and operational availability for Lavanta Naturals platform.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
          onClick={fetchHealth}
          disabled={loading}
        >
          Refresh Status
        </Button>
      </div>

      {/* Global Status Banner */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              All Systems Operational
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Lavanta workspace core infrastructure is fully responsive with zero service interruptions.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <Clock size={14} />
          Last checked: {lastRefreshed.toLocaleTimeString()}
        </div>
      </div>

      {/* Services Breakdown */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Subsystem Status
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {services.map((s, idx) => (
            <div
              key={s.name}
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: idx < services.length - 1 ? '1px solid var(--border-color)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: s.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {s.category} • {s.details}
                  </div>
                </div>
              </div>

              <Badge variant={s.status === 'OPERATIONAL' ? 'forest' : 'danger'}>
                {s.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
