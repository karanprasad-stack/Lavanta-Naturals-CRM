import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Calendar,
  MessageSquare,
  Megaphone,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { EmployeeDashboardData } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CalendarWidget } from './CalendarWidget';
import { WorkActivityWidget } from './WorkActivityWidget';
import { GoalsWidget } from './GoalsWidget';

interface EmployeeDashboardProps {
  data: EmployeeDashboardData;
  onQuickAction: (actionKey: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ data, onQuickAction }) => {
  const navigate = useNavigate();
  const firstName = (data.user?.name || 'there').split(' ')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Employee Welcome Banner */}
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
              Personal Workspace
            </span>
            <Badge variant="neutral" size="sm">EMPLOYEE</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Good morning, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Here is your daily agenda, assigned deliverables, and team broadcasts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<User size={15} />}
            onClick={() => navigate('/profile')}
          >
            My Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckSquare size={15} />}
            onClick={() => onQuickAction('view_tasks')}
          >
            View My Tasks
          </Button>
        </div>
      </motion.div>

      {/* 2. Personal Work KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Assigned */}
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
              My Tasks
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
              <CheckSquare size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {data.myWork.myTasks}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
            <span>Active Deliverables</span>
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
            {data.myWork.inProgress}
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
            {data.myWork.completed}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
            <span>Accomplished</span>
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
          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: data.myWork.overdue > 0 ? '#DC2626' : 'var(--color-text-secondary)', margin: '4px 0' }}>
            {data.myWork.overdue}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: data.myWork.overdue > 0 ? '#DC2626' : 'var(--color-text-secondary)', fontWeight: 600 }}>
            <span>Action Required</span>
            <ArrowRight size={13} />
          </div>
        </motion.div>
      </div>

      {/* 3. Main Employee Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Today's Work & Profile Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Today's Work */}
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
                  Today's Work & Agenda
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Assigned priorities for your current shift.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuickAction('view_tasks')}
                style={{ fontSize: '0.8rem' }}
              >
                All My Tasks →
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.todayWork && data.todayWork.length > 0 ? (
                data.todayWork.map(task => (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '4px', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckSquare size={14} color="var(--color-primary-deep)" />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {task.title}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {task.deadline}
                      </span>
                      <ArrowRight size={14} color="var(--color-text-muted)" />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No tasks due today. All caught up!
                </div>
              )}
            </div>
          </div>

          {/* Profile Summary Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={data.user?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={data.user?.name || 'User'}
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    {data.user?.name}
                  </h3>
                  <Badge variant="neutral" size="sm">{data.user?.role}</Badge>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {data.user?.designation} • <strong style={{ color: 'var(--color-primary-deep)' }}>{data.user?.department}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Joined: {data.user?.joiningDate || '2023-01-15'} • Status: <span style={{ color: '#16A34A', fontWeight: 600 }}>{data.user?.status || 'Active'}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
            >
              Edit Profile →
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Employee Actions, Featured Announcement, Recent Chat */}
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
              Workspace Actions
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
                icon={<Megaphone size={16} />}
                onClick={() => onQuickAction('view_announcements')}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                View Announcements
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

          {/* Featured Announcement (Requirement 27) */}
          {data.announcement && (
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-xs)',
                overflow: 'hidden'
              }}
            >
              {/* Compact Poster Image */}
              {data.announcement.posterUrl && (
                <div style={{ width: '100%', height: '110px', overflow: 'hidden', background: '#F0F9ED' }}>
                  <img
                    src={data.announcement.posterUrl}
                    alt={data.announcement.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--color-primary-deep)'
                    }}
                  >
                    {data.announcement.type || 'Announcement'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary-deep)',
                      border: '1px solid var(--color-primary-border)'
                    }}
                  >
                    {data.announcement.priority || 'Important'}
                  </span>
                </div>

                <h4
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: '2px 0',
                    lineHeight: 1.35
                  }}
                >
                  {data.announcement.title}
                </h4>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div>{data.announcement.date}</div>
                  {data.announcement.targetAudience && (
                    <div style={{ color: 'var(--color-primary-deep)', fontWeight: 500 }}>
                      {data.announcement.targetAudience}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(data.announcement?.id ? `/announcements/${data.announcement.id}` : '/announcements')}
                  style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                >
                  View Announcement
                </Button>
              </div>
            </div>
          )}

          {/* Recent Chat Snippets */}
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
                Recent Messages
              </h3>
              <MessageSquare size={15} color="var(--color-text-muted)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.recentChat && data.recentChat.length > 0 ? (
                data.recentChat.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => onQuickAction('open_chat')}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                    className="luxury-card"
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-primary-deep)', marginBottom: '2px' }}>
                      {msg.sender}
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No messages yet.
                </div>
              )}
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
