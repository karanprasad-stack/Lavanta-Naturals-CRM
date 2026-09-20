import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Eye, AlertCircle, Users } from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { AnnouncementReadReceipts } from '../../types/announcement';

interface AnnouncementReadReceiptsModalProps {
  announcementId: string;
  announcementTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementReadReceiptsModal: React.FC<AnnouncementReadReceiptsModalProps> = ({
  announcementId,
  announcementTitle,
  isOpen,
  onClose
}) => {
  const [data, setData] = useState<AnnouncementReadReceipts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'READ' | 'UNREAD'>('READ');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    announcementService
      .getReadReceipts(announcementId)
      .then(res => {
        if (isMounted) {
          setData(res.readReceipts);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to load read receipts');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, announcementId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(23, 34, 53, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-subtle)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color="var(--color-primary-deep)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Announcement Read Receipts
              </h3>
            </div>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '0.775rem',
                color: 'var(--color-text-secondary)',
                maxWidth: '420px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {announcementTitle}
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
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem 0' }}>
              <div className="skeleton-shimmer" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
              <div className="skeleton-shimmer" style={{ width: '100%', height: '120px', borderRadius: '8px' }} />
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '1rem',
                background: '#FFEBEE',
                border: '1px solid #FFCDD2',
                borderRadius: '8px',
                color: '#C62828',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {data && !loading && (
            <div>
              {/* Progress Summary Card */}
              <div
                style={{
                  background: 'var(--color-bg-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Read by: {data.readRatio}
                  </span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--color-primary-deep)'
                    }}
                  >
                    {data.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: '#E2E8F0',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${data.percentage}%`,
                      height: '100%',
                      background: 'var(--color-primary)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>

              {/* Tabs: Read vs Unread */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '1rem'
                }}
              >
                <button
                  onClick={() => setActiveTab('READ')}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    borderBottom: activeTab === 'READ' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    fontWeight: activeTab === 'READ' ? 600 : 500,
                    color: activeTab === 'READ' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle size={14} />
                  <span>Read ({data.readCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('UNREAD')}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    borderBottom: activeTab === 'UNREAD' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    fontWeight: activeTab === 'UNREAD' ? 600 : 500,
                    color: activeTab === 'UNREAD' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Clock size={14} />
                  <span>Unread ({data.unreadCount})</span>
                </button>
              </div>

              {/* User List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {activeTab === 'READ' ? (
                  data.readUsers.length > 0 ? (
                    data.readUsers.map(item => (
                      <div
                        key={item.user._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: '#FFFFFF'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--color-primary-subtle)',
                              color: 'var(--color-primary-deep)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}
                          >
                            {item.user.profilePhoto ? (
                              <img src={item.user.profilePhoto} alt={item.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              item.user.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {item.user.name}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                              {item.user.role} • {item.user.department || 'Lavanta'}
                            </div>
                          </div>
                        </div>

                        {item.readAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                            {new Date(item.readAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.825rem' }}>
                      No users have read this announcement yet.
                    </div>
                  )
                ) : data.unreadUsers.length > 0 ? (
                  data.unreadUsers.map(item => (
                    <div
                      key={item.user._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: '#FFFFFF'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F1F5F9',
                            color: '#64748B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                        >
                          {item.user.profilePhoto ? (
                            <img src={item.user.profilePhoto} alt={item.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            item.user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {item.user.name}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>
                            {item.user.role} • {item.user.department || 'Lavanta'}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'var(--color-bg-subtle)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        Pending
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-primary-deep)', fontSize: '0.825rem', fontWeight: 600 }}>
                    Everyone has read this announcement! 🎉
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--color-bg-subtle)'
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem', padding: '6px 16px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
