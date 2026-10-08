import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { TaskCounters } from '../../types/task';

interface TaskCountersBarProps {
  counters: TaskCounters;
  activeStatus: string;
  onSelectStatus: (status: string) => void;
}

export const TaskCountersBar: React.FC<TaskCountersBarProps> = ({
  counters,
  activeStatus,
  onSelectStatus
}) => {
  const activeCount = (counters.todo || 0) + (counters.inProgress || 0);

  const items = [
    {
      key: 'ACTIVE',
      label: 'Active',
      count: activeCount,
      icon: <Layers size={16} />,
      color: 'var(--color-primary-deep)',
      bg: 'rgba(22, 163, 74, 0.1)'
    },
    {
      key: 'IN_PROGRESS',
      label: 'In Progress',
      count: counters.inProgress,
      icon: <Clock size={16} />,
      color: '#0284C7',
      bg: 'rgba(2, 132, 199, 0.1)'
    },
    {
      key: 'COMPLETED',
      label: 'Completed',
      count: counters.completed,
      icon: <CheckCircle2 size={16} />,
      color: '#16A34A',
      bg: 'rgba(22, 163, 74, 0.1)'
    },
    {
      key: 'OVERDUE',
      label: 'Overdue',
      count: counters.overdue,
      icon: <AlertCircle size={16} />,
      color: '#DC2626',
      bg: 'rgba(220, 38, 38, 0.1)'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.85rem'
      }}
    >
      {items.map(item => {
        const isSelected = activeStatus.toUpperCase() === item.key;
        return (
          <motion.div
            key={item.key}
            whileHover={{ y: -2 }}
            onClick={() => onSelectStatus(isSelected ? 'ALL' : item.key)}
            style={{
              background: 'var(--bg-surface)',
              border: isSelected
                ? '2px solid var(--color-primary)'
                : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              boxShadow: isSelected ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            className="luxury-card"
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: isSelected ? 'var(--color-primary-deep)' : 'var(--color-text-primary)',
                  marginTop: '2px',
                  lineHeight: 1.1
                }}
              >
                {item.count}
              </div>
            </div>

            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color
              }}
            >
              {item.icon}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
