import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCommit, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { documentService, DocumentItem } from '../../services/documentService';
import { useToast } from '../../context/ToastContext';

interface NewVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  document: DocumentItem;
}

export const NewVersionModal: React.FC<NewVersionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  document
}) => {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg('File size exceeds maximum permitted limit (25 MB)');
        return;
      }
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a replacement file');
      return;
    }
    if (!changeNotes.trim()) {
      setErrorMsg('Please summarize what changed in this version');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('changeNotes', changeNotes.trim());

      await documentService.createVersion(document._id, formData);

      showToast(`Version ${document.version + 1} published. Previous versions remain preserved.`, 'success');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Create version error:', err);
      setErrorMsg(err.message || 'Failed to upload new version');
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
          background: 'rgba(23, 34, 53, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitCommit size={20} color="var(--color-primary-deep)" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Upload Version {document.version + 1}
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Target: {document.title}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {errorMsg && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#DC2626',
                  fontSize: '0.85rem'
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'block' }}>
                Replacement File *
              </label>
              <label
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: selectedFile ? '#F0FDF4' : '#FAFBF8',
                  borderColor: selectedFile ? '#69C43F' : 'var(--border-color)',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {selectedFile ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle2 size={28} color="#16A34A" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#16A34A' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <Upload size={28} color="var(--color-primary-deep)" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      Select updated file
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Max 25 MB
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Change Summary / Release Notes *
              </label>
              <textarea
                value={changeNotes}
                onChange={e => setChangeNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Updated Section 4 with revised PTO allowance for 2026..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#FFFFFF',
                  resize: 'vertical'
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem'
              }}
            >
              <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                Publish Version {document.version + 1}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
