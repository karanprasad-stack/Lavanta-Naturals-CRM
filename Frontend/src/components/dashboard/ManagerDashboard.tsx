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
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  TrendingUp
} from 'lucide-react';
import { ManagerDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ManagerDashboardProps {
  data: ManagerDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'Manager').split(' ')[0];
  const dept = data.user?.department || 'Operations';

  const inProgressList = data.inProgressTasks || [];
  const overdueList = data.overdueTasks || [];
  const workloadList = data.teamWorkload || [];
  const recentActs = data.recentActivities || [];
  const announcements = data.announcements || [];

  const getPriorityBadge = (priority: string) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    if (p === 'HIGH' || p === 'URGENT') return <Badge variant="danger" size="sm">Urgent</Badge>;
    if (p === 'MEDIUM') return <Badge variant="warning" size="sm">Medium</Badge>;
    return <Badge variant="neutral" size="sm">Standard</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Manager Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Department Management • {dept}
            </span>
            <Badge variant="lavender" size="sm">MANAGER</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome back, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Oversee team deliverables, track active assignments, and balance member workload.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<Users size={15} />}
            onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}`)}
          >
            Team Roster
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Megaphone size={15} />}
            onClick={() => onQuickAction('create_announcement')}
          >
            Announcement
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckSquare size={15} />}
            onClick={() => onQuickAction('assign_task')}
          >
            + Assign Task
          </Button>
        </div>
      </motion.div>

      {/* 2. Key Actionable KPI Cards (4 Cards Max) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Team Tasks In Progress */}
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
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              In Progress
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-primary-deep)', margin: '4px 0' }}>
            {data.teamTaskOverview.inProgress}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            <span>Active Sprint Tasks</span>
            <ArrowRight size={13} color="var(--color-primary-deep)" />
          </div>
        </motion.div>

        {/* Overdue / High Priority Tasks */}
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
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overdue Tasks
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: data.teamTaskOverview.overdue > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.teamTaskOverview.overdue}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            <span>Needs Immediate Attention</span>
            <ArrowRight size={13} color={data.teamTaskOverview.overdue > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'} />
          </div>
        </motion.div>

        {/* Completed Tasks */}
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
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.teamTaskOverview.completed}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            <span>Finished Deliverables</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

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
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Team Members
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.teamStats.teamMembers}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            <span>{data.teamStats.employees} Staff • {data.teamStats.interns} Interns</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. Primary Work Section (2-Column Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Team Tasks In Progress & Overdue Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Overdue Warning Panel (if any exist) */}
          {overdueList.length > 0 && (
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-danger-border)',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="var(--color-danger)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-danger)', margin: 0 }}>
                    Overdue Deliverables ({overdueList.length})
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                  View In Tasks →
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {overdueList.map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '2px' }}>
                        Due {task.deadline} • Assigned to {task.assignedTo?.name || 'Unassigned'}
                      </div>
                    </div>
                    {getPriorityBadge(task.priority)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Tasks Currently In Progress */}
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
                  Team Tasks In Progress
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Current active work items across {dept}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tasks')}
                style={{ fontSize: '0.8rem' }}
              >
                All Department Tasks →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {inProgressList.length > 0 ? (
                inProgressList.map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {task.assignedTo?.profilePhoto ? (
                        <img
                          src={task.assignedTo.profilePhoto}
                          alt={task.assignedTo.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-soft-green)', color: 'var(--color-primary-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {(task.assignedTo?.name || 'T')[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {task.assignedTo?.name || 'Team member'} • Due {task.deadline}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {getPriorityBadge(task.priority)}
                      <ArrowRight size={14} color="var(--color-text-muted)" />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No tasks currently in progress in this department.
                </div>
              )}
            </div>
          </div>

          {/* Team Workload & Task Distribution */}
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
                  Team Workload Distribution
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Active tasks assigned per department member.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/team?department=${encodeURIComponent(dept)}`)}
                style={{ fontSize: '0.8rem' }}
              >
                View Roster →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {workloadList.length > 0 ? (
                workloadList.map(({ user, taskCount }) => (
                  <div
                    key={user.id}
                    onClick={() => navigate(`/team/${user.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={user.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={user.name}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                          {user.designation} • <span style={{ textTransform: 'capitalize' }}>{user.role?.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: taskCount > 0 ? 'var(--color-soft-green)' : 'var(--bg-surface)',
                          color: taskCount > 0 ? 'var(--color-primary-deep)' : 'var(--color-text-muted)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                      <ArrowRight size={13} color="var(--color-text-muted)" />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  No members found in this department.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Activity, Announcements & Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Recent Team Activity */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={17} color="var(--color-primary-deep)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Recent Team Activity
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentActs.length > 0 ? (
                recentActs.map(act => (
                  <div
                    key={act.id}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {act.actorName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {act.time}
                      </span>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.775rem' }}>
                      {act.message}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  No recent activity recorded.
                </div>
              )}
            </div>
          </div>

          {/* Department Announcements Preview */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Megaphone size={17} color="var(--color-primary-deep)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Announcements
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/announcements')} style={{ fontSize: '0.75rem' }}>
                View All →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {announcements.length > 0 ? (
                announcements.slice(0, 3).map(ann => (
                  <div
                    key={ann.id}
                    onClick={() => navigate(`/announcements/${ann.id}`)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {ann.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {ann.date} • {ann.targetAudience}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  No active announcements.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.85rem' }}>
              Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button
                variant="primary"
                size="md"
                icon={<CheckSquare size={16} />}
                onClick={() => onQuickAction('assign_task')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                + Assign New Task
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
                onClick={() => navigate('/chat')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Open Team Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
