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
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LavantaLogo } from '../ui/LavantaLogo';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = userRole === 'FOUNDER' || userRole === 'HR' || userRole === 'MANAGER' || userRole === 'HR_MANAGER';

  const navSections = [
    {
      title: 'Workspace',
      items: [
        ...(userRole === 'FOUNDER' ? [
          { label: 'Founder Cockpit', icon: <Compass size={18} />, to: '/founder' }
        ] : []),
        { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/dashboard' },
        { 
          label: isManagement ? 'Tasks' : 'My Tasks', 
          icon: <CheckSquare size={18} />, 
          to: '/tasks' 
        },
        { 
          label: isManagement ? 'Work Activity' : 'My Activity', 
          icon: <Activity size={18} />, 
          to: isManagement ? '/activity' : '/my-activity' 
        },
        { 
          label: isManagement ? 'Goals & OKRs' : 'My Goals', 
          icon: <Target size={18} />, 
          to: isManagement ? '/goals' : '/my-goals' 
        },
        { label: 'Documents', icon: <FileText size={18} />, to: '/documents' },
        { label: 'Calendar', icon: <Calendar size={18} />, to: '/calendar' }
      ]
    },
    {
      title: 'Catalog & Stock',
      items: [
        { label: 'Products', icon: <Package size={18} />, to: '/products' },
        ...(isManagement ? [{ label: 'Inventory', icon: <Layers size={18} />, to: '/inventory' }] : [])
      ]
    },
    {
      title: 'Sales & Finance',
      items: [
        { label: 'Orders', icon: <ShoppingBag size={18} />, to: '/orders' },
        ...((userRole === 'FOUNDER' || userRole === 'MANAGER') ? [
          { label: 'Sales Analytics', icon: <TrendingUp size={18} />, to: '/sales' },
          { label: 'Financials', icon: <DollarSign size={18} />, to: '/finance' }
        ] : []),
        { label: 'Expenses', icon: <Receipt size={18} />, to: '/expenses' }
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Company Chat', icon: <MessageSquare size={18} />, to: '/chat' },
        { label: 'Announcements', icon: <Megaphone size={18} />, to: '/announcements' },
        { label: 'Notifications', icon: <Bell size={18} />, to: '/notifications', badge: unreadCount > 0 ? unreadCount : undefined }
      ]
    },
    {
      title: 'Company & Operations',
      items: [
        ...(isManagement ? [{ label: 'Team', icon: <Users size={18} />, to: '/team' }] : []),
        ...(userRole === 'FOUNDER' || userRole === 'HR' ? [{ label: 'Security Audit', icon: <ShieldAlert size={18} />, to: '/audit' }] : []),
        ...(userRole === 'FOUNDER' ? [{ label: 'System Status', icon: <Server size={18} />, to: '/system' }] : []),
        { label: 'Profile', icon: <User size={18} />, to: '/profile' },
        { label: 'Settings', icon: <Settings size={18} />, to: '/settings' }
      ]
    }
  ];

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
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          transform: isMobileOpen ? 'translateX(0)' : undefined,
          ...(window.innerWidth <= 768
            ? {
                position: 'fixed',
                left: isMobileOpen ? 0 : '-100%',
                top: 0,
                bottom: 0,
                zIndex: 50,
                transition: 'left 0.25s ease'
              }
            : {})
        }}
      >
        {/* Brand Header — Clean White with Lavanta Naturals Logo */}
        <div className="sidebar-brand">
          <LavantaLogo variant={isCollapsed ? 'mark' : 'full'} size="sm" />

          <button
            onClick={onToggleCollapse}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: window.innerWidth <= 768 ? 'none' : 'flex'
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav">
          {navSections.map((section, idx) => (
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
                <span style={{ textTransform: 'capitalize' }}>
                  {(currentUser?.role || 'EMPLOYEE').replace('_', ' ').toLowerCase()}
                </span>
              </div>
            </div>
          )}
        </NavLink>
      </aside>
    </>
  );
};
