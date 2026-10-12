import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Activity,
  Target,
  Users,
  Bell,
  MessageSquare,
  Megaphone,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Settings,
  FileText,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Receipt,
  Compass,
  Server,
  ShieldAlert,
  Sliders,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { useWorkspaceConfig } from '../../context/WorkspaceConfigContext';
import { LavantaLogo } from '../ui/LavantaLogo';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  label: string;
  icon: React.ReactNode;
  to: string;
  moduleKey: string;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const { totalUnreadCount } = useChat();
  const { isModuleVisible, previewRole } = useWorkspaceConfig();
  const location = useLocation();

  const realRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  // If previewing, active role displays as previewRole
  const effectiveRole = previewRole || realRole;
  const isManagement = effectiveRole === 'FOUNDER' || effectiveRole === 'HR' || effectiveRole === 'MANAGER' || effectiveRole === 'HR_MANAGER';

  const navSections: { title: string; items: NavItemConfig[] }[] = [
    {
      title: 'Workspace',
      items: [
        { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/dashboard', moduleKey: 'dashboard' },
        { 
          label: isManagement ? 'Tasks' : 'My Tasks', 
          icon: <CheckSquare size={18} />, 
          to: '/tasks',
          moduleKey: 'tasks'
        },
        { 
          label: isManagement ? 'Work Activity' : 'My Activity', 
          icon: <Activity size={18} />, 
          to: isManagement ? '/activity' : '/my-activity',
          moduleKey: 'workActivity'
        },
        { 
          label: isManagement ? 'Goals & OKRs' : 'My Goals', 
          icon: <Target size={18} />, 
          to: isManagement ? '/goals' : '/my-goals',
          moduleKey: 'goals'
        },
        { label: 'Calendar', icon: <Calendar size={18} />, to: '/calendar', moduleKey: 'calendar' }
      ]
    },
    {
      title: 'Catalog & Sales',
      items: [
        { label: 'Products', icon: <Package size={18} />, to: '/products', moduleKey: 'products' },
        { label: 'Orders', icon: <ShoppingBag size={18} />, to: '/orders', moduleKey: 'orders' },
        { label: 'Sales Analytics', icon: <TrendingUp size={18} />, to: '/sales', moduleKey: 'salesAnalytics' }
      ]
    },
    {
      title: 'Finance',
      items: [
        { label: 'Expenses', icon: <Receipt size={18} />, to: '/expenses', moduleKey: 'expenses' },
        { label: 'Financials', icon: <DollarSign size={18} />, to: '/finance', moduleKey: 'financials' }
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Company Chat', icon: <MessageSquare size={18} />, to: '/chat', moduleKey: 'companyChat', badge: totalUnreadCount > 0 ? totalUnreadCount : undefined },
        { label: 'Announcements', icon: <Megaphone size={18} />, to: '/announcements', moduleKey: 'announcements' },
        { label: 'Notifications', icon: <Bell size={18} />, to: '/notifications', moduleKey: 'notifications', badge: unreadCount > 0 ? unreadCount : undefined }
      ]
    },
    {
      title: 'Company',
      items: [
        { label: 'Team', icon: <Users size={18} />, to: '/team', moduleKey: 'team' },
        { label: 'Security Audit', icon: <ShieldAlert size={18} />, to: '/audit', moduleKey: 'securityAudit' },
        { label: 'System Status', icon: <Server size={18} />, to: '/system', moduleKey: 'systemStatus' },
        ...(realRole === 'FOUNDER' && !previewRole ? [
          { label: 'Workspace Access', icon: <Sliders size={18} />, to: '/settings/workspace-access', moduleKey: 'settings' }
        ] : []),
        { label: 'Profile', icon: <User size={18} />, to: '/profile', moduleKey: 'profile' },
        { label: 'Settings', icon: <Settings size={18} />, to: '/settings', moduleKey: 'settings' }
      ]
    }
  ];

  // Dynamic filter based on role workspace configuration
  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => isModuleVisible(item.moduleKey))
    }))
    .filter(section => section.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 34, 53, 0.3)',
            backdropFilter: 'blur(2px)',
            zIndex: 45
          }}
        />
      )}

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          transform: isMobileOpen ? 'translateX(0)' : undefined
        }}
      >
        {/* Brand Header — Clean White with Lavanta Naturals Logo */}
        <div className="sidebar-brand">
          <LavantaLogo variant={isCollapsed ? 'mark' : 'full'} size="sm" />

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {/* Mobile close drawer button */}
          <button
            onClick={onCloseMobile}
            className="flex md:hidden"
            aria-label="Close navigation menu"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              background: 'var(--bg-subtle)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Visual Preview Mode Badge for Founder */}
        {previewRole && !isCollapsed && (
          <div
            style={{
              margin: '0.5rem 0.85rem',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(105, 196, 63, 0.12)',
              border: '1px solid rgba(105, 196, 63, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              color: 'var(--color-primary-deep, #3E8E25)',
              fontWeight: 600
            }}
          >
            <Eye size={13} />
            <span>Previewing {previewRole}</span>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="sidebar-nav">
          {filteredSections.map((section, idx) => (
            <div key={idx}>
              {!isCollapsed && <div className="nav-section-title">{section.title}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {section.items.map(item => {
                  const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => isMobileOpen && onCloseMobile()}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                      {!isCollapsed && <span>{item.label}</span>}
                      {!isCollapsed && item.badge !== undefined && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile at Bottom */}
        <NavLink
          to="/profile"
          className="sidebar-user"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
          title="View My Profile"
        >
          <img
            src={currentUser?.profilePhoto || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
            alt={currentUser?.name || 'User'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--border-color)'
            }}
          />
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentUser?.name}
              </div>
              <div
                style={{
                  fontSize: '0.725rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <ShieldCheck size={12} color="var(--color-primary)" />
                <span style={{ textTransform: 'capitalize', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
                  {effectiveRole.replace('_', ' ').toLowerCase()}
                  {previewRole ? ' (Preview)' : ''}
                </span>
              </div>
            </div>
          )}
        </NavLink>
      </aside>
    </>
  );
};
