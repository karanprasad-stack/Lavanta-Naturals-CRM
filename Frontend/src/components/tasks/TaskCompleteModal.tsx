import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle2, UploadCloud, Paperclip, AlertCircle } from 'lucide-react';
import { Task } from '../../types/task';
import { taskService } from '../../services/taskService';
import { useToast } from '../../context/ToastContext';

interface TaskCompleteModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const TaskCompleteModal: React.FC<TaskCompleteModalProps> = ({
  task,
  isOpen,
  onClose,
  onCompleted
}) => {
  const { showToast } = useToast();
  const [comment, setComment] = useState('');
  const [hasProof, setHasProof] = useState(false);
  const [proofFilename, setProofFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload: any = {
        completionComment: comment.trim() || undefined
      };

      if (hasProof && proofFilename.trim()) {
        payload.proofOfWork = {
          filename: proofFilename.trim(),
          fileType: proofFilename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          size: 180000,
          url: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=800&auto=format&fit=crop&q=80',
          comment: comment.trim() || 'Deliverables verified.'
        };
      }

      await taskService.completeTask(task._id, payload);
      showToast('Task marked as completed!', 'success');
      onCompleted();
      onClose();
      setComment('');
      setHasProof(false);
      setProofFilename('');
    } catch (err: any) {
      setError(err?.message || 'Failed to complete task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Task Deliverables"
      subtitle={`Finalize "${task.title}"`}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<CheckCircle2 size={16} />}
            onClick={handleComplete}
            disabled={submitting}
          >
            {submitting ? 'Completing...' : 'Mark as Completed'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleComplete} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ padding: '0.85rem 1rem', background: '#FAFBF8', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{task.title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Assigned by {task.assignedBy?.name} • Priority: {task.priority}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Completion Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Describe what was accomplished or notes for your manager..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              outline: 'none',
              background: '#FFFFFF',
              color: 'var(--color-text-primary)',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Proof of Work Option */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              <input
                type="checkbox"
                checked={hasProof}
                onChange={e => setHasProof(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              Attach Proof of Work / Deliverable Asset
            </label>
          </div>

          {hasProof && (
            <div
              style={{
                padding: '1rem',
                background: '#FAFBF8',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--color-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>
                  Document / Screenshot Filename *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lavender_Serum_IG_Carousel_Final.pdf"
                  value={proofFilename}
                  onChange={e => setProofFilename(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.825rem',
                    background: '#FFFFFF',
                    outline: 'none'
                  }}
                  required={hasProof}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <UploadCloud size={14} color="var(--color-primary-deep)" />
                <span>Supports PDF documents, JPG/PNG screenshots, or design deliverables.</span>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
