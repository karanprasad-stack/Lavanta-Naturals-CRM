import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  AlertCircle,
  CheckSquare,
  Users,
  UserCheck,
  Search,
  Check,
  GraduationCap,
  Briefcase,
  Shield
} from 'lucide-react';
import { TaskPriority, CreateTaskPayload, AssignmentTargetType } from '../../types/task';
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
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Target mode state: 'INTERNS' | 'EMPLOYEES' | 'HR' | 'MEMBERS'
  const [targetType, setTargetType] = useState<AssignmentTargetType>('MEMBERS');
  // For role cohorts: 'ALL' vs 'CUSTOM'
  const [cohortMode, setCohortMode] = useState<'ALL' | 'CUSTOM'>('ALL');
  // Selected member IDs
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  // Search query for member selector
  const [searchQuery, setSearchQuery] = useState('');

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const currentUserId = currentUser?.id || (currentUser as any)?._id;

  // Filter team members based on RBAC
  const eligibleMembers = useMemo(() => {
    return teamMembers.filter(m => {
      const memberId = m.id || (m as any)._id;
      if (!memberId || memberId === currentUserId) return false;

      if (userRole === 'FOUNDER') {
        return true;
      }
      if (userRole === 'HR') {
        const r = (m.role || '').toUpperCase();
        return r === 'EMPLOYEE' || r === 'INTERN' || r === 'MANAGER';
      }
      if (userRole === 'MANAGER') {
        return m.department === currentUser?.department;
      }
      return false;
    });
  }, [teamMembers, currentUserId, userRole, currentUser?.department]);

  // Cohort lists
  const eligibleInterns = useMemo(
    () => eligibleMembers.filter(m => (m.role || '').toUpperCase() === 'INTERN'),
    [eligibleMembers]
  );
  const eligibleEmployees = useMemo(
    () => eligibleMembers.filter(m => (m.role || '').toUpperCase() === 'EMPLOYEE'),
    [eligibleMembers]
  );
  const eligibleHR = useMemo(
    () => eligibleMembers.filter(m => (m.role || '').toUpperCase() === 'HR'),
    [eligibleMembers]
  );

  // Filtered members for search list
  const filteredSearchMembers = useMemo(() => {
    let pool = eligibleMembers;
    if (targetType === 'INTERNS' && cohortMode === 'CUSTOM') {
      pool = eligibleInterns;
    } else if (targetType === 'EMPLOYEES' && cohortMode === 'CUSTOM') {
      pool = eligibleEmployees;
    } else if (targetType === 'HR' && cohortMode === 'CUSTOM') {
      pool = eligibleHR;
    }

    if (!searchQuery.trim()) return pool;
    const q = searchQuery.toLowerCase().trim();
    return pool.filter(
      m =>
        m.name?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.designation?.toLowerCase().includes(q)
    );
  }, [eligibleMembers, eligibleInterns, eligibleEmployees, eligibleHR, targetType, cohortMode, searchQuery]);

  // Compute final effective assignees count preview
  const effectiveAssigneesCount = useMemo(() => {
    if (targetType === 'INTERNS') {
      return cohortMode === 'ALL' ? eligibleInterns.length : selectedMemberIds.length;
    }
    if (targetType === 'EMPLOYEES') {
      return cohortMode === 'ALL' ? eligibleEmployees.length : selectedMemberIds.length;
    }
    if (targetType === 'HR') {
      return cohortMode === 'ALL' ? eligibleHR.length : selectedMemberIds.length;
    }
    return selectedMemberIds.length;
  }, [targetType, cohortMode, eligibleInterns.length, eligibleEmployees.length, eligibleHR.length, selectedMemberIds.length]);

  const toggleMemberSelection = (rawId: string) => {
    const id = String(rawId || '').trim();
    if (!id) return;
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : Array.from(new Set([...prev, id]))
    );
  };

  const removeMember = (rawId: string) => {
    const id = String(rawId || '').trim();
    setSelectedMemberIds(prev => prev.filter(mId => mId !== id));
  };

  const handleTargetTypeChange = (newTarget: AssignmentTargetType) => {
    setTargetType(newTarget);
    setCohortMode('ALL');
    setSelectedMemberIds([]);
    setSearchQuery('');
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Task title is required.');
      return;
    }

    // Assignee validation
    let finalAssigneeIds: string[] = [];

    if (targetType === 'MEMBERS') {
      if (selectedMemberIds.length === 0) {
        setValidationError('Please select at least one team member to assign this task to.');
        return;
      }
      finalAssigneeIds = Array.from(new Set(selectedMemberIds.map(id => String(id || '').trim()))).filter(Boolean);
    } else {
      if (cohortMode === 'CUSTOM') {
        if (selectedMemberIds.length === 0) {
          setValidationError(`Please select at least one ${targetType.toLowerCase()} member or switch to "All".`);
          return;
        }
        finalAssigneeIds = Array.from(new Set(selectedMemberIds.map(id => String(id || '').trim()))).filter(Boolean);
      } else {
        // ALL in cohort
        const cohortList =
          targetType === 'INTERNS'
            ? eligibleInterns
            : targetType === 'EMPLOYEES'
            ? eligibleEmployees
            : eligibleHR;

        if (cohortList.length === 0) {
          setValidationError(`No active ${targetType.toLowerCase()} members found in your authorized scope.`);
          return;
        }
        finalAssigneeIds = Array.from(new Set(cohortList.map(m => String((m as any)._id || m.id || '').trim()))).filter(Boolean);
      }
    }

    if (!deadlineDate) {
      setValidationError('Please specify a task deadline date.');
      return;
    }

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
        targetType,
        assigneeIds: finalAssigneeIds,
        assignedTo: finalAssigneeIds[0],
        priority,
        deadline: deadlineObj.toISOString()
      };

      await taskService.createTask(payload);
      showToast(
        `Task assigned to ${finalAssigneeIds.length} member${finalAssigneeIds.length > 1 ? 's' : ''} successfully.`,
        'success'
      );
      onTaskCreated();

      // Reset form
      setTitle('');
      setDescription('');
      setTargetType('MEMBERS');
      setCohortMode('ALL');
      setSelectedMemberIds([]);
      setSearchQuery('');
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
        background: 'rgba(23, 34, 53, 0.5)',
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
          maxWidth: '560px',
          height: '100%',
          background: 'var(--bg-surface, #FFFFFF)',
          color: 'var(--color-text-primary, #172235)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Drawer Header */}
        <div
          className="p-3.5 sm:p-5 flex items-center justify-between border-b border-[var(--border-color)]"
          style={{
            background: 'var(--bg-surface)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-primary-deep)',
                  textTransform: 'uppercase'
                }}
              >
                Multi-Member Task Delegation
              </span>
              <Badge variant="green" size="sm">
                Shared Task
              </Badge>
            </div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '2px 0 0'
              }}
            >
              Assign New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Drawer"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--bg-surface-elevated, #FAFBF8)',
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
          className="p-3.5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 sm:gap-6"
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
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              1. Task Details
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '4px'
                }}
              >
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Conduct QC Lab Formulation Batch 04"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: 'var(--bg-surface)',
                  color: 'var(--color-text-primary)'
                }}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '4px'
                }}
              >
                Description & Deliverables
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
                  background: 'var(--bg-surface)',
                  color: 'var(--color-text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Section 2: TARGET & MULTI-MEMBER ASSIGNMENT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                2. Assignment Target
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-primary-deep)',
                  background: 'var(--color-soft-green)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                {effectiveAssigneesCount} Recipient{effectiveAssigneesCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Target Options Tabs */}
            <div
              className={`grid ${userRole === 'MANAGER' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-1.5`}
            >
              {/* Option A: Interns */}
              <button
                type="button"
                onClick={() => handleTargetTypeChange('INTERNS')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: targetType === 'INTERNS' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: targetType === 'INTERNS' ? 'var(--color-soft-green)' : 'var(--bg-surface)',
                  color: targetType === 'INTERNS' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <GraduationCap size={16} />
                <span>Interns</span>
              </button>

              {/* Option B: Employees */}
              <button
                type="button"
                onClick={() => handleTargetTypeChange('EMPLOYEES')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: targetType === 'EMPLOYEES' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: targetType === 'EMPLOYEES' ? 'var(--color-soft-green)' : 'var(--bg-surface)',
                  color: targetType === 'EMPLOYEES' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Briefcase size={16} />
                <span>Employees</span>
              </button>

              {/* Option C: HR (Founder & HR only) */}
              {userRole !== 'MANAGER' && (
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('HR')}
                  style={{
                    padding: '0.6rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: targetType === 'HR' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    background: targetType === 'HR' ? 'var(--color-soft-green)' : 'var(--bg-surface)',
                    color: targetType === 'HR' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Shield size={16} />
                  <span>HR Team</span>
                </button>
              )}

              {/* Option D: Specific Member(s) */}
              <button
                type="button"
                onClick={() => handleTargetTypeChange('MEMBERS')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: targetType === 'MEMBERS' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: targetType === 'MEMBERS' ? 'var(--color-soft-green)' : 'var(--bg-surface)',
                  color: targetType === 'MEMBERS' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users size={16} />
                <span>Specific Member(s)</span>
              </button>
            </div>

            {/* Sub-mode for Cohorts: All vs Custom */}
            {targetType !== 'MEMBERS' && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated, #FAFBF8)',
                  border: '1px solid var(--border-color)',
                  alignItems: 'center'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="cohortMode"
                    checked={cohortMode === 'ALL'}
                    onChange={() => {
                      setCohortMode('ALL');
                      setSelectedMemberIds([]);
                    }}
                  />
                  <span>
                    All Eligible {targetType === 'INTERNS' ? 'Interns' : targetType === 'EMPLOYEES' ? 'Employees' : 'HR Members'} (
                    {targetType === 'INTERNS'
                      ? eligibleInterns.length
                      : targetType === 'EMPLOYEES'
                      ? eligibleEmployees.length
                      : eligibleHR.length}
                    )
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="cohortMode"
                    checked={cohortMode === 'CUSTOM'}
                    onChange={() => setCohortMode('CUSTOM')}
                  />
                  <span>Select Specific</span>
                </label>
              </div>
            )}

            {/* Selected Member Chips (when specific or custom selected) */}
            {(targetType === 'MEMBERS' || cohortMode === 'CUSTOM') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {selectedMemberIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedMemberIds.map(id => {
                      const member = eligibleMembers.find(m => (m.id || (m as any)._id) === id);
                      if (!member) return null;
                      return (
                        <div
                          key={id}
                          className="inline-flex items-center gap-1.5 py-1 px-2.5 max-w-full rounded-full text-xs font-semibold"
                          style={{
                            background: 'var(--color-soft-green)',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-primary-deep)'
                          }}
                        >
                          <img
                            src={
                              member.profilePhoto ||
                              member.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                            }
                            alt={member.name}
                            style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span className="truncate">
                            {member.name}{' '}
                            <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>
                              ({member.email || member.role})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMember(id)}
                            aria-label={`Remove ${member.name}`}
                            className="p-1 hover:opacity-75 transition-opacity flex-shrink-0"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--color-primary-deep)',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Member Search & Multi-select Box */}
                <div>
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
                      placeholder={`Search ${targetType === 'MEMBERS' ? 'team members' : targetType.toLowerCase()} by name, role, department...`}
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

                  {/* Filtered Member Selection List */}
                  <div
                    style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      marginTop: '4px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)'
                    }}
                  >
                    {filteredSearchMembers.length === 0 ? (
                      <div
                        style={{
                          padding: '0.85rem',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        No matching team members found.
                      </div>
                    ) : (
                      filteredSearchMembers.map(m => {
                        const mId = m.id || (m as any)._id;
                        const isSelected = selectedMemberIds.includes(mId);

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
                                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  {m.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                  {m.email ? `${m.email} • ` : ''}{m.designation || m.role} • {m.department}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                background: isSelected ? 'var(--color-primary)' : 'var(--bg-surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {isSelected && <Check size={12} color="#FFFFFF" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: PRIORITY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
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
                  background: priority === 'HIGH' ? '#FEF2F2' : 'var(--bg-surface)',
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
                  background: priority === 'MEDIUM' ? '#FEF3C7' : 'var(--bg-surface)',
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
                  background: priority === 'LOW' ? '#F0FDF4' : 'var(--bg-surface)',
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
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              4. Deadline Target *
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '3px'
                  }}
                >
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
                    background: 'var(--bg-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '3px'
                  }}
                >
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
                    background: 'var(--bg-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="mt-auto pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              1 shared task document • Canonical status
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button type="button" variant="outline" size="md" onClick={onClose} disabled={submitting} className="flex-1 sm:flex-initial justify-center">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
                icon={<CheckSquare size={16} />}
                className="flex-1 sm:flex-initial justify-center"
              >
                {submitting ? 'Assigning...' : `Assign (${effectiveAssigneesCount})`}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
