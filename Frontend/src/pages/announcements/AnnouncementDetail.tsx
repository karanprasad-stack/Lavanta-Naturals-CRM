import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Eye,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { calendarService } from '../../services/calendarService';
import { Announcement } from '../../types/announcement';
import { AnnouncementDetailSkeleton } from '../../components/announcements/AnnouncementSkeleton';
import { AnnouncementReadReceiptsModal } from '../../components/announcements/AnnouncementReadReceiptsModal';
import { useAuth } from '../../context/AuthContext';

export const AnnouncementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isReceiptsOpen, setIsReceiptsOpen] = useState<boolean>(false);
  const [isReadLocal, setIsReadLocal] = useState<boolean>(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState<boolean>(false);
  const [isAddedToCalendar, setIsAddedToCalendar] = useState<boolean>(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const userRole = (currentUser?.role || '').toUpperCase();
  const isPrivileged = userRole === 'FOUNDER' || userRole === 'HR';

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    announcementService
      .getAnnouncementById(id)
      .then(res => {
        setAnnouncement(res.announcement);
        setIsReadLocal(!!res.announcement.isRead);

        // Requirement 9: Mark as read when the user actually opens the announcement detail page
        if (!res.announcement.isRead) {
          announcementService.markAsRead(id).then(() => {
            setIsReadLocal(true);
          }).catch(() => {});
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load announcement.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to archive this announcement?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      navigate('/announcements');
    } catch (err: any) {
      alert(err.message || 'Failed to archive announcement');
    }
  };

  const handleAddToCalendar = async () => {
    if (!announcement) return;
    if (isAddedToCalendar && createdEventId) {
      navigate(`/calendar?event=${createdEventId}`);
      return;
    }
    setIsAddingToCalendar(true);
    try {
      const event = await calendarService.createEvent({
        title: announcement.title,
        description: announcement.description || announcement.content,
        type: announcement.type === 'EVENT' ? 'COMPANY_EVENT' : 'OTHER',
        startDateTime: announcement.publishedAt || new Date().toISOString(),
        visibility: 'COMPANY',
        relatedAnnouncement: announcement._id
      });
      setIsAddedToCalendar(true);
      setCreatedEventId(event._id || (event as any).id);
    } catch (err: any) {
      console.error('[AnnouncementDetail] Failed to add to calendar:', err);
      alert(err?.message || 'Failed to add announcement to calendar.');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem', maxWidth: '850px', margin: '0 auto' }}>
        <AnnouncementDetailSkeleton />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div
          style={{
            padding: '1.5rem',
            background: '#FFEBEE',
            border: '1px solid #FFCDD2',
            borderRadius: '12px',
            color: '#C62828',
            marginBottom: '1rem'
          }}
        >
          <AlertCircle size={24} style={{ margin: '0 auto 8px auto', display: 'block' }} />
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>Announcement Unavailable</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{error || 'Announcement not found.'}</p>
        </div>
        <button onClick={() => navigate('/announcements')} className="announcement-detail-btn announcement-detail-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Announcements</span>
        </button>
      </div>
    );
  }

  const isAuthor = announcement.createdBy?._id === currentUser?.id;
  const canSeeReceipts = isPrivileged || isAuthor;

  // Format priority styling
  const getPriorityBadge = (p: string) => {
    switch (p.toUpperCase()) {
      case 'URGENT':
        return {
          bg: '#FFEBEE',
          color: '#C62828',
          border: '1px solid #FFCDD2',
          label: 'Urgent Priority'
        };
      case 'IMPORTANT':
        return {
          bg: 'var(--color-primary-subtle)',
          color: 'var(--color-primary-deep)',
          border: '1px solid var(--color-primary-border)',
          label: 'Important'
        };
      default:
        return {
          bg: 'var(--color-bg-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--border-color)',
          label: 'Normal Priority'
        };
    }
  };

  const priorityMeta = getPriorityBadge(announcement.priority);
  const formattedPublished = new Date(announcement.publishedAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '850px', margin: '0 auto' }}>
      {/* Top Navigation Bar */}
      <div className="announcement-detail-header">
        <button
          onClick={() => navigate('/announcements')}
          className="announcement-detail-btn announcement-detail-back-btn"
          aria-label="Back to Announcements"
        >
          <ArrowLeft size={15} />
          <span>Back to Announcements</span>
        </button>

        <div className="announcement-detail-actions">
          {/* Add to Calendar Button */}
          <button
            onClick={handleAddToCalendar}
            disabled={isAddingToCalendar}
            className="announcement-detail-btn announcement-detail-cal-btn"
            aria-label={isAddedToCalendar ? 'View in Calendar' : 'Add to Calendar'}
          >
            <Calendar size={15} />
            <span>
              {isAddingToCalendar
                ? 'Adding...'
                : isAddedToCalendar
                ? 'View in Calendar'
                : 'Add to Calendar'}
            </span>
          </button>

          {/* Read Receipts Button for Founder & HR */}
          {canSeeReceipts && (
            <button
              onClick={() => setIsReceiptsOpen(true)}
              className="announcement-detail-btn announcement-detail-receipts-btn"
              aria-label="Read Receipts"
            >
              <Eye size={15} />
              <span>Read Receipts</span>
            </button>
          )}

          {/* Delete/Archive button for author or leadership */}
          {(isPrivileged || isAuthor) && (
            <button
              onClick={handleDelete}
              className="announcement-detail-btn announcement-detail-delete-btn"
              title="Delete Announcement"
              aria-label="Delete Announcement"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Announcement Document Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}
      >
        {/* Prominent Poster Header */}
        {announcement.posterImage ? (
          <div
            style={{
              width: '100%',
              height: '260px',
              position: 'relative',
              overflow: 'hidden',
              background: '#000000'
            }}
          >
            <img
              src={announcement.posterImage}
              alt={announcement.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '140px',
              background: 'linear-gradient(135deg, #F0F9ED 0%, #E8D8FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-deep)',
              gap: '8px'
            }}
          >
            <Sparkles size={24} />
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>Lavanta Naturals HQ</span>
          </div>
        )}

        {/* Document Body */}
        <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-5">
          {/* Metadata Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '3px 9px',
                borderRadius: '6px',
                background: priorityMeta.bg,
                color: priorityMeta.color,
                border: priorityMeta.border
              }}
            >
              {priorityMeta.label}
            </span>

            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '6px',
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {announcement.type}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.725rem',
                color: 'var(--color-text-secondary)',
                padding: '3px 9px',
                borderRadius: '6px',
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--border-color)'
              }}
            >
              <Users size={12} />
              {announcement.targetType === 'EVERYONE'
                ? 'Everyone'
                : announcement.targetType === 'DEPARTMENT'
                ? `${(announcement.targetDepartments || []).join(', ')} Team`
                : announcement.targetType === 'ROLE'
                ? `${(announcement.targetRoles || []).join(', ')}s`
                : 'Selected Members'}
            </span>

            {isReadLocal && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.725rem',
                  color: 'var(--color-primary-deep)',
                  fontWeight: 600,
                  marginLeft: 'auto'
                }}
              >
                <CheckCircle2 size={13} color="var(--color-primary)" />
                Read
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
              margin: '0.25rem 0'
            }}
          >
            {announcement.title}
          </h1>

          {/* Description Lead */}
          <div
            style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
              padding: '0.85rem 1rem',
              background: 'var(--color-bg-subtle)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--color-primary)'
            }}
          >
            {announcement.description}
          </div>

          {/* Author & Published Info Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0',
              borderTop: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary-deep)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {announcement.createdBy?.profilePhoto ? (
                  <img
                    src={announcement.createdBy.profilePhoto}
                    alt={announcement.createdBy.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (announcement.createdBy?.name || 'A').charAt(0)
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {announcement.createdBy?.name || 'Leadership Team'}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                  {announcement.createdBy?.role} • {announcement.createdBy?.designation || announcement.createdBy?.department || 'Lavanta HQ'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} />
                <span>{formattedPublished}</span>
              </div>

              {announcement.expiresAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} />
                  <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Full Markdown/Rich Content */}
          <div
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.7,
              color: 'var(--color-text-primary)',
              whiteSpace: 'pre-wrap',
              paddingTop: '0.5rem'
            }}
          >
            {announcement.content || announcement.description}
          </div>

          {/* Attachments Section */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.6rem' }}>
                Attachments ({announcement.attachments.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {announcement.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--color-bg-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--color-primary-deep)" />
                      <span style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {file.filename}
                      </span>
                    </div>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="announcement-detail-btn announcement-detail-back-btn"
                      style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Read Receipts Modal */}
      {canSeeReceipts && (
        <AnnouncementReadReceiptsModal
          announcementId={announcement._id}
          announcementTitle={announcement.title}
          isOpen={isReceiptsOpen}
          onClose={() => setIsReceiptsOpen(false)}
        />
      )}
    </div>
  );
};
