import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, CheckCircle2, UserCheck, Edit3 } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, UpdateTaskPayload } from '../../types/task';
import { User } from '../../types';
import { taskService } from '../../services/taskService';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
  onUpdated?: () => void;
  teamMembers: User[];
  currentUser?: User | null;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onUpdated,
  teamMembers,
  currentUser: propUser
}) => {
  const { showToast } = useToast();
  const { currentUser: authUser } = useAuth();
  const currentUser = propUser || authUser;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  // Populate state whenever task changes
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssignedTo(task.assignedTo?._id || (task.assignedTo as any)?.id || '');
      setPriority(task.priority || 'MEDIUM');
      setStatus(task.status || 'TODO');

      if (task.deadline) {
        const d = new Date(task.deadline);
        setDeadlineDate(d.toISOString().split('T')[0]);
        setDeadlineTime(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        );
      } else {
        setDeadlineDate('');
        setDeadlineTime('18:00');
      }
      setValidationError(null);
    }
  }, [task, isOpen]);

  // Eligible assignees based on current user role
  const eligibleAssignees = teamMembers.filter(m => {
    if (userRole === 'FOUNDER') return true;
    if (userRole === 'HR') {
      const r = m.role.toUpperCase();
      return r === 'EMPLOYEE' || r === 'INTERN' || r === 'MANAGER';
    }
    if (userRole === 'MANAGER') {
      return m.department === currentUser?.department;
    }
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!title.trim()) {
      setValidationError('Task title is required.');
      return;
    }
    if (!assignedTo) {
      setValidationError('Please select an assignee.');
      return;
    }
    if (!deadlineDate) {
      setValidationError('Please specify a deadline date.');
      return;
    }

    const fullDeadline = new Date(`${deadlineDate}T${deadlineTime || '18:00'}:00`);

    setSubmitting(true);
    setValidationError(null);

    try {
      const payload: UpdateTaskPayload = {
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        priority,
        status,
        deadline: fullDeadline.toISOString()
      };

      await taskService.updateTask(task._id, payload);
      showToast('Task updated successfully.', 'success');
      onTaskUpdated?.();
      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error('[TaskEditModal] Update failed:', err);
      setValidationError(err?.message || 'Failed to update task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.3))',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'rgba(22, 163, 74, 0.12)',
                  color: 'var(--color-primary-deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Edit3 size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Edit Task
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Authorized management changes for "{task.title.slice(0, 32)}..."
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '1.5rem', gap: '1rem' }}>
            {validationError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '6px',
                  color: '#DC2626',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated, #FAFBF8)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated, #FAFBF8)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Status & Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated, #FAFBF8)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated, #FAFBF8)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Assignee Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Assignee *
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated, #FAFBF8)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="">Select team member...</option>
                {eligibleAssignees.map(m => (
                  <option key={m.id || (m as any)._id} value={m.id || (m as any)._id}>
                    {m.name} — {m.role} ({m.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Deadline Date *
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={e => setDeadlineDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated, #FAFBF8)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={e => setDeadlineTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated, #FAFBF8)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
                marginTop: '0.5rem'
              }}
            >
              <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
