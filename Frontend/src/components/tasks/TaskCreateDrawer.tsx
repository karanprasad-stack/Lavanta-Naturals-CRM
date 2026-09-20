import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, CheckCircle2, UserCheck, CheckSquare, Paperclip } from 'lucide-react';
import { TaskPriority, CreateTaskPayload } from '../../types/task';
import { User } from '../../types';
import { taskService } from '../../services/taskService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';

interface TaskCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  teamMembers: User[];
  currentUser: User | null;
}

export const TaskCreateDrawer: React.FC<TaskCreateDrawerProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  teamMembers,
  currentUser
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter assignees based on current user's role
  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const currentUserId = currentUser?.id || (currentUser as any)?._id;

  const eligibleAssignees = teamMembers.filter(m => {
    const memberId = m.id || (m as any)._id;
    // Cannot assign to oneself
    if (memberId === currentUserId) return false;

    if (userRole === 'FOUNDER') {
      // Founder can assign to anyone
      return true;
    }
    if (userRole === 'HR') {
      // HR can assign to employees and interns
      const r = m.role.toUpperCase();
      return r === 'EMPLOYEE' || r === 'INTERN' || r === 'MANAGER';
    }
    if (userRole === 'MANAGER') {
      // Manager can assign strictly within their department
      return m.department === currentUser?.department;
    }
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Task name is required.');
      return;
    }

    if (!assignedTo) {
      setValidationError('Please select an assignee from your permitted team members.');
      return;
    }

    if (!deadlineDate) {
      setValidationError('Please specify a task deadline date.');
      return;
    }

    // Combine date and time
    const fullDeadlineStr = `${deadlineDate}T${deadlineTime || '18:00'}:00`;
    const deadlineObj = new Date(fullDeadlineStr);

    if (isNaN(deadlineObj.getTime())) {
      setValidationError('Invalid date/time format.');
      return;
    }

    if (deadlineObj.getTime() <= Date.now()) {
      setValidationError('Deadline must be in the future.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        priority,
        deadline: deadlineObj.toISOString()
      };

      await taskService.createTask(payload);
      showToast('Task assigned successfully.', 'success');
      onTaskCreated();
      // Reset form
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority('MEDIUM');
      setDeadlineDate('');
      setDeadlineTime('18:00');
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(23, 34, 53, 0.4)',
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase' }}>
                Task Delegation
              </span>
              <Badge variant="green" size="sm">Phase 4</Badge>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '2px 0 0' }}>
              Assign New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: '#FAFBF8',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          {validationError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-sm)',
                color: '#DC2626',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: TASK DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Task Details
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Task Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Create Instagram Content for Face Serum"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#FFFFFF',
                  color: 'var(--color-text-primary)'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Description & Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Detail deliverables, guidelines, formulation notes, or references..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#FFFFFF',
                  color: 'var(--color-text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Section 2: ASSIGNMENT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Assignee Selection
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Assign To *
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: '#FFFFFF',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer'
                }}
                required
              >
                <option value="">-- Select Permitted Team Member --</option>
                {eligibleAssignees.map(m => (
                  <option key={m.id || (m as any)._id} value={m.id || (m as any)._id}>
                    {m.name} — {m.designation} ({m.department})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '3px', display: 'block' }}>
                {userRole === 'MANAGER'
                  ? `Showing team members reporting to ${currentUser?.department}.`
                  : 'Showing employees and intern cohort members.'}
              </span>
            </div>
          </div>

          {/* Section 3: PRIORITY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              3. Urgency & Priority
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              {/* High */}
              <div
                onClick={() => setPriority('HIGH')}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: priority === 'HIGH' ? '2px solid #DC2626' : '1px solid var(--border-color)',
                  background: priority === 'HIGH' ? '#FEF2F2' : '#FFFFFF',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#DC2626' }}>High</span>
              </div>

              {/* Medium */}
              <div
                onClick={() => setPriority('MEDIUM')}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: priority === 'MEDIUM' ? '2px solid #B45309' : '1px solid var(--border-color)',
                  background: priority === 'MEDIUM' ? '#FEF3C7' : '#FFFFFF',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B45309', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B45309' }}>Medium</span>
              </div>

              {/* Low */}
              <div
                onClick={() => setPriority('LOW')}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: priority === 'LOW' ? '2px solid #16A34A' : '1px solid var(--border-color)',
                  background: priority === 'LOW' ? '#F0FDF4' : '#FFFFFF',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A' }}>Low</span>
              </div>
            </div>
          </div>

          {/* Section 4: DEADLINE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              4. Deadline Target *
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>
                  Target Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={deadlineDate}
                  onChange={e => setDeadlineDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>
                  Target Time
                </label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={e => setDeadlineTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <Button type="button" variant="outline" size="md" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              icon={<CheckSquare size={16} />}
            >
              {submitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
