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
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { HRDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface HRDashboardProps {
  data: HRDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'HR Specialist').split(' ')[0];

  const getRoleBadge = (role: string) => {
    const r = (role || '').toUpperCase();
    if (r === 'FOUNDER') return <Badge variant="green" size="sm">FOUNDER</Badge>;
    if (r === 'HR' || r === 'MANAGER' || r === 'HR_MANAGER') return <Badge variant="lavender" size="sm">{r.replace('_', ' ')}</Badge>;
    if (r === 'INTERN') return <Badge variant="warning" size="sm">INTERN</Badge>;
    return <Badge variant="neutral" size="sm">EMPLOYEE</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'URGENT' || p === 'HIGH') return <Badge variant="danger" size="sm">High</Badge>;
    if (p === 'MEDIUM') return <Badge variant="warning" size="sm">Medium</Badge>;
    return <Badge variant="neutral" size="sm">Normal</Badge>;
  };

  const hrTasks = data.hrTasks || [];
  const announcements = data.announcements || [];
  const recentActivities = data.recentActivities || [];
  const directoryPreview = data.teamDirectoryPreview || [];
  const hrWork = data.hrWorkOverview || { tasksAssigned: 0, tasksInProgress: 0, tasksCompleted: 0, overdueTasks: 0 };

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
          padding: '1.5rem 1.75rem',
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
              People & Culture Operations
            </span>
            <Badge variant="lavender" size="sm">HR OPERATIONS</Badge>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome back, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Workforce distribution, active personnel records, and HR operational tasks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
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
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Employees
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.peopleStats?.totalEmployees ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>Active Staff</span>
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
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Interns
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <GraduationCap size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.peopleStats?.totalInterns ?? 0}
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
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Workforce
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.peopleStats?.activeMembers ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>
            <span>Total Operational</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Pending HR Tasks */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/tasks')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending HR Tasks
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
              <CheckSquare size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {hrWork.tasksAssigned}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9333EA', fontWeight: 600 }}>
            <span>Actionable Items</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. Main Operational Sections (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
        {/* LEFT COLUMN: Pending HR Tasks & Team Directory */}
        <div className="flex flex-col gap-5 sm:gap-6 min-w-0">
          {/* Pending HR Tasks */}
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
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Pending HR Tasks & Onboarding
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Onboarding milestones, compliance, and assigned HR deliverables.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                All Tasks →
              </Button>
            </div>

            {hrTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <CheckSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                No pending HR tasks right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {hrTasks.slice(0, 6).map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
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
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckSquare size={16} color="var(--color-primary-deep)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                          <span>Assignee: {task.assignedTo?.name || 'Unassigned'}</span>
                          {task.deadline && (
                            <>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={12} />
                                {task.deadline}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getPriorityBadge(task.priority)}
                      <ArrowRight size={14} color="var(--color-text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Directory Preview */}
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
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Workforce Directory
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Recently joined team members and staff overview.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/team')}>
                Full Directory →
              </Button>
            </div>

            {directoryPreview.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                No active records found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {directoryPreview.slice(0, 5).map(u => (
                  <div
                    key={u.id}
                    onClick={() => navigate(`/team/${u.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          overflow: 'hidden'
                        }}
                      >
                        {u.profilePhoto ? (
                          <img src={u.profilePhoto} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          u.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {u.designation} • {u.department}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getRoleBadge(u.role)}
                      <ArrowRight size={13} color="var(--color-text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions, Recent Activity & Announcements */}
        <div className="flex flex-col gap-5 sm:gap-6 min-w-0">
          {/* HR Quick Actions */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.85rem' }}>
              HR Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                variant="primary"
                size="sm"
                icon={<UserPlus size={14} />}
                onClick={() => navigate('/team?action=add&role=EMPLOYEE')}
                style={{ justifyContent: 'center' }}
              >
                + Employee
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<GraduationCap size={14} />}
                onClick={() => navigate('/team?action=add&role=INTERN')}
                style={{ justifyContent: 'center' }}
              >
                + Intern
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<CheckSquare size={14} />}
                onClick={() => onQuickAction('assign_task')}
                style={{ justifyContent: 'center' }}
              >
                Assign Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Megaphone size={14} />}
                onClick={() => onQuickAction('create_announcement')}
                style={{ justifyContent: 'center' }}
              >
                Announce
              </Button>
            </div>
          </div>

          {/* Announcements */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Company Broadcasts
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/announcements')}>
                View All →
              </Button>
            </div>

            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                No announcements right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {announcements.slice(0, 4).map((ann: any) => (
                  <div
                    key={ann.id || ann._id}
                    onClick={() => navigate(`/announcements/${ann.id || ann._id}`)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {ann.title}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                        {ann.date}
                      </div>
                    </div>
                    <ArrowRight size={13} color="var(--color-text-muted)" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Team Activity */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.85rem' }}>
              Recent HR & Team Activity
            </h3>

            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                No recent activity logged.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentActivities.slice(0, 5).map(act => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{act.actorName}</span>{' '}
                      <span style={{ color: 'var(--color-text-secondary)' }}>{act.message}</span>
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {act.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
