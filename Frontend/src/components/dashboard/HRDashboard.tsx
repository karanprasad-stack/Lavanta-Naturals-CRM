import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Activity,
  CheckSquare,
  Megaphone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { HRDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CalendarWidget } from './CalendarWidget';
import { WorkActivityWidget } from './WorkActivityWidget';
import { GoalsWidget } from './GoalsWidget';

interface HRDashboardProps {
  data: HRDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'HR').split(' ')[0];

  const getRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'FOUNDER') return <Badge variant="green" size="sm">FOUNDER</Badge>;
    if (r === 'HR' || r === 'MANAGER' || r === 'HR_MANAGER') return <Badge variant="lavender" size="sm">{r.replace('_', ' ')}</Badge>;
    if (r === 'INTERN') return <Badge variant="warning" size="sm">INTERN</Badge>;
    return <Badge variant="neutral" size="sm">EMPLOYEE</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. HR Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              People & Culture Operations
            </span>
            <Badge variant="lavender" size="sm">HR MANAGEMENT</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Good morning, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Workforce distribution, onboarding pipeline, and organizational health.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<GraduationCap size={15} />}
            onClick={() => navigate('/team?action=add&role=INTERN')}
          >
            + Add Intern
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus size={15} />}
            onClick={() => navigate('/team?action=add&role=EMPLOYEE')}
          >
            + Add Employee
          </Button>
        </div>
      </motion.div>

      {/* 2. People KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Employees */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team?role=EMPLOYEE')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Employees
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-primary-deep)', margin: '4px 0' }}>
            {data.peopleStats.totalEmployees}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>Full-time Staff</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Total Interns */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team?role=INTERN')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Interns
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <GraduationCap size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#B45309', margin: '4px 0' }}>
            {data.peopleStats.totalInterns}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
            <span>Active Cohort</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Active Members */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team?status=ACTIVE')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active on Duty
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#16A34A', margin: '4px 0' }}>
            {data.peopleStats.activeMembers}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
            <span>Active Attendance</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* New Joiners */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              New Joiners
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6D28D9' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#6D28D9', margin: '4px 0' }}>
            {data.peopleStats.newJoiners}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6D28D9', fontWeight: 600 }}>
            <span>Onboarding Pipeline</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. HR Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Team Directory Preview & HR Work Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Team Directory Preview */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem 1.75rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Team Directory Preview
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Operational staff, intern cohorts, and team status.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/team')}
                style={{ fontSize: '0.8rem' }}
              >
                Full Directory →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.teamDirectoryPreview.slice(0, 6).map(u => (
                <div
                  key={u.id}
                  onClick={() => navigate(`/team/${u.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="luxury-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={u.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={u.name}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {u.designation} • <span style={{ color: 'var(--color-primary-deep)', fontWeight: 500 }}>{u.department}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Joined {u.joiningDate}
                    </span>
                    {getRoleBadge(u.role)}
                    <ArrowRight size={14} color="var(--color-text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HR Work Overview */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem 1.75rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  HR Work Overview
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Work items and onboarding tasks assigned by HR.
                </p>
              </div>
              <Badge variant="lavender" size="sm">Phase 4 Tasks</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Assigned</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px' }}>{data.hrWorkOverview.tasksAssigned}</div>
              </div>
              <div style={{ background: 'var(--color-soft-lavender)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-lavender-dark)', textTransform: 'uppercase' }}>In Progress</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-lavender-dark)', marginTop: '2px' }}>{data.hrWorkOverview.tasksInProgress}</div>
              </div>
              <div style={{ background: 'var(--color-soft-green)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary-deep)', textTransform: 'uppercase' }}>Completed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-deep)', marginTop: '2px' }}>{data.hrWorkOverview.tasksCompleted}</div>
              </div>
              <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Overdue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '2px' }}>{data.hrWorkOverview.overdueTasks}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <span>Assign onboarding milestones and evaluate intern deliverables directly in Phase 4.</span>
              <Button variant="outline" size="sm" onClick={() => onQuickAction('assign_task')}>
                Assign Task
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HR Actions & Recent Joiners */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* HR Quick Actions */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
              HR Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Button
                variant="primary"
                size="md"
                icon={<UserPlus size={16} />}
                onClick={() => navigate('/team?action=add&role=EMPLOYEE')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                + Add Employee
              </Button>

              <Button
                variant="outline"
                size="md"
                icon={<GraduationCap size={16} />}
                onClick={() => navigate('/team?action=add&role=INTERN')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                + Add Intern
              </Button>

              <Button
                variant="outline"
                size="md"
                icon={<CheckSquare size={16} />}
                onClick={() => onQuickAction('assign_task')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Assign Task
              </Button>

              <Button
                variant="outline"
                size="md"
                icon={<Megaphone size={16} />}
                onClick={() => onQuickAction('create_announcement')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Create Announcement
              </Button>
            </div>
          </div>

          {/* Recent Joiners Spotlight */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Recent Joiners
              </h3>
              <Badge variant="lavender" size="sm">Onboarding</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recentJoiners.map(j => (
                <div
                  key={j.id}
                  onClick={() => navigate(`/team/${j.id}`)}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="luxury-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={j.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={j.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--color-text-primary)' }}>
                        {j.name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                        {j.designation}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getRoleBadge(j.role)}
                    <ArrowRight size={13} color="var(--color-text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Phase 9: Goals & OKRs Widget */}
      <GoalsWidget maxItems={4} />

      {/* Phase 8: Work Activity Monitoring Widget */}
      <WorkActivityWidget maxItems={4} />

      {/* Phase 7: Today's Calendar Widget */}
      <CalendarWidget maxItems={5} />
    </div>
  );
};
