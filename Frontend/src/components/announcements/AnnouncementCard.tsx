import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Announcement } from '../../types/announcement';

interface AnnouncementCardProps {
  announcement: Announcement;
  onSelect?: (announcement: Announcement) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onSelect
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(announcement);
    } else {
      navigate(`/announcements/${announcement._id}`);
    }
  };

  // Priority badge styling
  const getPriorityStyle = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return {
          background: '#FFEBEE',
          color: '#C62828',
          border: '1px solid #FFCDD2',
          label: 'Urgent'
        };
      case 'IMPORTANT':
        return {
          background: 'var(--color-primary-subtle)',
          color: 'var(--color-primary-deep)',
          border: '1px solid var(--color-primary-border)',
          label: 'Important'
        };
      default:
        return {
          background: 'var(--color-bg-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--border-color)',
          label: 'Normal'
        };
    }
  };

  // Format audience string
  const formatAudience = () => {
    switch (announcement.targetType) {
      case 'EVERYONE':
        return 'Entire Lavanta Team';
      case 'DEPARTMENT':
        return (announcement.targetDepartments || []).length > 0
          ? `${announcement.targetDepartments.join(' + ')} Team`
          : 'Department Specific';
      case 'ROLE':
        return (announcement.targetRoles || []).length > 0
          ? `${announcement.targetRoles.join(', ')}s`
          : 'Role Specific';
      case 'USERS':
        return 'Selected Members';
      default:
        return 'Company Wide';
    }
  };

  const priorityMeta = getPriorityStyle(announcement.priority);
  const formattedDate = new Date(announcement.publishedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      onClick={handleCardClick}
      className="announcement-card"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--color-primary-border)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      {/* Poster Image / Banner */}
      <div
        style={{
          width: '100%',
          height: '145px',
          background: 'linear-gradient(135deg, #F0F9ED 0%, #E8D8FF 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {announcement.posterImage ? (
          <img
            src={announcement.posterImage}
            alt={announcement.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={e => {
              // Graceful fallback to botanical gradient if image link breaks
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-deep)',
              gap: '6px'
            }}
          >
            <Sparkles size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Lavanta Naturals</span>
          </div>
        )}

        {/* Unread indicator badge overlay */}
        {!announcement.isRead && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              fontSize: '0.675rem',
              fontWeight: 700,
              color: 'var(--color-primary-deep)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-primary)'
              }}
            />
            Unread
          </div>
        )}

        {/* Priority Badge overlay */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.675rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: priorityMeta.background,
            color: priorityMeta.color,
            border: priorityMeta.border
          }}
        >
          {priorityMeta.label}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
        {/* Type & Target Audience */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-primary-deep)'
            }}
          >
            {announcement.type}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-subtle)',
              padding: '2px 7px',
              borderRadius: '10px'
            }}
          >
            <Users size={11} />
            {formatAudience()}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: '0.15rem 0',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {announcement.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {announcement.description}
        </p>

        {/* Card Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.725rem',
            color: 'var(--color-text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} />
            <span>{formattedDate}</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
              color: 'var(--color-primary-deep)'
            }}
          >
            <span>View</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
};
