import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Download, Pin, Star, ShieldCheck } from 'lucide-react';
import { documentService, DocumentItem, DocumentSummary, formatFileSize } from '../../services/documentService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface DocumentsWidgetProps {
  maxItems?: number;
}

export const DocumentsWidget: React.FC<DocumentsWidgetProps> = ({ maxItems = 4 }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      documentService.getDocumentSummary().catch(() => null),
      documentService.getDocuments({ limit: maxItems }).catch(() => ({ data: [] }))
    ]).then(([sumData, docData]) => {
      if (isMounted) {
        if (sumData) setSummary(sumData);
        if (docData && docData.data) setDocuments(docData.data.slice(0, maxItems));
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [maxItems]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-xs)',
              background: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-deep)'
            }}
          >
            <FileText size={17} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Documents & Company Knowledge
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '1px 0 0' }}>
              {role === 'FOUNDER'
                ? 'Corporate policies, standard operating procedures & knowledge base.'
                : role === 'HR'
                ? 'Employee guidelines, HR documentation & leave policies.'
                : role === 'MANAGER'
                ? 'Department operational manuals and resources.'
                : 'Essential company policies and shared documents.'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/documents')}
          style={{ fontSize: '0.8rem' }}
        >
          View Knowledge Hub →
        </Button>
      </div>

      {/* Summary KPI Pills */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#FAFBF8', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Published Docs</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-deep)', marginTop: '2px' }}>
              {summary.totalPublished}
            </div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#FAFBF8', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Important Pinned</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
              {summary.importantDocuments?.length || 0}
            </div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#FAFBF8', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>My Favorites</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7C3AED', marginTop: '2px' }}>
              {summary.myFavoritesCount || 0}
            </div>
          </div>
        </div>
      )}

      {/* Document Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {isLoading ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '1rem', textAlign: 'center' }}>
            Loading knowledge hub...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '1rem', textAlign: 'center' }}>
            No documents available yet.
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc._id}
              onClick={() => navigate(`/documents/${doc._id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              className="luxury-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <FileText size={16} color="var(--color-primary-deep)" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </span>
                    {doc.isPinned && <Pin size={11} color="#D97706" />}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                    {doc.category} • {formatFileSize(doc.fileSize)} • Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <a
                  href={documentService.getDownloadUrl(doc._id)}
                  download
                  onClick={e => e.stopPropagation()}
                  title="Download"
                  style={{ color: 'var(--color-text-secondary)', padding: '4px', display: 'flex' }}
                >
                  <Download size={14} />
                </a>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
