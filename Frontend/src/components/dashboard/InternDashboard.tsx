import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  CheckSquare,
  Calendar,
  MessageSquare,
  Megaphone,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { InternDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CalendarWidget } from './CalendarWidget';
import { WorkActivityWidget } from './WorkActivityWidget';
import { GoalsWidget } from './GoalsWidget';

interface InternDashboardProps {
  data: InternDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'Intern').split(' ')[0];

  const getUrgencyBadge = (urgency: string) => {
    const u = urgency.toUpperCase();
    if (u === 'HIGH' || u === 'URGENT') return <Badge variant="danger" size="sm">High</Badge>;
    if (u === 'MEDIUM') return <Badge variant="warning" size="sm">Medium</Badge>;
    return <Badge variant="neutral" size="sm">Standard</Badge>;
  };

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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Internship Workspace & Learning Track
            </span>
            <Badge variant="warning" size="sm">INTERN COHORT</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Good morning, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Track assignments, onboarding milestones, and mentorship feedback.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<User size={15} />}
            onClick={() => navigate('/profile')}
          >
            Intern Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckSquare size={15} />}
            onClick={() => onQuickAction('view_tasks')}
          >
            My Assignments
          </Button>
        </div>
      </motion.div>

      {/* 2. Intern Assignment KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* To Do */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onQuickAction('view_tasks')}
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
              To Do Tasks
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <CheckSquare size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.myTasks.todo}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
            <span>Pending Start</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* In Progress */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onQuickAction('view_tasks')}
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
              In Progress
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-primary-deep)', margin: '4px 0' }}>
            {data.myTasks.inProgress}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>Underway</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Completed */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onQuickAction('view_tasks')}
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
              Completed
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: '#16A34A', margin: '4px 0' }}>
            {data.myTasks.completed}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
            <span>Verified Tasks</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>

        {/* Overdue */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onQuickAction('view_tasks')}
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
              Overdue
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: data.myTasks.overdue > 0 ? '#DC2626' : 'var(--color-text-secondary)', margin: '4px 0' }}>
            {data.myTasks.overdue}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: data.myTasks.overdue > 0 ? '#DC2626' : 'var(--color-text-secondary)', fontWeight: 600 }}>
            <span>Attention Needed</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. Main Intern Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Important Tasks & Mentorship Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Important Assigned Tasks */}
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
                  Important Assigned Tasks
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Assignments delegated by mentors and leads.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuickAction('view_tasks')}
                style={{ fontSize: '0.8rem' }}
              >
                All Assignments →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.importantTasks && data.importantTasks.length > 0 ? (
                data.importantTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onQuickAction('view_tasks')}
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
                    className="luxury-card"
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Assigned by <strong style={{ color: 'var(--color-primary-deep)' }}>{task.assignedBy}</strong> • Due: {task.deadline}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {getUrgencyBadge(task.urgency)}
                      <ArrowRight size={14} color="var(--color-text-muted)" />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No active assignments currently.
                </div>
              )}
            </div>
          </div>

          {/* Intern Mentorship & Learning Note */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', flexShrink: 0 }}>
              <BookOpen size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Lavanta Naturals Mentorship Program
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Need help or clarification on your assignments? Connect directly with your assigned mentor via team chat or during weekly check-ins.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickAction('open_chat')}
            >
              Contact Mentor
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Intern Actions, Cohort Notices, Upcoming */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
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
              Intern Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Button
                variant="primary"
                size="md"
                icon={<CheckSquare size={16} />}
                onClick={() => onQuickAction('view_tasks')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                View My Tasks
              </Button>

              <Button
                variant="outline"
                size="md"
                icon={<MessageSquare size={16} />}
                onClick={() => onQuickAction('open_chat')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Contact Mentor
              </Button>

              <Button
                variant="outline"
                size="md"
                icon={<Megaphone size={16} />}
                onClick={() => onQuickAction('view_announcements')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                Cohort Announcements
              </Button>

              <Button
                variant="outline"
                size="md"
                icon={<Calendar size={16} />}
                onClick={() => onQuickAction('view_calendar')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                View Calendar
              </Button>
            </div>
          </div>

          {/* Upcoming Schedule */}
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
                Upcoming Check-ins
              </h3>
              <Calendar size={15} color="var(--color-text-muted)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.upcoming && data.upcoming.length > 0 ? (
                data.upcoming.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-primary-deep)', marginTop: '2px' }}>
                      {item.date}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No upcoming syncs scheduled.
                </div>
              )}
            </div>
          </div>

          {/* Cohort Announcements */}
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
                Cohort Briefings
              </h3>
              <Badge variant="warning" size="sm">Interns</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.announcements && data.announcements.map(notice => (
                <div
                  key={notice.id}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                    <span>Notice</span>
                    <span>{notice.date}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {notice.title}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {notice.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Phase 9: Goals & OKRs Widget */}
      <GoalsWidget maxItems={4} />

      {/* Phase 8: Personal Work Activity Widget */}
      <WorkActivityWidget maxItems={4} />

      {/* Phase 7: Today's Calendar Widget */}
      <CalendarWidget maxItems={5} />
    </div>
  );
};
