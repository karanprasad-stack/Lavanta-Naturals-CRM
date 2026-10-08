import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { documentService, DocumentFolder, DocumentVisibility } from '../../services/documentService';
import { useToast } from '../../context/ToastContext';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingFolders: DocumentFolder[];
  initialParentId?: string | null;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingFolders,
  initialParentId
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string>(initialParentId || '');
  const [department, setDepartment] = useState('General');
  const [visibility, setVisibility] = useState<DocumentVisibility>('COMPANY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Folder name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await documentService.createFolder({
        name: name.trim(),
        description: description.trim(),
        parentFolderId: parentFolderId || null,
        department,
        visibility
      });

      showToast(`Folder "${name}" was created successfully.`, 'success');

      setName('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Create folder error:', err);
      setErrorMsg(err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only allow selecting parent folders with depth < 4
  const eligibleParents = existingFolders.filter(f => f.depth < 4);

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
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
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            width: '100%',
            maxWidth: '500px',
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
              <FolderPlus size={20} color="var(--color-primary-deep)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                New Knowledge Folder
              </h2>
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

          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div
                style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-danger)',
                  fontSize: '0.85rem'
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Folder Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Standard Operating Procedures"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-input)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Parent Folder
              </label>
              <select
                value={parentFolderId}
                onChange={e => setParentFolderId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-input)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">(Root level directory)</option>
                {eligibleParents.map(f => (
                  <option key={f._id} value={f._id}>
                    {f.depth > 1 ? `${'— '.repeat(f.depth - 1)} ${f.name}` : f.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                Maximum hierarchy nesting is 4 levels.
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Department
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-input)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="General">General</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Operations">Operations</option>
                <option value="R&D">R&D</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Visibility
              </label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as DocumentVisibility)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-input)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="COMPANY">Company-wide</option>
                <option value="DEPARTMENT">Department Only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.75rem'
              }}
            >
              <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                Create Folder
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
