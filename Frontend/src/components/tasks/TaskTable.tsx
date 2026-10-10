import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Play,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { User } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getTaskPermissions } from '../../utils/taskPermissions';

interface TaskTableProps {
  tasks: Task[];
  isManagement: boolean;
  currentUserId?: string;
  currentUser?: User | null;
  onStartTask: (taskId: string) => void;
  onOpenCompleteModal: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isManagement,
  currentUserId,
  currentUser,
  onStartTask,
  onOpenCompleteModal,
  onEditTask,
  onDeleteTask,
  onStatusChange
}) => {
  const navigate = useNavigate();

  const getPriorityBadge = (p: TaskPriority) => {
    if (p === 'HIGH') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.725rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #FECACA'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626' }} />
          HIGH
        </span>
      );
    }
    if (p === 'MEDIUM') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.725rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FDE68A'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B45309' }} />
          MEDIUM
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.725rem',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #DCFCE7'
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
        LOW
      </span>
    );
  };

  const getStatusBadge = (status: TaskStatus, isOverdue?: boolean) => {
    if (isOverdue && status !== 'COMPLETED' && status !== 'CANCELLED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.725rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #FECACA'
          }}
        >
          <AlertCircle size={12} /> OVERDUE
        </span>
      );
    }
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="green" size="sm">COMPLETED</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="lavender" size="sm">IN PROGRESS</Badge>;
      case 'TODO':
        return <Badge variant="warning" size="sm">TO DO</Badge>;
      case 'DELAYED':
        return <Badge variant="danger" size="sm">DELAYED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const formatDeadline = (dateStr: string) => {
    const d = new Date(dateStr);
    const isPast = d.getTime() < Date.now();
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPast ? '#DC2626' : 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
        <Clock size={13} />
        {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    );
  };

  if (tasks.length === 0) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--color-soft-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'var(--color-primary-deep)'
          }}
        >
          <CheckCircle2 size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          You're All Caught Up!
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '4px auto 0', maxWidth: '380px' }}>
          No tasks match your current filter selection. Adjust your filters or assign a new task.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                background: 'var(--bg-surface-elevated, #FAFBF8)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <th style={{ padding: '0.85rem 1.25rem' }}>Task</th>
              <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Assigned To</th>
              <th style={{ padding: '0.85rem 1rem' }}>Assigned By</th>
              <th style={{ padding: '0.85rem 1rem' }}>Deadline</th>
              <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, idx) => {
              const perms = getTaskPermissions(currentUser, t);
              return (
                <tr
                  key={t._id}
                  style={{
                    borderBottom: idx === tasks.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    transition: 'background-color 0.15s ease'
                  }}
                  className="table-row-hover"
                >
                  {/* Task Title & Description preview */}
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle', maxWidth: '320px' }}>
                    <div
                      onClick={() => navigate(`/tasks/${t._id}`)}
                      style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        lineHeight: 1.3
                      }}
                      className="hover-underline"
                    >
                      {t.title}
                    </div>
                    {t.description && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {t.comments && t.comments.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MessageSquare size={11} /> {t.comments.length}
                        </span>
                      )}
                      {t.proofOfWork && t.proofOfWork.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
                          <Paperclip size={11} /> Proof Attached
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                    {getPriorityBadge(t.priority)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                    {perms.canChangeStatus && perms.isManagement ? (
                      <select
                        value={t.status}
                        onChange={e => onStatusChange?.(t._id, e.target.value as TaskStatus)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          background: 'var(--bg-surface-elevated, #FAFBF8)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--border-color)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="TODO">TO DO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    ) : (
                      getStatusBadge(t.status, t.isOverdue)
                    )}
                  </td>

                  {/* Assigned Members */}
                  <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                    {(() => {
                      const assigneesList =
                        t.assignees && t.assignees.length > 0 ? t.assignees : t.assignedTo ? [t.assignedTo] : [];

                      if (assigneesList.length === 0) {
                        return <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Unassigned</span>;
                      }

                      if (assigneesList.length === 1) {
                        const single = assigneesList[0];
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={
                                single?.profilePhoto ||
                                single?.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                              }
                              alt={single?.name || 'User'}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                                {single?.name || 'User'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                {single?.role}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Multiple assignees: avatar stack + summary
                      const visibleAvatars = assigneesList.slice(0, 3);
                      const overflowCount = assigneesList.length - 3;
                      const namesTooltip = assigneesList.map(a => `${a.name} (${a.role})`).join(', ');

                      return (
                        <div title={namesTooltip} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {visibleAvatars.map((a, idx) => (
                              <img
                                key={a._id || idx}
                                src={
                                  a?.profilePhoto ||
                                  a?.avatar ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                                }
                                alt={a.name}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #FFFFFF',
                                  marginLeft: idx > 0 ? '-8px' : 0,
                                  boxShadow: 'var(--shadow-xs)'
                                }}
                              />
                            ))}
                            {overflowCount > 0 && (
                              <span
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  background: 'var(--color-primary-subtle)',
                                  color: 'var(--color-primary-deep)',
                                  fontSize: '0.675rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid #FFFFFF',
                                  marginLeft: '-8px'
                                }}
                              >
                                +{overflowCount}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                              {assigneesList.length} assignees
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                              Shared task
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Assigned By */}
                  <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {t.assignedBy?.name || 'System'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {t.assignedBy?.role}
                    </div>
                  </td>

                  {/* Deadline */}
                  <td style={{ padding: '0.9rem 1rem', verticalAlign: 'middle' }}>
                    {formatDeadline(t.deadline)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {/* Management Actions (Founder, HR, Manager) */}
                      {perms.canEdit && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit3 size={13} />}
                            onClick={() => onEditTask?.(t)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            title="Edit Task"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 size={13} />}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to cancel task "${t.title}"?`)) {
                                onDeleteTask?.(t._id);
                              }
                            }}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#DC2626' }}
                            title="Cancel / Delete Task"
                          >
                            Delete
                          </Button>
                        </>
                      )}

                      {/* Employee / Intern Workflow Action (strictly for assignee when not management) */}
                      {!perms.canEdit && perms.canStart && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Play size={13} />}
                          onClick={() => onStartTask(t._id)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          Start
                        </Button>
                      )}

                      {!perms.canEdit && perms.canComplete && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CheckCircle2 size={13} />}
                          onClick={() => onOpenCompleteModal(t)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          Complete
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tasks/${t._id}`)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title="View Details"
                      >
                        <ArrowRight size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
