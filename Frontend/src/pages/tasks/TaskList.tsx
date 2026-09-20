import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { TaskCompleteModal } from '../../components/tasks/TaskCompleteModal';
import { TaskSkeleton } from '../../components/tasks/TaskSkeleton';
import { Button } from '../../components/ui/Button';

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

  // Filters State
  const [filters, setFilters] = useState<TaskFilterParams>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    assignee: 'ALL',
    deadline: 'all'
  });

  // View Mode: Table vs Kanban (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(() => {
    return (localStorage.getItem('lavanta_task_view') as 'table' | 'kanban') || 'table';
  });

  // Drawer / Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeModalTask, setCompleteModalTask] = useState<Task | null>(null);
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

  const handleFilterChange = (key: keyof TaskFilterParams, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      assignee: 'ALL',
      deadline: 'all'
    });
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

  const handleStatusDrop = async (taskId: string, newStatus: TaskStatus) => {
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
      }
      fetchTasks();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update task status.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Page Header */}
      <div
        style={{
          background: '#FFFFFF',
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
              {isManagement ? 'Team Task Management & Delegation' : 'Personal Workspace Agenda'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {isManagement ? 'Tasks & Deliverables' : 'My Assigned Tasks'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            {isManagement
              ? 'Assign, monitor, and manage operational tasks across departments.'
              : 'Execute assigned deliverables, submit proof of work, and track completion.'}
          </p>
        </div>

        {isManagement && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            Assign Task
          </Button>
        )}
      </div>

      {/* 2. Task Counters Bar */}
      <TaskCountersBar
        counters={counters}
        activeStatus={filters.status || 'ALL'}
        onSelectStatus={statusKey => handleFilterChange('status', statusKey)}
      />

      {/* 3. Compact Management Monitoring Banner */}
      {isManagement && (
        <div
          style={{
            background: '#FAFBF8',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.825rem',
            color: 'var(--color-text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--color-primary-deep)" />
            <span>
              <strong>Operations Pulse:</strong>{' '}
              {counters.inProgress} active task{counters.inProgress === 1 ? '' : 's'} underway across units.{' '}
              {counters.overdue > 0 && (
                <span style={{ color: '#DC2626', fontWeight: 700 }}>
                  ⚠️ {counters.overdue} task{counters.overdue === 1 ? ' is' : 's are'} overdue.
                </span>
              )}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Real-time MongoDB Sync
          </span>
        </div>
      )}

      {/* 4. Filters & View Toggle Bar */}
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
          onStartTask={handleStartTask}
          onOpenCompleteModal={task => setCompleteModalTask(task)}
        />
      ) : (
        <KanbanBoard
          tasks={tasks}
          isManagement={isManagement}
          currentUserId={currentUserId}
          onStartTask={handleStartTask}
          onOpenCompleteModal={task => setCompleteModalTask(task)}
          onStatusChange={handleStatusDrop}
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
    </div>
  );
};

export default TaskList;
