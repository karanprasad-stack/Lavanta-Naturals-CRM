import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Users, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { documentService, DocumentItem, DocumentVisibility } from '../../services/documentService';
import { useToast } from '../../context/ToastContext';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  document: DocumentItem;
}

const ROLES = ['FOUNDER', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN'];
const DEPARTMENTS = ['Human Resources', 'Operations', 'R&D', 'Marketing', 'Finance', 'General'];

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  document
}) => {
  const { showToast } = useToast();
  const [visibility, setVisibility] = useState<DocumentVisibility>(document.visibility || 'COMPANY');
  const [allowedRoles, setAllowedRoles] = useState<string[]>(document.allowedRoles || []);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>(document.allowedDepartments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVisibility(document.visibility || 'COMPANY');
      setAllowedRoles(document.allowedRoles || []);
      setAllowedDepartments(document.allowedDepartments || []);
    }
  }, [isOpen, document]);

  if (!isOpen) return null;

  const toggleRole = (role: string) => {
    if (allowedRoles.includes(role)) {
      setAllowedRoles(allowedRoles.filter(r => r !== role));
    } else {
      setAllowedRoles([...allowedRoles, role]);
    }
  };

  const toggleDept = (dept: string) => {
    if (allowedDepartments.includes(dept)) {
      setAllowedDepartments(allowedDepartments.filter(d => d !== dept));
    } else {
      setAllowedDepartments([...allowedDepartments, dept]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await documentService.updateDocumentAccess(document._id, {
        visibility,
        allowedRoles,
        allowedDepartments
      });

      showToast(`Sharing permissions for "${document.title}" have been updated.`, 'success');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Update access error:', err);
      setErrorMsg(err.message || 'Failed to update access settings');
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
              <Share2 size={20} color="var(--color-primary-deep)" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Who can access this document?
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {document.title}
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

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'block' }}>
                Visibility Scope
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { id: 'COMPANY', label: 'Company-Wide', desc: 'All active company members can discover and view this document' },
                  { id: 'DEPARTMENT', label: 'Department Restricted', desc: 'Only team members in selected departments can access' },
                  { id: 'ROLE', label: 'Role Specific', desc: 'Only specified roles can view or download' },
                  { id: 'PRIVATE', label: 'Private to Uploader', desc: 'Accessible only by you and company founder' }
                ].map(opt => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: visibility === opt.id ? 'var(--color-soft-green)' : 'var(--bg-surface-elevated)',
                      borderColor: visibility === opt.id ? 'var(--color-primary-deep)' : 'var(--border-color)'
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.id}
                      checked={visibility === opt.id}
                      onChange={() => setVisibility(opt.id as DocumentVisibility)}
                      style={{ marginTop: '3px', accentColor: 'var(--color-primary-deep)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {(visibility === 'ROLE' || visibility === 'COMPANY') && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'block' }}>
                  Allowed Roles {visibility === 'COMPANY' ? '(Leave empty for everyone)' : '*'}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ROLES.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        background: allowedRoles.includes(r) ? 'var(--color-primary-deep)' : 'var(--bg-surface-elevated)',
                        color: allowedRoles.includes(r) ? '#FFFFFF' : 'var(--color-text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {visibility === 'DEPARTMENT' && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'block' }}>
                  Allowed Departments
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {DEPARTMENTS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDept(d)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        background: allowedDepartments.includes(d) ? 'var(--color-primary-deep)' : 'var(--bg-surface-elevated)',
                        color: allowedDepartments.includes(d) ? '#FFFFFF' : 'var(--color-text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSubmitting}>
              Save Permissions
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
