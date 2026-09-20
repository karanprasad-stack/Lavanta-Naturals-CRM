import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  Folder,
  Shield,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { documentService, DocumentCategory, DocumentVisibility, DocumentFolder } from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFolderId?: string | null;
}

const CATEGORIES: Array<{ id: DocumentCategory; label: string }> = [
  { id: 'POLICY', label: 'Policy' },
  { id: 'SOP', label: 'SOP' },
  { id: 'GUIDE', label: 'Guide / Handbook' },
  { id: 'TEMPLATE', label: 'Template' },
  { id: 'REPORT', label: 'Report' },
  { id: 'HR', label: 'Human Resources' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'TECHNICAL', label: 'Technical / R&D' },
  { id: 'GENERAL', label: 'General Knowledge' }
];

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFolderId
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('GENERAL');
  const [folderId, setFolderId] = useState<string>(initialFolderId || '');
  const [department, setDepartment] = useState<string>(currentUser?.department || 'General');
  const [visibility, setVisibility] = useState<DocumentVisibility>('COMPANY');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      documentService.getFolders().then(setFolders).catch(() => {});
      if (initialFolderId) setFolderId(initialFolderId);
    }
  }, [isOpen, initialFolderId]);

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
      if (!title) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_]/g, ' ');
        setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }
    }
  };

  const handleSubmit = async (statusToSet: 'PUBLISHED' | 'DRAFT') => {
    if (!selectedFile) {
      setErrorMsg('Please select a file to upload');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Document title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      if (folderId) formData.append('folderId', folderId);
      formData.append('department', department);
      formData.append('visibility', visibility);
      formData.append('status', statusToSet);
      formData.append('isPinned', String(isPinned));
      formData.append('tags', tagsInput);

      await documentService.createDocument(formData);
      showToast(
        statusToSet === 'PUBLISHED'
          ? `"${title}" has been published to the knowledge hub.`
          : `"${title}" saved as draft.`,
        'success'
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload document error:', err);
      setErrorMsg(err.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRole = (currentUser?.role || '').toUpperCase();
  const canPin = userRole === 'FOUNDER' || userRole === 'HR' || userRole === 'MANAGER';

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
          transition={{ duration: 0.2 }}
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
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
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Upload to Knowledge Hub
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Store company policies, SOPs, templates, and internal guidelines.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-xs)'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {errorMsg && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#DC2626',
                  fontSize: '0.85rem'
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* File Dropzone */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'block' }}>
                Document File *
              </label>
              <label
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp"
                />
                {selectedFile ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#16A34A' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change file
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <Upload size={32} color="var(--color-primary-deep)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      Click to choose or drag & drop document
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Supports PDF, DOCX, XLSX, CSV, TXT, Images (Max 25 MB)
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Document Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Employee Leave Policy 2026"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Description / Purpose
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of what this document covers..."
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

            {/* Category & Folder */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as DocumentCategory)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                  Folder
                </label>
                <select
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="">(No folder - Root library)</option>
                  {folders.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.depth > 1 ? `${'— '.repeat(f.depth - 1)} ${f.name}` : f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department & Visibility */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                  Department Scope
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="General">General / Organization</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Operations">Operations</option>
                  <option value="R&D">R&D</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                  Visibility *
                </label>
                <select
                  value={visibility}
                  onChange={e => setVisibility(e.target.value as DocumentVisibility)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="COMPANY">Company-wide (All members)</option>
                  <option value="DEPARTMENT">Department Only</option>
                  <option value="TEAM">Team Only</option>
                  <option value="ROLE">Specific Roles</option>
                  <option value="PRIVATE">Private (Only me)</option>
                </select>
              </div>
            </div>

            {/* Tags & Pinned */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'block' }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="e.g. policy, leave, hr, 2026, onboarding"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>

            {canPin && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary-deep)', width: '16px', height: '16px' }}
                />
                <span>Pin as <strong>Important Document</strong> (promoted on dashboards & top of knowledge hub)</span>
              </label>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              background: '#FAFBF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmit('PUBLISHED')}
              isLoading={isSubmitting}
            >
              Publish Document
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
