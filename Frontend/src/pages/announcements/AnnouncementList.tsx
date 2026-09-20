import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Megaphone,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { Announcement, AnnouncementType } from '../../types/announcement';
import { AnnouncementCard } from '../../components/announcements/AnnouncementCard';
import { AnnouncementCardSkeleton } from '../../components/announcements/AnnouncementSkeleton';
import { AnnouncementCreateDrawer } from '../../components/announcements/AnnouncementCreateDrawer';
import { useAuth } from '../../context/AuthContext';

export const AnnouncementList: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const userRole = (currentUser?.role || '').toUpperCase();
  const canCreate = userRole === 'FOUNDER' || userRole === 'HR' || userRole === 'MANAGER';

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAnnouncements({
        type: selectedType,
        priority: selectedPriority,
        unreadOnly,
        search: search.trim() || undefined
      });
      setAnnouncements(res.announcements || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedPriority, unreadOnly, search]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filterTabs: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Updates' },
    { id: 'MEETING', label: 'Meetings' },
    { id: 'EVENT', label: 'Events' },
    { id: 'IMPORTANT', label: 'Important' },
    { id: 'NOTICE', label: 'Notices' },
    { id: 'GENERAL', label: 'General' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Announcements
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary-deep)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
            Stay updated with what's happening at Lavanta Naturals.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', padding: '9px 18px' }}
          >
            <Plus size={16} />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '0.75rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {/* Top Controls: Search + Priority + Unread Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '400px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search announcements..."
              className="input-field"
              style={{ paddingLeft: '32px', width: '100%', fontSize: '0.825rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Priority Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Priority:
              </span>
              <select
                value={selectedPriority}
                onChange={e => setSelectedPriority(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '5px 8px' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Unread Only Pill Button */}
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: unreadOnly ? 600 : 500,
                border: unreadOnly ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: unreadOnly ? 'var(--color-primary-subtle)' : '#FFFFFF',
                color: unreadOnly ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={14} color={unreadOnly ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
              <span>Unread Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {filterTabs.map(tab => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.775rem',
                  fontWeight: isActive ? 600 : 500,
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Announcements Content Grid */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {[1, 2, 3, 4, 5, 6].map(i => (
            <AnnouncementCardSkeleton key={i} />
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {announcements.map(announcement => (
            <AnnouncementCard key={announcement._id} announcement={announcement} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}
          >
            <Megaphone size={26} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '4px 0 0 0' }}>
            {unreadOnly ? 'No unread announcements' : 'No announcements right now'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: 0 }}>
            {unreadOnly
              ? 'You are all caught up on latest company notices and meetings.'
              : 'No new updates have been posted for your role or department.'}
          </p>

          {canCreate && !unreadOnly && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="btn btn-secondary"
              style={{ marginTop: '0.5rem', fontSize: '0.825rem' }}
            >
              + Create First Announcement
            </button>
          )}
        </div>
      )}

      {/* Create Announcement Drawer */}
      <AnnouncementCreateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchAnnouncements}
      />
    </div>
  );
};
