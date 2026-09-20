import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowRight,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Play,
  AlertCircle
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface KanbanBoardProps {
  tasks: Task[];
  isManagement: boolean;
  currentUserId?: string;
  onStartTask: (taskId: string) => void;
  onOpenCompleteModal: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  isManagement,
  currentUserId,
  onStartTask,
  onOpenCompleteModal,
  onStatusChange
}) => {
  const navigate = useNavigate();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDragCol, setActiveDragCol] = useState<TaskStatus | null>(null);

  const columns: Array<{ status: TaskStatus; title: string; color: string; bg: string }> = [
    { status: 'TODO', title: 'To Do', color: '#B45309', bg: '#FEF3C7' },
    { status: 'IN_PROGRESS', title: 'In Progress', color: 'var(--color-primary-deep)', bg: '#F0FDF4' },
    { status: 'COMPLETED', title: 'Completed', color: '#16A34A', bg: '#DCFCE7' },
    { status: 'DELAYED', title: 'Delayed', color: '#DC2626', bg: '#FEE2E2' },
    { status: 'CANCELLED', title: 'Cancelled', color: '#5A667A', bg: '#F1F5F0' }
  ];

  const getPriorityDot = (p: TaskPriority) => {
    if (p === 'HIGH') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#DC2626' }} />
          HIGH
        </span>
      );
    }
    if (p === 'MEDIUM') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#B45309', fontWeight: 700 }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#B45309' }} />
          MEDIUM
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A' }} />
        LOW
      </span>
    );
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!isManagement) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: TaskStatus) => {
    if (!isManagement) return;
    e.preventDefault();
    setActiveDragCol(colStatus);
  };

  const handleDrop = (e: React.DragEvent, colStatus: TaskStatus) => {
    if (!isManagement) return;
    e.preventDefault();
    setActiveDragCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId && onStatusChange) {
      onStatusChange(taskId, colStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        alignItems: 'start'
      }}
    >
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status);
        const isTarget = activeDragCol === col.status;

        return (
          <div
            key={col.status}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={() => setActiveDragCol(null)}
            onDrop={e => handleDrop(e, col.status)}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: isTarget ? '2px dashed var(--color-primary)' : '1px solid var(--border-color)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              minHeight: '480px',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            {/* Column Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.65rem',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {col.title}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    background: col.bg,
                    color: col.color
                  }}
                >
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {colTasks.map(t => {
                const isOverdue = t.isOverdue && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
                const deadlineDate = new Date(t.deadline);

                return (
                  <motion.div
                    key={t._id}
                    draggable={isManagement}
                    onDragStart={e => handleDragStart(e as any, t._id)}
                    whileHover={{ y: -2 }}
                    style={{
                      background: '#FAFBF8',
                      borderRadius: 'var(--radius-sm)',
                      border: isOverdue ? '1px solid #FECACA' : '1px solid var(--border-color)',
                      padding: '0.85rem',
                      cursor: isManagement ? 'grab' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                    className="luxury-card"
                  >
                    {/* Header: Priority & Overdue */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {getPriorityDot(t.priority)}
                      {isOverdue && (
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            color: '#DC2626',
                            background: '#FEE2E2',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <div
                      onClick={() => navigate(`/tasks/${t._id}`)}
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.35,
                        cursor: 'pointer'
                      }}
                      className="hover-underline"
                    >
                      {t.title}
                    </div>

                    {/* Metadata & Assignee */}
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                      Assigned by <strong style={{ color: 'var(--color-text-primary)' }}>{t.assignedBy?.name}</strong>
                    </div>

                    {/* Deadline */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.725rem',
                        color: isOverdue ? '#DC2626' : 'var(--color-text-muted)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>

                      {/* Attachments / Comments icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {t.comments?.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <MessageSquare size={11} /> {t.comments.length}
                          </span>
                        )}
                        {t.proofOfWork?.length > 0 && (
                          <Paperclip size={11} color="var(--color-primary-deep)" />
                        )}
                      </div>
                    </div>

                    {/* Footer: Assignee Avatar + Workflow Button */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img
                          src={t.assignedTo?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                          alt={t.assignedTo?.name || 'User'}
                          style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        <span style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                          {t.assignedTo?.name}
                        </span>
                      </div>

                      <div>
                        {t.status === 'TODO' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onStartTask(t._id);
                            }}
                            style={{
                              background: 'var(--color-soft-green)',
                              border: '1px solid var(--color-primary)',
                              color: 'var(--color-primary-deep)',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-xs)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Play size={10} /> Start
                          </button>
                        )}

                        {t.status === 'IN_PROGRESS' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onOpenCompleteModal(t);
                            }}
                            style={{
                              background: 'var(--color-primary)',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-xs)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <CheckCircle2 size={10} /> Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {colTasks.length === 0 && (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    fontStyle: 'italic'
                  }}
                >
                  No tasks in {col.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
