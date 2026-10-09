import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  Bell,
  MessageSquare,
  Menu,
  User,
  LogOut,
  Shield,
  Plus,
  Compass,
  Activity,
  Target,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { QuickCreateModal } from './QuickCreateModal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

const formatRole = (role?: string) => {
  if (!role) return 'Founder';
  if (role.toUpperCase() === 'HR') return 'HR';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase().replace(/_/g, ' ');
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, activeRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { open: openCommandPalette } = useCommandPalette();
  const { totalUnreadCount } = useChat();
  const { isDark, toggleTheme } = useTheme();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Generate readable title
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSection = pathParts[0] || 'dashboard';
  const pageTitle = currentSection.charAt(0).toUpperCase() + currentSection.slice(1).replace('-', ' ');

  return (
    <header className="top-header">
      {/* Left: Mobile Menu & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flexShrink: 1 }}>
        <button
          onClick={onOpenMobileSidebar}
          className="header-mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <div className="header-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.725rem', color: 'var(--color-text-secondary)', marginBottom: '1px' }}>
            <Link to="/dashboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Lavanta HQ</Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ textTransform: 'capitalize', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
              {currentSection}
            </span>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: Quick Create, Search, Role Pill, Utilities (Chat, Calendar, Theme, Notifications), Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'nowrap', flexShrink: 0 }}>
        {/* Quick Create '+' Button */}
        <button
          onClick={() => setIsQuickCreateOpen(true)}
          className="header-create-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0 0.85rem',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(105, 196, 63, 0.25)',
            transition: 'background 0.15s ease',
            flexShrink: 0
          }}
          title="Quick Create (Tasks, Orders, Expenses, Products...)"
        >
          <Plus size={15} />
          <span>Create</span>
        </button>

        {/* Search */}
        <button
          id="header-global-search-btn"
          onClick={openCommandPalette}
          className="header-search-btn"
          title="Search anything (Cmd+K)"
          aria-label="Search tasks, announcements, team..."
        >
          <Search size={15} color="var(--color-text-secondary)" style={{ flexShrink: 0 }} />
          <span>Search tasks, announcements, team...</span>
          <span className="header-shortcut-key">⌘K</span>
        </button>

        {/* Authenticated Role Indicator */}
        <div
          className="header-role-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 0.75rem',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-soft-green)',
            color: 'var(--color-primary-deep)',
            border: '1px solid rgba(105, 196, 63, 0.3)',
            fontSize: '0.775rem',
            fontWeight: 600,
            userSelect: 'none',
            flexShrink: 0
          }}
          title={`Authenticated Role: ${formatRole(currentUser?.role || activeRole)}`}
        >
          <Shield size={13} />
          <span>
            {formatRole(currentUser?.role || activeRole)}
          </span>
        </div>

        {/* Subtle Divider */}
        <div
          className="header-role-divider"
          style={{
            width: '1px',
            height: '22px',
            backgroundColor: 'var(--border-color)',
            margin: '0 0.15rem',
            flexShrink: 0
          }}
        />

        {/* Utilities Group: Chat, Calendar, Theme, Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {/* Chat shortcut */}
          <button
            onClick={() => navigate('/chat')}
            className="header-nav-utility"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
            title="Open Company Chat"
          >
            <MessageSquare size={17} />
            {totalUnreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 3px',
                  borderRadius: '8px',
                  background: 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFFFFF'
                }}
              >
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </button>

          {/* Calendar shortcut */}
          <button
            onClick={() => navigate('/calendar')}
            className="header-nav-utility"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Open Calendar"
          >
            <Calendar size={17} />
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: isDark ? '#FBBF24' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications Popover */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileMenuOpen(false);
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
              title="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#FFFFFF',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

          {isNotifOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                width: '320px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                padding: '0.75rem',
                maxHeight: '380px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary-deep)',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        fontSize: '0.675rem',
                        fontWeight: 700
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary-deep)',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}
                  >
                    View All
                  </Link>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map(n => {
                    const link =
                      n.relatedEntityType === 'TASK' || n.taskId
                        ? `/tasks/${n.relatedEntityId || n.taskId}`
                        : n.relatedEntityType === 'ANNOUNCEMENT'
                        ? `/announcements/${n.relatedEntityId}`
                        : undefined;

                    return (
                      <div
                        key={n._id}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n._id);
                          if (link) navigate(link);
                          setIsNotifOpen(false);
                        }}
                        style={{
                          padding: '0.6rem',
                          borderRadius: '8px',
                          background: n.isRead ? 'var(--bg-surface-elevated)' : 'var(--color-soft-green)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: '0.775rem',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: n.isRead ? 600 : 700, color: 'var(--color-text-primary)' }}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'var(--color-primary)'
                              }}
                            />
                          )}
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.725rem', margin: '2px 0 4px 0', lineHeight: 1.35 }}>
                          {n.message}
                        </div>
                        <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>
                          {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Profile Avatar & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setIsNotifOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
            title={currentUser?.name || 'User Profile'}
            aria-label="User profile menu"
          >
            <img
              src={currentUser?.profilePhoto || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'User'}
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)' }}
            />
          </button>

          {isProfileMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                width: '210px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                padding: '0.5rem'
              }}
            >
              <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{currentUser?.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{currentUser?.email}</div>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.45rem 0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-primary)'
                }}
              >
                <User size={14} />
                <span>My Profile</span>
              </Link>

              <Link
                to="/my-activity"
                onClick={() => setIsProfileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.45rem 0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Activity size={14} />
                <span>My Activity</span>
              </Link>

              <Link
                to="/my-goals"
                onClick={() => setIsProfileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.45rem 0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Target size={14} />
                <span>My Goals & OKRs</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setIsProfileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.45rem 0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Settings size={14} />
                <span>Settings</span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.45rem 0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '4px'
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </header>
  );
};
