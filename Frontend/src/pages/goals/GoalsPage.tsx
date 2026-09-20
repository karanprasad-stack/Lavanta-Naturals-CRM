import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  User,
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  goalService,
  Goal,
  GoalSummaryData,
  GoalType,
  GoalStatus
} from '../../services/goalService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CreateGoalModal } from '../../components/goals/CreateGoalModal';

export const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER' || role === 'HR_MANAGER';

  useEffect(() => {
    loadData();
  }, [selectedType, selectedStatus, selectedDept]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGoals();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [goalsRes, sumRes] = await Promise.all([
        goalService.getGoals({
          type: selectedType,
          status: selectedStatus,
          department: selectedDept,
          search
        }),
        goalService.getGoalSummary()
      ]);
      setGoals(goalsRes.goals);
      setSummary(sumRes);
    } catch (err) {
      console.error('[GoalsPage] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const res = await goalService.getGoals({
        type: selectedType,
        status: selectedStatus,
        department: selectedDept,
        search
      });
      setGoals(res.goals);
    } catch (err) {
      console.error('[GoalsPage] Error filtering goals:', err);
    }
  };

  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="green" size="sm">ACTIVE</Badge>;
      case 'COMPLETED':
        return <Badge variant="neutral" size="sm" style={{ background: '#DCFCE7', color: '#15803D' }}>COMPLETED</Badge>;
      case 'AT_RISK':
        return <Badge variant="warning" size="sm" style={{ background: '#FEE2E2', color: '#B91C1C' }}>AT RISK</Badge>;
      case 'PAUSED':
        return <Badge variant="neutral" size="sm">PAUSED</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral" size="sm">DRAFT</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: GoalType) => {
    switch (type) {
      case 'COMPANY':
        return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary-deep)', background: '#F0FDF4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #DCFCE7' }}>COMPANY GOAL</span>;
      case 'DEPARTMENT':
        return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1', background: '#F0F9FF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E0F2FE' }}>DEPARTMENT</span>;
      case 'TEAM':
        return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6D28D9', background: '#FAF5FF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #EDE9FE' }}>TEAM</span>;
      default:
        return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', background: '#F8FAFC', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>INDIVIDUAL</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* 1. Header Banner */}
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
              Strategic Execution
            </span>
            <Badge variant="green" size="sm">GOALS & OKRs</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Goals & Performance Planning
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Plan priorities, track outcomes, and connect goals to everyday work.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            style={{ gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </Button>

          {isManagement && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ gap: '6px' }}
            >
              <Plus size={16} />
              <span>Create Goal</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem'
          }}
        >
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid #0284C7' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active Goals</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>{summary.activeGoals}</div>
            <div style={{ fontSize: '0.72rem', color: '#0284C7', marginTop: '2px' }}>In progress</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid #16A34A' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Completed</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16A34A', marginTop: '4px' }}>{summary.completedGoals}</div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: '2px' }}>Achieved outcomes</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: `4px solid ${summary.atRiskGoals > 0 ? '#DC2626' : '#94A3B8'}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>At Risk</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: summary.atRiskGoals > 0 ? '#DC2626' : 'var(--color-text-primary)', marginTop: '4px' }}>{summary.atRiskGoals}</div>
            <div style={{ fontSize: '0.72rem', color: summary.atRiskGoals > 0 ? '#DC2626' : '#64748B', marginTop: '2px' }}>
              {summary.atRiskGoals > 0 ? '>20% behind schedule' : 'On schedule'}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--color-primary-deep)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Average Progress</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', marginTop: '4px' }}>{summary.averageProgress}%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-primary-deep)', marginTop: '2px' }}>Across all OKRs</div>
          </div>
        </div>
      )}

      {/* 3. Filter Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search goals & objectives..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Scope buttons */}
          {(['ALL', 'COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL'] as const).map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              style={{
                border: 'none',
                background: selectedType === t ? 'var(--color-primary)' : '#F1F5F9',
                color: selectedType === t ? '#FFFFFF' : '#475569',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {t === 'ALL' ? 'All Goals' : t}
            </button>
          ))}

          {/* Status select */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.78rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="AT_RISK">At Risk</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
      </div>

      {/* 4. Goal Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ height: '140px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '140px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : goals.length === 0 ? (
        <div
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <Target size={40} color="#94A3B8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            No goals found
          </h3>
          <p style={{ margin: '6px 0 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            No goals match the selected filters.
          </p>
          {isManagement && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={14} style={{ marginRight: '4px' }} />
              <span>Create New Goal</span>
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {goals.map(goal => {
            const daysRemaining = Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <motion.div
                key={goal._id}
                onClick={() => navigate(`/goals/${goal._id}`)}
                whileHover={{ y: -2 }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                {/* Top badges */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    {getTypeBadge(goal.type)}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getStatusBadge(goal.status)}
                    </div>
                  </div>

                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.3
                    }}
                  >
                    {goal.title}
                  </h3>

                  {goal.description && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {goal.description}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Overall Progress</span>
                    <strong style={{ color: goal.progress >= 100 ? '#16A34A' : 'var(--color-primary-deep)' }}>
                      {goal.progress}%
                    </strong>
                  </div>
                  <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${goal.progress}%`,
                        background: goal.status === 'AT_RISK' ? '#DC2626' : (goal.progress >= 100 ? '#16A34A' : 'var(--color-primary)'),
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>

                {/* Footer details */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#EDE9FE',
                        color: '#6D28D9',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      {goal.owner?.profilePhoto ? (
                        <img src={goal.owner.profilePhoto} alt={goal.owner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        goal.owner?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {goal.owner?.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} color="#64748B" />
                    <span>
                      {daysRemaining > 0 ? `${daysRemaining}d left` : 'Due today'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData()}
        userRole={role}
        userDept={currentUser?.department || 'Operations'}
      />
    </div>
  );
};
