import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Play,
  Paperclip,
  MessageSquare,
  AlertCircle,
  Calendar,
  User,
  Shield,
  Trash2,
  Edit3,
  FileText
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TaskActivity } from '../../types/task';
import { User as UserType } from '../../types';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskSkeleton } from '../../components/tasks/TaskSkeleton';
import { TaskActivityTimeline } from '../../components/tasks/TaskActivityTimeline';
import { TaskCommentsList } from '../../components/tasks/TaskCommentsList';
import { TaskCompleteModal } from '../../components/tasks/TaskCompleteModal';
import { TaskEditModal } from '../../components/tasks/TaskEditModal';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);

  const currentUserId = currentUser?.id || (currentUser as any)?._id;
  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = userRole === 'FOUNDER' || userRole === 'HR' || userRole === 'MANAGER';

  useEffect(() => {
    if (isManagement) {
      userService.getUsers().then(res => {
        setTeamMembers(res.users);
      }).catch(err => {
        console.warn('Could not load team members for task editing:', err);
      });
    }
  }, [isManagement]);

  const fetchTaskDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [taskRes, actRes] = await Promise.all([
        taskService.getTaskById(id),
        taskService.getTaskActivity(id)
      ]);
      setTask(taskRes);
      setActivities(actRes);
    } catch (err: any) {
      console.error('[TaskDetail] Failed to load task details:', err);
      setError(err?.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleStartTask = async () => {
    if (!task) return;
    try {
      await taskService.startTask(task._id);
      showToast('Task started! Status changed to In Progress.', 'success');
      fetchTaskDetails();
    } catch (err: any) {
      showToast(err?.message || 'Failed to start task.', 'error');
    }
  };

  const handleCancelTask = async () => {
    if (!task) return;
    if (!window.confirm('Are you sure you want to cancel this task?')) return;
    try {
      await taskService.cancelTask(task._id);
      showToast('Task has been cancelled.', 'info');
      fetchTaskDetails();
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel task.', 'error');
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      if (newStatus === 'IN_PROGRESS') {
        await taskService.startTask(task._id);
      } else if (newStatus === 'COMPLETED') {
        setIsCompleteOpen(true);
        return;
      } else if (newStatus === 'CANCELLED') {
        await handleCancelTask();
        return;
      } else {
        await taskService.updateTask(task._id, { status: newStatus });
      }
      showToast(`Task status updated to ${newStatus}.`, 'success');
      fetchTaskDetails();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update task status.', 'error');
    }
  };

  const handleAddComment = async (message: string) => {
    if (!task) return;
    const res = await taskService.addComment(task._id, message);
    setTask(prev => (prev ? { ...prev, comments: res.comments } : null));
    // Refresh activities to include comment
    const actRes = await taskService.getTaskActivity(task._id);
    setActivities(actRes);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    if (p === 'HIGH') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626' }} />
          HIGH PRIORITY
        </span>
      );
    }
    if (p === 'MEDIUM') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B45309' }} />
          MEDIUM PRIORITY
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
        LOW PRIORITY
      </span>
    );
  };

  const getStatusBadge = (status: TaskStatus, isOverdue?: boolean) => {
    if (isOverdue && status !== 'COMPLETED' && status !== 'CANCELLED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <AlertCircle size={13} /> OVERDUE
        </span>
      );
    }
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="green" size="md">COMPLETED</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="lavender" size="md">IN PROGRESS</Badge>;
      case 'TODO':
        return <Badge variant="warning" size="md">TO DO</Badge>;
      case 'DELAYED':
        return <Badge variant="danger" size="md">DELAYED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" size="md">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  if (loading) {
    return <TaskSkeleton view="detail" />;
  }

  if (error || !task) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '3rem 2rem',
          textAlign: 'center',
          maxWidth: '520px',
          margin: '2rem auto'
        }}
      >
        <AlertCircle size={32} color="#DC2626" style={{ margin: '0 auto 8px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Task Not Found or Access Denied
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
          {error || 'You do not have permission to access this task, or it may have been removed.'}
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/tasks')} style={{ marginTop: '1.25rem' }}>
          ← Back to Tasks
        </Button>
      </div>
    );
  }

  const perms = getTaskPermissions(currentUser, task);
  const isOverdue = task.isOverdue && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
  const deadlineDate = new Date(task.deadline);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={15} />}
          onClick={() => navigate('/tasks')}
          style={{ paddingLeft: 0, color: 'var(--color-text-secondary)' }}
        >
          Back to Tasks
        </Button>
      </div>

      {/* Task Header Banner */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {getPriorityBadge(task.priority)}
            {getStatusBadge(task.status, isOverdue)}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Created {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {task.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
            <div>
              Assigned to: <strong style={{ color: 'var(--color-text-primary)' }}>{task.assignedTo?.name}</strong>
            </div>
            <span>•</span>
            <div>
              Assigned by: <strong style={{ color: 'var(--color-text-primary)' }}>{task.assignedBy?.name}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Management Status Selector */}
          {perms.canChangeStatus && perms.isManagement && (
            <select
              value={task.status}
              onChange={e => handleStatusChange(e.target.value as TaskStatus)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          {/* Management Edit Button */}
          {perms.canEdit && (
            <Button
              variant="outline"
              size="md"
              icon={<Edit3 size={15} />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Task
            </Button>
          )}

          {/* Management Cancel Button */}
          {perms.canDelete && task.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              size="md"
              icon={<Trash2 size={15} />}
              onClick={handleCancelTask}
              style={{ color: '#DC2626' }}
            >
              Cancel Task
            </Button>
          )}

          {/* Employee/Assignee Actions (strictly for non-management assignees) */}
          {!perms.canEdit && perms.canStart && (
            <Button
              variant="primary"
              size="md"
              icon={<Play size={16} />}
              onClick={handleStartTask}
            >
              Start Task
            </Button>
          )}

          {!perms.canEdit && perms.canComplete && (
            <Button
              variant="primary"
              size="md"
              icon={<CheckCircle2 size={16} />}
              onClick={() => setIsCompleteOpen(true)}
            >
              Mark Completed
            </Button>
          )}

          {task.status === 'COMPLETED' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: '#F0FDF4',
                border: '1px solid #DCFCE7',
                color: '#16A34A',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <CheckCircle2 size={16} />
              <span>
                Completed{' '}
                {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Successfully'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Description, Proof of Work, Activity Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Description Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.85rem' }}>
              Task Requirements & Brief
            </h3>
            {task.description ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                No additional description provided for this task.
              </p>
            )}
          </div>

          {/* Proof of Work Card */}
          {task.proofOfWork && task.proofOfWork.length > 0 && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Submitted Proof of Work
                </h3>
                <Badge variant="green" size="sm">Deliverable Attached</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {task.proofOfWork.map(p => (
                  <div
                    key={p._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#FAFBF8',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-xs)',
                          background: '#DCFCE7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#16A34A'
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                          {p.filename}
                        </div>
                        {p.comment && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            "{p.comment}"
                          </div>
                        )}
                      </div>
                    </div>

                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--color-primary-deep)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>View Asset</span>
                      <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
              Activity Timeline & Audit Trail
            </h3>
            <TaskActivityTimeline activities={activities} />
          </div>
        </div>

        {/* RIGHT COLUMN: Task Metadata & Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metadata Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
              Task Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              {/* Deadline */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Deadline</span>
                <span style={{ fontWeight: 600, color: isOverdue ? '#DC2626' : 'var(--color-text-primary)' }}>
                  {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                  {deadlineDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Department */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Department</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary-deep)' }}>{task.department}</span>
              </div>

              {/* Assignee Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Assignee</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img
                    src={task.assignedTo?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                    alt={task.assignedTo?.name}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{task.assignedTo?.name}</span>
                </div>
              </div>

              {/* Assignor Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Assigned By</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{task.assignedBy?.name}</span>
              </div>

              {/* Started At */}
              {task.startedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Started</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{new Date(task.startedAt).toLocaleDateString()}</span>
                </div>
              )}

              {/* Completed At */}
              {task.completedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Completed</span>
                  <span style={{ color: '#16A34A', fontWeight: 600 }}>{new Date(task.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments & Discussion Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Discussion
              </h3>
              <Badge variant="neutral" size="sm">
                {task.comments?.length || 0} comment{task.comments?.length === 1 ? '' : 's'}
              </Badge>
            </div>

            <TaskCommentsList
              comments={task.comments || []}
              onAddComment={handleAddComment}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      <TaskCompleteModal
        task={task}
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        onCompleted={() => {
          setIsCompleteOpen(false);
          fetchTaskDetails();
        }}
      />

      {/* Edit Modal (Management) */}
      <TaskEditModal
        task={task}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdated={() => {
          setIsEditOpen(false);
          fetchTaskDetails();
        }}
        teamMembers={teamMembers}
      />
    </div>
  );
};

export default TaskDetail;
