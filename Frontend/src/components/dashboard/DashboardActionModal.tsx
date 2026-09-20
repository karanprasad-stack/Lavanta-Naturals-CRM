import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckSquare, Megaphone, MessageSquare, Calendar, Sparkles } from 'lucide-react';

export type ActionModalType =
  | 'assign_task'
  | 'create_announcement'
  | 'open_chat'
  | 'view_calendar'
  | 'view_tasks'
  | 'view_announcements'
  | null;

interface DashboardActionModalProps {
  action: ActionModalType;
  onClose: () => void;
}

export const DashboardActionModal: React.FC<DashboardActionModalProps> = ({ action, onClose }) => {
  if (!action) return null;

  const contentMap: Record<
    NonNullable<ActionModalType>,
    {
      title: string;
      phase: string;
      icon: React.ReactNode;
      description: string;
      highlight: string;
    }
  > = {
    assign_task: {
      title: 'Task Management System',
      phase: 'Phase 4 Preview',
      icon: <CheckSquare size={24} color="var(--color-primary-deep)" />,
      description:
        'The Task Management module will be introduced in Phase 4. It will empower founders and managers to create tasks, assign work to team members, set urgency levels, and track deliverables in real-time.',
      highlight: 'Full assignment workflows, Kanban boards, and deadlines will be active in Phase 4.'
    },
    view_tasks: {
      title: 'My Deliverables & Assignments',
      phase: 'Phase 4 Preview',
      icon: <CheckSquare size={24} color="var(--color-primary-deep)" />,
      description:
        'Personal task tracking and interactive status updates (To Do, In Progress, Complete) will be available in Phase 4.',
      highlight: 'You will be able to update progress, submit deliverables, and comment on tasks.'
    },
    create_announcement: {
      title: 'Company Broadcast System',
      phase: 'Phase 5 Preview',
      icon: <Megaphone size={24} color="var(--color-primary-deep)" />,
      description:
        'The Announcements broadcasting engine will launch in Phase 5. It enables leadership and HR to broadcast updates to specific departments, all-hands, or intern cohorts.',
      highlight: 'Targeted audiences, rich text attachments, and broadcast pinning.'
    },
    view_announcements: {
      title: 'Company Announcements Feed',
      phase: 'Phase 5 Preview',
      icon: <Megaphone size={24} color="var(--color-primary-deep)" />,
      description:
        'Full announcement archives, search, and notification preferences will be enabled in Phase 5.',
      highlight: 'Stay synchronized with all company updates, notices, and operational policies.'
    },
    open_chat: {
      title: 'Internal Communications & Chat',
      phase: 'Phase 5 Preview',
      icon: <MessageSquare size={24} color="var(--color-primary-deep)" />,
      description:
        'Real-time workplace communication is scheduled for Phase 5. It includes 1-on-1 direct messages, departmental channels, and mentorship communication.',
      highlight: 'Direct chat, reactions, and departmental channels.'
    },
    view_calendar: {
      title: 'Workspace Calendar & Events',
      phase: 'Phase 6 Preview',
      icon: <Calendar size={24} color="var(--color-primary-deep)" />,
      description:
        'The workspace calendar will launch in Phase 6, synchronizing team milestones, sprint reviews, and company-wide events.',
      highlight: 'Departmental calendars, meeting coordination, and holiday schedules.'
    }
  };

  const config = contentMap[action];

  return (
    <Modal
      isOpen={Boolean(action)}
      onClose={onClose}
      title={config.title}
      subtitle="Lavanta Naturals Product Roadmap"
      size="md"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-soft-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {config.icon}
          </div>
          <div>
            <Badge variant="green" size="sm">
              {config.phase}
            </Badge>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Planned for upcoming platform releases
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5, margin: 0 }}>
          {config.description}
        </p>

        <div
          style={{
            padding: '0.85rem 1rem',
            background: '#FAFBF8',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} color="var(--color-primary-deep)" />
          <span>{config.highlight}</span>
        </div>
      </div>
    </Modal>
  );
};
