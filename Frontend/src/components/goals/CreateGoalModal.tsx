import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, AlertCircle } from 'lucide-react';
import { goalService, GoalType, GoalPriority } from '../../services/goalService';
import { Button } from '../ui/Button';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newGoal: any) => void;
  userRole: string;
  userDept: string;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userRole,
  userDept
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>(userRole === 'FOUNDER' || userRole === 'HR' ? 'COMPANY' : 'DEPARTMENT');
  const [department, setDepartment] = useState(userDept || 'Operations');
  const [team, setTeam] = useState('Core');
  const [priority, setPriority] = useState<GoalPriority>('HIGH');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a goal title.');
      return;
    }
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      setError('Target end date cannot be earlier than start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const goal = await goalService.createGoal({
        title: title.trim(),
        description: description.trim(),
        type,
        department,
        team,
        priority,
        startDate,
        endDate
      });
      onSuccess(goal);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(23, 34, 53, 0.4)',
          backdropFilter: 'blur(3px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '560px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #DCFCE7'
                }}
              >
                <Target size={18} color="var(--color-primary-deep)" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Create New Goal & OKR
                </h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Establish strategic priorities and track outcomes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '6px',
                  color: '#DC2626',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Goal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Scale Lavanta Naturals Direct-to-Consumer Revenue"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.88rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Describe what success looks like and the strategic context..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Goal Scope / Type
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as GoalType)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  {(userRole === 'FOUNDER' || userRole === 'HR') && (
                    <option value="COMPANY">Company Goal</option>
                  )}
                  <option value="DEPARTMENT">Department Goal</option>
                  <option value="TEAM">Team Goal</option>
                  <option value="INDIVIDUAL">Individual Goal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as GoalPriority)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Department
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="Executive">Executive</option>
                  <option value="Operations">Operations</option>
                  <option value="Formulations">Formulations</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Team / Pod
                </label>
                <input
                  type="text"
                  value={team}
                  onChange={e => setTeam(e.target.value)}
                  placeholder="e.g. Core, Packaging, DTC"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Target Completion Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Goal...' : 'Establish Goal'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
