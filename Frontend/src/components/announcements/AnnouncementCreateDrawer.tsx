import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  Trash2,
  RefreshCw,
  Sparkles,
  Users
} from 'lucide-react';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementTargetType,
  CreateAnnouncementPayload
} from '../../types/announcement';
import { announcementService } from '../../services/announcementService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface AnnouncementCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AnnouncementCreateDrawer: React.FC<AnnouncementCreateDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('GENERAL');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [targetType, setTargetType] = useState<AnnouncementTargetType>('EVERYONE');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [posterImage, setPosterImage] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const userRole = (currentUser?.role || '').toUpperCase();

  // Load team members for target users selection
  useEffect(() => {
    if (isOpen) {
      userService
        .getUsers({ limit: 100 })
        .then(res => {
          if (res.users) setAllUsers(res.users);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Adjust default target for Manager
  useEffect(() => {
    if (userRole === 'MANAGER') {
      setTargetType('DEPARTMENT');
      if (currentUser?.department) {
        setTargetDepartments([currentUser.department]);
      }
    } else {
      setTargetType('EVERYONE');
    }
  }, [userRole, currentUser]);

  if (!isOpen) return null;

  // File Upload & Validation
  const handleImageFile = (file: File) => {
    setError(null);
    const validExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!validExtensions.includes(file.type.toLowerCase())) {
      setError('Allowed image formats: JPG, JPEG, PNG, WEBP.');
      return;
    }

    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (result) {
        setPosterImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleRoleToggle = (role: string) => {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleDeptToggle = (dept: string) => {
    setTargetDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handleUserToggle = (uId: string) => {
    setTargetUsers(prev =>
      prev.includes(uId) ? prev.filter(id => id !== uId) : [...prev, uId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide an announcement title.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a short description.');
      return;
    }

    if (targetType === 'ROLE' && targetRoles.length === 0) {
      setError('Please select at least one role to target.');
      return;
    }

    if (targetType === 'DEPARTMENT' && targetDepartments.length === 0) {
      setError('Please select at least one department to target.');
      return;
    }

    if (targetType === 'USERS' && targetUsers.length === 0) {
      setError('Please select at least one user to target.');
      return;
    }

    const payload: CreateAnnouncementPayload = {
      title: title.trim(),
      description: description.trim(),
      content: content.trim() || description.trim(),
      type,
      priority,
      targetType,
      targetRoles: targetType === 'ROLE' ? targetRoles : [],
      targetDepartments: targetType === 'DEPARTMENT' ? targetDepartments : [],
      targetUsers: targetType === 'USERS' ? targetUsers : [],
      posterImage: posterImage || undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
    };

    setIsSubmitting(true);
    try {
      await announcementService.createAnnouncement(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentsList = ['Marketing', 'Product', 'R&D', 'Operations', 'Sales', 'Finance', 'HR'];
  const rolesList = ['FOUNDER', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN'];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(23, 34, 53, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 1060
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          height: '100%',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-subtle)'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              Create Announcement
            </h2>
            <p style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
              Publish company-wide announcements, team updates, and notices.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FFEBEE',
                border: '1px solid #FFCDD2',
                borderRadius: '8px',
                color: '#C62828',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
              Announcement Title <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q4 Clean Formulation Product Review"
              className="input-field"
              style={{ width: '100%', fontSize: '0.875rem' }}
              required
            />
          </div>

          {/* Short Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
              Short Description / Summary <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief 1-2 sentence overview visible on announcement cards..."
              rows={2}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
              required
            />
          </div>

          {/* Full Content Body */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
              Full Announcement Content
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Detailed information, meeting agendas, action items, or safety guidelines..."
              rows={5}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Type & Priority Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
                Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as AnnouncementType)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="EVENT">EVENT</option>
                <option value="MEETING">MEETING</option>
                <option value="IMPORTANT">IMPORTANT</option>
                <option value="NOTICE">NOTICE</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as AnnouncementPriority)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <option value="NORMAL">NORMAL (Neutral)</option>
                <option value="IMPORTANT">IMPORTANT (Soft Green)</option>
                <option value="URGENT">URGENT (Soft Red)</option>
              </select>
            </div>
          </div>

          {/* Target Audience Section */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)'
            }}
          >
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Target Audience
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }} role="group" aria-label="Target Audience">
              {userRole !== 'MANAGER' && (
                <button
                  type="button"
                  onClick={() => setTargetType('EVERYONE')}
                  className={`announcement-audience-btn ${targetType === 'EVERYONE' ? 'selected' : ''}`}
                  aria-pressed={targetType === 'EVERYONE'}
                >
                  Everyone
                </button>
              )}

              <button
                type="button"
                onClick={() => setTargetType('DEPARTMENT')}
                className={`announcement-audience-btn ${targetType === 'DEPARTMENT' ? 'selected' : ''}`}
                aria-pressed={targetType === 'DEPARTMENT'}
              >
                Department
              </button>

              {userRole !== 'MANAGER' && (
                <button
                  type="button"
                  onClick={() => setTargetType('ROLE')}
                  className={`announcement-audience-btn ${targetType === 'ROLE' ? 'selected' : ''}`}
                  aria-pressed={targetType === 'ROLE'}
                >
                  Specific Role
                </button>
              )}

              <button
                type="button"
                onClick={() => setTargetType('USERS')}
                className={`announcement-audience-btn ${targetType === 'USERS' ? 'selected' : ''}`}
                aria-pressed={targetType === 'USERS'}
              >
                Specific Users
              </button>
            </div>

            {/* Department Options */}
            {targetType === 'DEPARTMENT' && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Departments:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {departmentsList.map(dept => {
                    const isSelected = targetDepartments.includes(dept);
                    const isManagerDept = userRole === 'MANAGER' && dept.toLowerCase() === (currentUser?.department || '').toLowerCase();
                    const isDisabled = userRole === 'MANAGER' && !isManagerDept;
                    return (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => handleDeptToggle(dept)}
                        disabled={isDisabled}
                        className={`announcement-dept-btn ${isSelected ? 'selected' : ''}`}
                        aria-pressed={isSelected}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Role Options */}
            {targetType === 'ROLE' && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Roles:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {rolesList.map(r => {
                    const isSelected = targetRoles.includes(r);
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleRoleToggle(r)}
                        className={`announcement-dept-btn ${isSelected ? 'selected' : ''}`}
                        aria-pressed={isSelected}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Users Options */}
            {targetType === 'USERS' && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Users:
                </span>
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-input)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {allUsers.map(u => {
                    const isSelected = targetUsers.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.775rem',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--color-soft-green)' : 'transparent',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleUserToggle(u.id)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>
                          ({u.role} • {u.department || 'HQ'})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Poster Image Upload & Preview */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
              Announcement Poster / Image
            </label>

            {posterImage ? (
              <div
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                <img
                  src={posterImage}
                  alt="Poster preview"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '6px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '5px 10px',
                      background: 'var(--bg-surface)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterImage('')}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '5px 10px',
                      background: 'var(--bg-surface)',
                      color: 'var(--color-danger, #EF4444)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`announcement-upload-area ${isDragging ? 'dragging' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <ImageIcon size={28} color="var(--color-primary)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Click to upload or drag & drop poster image
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  JPG, JPEG, PNG, WEBP (Max 5MB)
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              style={{ display: 'none' }}
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '3px', display: 'block' }}>
              Expired announcements are automatically hidden from active feeds while preserved in archives.
            </span>
          </div>

          {/* Drawer Actions */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '8px 20px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
