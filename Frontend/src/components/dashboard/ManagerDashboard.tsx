import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CheckSquare,
  Megaphone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Activity,
  Briefcase,
  Layers,
  Calendar,
  Clock
} from 'lucide-react';
import { ManagerDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CalendarWidget } from './CalendarWidget';
import { WorkActivityWidget } from './WorkActivityWidget';
import { GoalsWidget } from './GoalsWidget';
import { SalesWidget } from './SalesWidget';
import { ExpenseWidget } from './ExpenseWidget';

interface ManagerDashboardProps {
  data: ManagerDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'Manager').split(' ')[0];
  const dept = data.user?.department || 'Operations';

  const getRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'FOUNDER') return <Badge variant="green" size="sm">FOUNDER</Badge>;
    if (r === 'HR' || r === 'MANAGER' || r === 'HR_MANAGER') return <Badge variant="lavender" size="sm">{r.replace('_', ' ')}</Badge>;
    if (r === 'INTERN') return <Badge variant="warning" size="sm">INTERN</Badge>;
    return <Badge variant="neutral" size="sm">EMPLOYEE</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Manager Welcome Banner */}
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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Department Management • {dept}
            </span>
            <Badge variant="lavender" size="sm">MANAGER</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Good morning, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Team operations, deliverables, and member workload for {dept}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<Users size={15} />}
            onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}`)}
          >
            Department Team
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckSquare size={15} />}
            onClick={() => onQuickAction('assign_task')}
          >
            Assign Task
          </Button>
        </div>
      </motion.div>

      {/* 2. Department Team KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Team Members */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}`)}
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
              Team Members
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.teamStats.teamMembers}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>In {dept}</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Department Employees */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}&role=EMPLOYEE`)}
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
            {data.teamStats.employees}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>Full-time Staff</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Department Interns */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}&role=INTERN`)}
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
            {data.teamStats.interns}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
            <span>Department Interns</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Active on Duty */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}&status=ACTIVE`)}
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
            {data.teamStats.activeMembers}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
            <span>Team Attendance</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. Main Manager Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Team Task Overview & Managed Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Team Task Overview */}
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
                  Team Task Overview
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Current sprint deliverables and task progress for {dept}.
                </p>
              </div>
              <Badge variant="green" size="sm">Phase 4 Tasks</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Assigned</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px' }}>{data.teamTaskOverview.assigned}</div>
              </div>
              <div style={{ background: 'var(--color-soft-green)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary-deep)', textTransform: 'uppercase' }}>In Progress</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-deep)', marginTop: '2px' }}>{data.teamTaskOverview.inProgress}</div>
              </div>
              <div style={{ background: 'var(--color-soft-green)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary-deep)', textTransform: 'uppercase' }}>Completed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-deep)', marginTop: '2px' }}>{data.teamTaskOverview.completed}</div>
              </div>
              <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Overdue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '2px' }}>{data.teamTaskOverview.overdue}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <span>Assign direct tasks to team members and monitor real-time completion.</span>
              <Button variant="primary" size="sm" onClick={() => onQuickAction('assign_task')}>
                + Assign Task
              </Button>
            </div>
          </div>

          {/* Managed Team Members */}
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
                  Managed Team Members
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Colleagues reporting within {dept}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}`)}
                style={{ fontSize: '0.8rem' }}
              >
                Department Roster →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.teamMembers.map(u => (
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
                    background: 'var(--bg-surface)',
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
                        {u.designation}
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
        </div>

        {/* RIGHT COLUMN: Manager Actions & Department Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Manager Quick Actions */}
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
              Manager Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Button
                variant="primary"
                size="md"
                icon={<CheckSquare size={16} />}
                onClick={() => onQuickAction('assign_task')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                + Assign Task
              </Button>

              <Button
                variant="outline"
                size="md"
                icon={<Users size={16} />}
                onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}`)}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                View Department Team
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

              <Button
                variant="outline"
                size="md"
                icon={<MessageSquare size={16} />}
                onClick={() => onQuickAction('open_chat')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Team Chat
              </Button>
            </div>
          </div>

          {/* Department Information Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.75rem' }}>
              Department Scope
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Department</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary-deep)' }}>{dept}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Lead Manager</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{data.user?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Operational Sprint</span>
                <span style={{ fontWeight: 600, color: '#16A34A' }}>Sprint 12 (Active)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Phase 12: Sales & Expenses Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <SalesWidget salesOverview={data.salesOverview} />
        <ExpenseWidget expenseOverview={data.expenseOverview} />
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
