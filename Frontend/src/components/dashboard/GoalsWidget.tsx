import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight, TrendingUp, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { goalService, Goal, GoalSummaryData } from '../../services/goalService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface GoalsWidgetProps {
  maxItems?: number;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ maxItems = 3 }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER' || role === 'HR_MANAGER';

  useEffect(() => {
    loadWidgetData();
  }, [role]);

  const loadWidgetData = async () => {
    try {
      setIsLoading(true);
      const [goalsRes, sumRes] = await Promise.all([
        goalService.getGoals({ limit: maxItems }),
        goalService.getGoalSummary()
      ]);
      setGoals(goalsRes.goals.slice(0, maxItems));
      setSummary(sumRes);
    } catch (err) {
      console.error('[GoalsWidget] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetRoute = () => {
    if (role === 'MANAGER') return '/team-goals';
    if (role === 'EMPLOYEE' || role === 'INTERN') return '/my-goals';
    return '/goals';
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Widget Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(88, 200, 58, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(88, 200, 58, 0.3)'
            }}
          >
            <Target size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {role === 'FOUNDER' ? 'Company Goals & OKRs' : (role === 'MANAGER' ? 'Team Goals & Outcomes' : 'My Goals & Outcomes')}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Strategic milestones and progress tracking
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(getTargetRoute())}
          style={{ fontSize: '0.8rem', gap: '6px' }}
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '1rem 0' }}>
          <div style={{ height: '32px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '32px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Metrics */}
          {summary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px',
                padding: '10px 12px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Active
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#60A5FA' }}>
                  {summary.activeGoals}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  At Risk
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: summary.atRiskGoals > 0 ? '#FF8585' : 'var(--color-text-muted)' }}>
                  {summary.atRiskGoals}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Done
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#86E56B' }}>
                  {summary.completedGoals}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Avg Progress
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {summary.averageProgress}%
                </div>
              </div>
            </div>
          )}

          {/* Goal items */}
          {goals.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--bg-surface-elevated)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              No goals established yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {goals.map(goal => (
                <div
                  key={goal._id}
                  onClick={() => navigate(`/goals/${goal._id}`)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, transform 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      {goal.title}
                    </span>
                    <Badge variant={goal.status === 'COMPLETED' ? 'green' : (goal.status === 'AT_RISK' ? 'warning' : 'neutral')} size="sm">
                      {goal.status}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    <span>{goal.owner?.name}</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{goal.progress}%</strong>
                  </div>

                  <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${goal.progress}%`,
                        background: goal.status === 'AT_RISK' ? '#EF4444' : (goal.progress >= 100 ? '#86E56B' : 'var(--color-primary)'),
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
