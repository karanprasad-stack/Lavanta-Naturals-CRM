import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ArrowLeft,
  Calendar,
  User,
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Activity,
  Layers,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Send,
  Flag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  goalService,
  Goal,
  Objective,
  KeyResult,
  GoalStatus
} from '../../services/goalService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { UpdateProgressModal } from '../../components/goals/UpdateProgressModal';

export const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeKRForProgress, setActiveKRForProgress] = useState<KeyResult | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // New Objective modal state
  const [isAddObjOpen, setIsAddObjOpen] = useState(false);
  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjDesc, setNewObjDesc] = useState('');

  // New Key Result modal state
  const [activeObjForKR, setActiveObjForKR] = useState<string | null>(null);
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRTarget, setNewKRTarget] = useState<number>(100);
  const [newKRStart, setNewKRStart] = useState<number>(0);
  const [newKRUnit, setNewKRUnit] = useState('');
  const [newKRMetricType, setNewKRMetricType] = useState<any>('NUMBER');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER' || role === 'HR_MANAGER';

  useEffect(() => {
    if (id) {
      loadGoal(id);
    }
  }, [id]);

  const loadGoal = async (goalId: string) => {
    try {
      setIsLoading(true);
      const res = await goalService.getGoalById(goalId);
      setGoal(res);
    } catch (err) {
      console.error('[GoalDetailPage] Error loading goal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newObjTitle.trim()) return;
    try {
      await goalService.addObjective(id, {
        title: newObjTitle.trim(),
        description: newObjDesc.trim()
      });
      setNewObjTitle('');
      setNewObjDesc('');
      setIsAddObjOpen(false);
      loadGoal(id);
    } catch (err) {
      console.error('[GoalDetailPage] Failed to add objective:', err);
    }
  };

  const handleAddKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeObjForKR || !newKRTitle.trim() || !id) return;
    try {
      await goalService.addKeyResult(activeObjForKR, {
        title: newKRTitle.trim(),
        metricType: newKRMetricType,
        startValue: newKRStart,
        targetValue: newKRTarget,
        unit: newKRUnit.trim()
      });
      setNewKRTitle('');
      setNewKRTarget(100);
      setNewKRStart(0);
      setNewKRUnit('');
      setActiveObjForKR(null);
      loadGoal(id);
    } catch (err) {
      console.error('[GoalDetailPage] Failed to add key result:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    try {
      setIsSubmittingComment(true);
      await goalService.addComment(id, commentText.trim());
      setCommentText('');
      loadGoal(id);
    } catch (err) {
      console.error('[GoalDetailPage] Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem 0' }}>
        <div style={{ height: '160px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '300px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (!goal) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <h3>Goal not found</h3>
        <Button variant="primary" onClick={() => navigate('/goals')}>Back to Goals</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/goals')}
          style={{ gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Goals & OKRs</span>
        </Button>
      </div>

      {/* 1. Header Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Badge variant="neutral" size="sm">{goal.type} GOAL</Badge>
              <Badge
                variant={goal.status === 'AT_RISK' ? 'warning' : (goal.status === 'COMPLETED' ? 'green' : 'neutral')}
                size="sm"
              >
                {goal.status}
              </Badge>
              <Badge variant={goal.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                {goal.priority} PRIORITY
              </Badge>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
              {goal.title}
            </h1>
            {goal.description && (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '750px', lineHeight: 1.5 }}>
                {goal.description}
              </p>
            )}
          </div>

          {/* Owner chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#EDE9FE',
                color: '#6D28D9',
                fontWeight: 700,
                fontSize: '0.85rem',
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
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Goal Owner
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                {goal.owner?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Dates & Progress Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #F1F5F9'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Overall OKR Progress</span>
              <strong style={{ color: goal.progress >= 100 ? '#16A34A' : 'var(--color-primary-deep)', fontSize: '1rem' }}>
                {goal.progress}%
              </strong>
            </div>
            <div style={{ height: '9px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${goal.progress}%`,
                  background: goal.status === 'AT_RISK' ? '#DC2626' : (goal.progress >= 100 ? '#16A34A' : 'var(--color-primary)'),
                  borderRadius: '5px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Start Date</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {new Date(goal.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Target Deadline</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {new Date(goal.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Department</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {goal.department}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Objectives & Key Results Hierarchy */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #DCFCE7'
              }}
            >
              <Layers size={18} color="var(--color-primary-deep)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Objectives & Key Results (OKRs)
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Measurable milestone hierarchy driving goal achievement
              </span>
            </div>
          </div>

          {isManagement && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddObjOpen(true)}
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              <span>Add Objective</span>
            </Button>
          )}
        </div>

        {/* Objectives List */}
        {(!goal.objectives || goal.objectives.length === 0) ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '8px', border: '1px dashed #E2E8F0' }}>
            <Target size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              No objectives added yet.
            </div>
            <p style={{ margin: '4px 0 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Add meaningful objectives and key results to structure this goal.
            </p>
            {isManagement && (
              <Button variant="primary" size="sm" onClick={() => setIsAddObjOpen(true)}>
                <Plus size={14} style={{ marginRight: '4px' }} />
                <span>Add First Objective</span>
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {goal.objectives.map((obj, objIdx) => (
              <div
                key={obj._id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  overflow: 'hidden'
                }}
              >
                {/* Objective Header */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                        Objective {objIdx + 1}
                      </span>
                      {obj.progress >= 100 && <Badge variant="green" size="sm">ACHIEVED</Badge>}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {obj.title}
                    </div>
                    {obj.description && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {obj.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Objective Progress</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: obj.progress >= 100 ? '#16A34A' : 'var(--color-primary-deep)' }}>
                        {obj.progress}%
                      </div>
                    </div>

                    {isManagement && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveObjForKR(obj._id)}
                        style={{ fontSize: '0.78rem', gap: '4px' }}
                      >
                        <Plus size={13} />
                        <span>Key Result</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Key Results Grid */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(!obj.keyResults || obj.keyResults.length === 0) ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '6px', fontSize: '0.82rem', color: '#64748B' }}>
                      No key results established for this objective yet.
                    </div>
                  ) : (
                    obj.keyResults.map(kr => (
                      <div
                        key={kr._id}
                        style={{
                          border: '1px solid #EDF2F7',
                          borderRadius: '8px',
                          padding: '1.25rem',
                          background: '#FAFBF8',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                                {kr.title}
                              </span>
                              <Badge
                                variant={kr.status === 'COMPLETED' ? 'green' : (kr.status === 'AT_RISK' ? 'warning' : 'neutral')}
                                size="sm"
                              >
                                {kr.status}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                              Metric: {kr.metricType} • Owner: <strong style={{ color: 'var(--color-text-primary)' }}>{kr.owner?.name}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {kr.currentValue} / {kr.targetValue} {kr.unit}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
                                {kr.progress}% Achieved
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveKRForProgress(kr);
                                setIsUpdateModalOpen(true);
                              }}
                              style={{ fontSize: '0.75rem', gap: '4px' }}
                            >
                              <TrendingUp size={13} />
                              <span>Update</span>
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${kr.progress}%`,
                              background: kr.progress >= 100 ? '#16A34A' : 'var(--color-primary)',
                              borderRadius: '3px'
                            }}
                          />
                        </div>

                        {/* Related Tasks Supporting Section */}
                        {kr.tasks && kr.tasks.length > 0 && (
                          <div
                            style={{
                              marginTop: '6px',
                              paddingTop: '8px',
                              borderTop: '1px solid #E2E8F0',
                              fontSize: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckSquare size={13} color="var(--color-primary-deep)" />
                                Related Tasks ({kr.taskStats?.completed} of {kr.taskStats?.total} completed — {kr.taskStats?.percentage}%)
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {kr.tasks.map(task => (
                                <div
                                  key={task._id}
                                  onClick={() => navigate(`/tasks/${task._id}`)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '5px 8px',
                                    borderRadius: '4px',
                                    background: '#FFFFFF',
                                    border: '1px solid #EDF2F7',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem'
                                  }}
                                >
                                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                    {task.title}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Badge variant={task.status === 'COMPLETED' ? 'green' : 'neutral'} size="sm">
                                      {task.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Goal Discussion & Activity Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Discussion Comments */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <MessageSquare size={18} color="var(--color-primary-deep)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Goal Discussion & Updates
            </h3>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
            <input
              type="text"
              placeholder="Post an update, milestone or insight..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            />
            <Button type="submit" variant="primary" size="sm" disabled={isSubmittingComment || !commentText.trim()}>
              <Send size={14} />
            </Button>
          </form>

          {/* Comments list */}
          {(!goal.comments || goal.comments.length === 0) ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '6px', color: '#64748B', fontSize: '0.8rem' }}>
              No comments posted on this goal yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {goal.comments.map(c => (
                <div key={c._id} style={{ padding: '10px 12px', borderRadius: '6px', background: '#FAFBF8', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{c.author?.name}</strong>
                    <span style={{ color: '#94A3B8' }}>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)' }}>
                    {c.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Audit Trail */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Activity size={18} color="var(--color-primary-deep)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Recent Goal Activity
            </h3>
          </div>

          {(!goal.activities || goal.activities.length === 0) ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: '#FAFBF8', borderRadius: '6px', color: '#64748B', fontSize: '0.8rem' }}>
              No logged activity records.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {goal.activities.map(act => (
                <div
                  key={act._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.8rem',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#FAFBF8',
                    borderLeft: '3px solid var(--color-primary)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {act.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                      {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Update Key Result Progress */}
      <UpdateProgressModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setActiveKRForProgress(null);
        }}
        keyResult={activeKRForProgress}
        onSuccess={() => loadGoal(goal._id)}
      />

      {/* Modal: Add Objective */}
      <AnimatePresence>
        {isAddObjOpen && (
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '480px',
                border: '1px solid var(--border-color)'
              }}
            >
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>Add Objective</h3>
              <form onSubmit={handleAddObjective} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Objective Title *
                  </label>
                  <input
                    type="text"
                    value={newObjTitle}
                    onChange={e => setNewObjTitle(e.target.value)}
                    placeholder="e.g. Standardize 90-Day Physicochemical Stability"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.88rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Description
                  </label>
                  <textarea
                    value={newObjDesc}
                    onChange={e => setNewObjDesc(e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Button type="button" variant="outline" onClick={() => setIsAddObjOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Add Objective</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Key Result */}
      <AnimatePresence>
        {activeObjForKR && (
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '480px',
                border: '1px solid var(--border-color)'
              }}
            >
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>Add Key Result</h3>
              <form onSubmit={handleAddKeyResult} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Key Result Title *
                  </label>
                  <input
                    type="text"
                    value={newKRTitle}
                    onChange={e => setNewKRTitle(e.target.value)}
                    placeholder="e.g. Increase mobile checkout conversion to 3.8%"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.88rem' }}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Metric Type
                    </label>
                    <select
                      value={newKRMetricType}
                      onChange={e => setNewKRMetricType(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      <option value="NUMBER">Number</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="CURRENCY">Currency (₹ / $)</option>
                      <option value="COUNT">Count / Units</option>
                      <option value="BOOLEAN">Boolean (Yes/No)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Unit (e.g. %, ₹, Batches)
                    </label>
                    <input
                      type="text"
                      value={newKRUnit}
                      onChange={e => setNewKRUnit(e.target.value)}
                      placeholder="%"
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Start Value
                    </label>
                    <input
                      type="number"
                      value={newKRStart}
                      onChange={e => setNewKRStart(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Target Value *
                    </label>
                    <input
                      type="number"
                      value={newKRTarget}
                      onChange={e => setNewKRTarget(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Button type="button" variant="outline" onClick={() => setActiveObjForKR(null)}>Cancel</Button>
                  <Button type="submit" variant="primary">Add Key Result</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
