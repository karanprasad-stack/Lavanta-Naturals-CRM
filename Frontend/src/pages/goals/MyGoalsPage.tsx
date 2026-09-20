import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { goalService, Goal, GoalSummaryData } from '../../services/goalService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const MyGoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'at_risk'>('all');

  useEffect(() => {
    loadMyGoals();
  }, []);

  const loadMyGoals = async () => {
    try {
      setIsLoading(true);
      const [goalsRes, sumRes] = await Promise.all([
        goalService.getGoals(),
        goalService.getGoalSummary()
      ]);
      setGoals(goalsRes.goals);
      setSummary(sumRes);
    } catch (err) {
      console.error('[MyGoalsPage] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGoals = goals.filter(g => {
    if (activeTab === 'active') return g.status === 'ACTIVE';
    if (activeTab === 'completed') return g.status === 'COMPLETED';
    if (activeTab === 'at_risk') return g.status === 'AT_RISK';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* 1. Header */}
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
              Personal Impact
            </span>
            <Badge variant="green" size="sm">MY GOALS</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            My Goals & Key Results
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Understand the strategic outcomes your daily tasks and projects are contributing toward.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadMyGoals} style={{ gap: '6px' }}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 2. Metric Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid #0284C7' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active Goals</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>{summary.activeGoals}</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid #16A34A' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Completed</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16A34A', marginTop: '4px' }}>{summary.completedGoals}</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: `4px solid ${summary.atRiskGoals > 0 ? '#DC2626' : '#94A3B8'}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>At Risk</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: summary.atRiskGoals > 0 ? '#DC2626' : 'var(--color-text-primary)', marginTop: '4px' }}>{summary.atRiskGoals}</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--color-primary-deep)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Average Progress</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary-deep)', marginTop: '4px' }}>{summary.averageProgress}%</div>
          </div>
        </div>
      )}

      {/* 3. Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        {(['all', 'active', 'completed', 'at_risk'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              border: 'none',
              background: activeTab === tab ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#475569',
              fontWeight: 600,
              fontSize: '0.8rem',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* 4. Goal Cards */}
      {isLoading ? (
        <div style={{ height: '140px', background: '#FFFFFF', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
      ) : filteredGoals.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Target size={36} color="#94A3B8" style={{ marginBottom: '8px' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>No goals found</h3>
          <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#64748B' }}>
            You have no assigned goals in this category.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredGoals.map(goal => (
            <div
              key={goal._id}
              onClick={() => navigate(`/goals/${goal._id}`)}
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                cursor: 'pointer',
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
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Badge variant="neutral" size="sm">{goal.type}</Badge>
                  <Badge
                    variant={goal.status === 'COMPLETED' ? 'green' : (goal.status === 'AT_RISK' ? 'warning' : 'neutral')}
                    size="sm"
                  >
                    {goal.status}
                  </Badge>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {goal.title}
                </h3>
                {goal.description && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {goal.description}
                  </p>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                  <span style={{ color: '#64748B' }}>Progress</span>
                  <strong style={{ color: goal.progress >= 100 ? '#16A34A' : 'var(--color-primary-deep)' }}>{goal.progress}%</strong>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Owner: {goal.owner?.name}</span>
                <span>Deadline: {new Date(goal.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
