import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Share2,
  GitCommit,
  Pin,
  Trash2,
  Star,
  FileText,
  Clock,
  User,
  Shield,
  Tag,
  AlertCircle,
  Eye,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  documentService,
  DocumentItem,
  DocumentVersion,
  DocumentActivity,
  formatFileSize
} from '../../services/documentService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NewVersionModal } from '../../components/documents/NewVersionModal';
import { ShareDocumentModal } from '../../components/documents/ShareDocumentModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [activities, setActivities] = useState<DocumentActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'VERSIONS' | 'ACCESS' | 'ACTIVITY'>('PREVIEW');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const doc = await documentService.getDocumentById(id);
      setDocument(doc);
      if (doc.versions) setVersions(doc.versions);

      const [vers, acts] = await Promise.all([
        documentService.getVersions(id).catch(() => []),
        documentService.getDocumentActivity(id).catch(() => [])
      ]);
      setVersions(vers);
      setActivities(acts);
    } catch (err: any) {
      console.error('Failed to fetch document:', err);
      setErrorMsg(err.message || 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Handle Favorite Toggle
  const handleToggleFavorite = async () => {
    if (!document) return;
    try {
      const isFav = await documentService.toggleFavorite(document._id);
      setDocument({ ...document, isFavorited: isFav });
      showToast(
        isFav ? 'Document marked as personal favorite.' : 'Document removed from favorites.',
        'info'
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Handle Pin / Unpin
  const handleTogglePin = async () => {
    if (!document) return;
    try {
      const updated = await documentService.updateDocument(document._id, {
        isPinned: !document.isPinned
      });
      setDocument(updated);
      showToast(
        updated.isPinned ? 'Promoted as Important Document.' : 'Removed from Important Documents.',
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Handle Archive
  const handleArchive = async () => {
    if (!document) return;
    if (!window.confirm('Are you sure you want to archive this document? It will be removed from general view.')) {
      return;
    }
    try {
      await documentService.deleteDocument(document._id);
      showToast(`"${document.title}" has been archived.`, 'info');
      navigate('/documents');
    } catch (err: any) {
      console.error('Failed to archive document:', err);
      showToast(err.message || 'Failed to archive document.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E8D8FF', borderTopColor: '#69C43F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Loading Document & Preview...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMsg || !document) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>
          {errorMsg || 'Document Not Found'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          The requested document could not be found or you do not have permission to view it.
        </p>
        <Button variant="outline" size="sm" icon={<ArrowLeft size={15} />} onClick={() => navigate('/documents')}>
          Back to Documents
        </Button>
      </div>
    );
  }

  const previewUrl = documentService.getPreviewUrl(document._id);
  const downloadUrl = documentService.getDownloadUrl(document._id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate('/documents')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary-deep)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Documents Hub</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleFavorite}
            title={document.isFavorited ? 'Remove Favorite' : 'Add to Favorites'}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-color)',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: document.isFavorited ? '#D97706' : 'var(--color-text-secondary)'
            }}
          >
            <Star size={15} fill={document.isFavorited ? '#D97706' : 'none'} />
            <span>{document.isFavorited ? 'Favorited' : 'Favorite'}</span>
          </button>

          {document.canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Pin size={15} color={document.isPinned ? '#D97706' : undefined} />}
                onClick={handleTogglePin}
              >
                {document.isPinned ? 'Unpin' : 'Pin'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={<Share2 size={15} />}
                onClick={() => setIsShareModalOpen(true)}
              >
                Access & Share
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={<GitCommit size={15} />}
                onClick={() => setIsVersionModalOpen(true)}
              >
                Upload Version
              </Button>

              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={15} color="#DC2626" />}
                onClick={handleArchive}
              >
                Archive
              </Button>
            </>
          )}

          <a
            href={downloadUrl}
            download
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="primary"
              size="sm"
              icon={<Download size={15} />}
            >
              Download File
            </Button>
          </a>
        </div>
      </div>

      {/* 2. Document Summary Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <Badge variant="green" size="sm">{document.category}</Badge>
              <Badge variant="neutral" size="sm">v{document.version}</Badge>
              {document.isPinned && (
                <Badge variant="warning" size="sm">Important / Pinned</Badge>
              )}
              <Badge variant="lavender" size="sm">{document.visibility}</Badge>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              {document.title}
            </h1>
            {document.description && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '6px 0 0', maxWidth: '800px' }}>
                {document.description}
              </p>
            )}
          </div>

          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: '#FAFBF8',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '1.5rem',
              fontSize: '0.75rem'
            }}
          >
            <div>
              <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>File Name</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>{document.fileName}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Size</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>{formatFileSize(document.fileSize)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Views / Downloads</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {document.viewsCount} / {document.downloadsCount}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span>Uploaded by <strong>{document.uploadedBy?.name}</strong> ({document.uploadedBy?.role})</span>
            <span>•</span>
            <span>Department: <strong>{document.department}</strong></span>
            <span>•</span>
            <span>Updated {new Date(document.updatedAt).toLocaleDateString()}</span>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={13} color="var(--color-text-muted)" />
              {document.tags.map(t => (
                <span
                  key={t}
                  style={{
                    background: '#FAFBF8',
                    border: '1px solid var(--border-color)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'PREVIEW', label: 'Document Preview' },
          { id: 'VERSIONS', label: `Versions History (${versions.length || 1})` },
          { id: 'ACCESS', label: 'Access Control' },
          { id: 'ACTIVITY', label: `Activity Trail (${activities.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary-deep)' : '2px solid transparent',
              padding: '0.5rem 0.2rem',
              color: activeTab === tab.id ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Content */}
      <div>
        {/* TAB: PREVIEW */}
        {activeTab === 'PREVIEW' && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            {document.fileType === 'PDF' ? (
              <iframe
                src={previewUrl}
                title={document.title}
                style={{ width: '100%', height: '700px', border: 'none' }}
              />
            ) : document.fileType === 'IMAGE' ? (
              <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#FAFBF8' }}>
                <img
                  src={previewUrl}
                  alt={document.title}
                  style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              </div>
            ) : document.fileType === 'TEXT' ? (
              <iframe
                src={previewUrl}
                title={document.title}
                style={{ width: '100%', height: '500px', border: 'none', padding: '1rem', background: '#FAFBF8', fontFamily: 'monospace' }}
              />
            ) : (
              /* Fallback: Preview unavailable */
              <div
                style={{
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: '#FAFBF8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <FileText size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    Preview Unavailable for this file format
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '4px 0 0', maxWidth: '420px' }}>
                    {document.fileName} ({document.mimeType}). Download the file to open and view it in your native application.
                  </p>
                </div>
                <a href={downloadUrl} download style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="md" icon={<Download size={16} />}>
                    Download File ({formatFileSize(document.fileSize)})
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}

        {/* TAB: VERSIONS */}
        {activeTab === 'VERSIONS' && (
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Version History
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Complete historical record of revisions. Previous versions are preserved.
                </p>
              </div>
              {document.canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<GitCommit size={15} />}
                  onClick={() => setIsVersionModalOpen(true)}
                >
                  Upload New Version
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {versions.map(v => (
                <div
                  key={v._id || v.version}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: v.version === document.version ? '#F0FDF4' : '#FFFFFF',
                    borderColor: v.version === document.version ? '#DCFCE7' : 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        Version {v.version}
                      </span>
                      {v.version === document.version && (
                        <Badge variant="green" size="sm">Current Active Version</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                      {v.changeNotes || 'No release notes provided.'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Uploaded by <strong>{v.uploadedBy?.name}</strong> • {new Date(v.createdAt).toLocaleString()} • {formatFileSize(v.fileSize)}
                    </div>
                  </div>

                  <a
                    href={documentService.getVersionDownloadUrl(document._id, v.version)}
                    download
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="outline" size="sm" icon={<Download size={14} />}>
                      Download v{v.version}
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ACCESS */}
        {activeTab === 'ACCESS' && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Who Can Access This Document
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Granular visibility and permission configuration enforced on the server.
                </p>
              </div>
              {document.canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Share2 size={15} />}
                  onClick={() => setIsShareModalOpen(true)}
                >
                  Configure Access
                </Button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#FAFBF8', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Visibility Level
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-deep)', marginTop: '2px' }}>
                  {document.visibility}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {document.visibility === 'COMPANY'
                    ? 'All active members of Lavanta Naturals can discover this document.'
                    : document.visibility === 'DEPARTMENT'
                    ? `Restricted to members in ${document.department} department.`
                    : document.visibility === 'ROLE'
                    ? 'Restricted to specific organizational roles.'
                    : 'Private to uploader and founder.'}
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#FAFBF8', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Permitted Roles
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {document.allowedRoles && document.allowedRoles.length > 0 ? (
                    document.allowedRoles.map(r => (
                      <Badge key={r} variant="lavender" size="sm">{r}</Badge>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      All authorized roles permitted
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ACTIVITY */}
        {activeTab === 'ACTIVITY' && (
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
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Document Activity Log
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activities.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  No activity logged yet.
                </div>
              ) : (
                activities.map(act => (
                  <div
                    key={act._id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#F0FDF4',
                        color: 'var(--color-primary-deep)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Eye size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div>
                        <strong>{act.userId?.name || 'Team Member'}</strong>{' '}
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {act.type.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewVersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onSuccess={fetchDetails}
        document={document}
      />

      <ShareDocumentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSuccess={fetchDetails}
        document={document}
      />
    </div>
  );
};
