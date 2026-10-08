import React from 'react';
import { Eye, X } from 'lucide-react';
import { useWorkspaceConfig } from '../../context/WorkspaceConfigContext';
import { Button } from '../ui/Button';

export const RolePreviewBanner: React.FC = () => {
  const { previewRole, exitPreview } = useWorkspaceConfig();

  if (!previewRole) return null;

  return (
    <div
      style={{
        backgroundColor: '#1E293B',
        color: '#FFFFFF',
        padding: '0.6rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        zIndex: 60,
        position: 'sticky',
        top: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(105, 196, 63, 0.2)',
            color: '#69C43F'
          }}
        >
          <Eye size={15} />
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>Visual Preview Mode:</span>{' '}
          <span>
            Viewing workspace as <strong style={{ color: '#69C43F', letterSpacing: '0.04em' }}>{previewRole}</strong>.
            Sidebar and modules reflect this role's configuration.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={exitPreview}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
        >
          <X size={13} />
          <span>Exit Preview</span>
        </button>
      </div>
    </div>
  );
};
