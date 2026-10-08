import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Upload,
  FolderPlus,
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
  Star,
  Download,
  Pin,
  Filter,
  ArrowRight,
  Clock,
  User,
  Shield,
  CheckCircle2,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';
import {
  documentService,
  DocumentItem,
  DocumentFolder,
  DocumentCategory,
  DocumentFileType,
  formatFileSize
} from '../../services/documentService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UploadDocumentModal } from '../../components/documents/UploadDocumentModal';
import { CreateFolderModal } from '../../components/documents/CreateFolderModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const QUICK_CATEGORIES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'ALL', label: 'All Documents', icon: '📂' },
  { id: 'POLICY', label: 'Policies', icon: '📜' },
  { id: 'SOP', label: 'SOPs', icon: '🧪' },
  { id: 'GUIDE', label: 'Guides & Manuals', icon: '📖' },
  { id: 'TEMPLATE', label: 'Templates', icon: '📑' },
  { id: 'HR', label: 'HR', icon: '👥' },
  { id: 'MARKETING', label: 'Marketing', icon: '🎨' },
  { id: 'TECHNICAL', label: 'Technical / R&D', icon: '🌿' },
  { id: 'FINANCE', label: 'Finance', icon: '📊' },
  { id: 'GENERAL', label: 'General', icon: '💡' }
];

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const userRole = (currentUser?.role || '').toUpperCase();
  const canUpload = true; // All authenticated users can upload drafts/permitted docs
  const canCreateFolder = userRole === 'FOUNDER' || userRole === 'HR' || userRole === 'MANAGER';

  // State
  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITES' | 'IMPORTANT' | 'RECENT'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(searchParams.get('folder') || null);
  const [currentFolder, setCurrentFolder] = useState<DocumentFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Advanced filters
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterFileType, setFilterFileType] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Folder & Breadcrumbs
  useEffect(() => {
    if (currentFolderId) {
      documentService.getFolderById(currentFolderId)
        .then(data => {
          setCurrentFolder(data);
          setBreadcrumbs(data.breadcrumbs || [{ id: data._id, name: data.name }]);
        })
        .catch(() => {
          setCurrentFolder(null);
          setBreadcrumbs([]);
        });
    } else {
      setCurrentFolder(null);
      setBreadcrumbs([]);
    }
  }, [currentFolderId]);

  // Load Folders List
  const fetchFolders = useCallback(async () => {
    try {
      const data = await documentService.getFolders({
        parentFolderId: currentFolderId || ''
      });
      setFolders(data);
    } catch (err) {
      console.warn('Failed to load folders:', err);
    }
  }, [currentFolderId]);

  // Load Documents
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);

      if (debouncedQuery) {
        const searchResults = await documentService.searchDocuments(debouncedQuery);
        setDocuments(searchResults);
        return;
      }

      if (activeTab === 'FAVORITES') {
        const favs = await documentService.getFavorites();
        setDocuments(favs);
        return;
      }

      const params: Record<string, any> = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (filterDepartment) params.department = filterDepartment;
      if (filterFileType) params.fileType = filterFileType;

      if (activeTab === 'IMPORTANT') {
        params.isPinned = 'true';
      } else if (currentFolderId) {
        params.folderId = currentFolderId;
      }

      const res = await documentService.getDocuments(params);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, activeTab, selectedCategory, currentFolderId, filterDepartment, filterFileType]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle Favorite Toggle
  const handleToggleFavorite = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      const isFav = await documentService.toggleFavorite(docId);
      setDocuments(prev =>
        prev.map(d => (d._id === docId ? { ...d, isFavorited: isFav } : d))
      );
      showToast(
        isFav ? 'Document marked as personal favorite.' : 'Document removed from favorites.',
        'info'
      );
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  // Get File Icon
  const getFileIcon = (fileType: DocumentFileType) => {
    switch (fileType) {
      case 'PDF':
        return <FileText size={20} color="#DC2626" />;
      case 'SHEET':
        return <FileSpreadsheet size={20} color="#16A34A" />;
      case 'IMAGE':
        return <FileImage size={20} color="#D97706" />;
      case 'DOC':
        return <FileText size={20} color="#2563EB" />;
      case 'TEXT':
        return <FileCode size={20} color="#6D28D9" />;
      default:
        return <File size={20} color="var(--color-text-secondary)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1380px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Company Knowledge Hub
            </span>
            <Badge variant="green" size="sm">Phase 10</Badge>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Documents & Knowledge
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Everything your team needs, in one place. Policies, SOPs, guidelines & company resources.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {canCreateFolder && (
            <Button
              variant="outline"
              size="md"
              icon={<FolderPlus size={16} />}
              onClick={() => setIsFolderModalOpen(true)}
            >
              New Folder
            </Button>
          )}
          {canUpload && (
            <Button
              variant="primary"
              size="md"
              icon={<Upload size={16} />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Document
            </Button>
          )}
        </div>
      </motion.div>

      {/* 2. Search & Quick Access Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search Input Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              position: 'relative',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-input)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 1rem'
            }}
          >
            <Search size={18} color="var(--color-text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, description, tags, file name (e.g. 'leave policy', 'distillation')..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                padding: '0.85rem 0.75rem',
                fontSize: '0.9rem',
                color: 'var(--color-text-primary)',
                background: 'transparent'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <Button
            variant={filterDepartment || filterFileType ? 'primary' : 'outline'}
            size="md"
            icon={<Filter size={16} />}
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
          >
            Filters {(filterDepartment || filterFileType) && '•'}
          </Button>
        </div>

        {/* Filter Drawer / Accordion */}
        <AnimatePresence>
          {isFilterDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                padding: '1rem 1.25rem',
                display: 'flex',
                gap: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                  Department
                </label>
                <select
                  value={filterDepartment}
                  onChange={e => setFilterDepartment(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: 'var(--bg-input)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="">All Departments</option>
                  <option value="General">General</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Operations">Operations</option>
                  <option value="R&D">R&D</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                  File Format
                </label>
                <select
                  value={filterFileType}
                  onChange={e => setFilterFileType(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: 'var(--bg-input)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="">All Formats</option>
                  <option value="PDF">PDF Documents</option>
                  <option value="SHEET">Spreadsheets (XLSX, CSV)</option>
                  <option value="DOC">Word / Documents</option>
                  <option value="IMAGE">Images (PNG, JPG)</option>
                  <option value="TEXT">Text Files</option>
                </select>
              </div>

              {(filterDepartment || filterFileType) && (
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: 'auto' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterDepartment('');
                      setFilterFileType('');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Horizontal Scroll Chips */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}
        >
          {QUICK_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id && !debouncedQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery('');
                }}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid var(--color-primary-deep)' : '1px solid var(--border-color)',
                  background: isSelected ? 'var(--color-soft-green)' : 'var(--bg-surface)',
                  color: isSelected ? 'var(--color-primary-deep)' : 'var(--color-text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Navigation Tabs & Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Left: Tabs */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { id: 'ALL', label: 'All Documents' },
            { id: 'FAVORITES', label: 'My Favorites' },
            { id: 'IMPORTANT', label: 'Important / Pinned' }
          ].map(tab => {
            const isTabActive = activeTab === tab.id && !debouncedQuery;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isTabActive ? '2px solid var(--color-primary-deep)' : '2px solid transparent',
                  padding: '0.4rem 0.2rem',
                  color: isTabActive ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                  fontWeight: isTabActive ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <button
            onClick={() => {
              setCurrentFolderId(null);
              setSearchParams({});
            }}
            style={{
              background: 'none',
              border: 'none',
              color: !currentFolderId ? 'var(--color-text-primary)' : 'var(--color-primary-deep)',
              fontWeight: !currentFolderId ? 700 : 500,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Root Hub
          </button>

          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              <ChevronRight size={14} color="var(--color-text-muted)" />
              <button
                onClick={() => {
                  setCurrentFolderId(b.id);
                  setSearchParams({ folder: b.id });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: idx === breadcrumbs.length - 1 ? 'var(--color-text-primary)' : 'var(--color-primary-deep)',
                  fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 4. Folders Grid (Shown when not in search or special tab) */}
      {!debouncedQuery && activeTab === 'ALL' && folders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Folders
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {folders.map(folder => (
              <motion.div
                key={folder._id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setCurrentFolderId(folder._id);
                  setSearchParams({ folder: folder._id });
                }}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.15s ease'
                }}
                className="luxury-card"
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--color-soft-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary-deep)'
                  }}
                >
                  <Folder size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {folder.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {folder.documentCount || 0} document{folder.documentCount === 1 ? '' : 's'}
                  </div>
                </div>
                <ChevronRight size={15} color="var(--color-text-muted)" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Documents List / Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {debouncedQuery
              ? `Search Results (${documents.length})`
              : activeTab === 'FAVORITES'
              ? `My Favorites (${documents.length})`
              : activeTab === 'IMPORTANT'
              ? `Important Documents (${documents.length})`
              : `Documents (${documents.length})`}
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                style={{
                  height: '68px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  opacity: 0.6,
                  animation: 'pulse 1.2s infinite ease-in-out'
                }}
              />
            ))}
            <style>{`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.9; } 100% { opacity: 0.5; } }`}</style>
          </div>
        ) : documents.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)'
              }}
            >
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              {debouncedQuery
                ? 'No documents matched your search.'
                : activeTab === 'FAVORITES'
                ? "You haven't favorited any documents yet."
                : 'No documents in this view.'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: 0 }}>
              {debouncedQuery
                ? 'Try searching with different keywords or clearing your active filters.'
                : activeTab === 'FAVORITES'
                ? 'Click the star icon on any document to keep it easily accessible in your favorites.'
                : 'Upload organizational policies, SOPs, and guidelines to build the knowledge hub.'}
            </p>
            {canUpload && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={() => setIsUploadModalOpen(true)}
                style={{ marginTop: '0.5rem' }}
              >
                Upload Document
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {documents.map(doc => (
              <motion.div
                key={doc._id}
                whileHover={{ y: -1 }}
                onClick={() => navigate(`/documents/${doc._id}`)}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.15s ease'
                }}
                className="luxury-card"
              >
                {/* Left: Icon & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getFileIcon(doc.fileType)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {doc.title}
                      </span>
                      {doc.isPinned && (
                        <span title="Pinned Document" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Pin size={13} color="#D97706" />
                        </span>
                      )}
                      <Badge variant="neutral" size="sm">
                        {doc.category}
                      </Badge>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        v{doc.version}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span>Uploaded by <strong>{doc.uploadedBy?.name || 'Lavanta Team'}</strong></span>
                      <span>•</span>
                      <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 600 }}>{doc.fileType} · {formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  {/* Favorite Button */}
                  <button
                    onClick={e => handleToggleFavorite(e, doc._id)}
                    title={doc.isFavorited ? 'Remove Favorite' : 'Add to Favorites'}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-xs)',
                      color: doc.isFavorited ? '#D97706' : 'var(--color-text-muted)'
                    }}
                  >
                    <Star size={16} fill={doc.isFavorited ? '#D97706' : 'none'} />
                  </button>

                  {/* Direct Download */}
                  <a
                    href={documentService.getDownloadUrl(doc._id)}
                    download
                    title="Download File"
                    style={{
                      padding: '6px',
                      color: 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    <Download size={16} />
                  </a>

                  {/* Details chevron */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                  >
                    View →
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          fetchDocuments();
          fetchFolders();
        }}
        initialFolderId={currentFolderId}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSuccess={() => fetchFolders()}
        existingFolders={folders}
        initialParentId={currentFolderId}
      />
    </div>
  );
};
