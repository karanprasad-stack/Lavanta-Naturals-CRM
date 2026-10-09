import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Megaphone,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import { InternDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface InternDashboardProps {
  data: InternDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'Intern').split(' ')[0];

  const getPriorityBadge = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'URGENT' || p === 'HIGH') return <Badge variant="danger" size="sm">High</Badge>;
    if (p === 'MEDIUM') return <Badge variant="warning" size="sm">Medium</Badge>;
    return <Badge variant="neutral" size="sm">Normal</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'IN_PROGRESS') return <Badge variant="lavender" size="sm">In Progress</Badge>;
    if (s === 'COMPLETED') return <Badge variant="green" size="sm">Completed</Badge>;
    return <Badge variant="neutral" size="sm">Assigned</Badge>;
  };

  const assignedTasks = data.assignedTasks || [];
  const completedTasks = data.completedTasks || [];
  const announcements = data.announcements || [];
  const myTasks = data.myTasks || { todo: 0, inProgress: 0, completed: 0, overdue: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Intern Welcome Banner */}
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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Internship Learning Track
            </span>
            <Badge variant="warning" size="sm">INTERN</Badge>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Welcome, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Track your assigned learning deliverables, milestones, and submissions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<MessageSquare size={15} />}
            onClick={() => navigate('/chat')}
          >
            Ask Mentor / Team
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckSquare size={15} />}
            onClick={() => navigate('/tasks')}
          >
            My Assignments
          </Button>
        </div>
      </motion.div>

      {/* 2. Intern Assignment KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {/* Assigned */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/tasks?filter=TODO')}
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
              Assigned Tasks
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <ListTodo size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {myTasks.todo}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>
            <span>To Do Queue</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* In Progress */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/tasks?filter=IN_PROGRESS')}
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
              In Progress
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {myTasks.inProgress}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
            <span>Work In Flight</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Overdue / Due Soon */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/tasks?filter=OVERDUE')}
          style={{
            background: 'var(--bg-surface)',
            border: myTasks.overdue > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: myTasks.overdue > 0 ? '#EF4444' : 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overdue
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: myTasks.overdue > 0 ? '#EF4444' : 'var(--color-text-primary)', margin: '4px 0' }}>
            {myTasks.overdue}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: myTasks.overdue > 0 ? '#EF4444' : 'var(--color-text-muted)', fontWeight: 600 }}>
            <span>Needs Attention</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Completed */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate('/tasks?filter=COMPLETED')}
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
              Completed
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {myTasks.completed}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>Accomplishments</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. Main Intern Content Layout (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Assigned Work & Completed Deliverables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Assigned Work */}
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
                  Assigned Deliverables & Milestones
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Assignments currently under your learning track.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                All Assignments →
              </Button>
            </div>

            {assignedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: 'var(--color-primary-deep)', opacity: 0.7 }} />
                No assignments pending. Check in with your manager or mentor!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {assignedTasks.map(task => (
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
                          <span>Assigned by {task.assignedBy}</span>
                          {task.deadline && (
                            <>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={12} />
                                Due {task.deadline}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                      <ArrowRight size={14} color="var(--color-text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Deliverables */}
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
                  Completed Milestones
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Finished work verified in your cohort.
                </p>
              </div>
              <Badge variant="green" size="sm">{completedTasks.length} Completed</Badge>
            </div>

            {completedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Completed assignments will appear here once submitted.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {completedTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface-elevated)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={15} color="#16A34A" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)', textDecoration: 'line-through', opacity: 0.85 }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                          Completed on {task.completedAt}
                        </div>
                      </div>
                    </div>

                    <ArrowRight size={13} color="var(--color-text-muted)" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Navigation & Announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
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
              Quick Navigation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <Button
                variant="primary"
                size="sm"
                icon={<CheckSquare size={14} />}
                onClick={() => navigate('/tasks')}
                style={{ justifyContent: 'center' }}
              >
                My Tasks
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<MessageSquare size={14} />}
                onClick={() => navigate('/chat')}
                style={{ justifyContent: 'center' }}
              >
                Chat Mentor
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Megaphone size={14} />}
                onClick={() => navigate('/announcements')}
                style={{ justifyContent: 'center' }}
              >
                Announcements
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Clock size={14} />}
                onClick={() => navigate('/notifications')}
                style={{ justifyContent: 'center' }}
              >
                Notifications
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
        </div>
      </div>
    </div>
  );
};
