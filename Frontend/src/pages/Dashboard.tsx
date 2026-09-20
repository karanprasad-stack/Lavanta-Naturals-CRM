import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  dashboardService,
  DashboardResponse,
  FounderDashboardData,
  HRDashboardData,
  ManagerDashboardData,
  EmployeeDashboardData,
  InternDashboardData
} from '../services/dashboardService';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { FounderDashboard } from '../components/dashboard/FounderDashboard';
import { HRDashboard } from '../components/dashboard/HRDashboard';
import { ManagerDashboard } from '../components/dashboard/ManagerDashboard';
import { EmployeeDashboard } from '../components/dashboard/EmployeeDashboard';
import { InternDashboard } from '../components/dashboard/InternDashboard';
import { DashboardActionModal, ActionModalType } from '../components/dashboard/DashboardActionModal';
import { AnnouncementCreateDrawer } from '../components/announcements/AnnouncementCreateDrawer';
import { Button } from '../components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, activeRole } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionModalType>(null);
  const [isAnnouncementDrawerOpen, setIsAnnouncementDrawerOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDashboardData();
      setData(res);
    } catch (err: any) {
      console.error('[Dashboard] Failed to load dashboard data:', err);
      setError(err?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, activeRole]);

  const handleAction = (actionKey: string) => {
    if (actionKey === 'assign_task' || actionKey === 'view_tasks' || actionKey === 'view_my_tasks') {
      navigate('/tasks');
      return;
    }
    if (actionKey === 'create_announcement') {
      setIsAnnouncementDrawerOpen(true);
      return;
    }
    if (actionKey === 'view_announcements') {
      navigate('/announcements');
      return;
    }
    if (actionKey === 'open_chat' || actionKey === 'team_chat') {
      navigate('/chat');
      return;
    }
    setActiveAction(actionKey as ActionModalType);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '3rem 2rem',
          textAlign: 'center',
          maxWidth: '560px',
          margin: '2rem auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626'
          }}
        >
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Unable to Load Dashboard
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
            {error || 'An unexpected error occurred while loading your role-specific dashboard.'}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<RefreshCw size={15} />}
          onClick={fetchDashboard}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      {data.role === 'FOUNDER' && (
        <FounderDashboard
          data={data as FounderDashboardData}
          onQuickAction={handleAction}
        />
      )}

      {data.role === 'HR' && (
        <HRDashboard
          data={data as HRDashboardData}
          onQuickAction={handleAction}
        />
      )}

      {data.role === 'MANAGER' && (
        <ManagerDashboard
          data={data as ManagerDashboardData}
          onQuickAction={handleAction}
        />
      )}

      {data.role === 'EMPLOYEE' && (
        <EmployeeDashboard
          data={data as EmployeeDashboardData}
          onQuickAction={handleAction}
        />
      )}

      {data.role === 'INTERN' && (
        <InternDashboard
          data={data as InternDashboardData}
          onQuickAction={handleAction}
        />
      )}

      {/* Action modal for upcoming phase previews */}
      <DashboardActionModal
        action={activeAction}
        onClose={() => setActiveAction(null)}
      />

      {/* Quick create announcement drawer */}
      <AnnouncementCreateDrawer
        isOpen={isAnnouncementDrawerOpen}
        onClose={() => setIsAnnouncementDrawerOpen(false)}
        onSuccess={fetchDashboard}
      />
    </>
  );
};

export default Dashboard;
