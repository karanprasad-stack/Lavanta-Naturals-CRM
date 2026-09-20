import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertCircle } from 'lucide-react';
import { goalService, KeyResult } from '../../services/goalService';
import { Button } from '../ui/Button';

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: KeyResult | null;
  onSuccess: (updatedKR: KeyResult) => void;
}

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  isOpen,
  onClose,
  keyResult,
  onSuccess
}) => {
  const [currentValue, setCurrentValue] = useState<number>(keyResult?.currentValue || 0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (keyResult) {
      setCurrentValue(keyResult.currentValue);
      setNote('');
      setError(null);
    }
  }, [keyResult]);

  if (!isOpen || !keyResult) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const updated = await goalService.updateKeyResultProgress(keyResult._id, currentValue, note);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute preview percentage
  let previewPct = 0;
  if (keyResult.metricType === 'BOOLEAN') {
    previewPct = currentValue ? 100 : 0;
  } else {
    const denom = keyResult.targetValue - keyResult.startValue;
    if (denom !== 0) {
      previewPct = Math.max(0, Math.min(100, Math.round(((currentValue - keyResult.startValue) / denom) * 100)));
    } else {
      previewPct = currentValue >= keyResult.targetValue ? 100 : 0;
    }
  }

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
            maxWidth: '480px',
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
                  background: '#E0F2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <TrendingUp size={18} color="#0284C7" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Update Key Result Progress
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {keyResult.title}
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

          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', borderRadius: '6px', color: '#DC2626', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}

            {/* Target vs Start */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Start: </span>
                <strong>{keyResult.startValue} {keyResult.unit}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Target: </span>
                <strong style={{ color: 'var(--color-primary-deep)' }}>{keyResult.targetValue} {keyResult.unit}</strong>
              </div>
            </div>

            {/* Value Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Current Value ({keyResult.unit || 'units'})
              </label>
              {keyResult.metricType === 'BOOLEAN' ? (
                <select
                  value={currentValue}
                  onChange={e => setCurrentValue(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                >
                  <option value={0}>No (0%)</option>
                  <option value={1}>Yes / Completed (100%)</option>
                </select>
              ) : (
                <input
                  type="number"
                  step="any"
                  value={currentValue}
                  onChange={e => setCurrentValue(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                  required
                />
              )}
            </div>

            {/* Calculated Progress preview bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Resulting Progress:</span>
                <strong style={{ color: previewPct >= 100 ? '#16A34A' : '#0284C7' }}>{previewPct}%</strong>
              </div>
              <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${previewPct}%`,
                    background: previewPct >= 100 ? '#16A34A' : 'var(--color-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Progress note */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Progress Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="What milestone or update does this represent?"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Save Progress'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
