import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, Edit3, Search, Check, Users } from 'lucide-react';
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
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const currentUserId = currentUser?.id || (currentUser as any)?._id;

  // Eligible assignees based on current user role
  const eligibleAssignees = useMemo(() => {
    return teamMembers.filter(m => {
      const memberId = m.id || (m as any)._id;
      if (!memberId) return false;
      if (userRole === 'FOUNDER') return true;
      if (userRole === 'HR') {
        const r = (m.role || '').toUpperCase();
        return r === 'EMPLOYEE' || r === 'INTERN' || r === 'MANAGER';
      }
      if (userRole === 'MANAGER') {
        return m.department === currentUser?.department;
      }
      return false;
    });
  }, [teamMembers, userRole, currentUser?.department]);

  // Populate state whenever task changes
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'MEDIUM');
      setStatus(task.status || 'TODO');

      // Initialize assignees from task.assignees or task.assignedTo
      const initialIds: string[] = [];
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach(a => {
          const id = (a as any)._id || (a as any).id || a;
          if (id) initialIds.push(id.toString());
        });
      } else if (task.assignedTo) {
        const id = (task.assignedTo as any)._id || (task.assignedTo as any).id || task.assignedTo;
        if (id) initialIds.push(id.toString());
      }
      setSelectedAssigneeIds(Array.from(new Set(initialIds)));

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
      setSearchQuery('');
      setValidationError(null);
    }
  }, [task, isOpen]);

  // Filtered members for search list
  const filteredSearchMembers = useMemo(() => {
    if (!searchQuery.trim()) return eligibleAssignees;
    const q = searchQuery.toLowerCase().trim();
    return eligibleAssignees.filter(
      m =>
        m.name?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.designation?.toLowerCase().includes(q)
    );
  }, [eligibleAssignees, searchQuery]);

  const toggleMemberSelection = (id: string) => {
    setSelectedAssigneeIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const removeMember = (id: string) => {
    setSelectedAssigneeIds(prev => prev.filter(mId => mId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!title.trim()) {
      setValidationError('Task title is required.');
      return;
    }
    if (selectedAssigneeIds.length === 0) {
      setValidationError('Please select at least one assignee for this task.');
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
        assigneeIds: selectedAssigneeIds,
        assignedTo: selectedAssigneeIds[0],
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
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-surface, #FFFFFF)',
            color: 'var(--color-text-primary, #172235)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-soft-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary-deep)'
                }}
              >
                <Edit3 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Edit Task Details
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  ID: {task._id.slice(-8)} • {selectedAssigneeIds.length} Assigned Member{selectedAssigneeIds.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Modal"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {validationError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '0.825rem',
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
                  background: 'var(--bg-surface)',
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
                  background: 'var(--bg-surface)',
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
                    background: 'var(--bg-surface)',
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
                    background: 'var(--bg-surface)',
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

            {/* Multi-Member Assignee Selection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Assigned Team Members *
                </label>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
                  {selectedAssigneeIds.length} Member{selectedAssigneeIds.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Selected Member Chips */}
              {selectedAssigneeIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {selectedAssigneeIds.map(id => {
                    const member =
                      eligibleAssignees.find(m => (m.id || (m as any)._id) === id) ||
                      (task.assignees?.find(a => (a as any)._id === id) as any) ||
                      (task.assignedTo?._id === id ? task.assignedTo : null);

                    return (
                      <div
                        key={id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          background: 'var(--color-soft-green)',
                          border: '1px solid var(--color-primary)',
                          borderRadius: '16px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--color-primary-deep)'
                        }}
                      >
                        <img
                          src={
                            member?.profilePhoto ||
                            member?.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                          }
                          alt={member?.name || 'User'}
                          style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span>{member?.name || 'Member'}</span>
                        <button
                          type="button"
                          onClick={() => removeMember(id)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-primary-deep)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search Member input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)'
                }}
              >
                <Search size={14} color="var(--color-text-secondary)" />
                <input
                  type="text"
                  placeholder="Search and add/remove members..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.825rem',
                    background: 'transparent',
                    color: 'var(--color-text-primary)'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Members dropdown list */}
              <div
                style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  marginTop: '4px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)'
                }}
              >
                {filteredSearchMembers.length === 0 ? (
                  <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    No matching team members.
                  </div>
                ) : (
                  filteredSearchMembers.map(m => {
                    const mId = m.id || (m as any)._id;
                    const isSelected = selectedAssigneeIds.includes(mId);

                    return (
                      <div
                        key={mId}
                        onClick={() => toggleMemberSelection(mId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-color)',
                          background: isSelected ? 'var(--color-soft-green)' : 'transparent',
                          transition: 'background 0.1s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={
                              m.profilePhoto ||
                              m.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                            }
                            alt={m.name}
                            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {m.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                              {m.designation || m.role} • {m.department}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                            background: isSelected ? 'var(--color-primary)' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isSelected && <Check size={11} color="#FFFFFF" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Deadline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
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
                    background: 'var(--bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Target Time
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
                    background: 'var(--bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
                marginTop: '0.5rem'
              }}
            >
              <Button type="button" variant="outline" size="md" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
