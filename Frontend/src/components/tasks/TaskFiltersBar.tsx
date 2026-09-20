import React from 'react';
import { Search, LayoutList, Kanban, RotateCcw } from 'lucide-react';
import { TaskFilterParams } from '../../types/task';
import { User } from '../../types';

interface TaskFiltersBarProps {
  filters: TaskFilterParams;
  onFilterChange: (key: keyof TaskFilterParams, value: string) => void;
  onResetFilters: () => void;
  viewMode: 'table' | 'kanban';
  onViewModeChange: (mode: 'table' | 'kanban') => void;
  teamMembers: User[];
  isManagement: boolean;
}

export const TaskFiltersBar: React.FC<TaskFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  viewMode,
  onViewModeChange,
  teamMembers,
  isManagement
}) => {
  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.priority && filters.priority !== 'ALL') ||
    (filters.assignee && filters.assignee !== 'ALL') ||
    (filters.deadline && filters.deadline !== 'all');

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Left: Search and Filters */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', flex: 1, minWidth: '280px' }}>
        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
          <Search
            size={16}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search task title, description, or person..."
            value={filters.search || ''}
            onChange={e => onFilterChange('search', e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              outline: 'none',
              background: '#FAFBF8',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>

        {/* Priority Filter */}
        <select
          value={filters.priority || 'ALL'}
          onChange={e => onFilterChange('priority', e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem',
            background: '#FFFFFF',
            color: 'var(--color-text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">Priority: All</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        {/* Assignee Filter (for Management) */}
        {isManagement && (
          <select
            value={filters.assignee || 'ALL'}
            onChange={e => onFilterChange('assignee', e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.825rem',
              background: '#FFFFFF',
              color: 'var(--color-text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Assignee: All</option>
            {teamMembers.map(u => (
              <option key={u.id || (u as any)._id} value={u.id || (u as any)._id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        )}

        {/* Deadline Window Filter */}
        <select
          value={filters.deadline || 'all'}
          onChange={e => onFilterChange('deadline', e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem',
            background: '#FFFFFF',
            color: 'var(--color-text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">Deadline: All Time</option>
          <option value="today">Due Today</option>
          <option value="this_week">Due This Week</option>
          <option value="overdue">Past Overdue</option>
        </select>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.45rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: '#FAFBF8',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
            title="Reset Filters"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right: View Toggle (List vs Kanban) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#FAFBF8',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px'
        }}
      >
        <button
          onClick={() => onViewModeChange('table')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0.35rem 0.75rem',
            borderRadius: 'calc(var(--radius-sm) - 2px)',
            border: 'none',
            background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
            color: viewMode === 'table' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
            fontWeight: viewMode === 'table' ? 600 : 500,
            fontSize: '0.8rem',
            boxShadow: viewMode === 'table' ? 'var(--shadow-xs)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <LayoutList size={14} />
          <span>List</span>
        </button>

        <button
          onClick={() => onViewModeChange('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0.35rem 0.75rem',
            borderRadius: 'calc(var(--radius-sm) - 2px)',
            border: 'none',
            background: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
            color: viewMode === 'kanban' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
            fontWeight: viewMode === 'kanban' ? 600 : 500,
            fontSize: '0.8rem',
            boxShadow: viewMode === 'kanban' ? 'var(--shadow-xs)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Kanban size={14} />
          <span>Kanban</span>
        </button>
      </div>
    </div>
  );
};
