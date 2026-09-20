import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  CheckSquare,
  Megaphone,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FounderDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CalendarWidget } from './CalendarWidget';
import { WorkActivityWidget } from './WorkActivityWidget';
import { GoalsWidget } from './GoalsWidget';
import { DocumentsWidget } from './DocumentsWidget';
import { InventoryWidget } from './InventoryWidget';
import { SalesWidget } from './SalesWidget';
import { ExpenseWidget } from './ExpenseWidget';

interface FounderDashboardProps {
  data: FounderDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'Founder').split(' ')[0];

  const getRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'FOUNDER') return <Badge variant="green" size="sm">FOUNDER</Badge>;
    if (r === 'HR' || r === 'MANAGER' || r === 'HR_MANAGER') return <Badge variant="lavender" size="sm">{r.replace('_', ' ')}</Badge>;
    if (r === 'INTERN') return <Badge variant="warning" size="sm">INTERN</Badge>;
    return <Badge variant="neutral" size="sm">EMPLOYEE</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Executive Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: '#FFFFFF',
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
              Executive Overview
            </span>
            <Badge variant="green" size="sm">FOUNDER</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Good morning, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Company-wide operational snapshot and executive visibility.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<Users size={15} />}
            onClick={() => navigate('/team')}
          >
            Team Directory
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus size={15} />}
            onClick={() => navigate('/team?action=add')}
          >
            Add Team Member
          </Button>
        </div>
      </motion.div>

      {/* 2. Executive KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Members */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team')}
          style={{
            background: '#FFFFFF',
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
              Total Members
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.teamStats.total}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>Manage Organization</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Employees */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team?role=EMPLOYEE')}
          style={{
            background: '#FFFFFF',
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
            <span>Filter Employees</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Interns */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team?role=INTERN')}
          style={{
            background: '#FFFFFF',
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
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#B45309', margin: '4px 0' }}>
            {data.teamStats.interns}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
            <span>Filter Interns</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* HR & Managers */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/team?role=HR_MANAGER')}
          style={{
            background: '#FFFFFF',
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
              HR / Managers
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6D28D9' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#6D28D9', margin: '4px 0' }}>
            {data.teamStats.hrManagers}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6D28D9', fontWeight: 600 }}>
            <span>Filter Leadership</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. Main Dashboard Layout (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Team Overview & Work Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Team Overview Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem 1.75rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Team Overview
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Active roster across departments and recent joins.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/team')}
                style={{ fontSize: '0.8rem' }}
              >
                All Team Members →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.teamOverview.slice(0, 6).map(u => (
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
                    background: '#FFFFFF',
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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

          {/* Work Overview Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem 1.75rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Company Work Overview
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Aggregate task distribution across all operational units.
                </p>
              </div>
              <Badge variant="neutral" size="sm">Phase 4 Preview</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Active</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px' }}>{data.workOverview.activeTasks}</div>
              </div>
              <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#16A34A', textTransform: 'uppercase' }}>Completed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>{data.workOverview.completedTasks}</div>
              </div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#D97706', textTransform: 'uppercase' }}>Pending</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>{data.workOverview.pendingTasks}</div>
              </div>
              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>Overdue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>{data.workOverview.overdueTasks}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#FAFBF8', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <span>Interactive task assignment and departmental sprint tracking will be enabled in Phase 4.</span>
              <Button variant="outline" size="sm" onClick={() => onQuickAction('assign_task')}>
                Manage Tasks
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Executive Actions, Announcements & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Executive Quick Actions */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
              Executive Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Button
                variant="primary"
                size="md"
                icon={<UserPlus size={16} />}
                onClick={() => navigate('/team?action=add')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Add Team Member
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

              <Button
                variant="outline"
                size="md"
                icon={<MessageSquare size={16} />}
                onClick={() => onQuickAction('open_chat')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Open Chat
              </Button>
            </div>
          </div>

          {/* Company Announcements */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Announcements
              </h3>
              <Badge variant="green" size="sm">Company Broadcasts</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.announcements.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem',
                    background: '#FAFBF8',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary-deep)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {item.targetAudience}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {item.date}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {item.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Recent Activity
              </h3>
              <Activity size={15} color="var(--color-text-muted)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recentActivity.map(act => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.8rem',
                    borderLeft: '2px solid var(--color-primary)',
                    paddingLeft: '10px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {act.text}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {act.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Phase 12: Sales & Expenses Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <SalesWidget salesOverview={data.salesOverview} />
        <ExpenseWidget expenseOverview={data.expenseOverview} />
      </div>

      {/* Phase 11: Inventory Overview Widget */}
      <InventoryWidget />

      {/* Phase 9: Goals & OKRs Widget */}
      <GoalsWidget maxItems={4} />

      {/* Phase 10: Documents & Company Knowledge Widget */}
      <DocumentsWidget maxItems={4} />

      {/* Phase 8: Work Activity Monitoring Widget */}
      <WorkActivityWidget maxItems={4} />

      {/* Phase 7: Today's Calendar Widget */}
      <CalendarWidget maxItems={5} />
    </div>
  );
};
