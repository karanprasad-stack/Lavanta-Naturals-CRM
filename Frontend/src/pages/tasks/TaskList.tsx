import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, CheckSquare, Sparkles, AlertCircle } from 'lucide-react';
import { Task, TaskCounters, TaskFilterParams, TaskStatus } from '../../types/task';
import { User } from '../../types';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskCountersBar } from '../../components/tasks/TaskCountersBar';
import { TaskFiltersBar } from '../../components/tasks/TaskFiltersBar';
import { TaskTable } from '../../components/tasks/TaskTable';
import { KanbanBoard } from '../../components/tasks/KanbanBoard';
import { TaskCreateDrawer } from '../../components/tasks/TaskCreateDrawer';
import { TaskEditModal } from '../../components/tasks/TaskEditModal';
import { TaskCompleteModal } from '../../components/tasks/TaskCompleteModal';
import { TaskSkeleton } from '../../components/tasks/TaskSkeleton';
import { Button } from '../../components/ui/Button';
import { socketService } from '../../services/socketService';

export const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, activeRole } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [counters, setCounters] = useState<TaskCounters>({
    all: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Helper to parse status query parameter
  const getInitialStatus = (): string => {
    const s = (searchParams.get('status') || '').toUpperCase();
    if (s === 'OVERDUE') return 'OVERDUE';
    if (s === 'ACTIVE') return 'ACTIVE';
    if (s === 'IN_PROGRESS' || s === 'IN-PROGRESS') return 'IN_PROGRESS';
    if (s === 'TODO' || s === 'TO_DO' || s === 'TO-DO') return 'TODO';
    if (s === 'COMPLETED') return 'COMPLETED';
    return 'ALL';
  };

  // Filters State
  const [filters, setFilters] = useState<TaskFilterParams>({
    search: searchParams.get('search') || '',
    status: getInitialStatus(),
    priority: searchParams.get('priority') || 'ALL',
    assignee: searchParams.get('assignee') || 'ALL',
    deadline: searchParams.get('deadline') || 'all'
  });

  // Sync state if URL search parameters change externally
  useEffect(() => {
    const urlStatus = getInitialStatus();
    setFilters(prev => {
      if (prev.status !== urlStatus) {
        return { ...prev, status: urlStatus };
      }
      return prev;
    });
  }, [searchParams]);

  // View Mode: Table vs Kanban (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(() => {
    return (localStorage.getItem('lavanta_task_view') as 'table' | 'kanban') || 'table';
  });

  // Drawer / Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeModalTask, setCompleteModalTask] = useState<Task | null>(null);
  const [editModalTask, setEditModalTask] = useState<Task | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  const userRole = (currentUser?.role || activeRole || 'EMPLOYEE').toUpperCase();
  const isManagement = userRole === 'FOUNDER' || userRole === 'HR' || userRole === 'MANAGER';
  const currentUserId = currentUser?.id || (currentUser as any)?._id;

  // Fetch Team members for assignee dropdown
  useEffect(() => {
    if (isManagement) {
      userService.getUsers().then(res => {
        setTeamMembers(res.users);
      }).catch(err => {
        console.warn('Could not load team members for task assignment:', err);
      });
    }
  }, [isManagement]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskService.getTasks(filters);
      setTasks(res.tasks);
      setCounters(res.counters);
    } catch (err: any) {
      console.error('[TaskList] Failed to fetch tasks:', err);
      setError(err?.message || 'Failed to load tasks. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time synchronization for new task assignments and updates
  useEffect(() => {
    const socket = socketService.connect();
    if (!socket) return;

    const handleTaskChange = () => {
      fetchTasks();
    };

    const handleNotification = (notif: any) => {
      if (notif?.category === 'TASK' || notif?.link?.includes('/tasks')) {
        fetchTasks();
      }
    };

    socket.on('task_assigned', handleTaskChange);
    socket.on('task_updated', handleTaskChange);
    socket.on('task_deleted', handleTaskChange);
    socket.on('notification_created', handleNotification);

    return () => {
      socket.off('task_assigned', handleTaskChange);
      socket.off('task_updated', handleTaskChange);
      socket.off('task_deleted', handleTaskChange);
      socket.off('notification_created', handleNotification);
    };
  }, [fetchTasks]);

  const handleFilterChange = (key: keyof TaskFilterParams, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    const newParams = new URLSearchParams(searchParams);
    if (key === 'status') {
      if (value === 'ALL') {
        newParams.delete('status');
      } else {
        newParams.set('status', value.toLowerCase());
      }
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      assignee: 'ALL',
      deadline: 'all'
    });
    setSearchParams({}, { replace: true });
  };

  const handleViewModeChange = (mode: 'table' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('lavanta_task_view', mode);
  };

  // Workflow actions
  const handleStartTask = async (taskId: string) => {
    try {
      await taskService.startTask(taskId);
      showToast('Task started! Status updated to In Progress.', 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err?.message || 'Failed to start task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.cancelTask(taskId);
      showToast('Task cancelled successfully.', 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel task.', 'error');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      if (newStatus === 'IN_PROGRESS') {
        await taskService.startTask(taskId);
      } else if (newStatus === 'COMPLETED') {
        const target = tasks.find(t => t._id === taskId);
        if (target) {
          setCompleteModalTask(target);
          return;
        }
      } else if (newStatus === 'CANCELLED') {
        await taskService.cancelTask(taskId);
      } else {
        await taskService.updateTask(taskId, { status: newStatus });
      }
      showToast(`Task status updated to ${newStatus}.`, 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update task status.', 'error');
    }
  };

  const handleStatusDrop = async (taskId: string, newStatus: TaskStatus) => {
    await handleStatusChange(taskId, newStatus);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Page Header */}
      <div
        className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Tasks
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            {isManagement
              ? 'Manage and track work across your team.'
              : 'Manage and track your assigned work.'}
          </p>
        </div>

        {isManagement && (
          <div className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => setIsCreateOpen(true)}
              className="w-full sm:w-auto justify-center"
            >
              + Create Task
            </Button>
          </div>
        )}
      </div>

      {/* 2. Task Summary Counters (Active, In Progress, Completed, Overdue) */}
      <TaskCountersBar
        counters={counters}
        activeStatus={filters.status || 'ALL'}
        onSelectStatus={statusKey => handleFilterChange('status', statusKey)}
      />

      {/* 3. Filters & View Toggle Bar */}
      <TaskFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        teamMembers={teamMembers}
        isManagement={isManagement}
      />

      {/* 5. Main Content: Table vs Kanban */}
      {loading ? (
        <TaskSkeleton view={viewMode} />
      ) : error ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#DC2626'
          }}
        >
          <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 600 }}>{error}</div>
          <Button variant="outline" size="sm" onClick={fetchTasks} style={{ marginTop: '1rem' }}>
            Retry
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <TaskTable
          tasks={tasks}
          isManagement={isManagement}
          currentUserId={currentUserId}
          currentUser={currentUser}
          onStartTask={handleStartTask}
          onOpenCompleteModal={task => setCompleteModalTask(task)}
          onEditTask={task => setEditModalTask(task)}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <KanbanBoard
          tasks={tasks}
          isManagement={isManagement}
          currentUserId={currentUserId}
          currentUser={currentUser}
          onStartTask={handleStartTask}
          onOpenCompleteModal={task => setCompleteModalTask(task)}
          onStatusChange={handleStatusDrop}
          onEditTask={task => setEditModalTask(task)}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* 6. Task Creation Drawer */}
      <TaskCreateDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={() => {
          fetchTasks();
          setIsCreateOpen(false);
        }}
        teamMembers={teamMembers}
        currentUser={currentUser}
      />

      {/* 7. Task Complete Modal */}
      <TaskCompleteModal
        task={completeModalTask}
        isOpen={Boolean(completeModalTask)}
        onClose={() => setCompleteModalTask(null)}
        onCompleted={() => {
          fetchTasks();
          setCompleteModalTask(null);
        }}
      />

      {/* 8. Task Edit Modal (Management only) */}
      <TaskEditModal
        task={editModalTask}
        isOpen={Boolean(editModalTask)}
        onClose={() => setEditModalTask(null)}
        onUpdated={() => {
          fetchTasks();
          setEditModalTask(null);
        }}
        teamMembers={teamMembers}
      />
    </div>
  );
};

export default TaskList;
