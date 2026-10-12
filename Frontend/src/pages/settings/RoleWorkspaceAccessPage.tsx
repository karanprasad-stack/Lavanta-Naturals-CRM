import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Shield,
  RotateCcw,
  Save,
  Eye,
  CheckCircle2,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Compass,
  LayoutDashboard,
  CheckSquare,
  Activity,
  Target,
  FileText,
  Calendar,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Receipt,
  MessageSquare,
  Megaphone,
  Bell,
  Users,
  ShieldAlert,
  Server,
  User,
  Settings,
  HelpCircle,
  Sparkles,
  BarChart3,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWorkspaceConfig } from '../../context/WorkspaceConfigContext';
import {
  MODULE_DEFINITIONS,
  WIDGET_DEFINITIONS,
  ModuleDefinition,
  WidgetDefinition
} from '../../services/roleWorkspaceService';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const ROLES_LIST: { role: UserRole; label: string; desc: string }[] = [
  { role: 'FOUNDER', label: 'Founder', desc: 'Chief executive, unrestricted workspace access' },
  { role: 'HR', label: 'HR Lead', desc: 'People operations, recruitment, and organizational culture' },
  { role: 'MANAGER', label: 'Manager', desc: 'Operational leadership, orders, products & teams' },
  { role: 'EMPLOYEE', label: 'Employee', desc: 'Frontline operations, daily tasks & collaboration' },
  { role: 'INTERN', label: 'Intern', desc: 'Project support, scoped learning & basic workspace' }
];

export const RoleWorkspaceAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const {
    allConfigs,
    updateRoleConfig,
    resetRoleConfig,
    setPreviewRole,
    previewRole,
    exitPreview,
    isLoading: isGlobalLoading
  } = useWorkspaceConfig();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isFounder = userRole === 'FOUNDER';

  // Selected role being configured
  const [selectedRole, setSelectedRole] = useState<UserRole>('EMPLOYEE');

  // Active configuration tab: sidebar modules vs dashboard widgets
  const [activeTab, setActiveTab] = useState<'sidebar' | 'widgets'>('sidebar');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for modified config
  const [localSidebar, setLocalSidebar] = useState<Record<string, boolean>>({});
  const [localWidgets, setLocalWidgets] = useState<Record<string, boolean>>({});
  const [mandatoryList, setMandatoryList] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Category collapsed state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);

  // Unsaved changes confirmation modal
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<UserRole | null>(null);

  // Sync with current role's configuration when selectedRole or allConfigs changes
  useEffect(() => {
    if (allConfigs && allConfigs[selectedRole]) {
      const config = allConfigs[selectedRole];
      setLocalSidebar({ ...config.sidebarModules });
      setLocalWidgets({ ...config.dashboardWidgets });
      setMandatoryList(config.mandatoryModules || []);
    }
  }, [selectedRole, allConfigs]);

  // Compute whether there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!allConfigs || !allConfigs[selectedRole]) return false;
    const original = allConfigs[selectedRole];

    const sidebarChanged = Object.keys(localSidebar).some(
      key => localSidebar[key] !== original.sidebarModules?.[key]
    );

    const widgetsChanged = Object.keys(localWidgets).some(
      key => localWidgets[key] !== original.dashboardWidgets?.[key]
    );

    return sidebarChanged || widgetsChanged;
  }, [allConfigs, selectedRole, localSidebar, localWidgets]);

  // Group modules by category
  const categories = ['WORKSPACE', 'CATALOG & SALES', 'SALES & FINANCE', 'COMMUNICATION', 'COMPANY & OPERATIONS'] as const;

  const filteredModulesByCategory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result: Record<string, ModuleDefinition[]> = {};

    categories.forEach(cat => {
      const list = MODULE_DEFINITIONS.filter(m => m.category === cat).filter(m => {
        if (!q) return true;
        return m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      });
      result[cat] = list;
    });

    return result;
  }, [searchQuery]);

  const filteredWidgets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return WIDGET_DEFINITIONS.filter(w => {
      if (!q) return true;
      return w.label.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
    });
  }, [searchQuery]);

  // If user is not Founder, redirect with warning
  if (!isFounder) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#FF8585',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <Lock size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
          Only the workspace Founder can configure role module visibility and workspace settings.
        </p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Toggle a sidebar module
  const handleToggleModule = (key: string) => {
    if (mandatoryList.includes(key)) return; // Locked

    setLocalSidebar(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle a dashboard widget
  const handleToggleWidget = (key: string) => {
    setLocalWidgets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle category collapse
  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Role selector handler with unsaved changes guard
  const handleSelectRole = (newRole: UserRole) => {
    if (newRole === selectedRole) return;
    if (hasUnsavedChanges) {
      setPendingRoleSwitch(newRole);
      return;
    }
    setSelectedRole(newRole);
  };

  // Save changes to backend
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRoleConfig(selectedRole, {
        sidebarModules: localSidebar,
        dashboardWidgets: localWidgets
      });
      showToast(`Workspace configuration for ${selectedRole} updated successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel unsaved changes
  const handleCancel = () => {
    if (allConfigs && allConfigs[selectedRole]) {
      const config = allConfigs[selectedRole];
      setLocalSidebar({ ...config.sidebarModules });
      setLocalWidgets({ ...config.dashboardWidgets });
    }
  };

  // Reset to default
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetRoleConfig(selectedRole);
      showToast(`Workspace configuration for ${selectedRole} restored to factory default!`, 'success');
      setShowResetModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset configuration', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Get matching icon for each module
  const getModuleIcon = (key: string) => {
    switch (key) {
      case 'dashboard': return <LayoutDashboard size={16} />;
      case 'tasks': return <CheckSquare size={16} />;
      case 'workActivity': return <Activity size={16} />;
      case 'goals': return <Target size={16} />;
      case 'documents': return <FileText size={16} />;
      case 'calendar': return <Calendar size={16} />;
      case 'products': return <Package size={16} />;
      case 'inventory': return <Layers size={16} />;
      case 'orders': return <ShoppingBag size={16} />;
      case 'salesAnalytics': return <TrendingUp size={16} />;
      case 'financials': return <DollarSign size={16} />;
      case 'expenses': return <Receipt size={16} />;
      case 'companyChat': return <MessageSquare size={16} />;
      case 'announcements': return <Megaphone size={16} />;
      case 'notifications': return <Bell size={16} />;
      case 'team': return <Users size={16} />;
      case 'securityAudit': return <ShieldAlert size={16} />;
      case 'systemStatus': return <Server size={16} />;
      case 'profile': return <User size={16} />;
      case 'settings': return <Settings size={16} />;
      default: return <Sliders size={16} />;
    }
  };


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ======================================================================
          HEADER & ACTIONS
          ====================================================================== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem 1.75rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(88, 200, 58, 0.12)',
                color: '#86E56B',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              <Sliders size={12} /> Founder Administrative System
            </span>
            {hasUnsavedChanges && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.14)',
                  color: '#FFC45C',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                ● Unsaved Changes
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Role & Workspace Access
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Control which workspace modules and dashboard widgets are available to each role.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Preview as Selected Role */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (previewRole === selectedRole) {
                exitPreview();
              } else {
                setPreviewRole(selectedRole);
                showToast(`Visual preview activated for ${selectedRole}`, 'info');
              }
            }}
            style={{
              borderColor: previewRole === selectedRole ? 'var(--color-primary)' : 'var(--border-color)',
              color: previewRole === selectedRole ? '#86E56B' : 'var(--color-text-secondary)',
              backgroundColor: previewRole === selectedRole ? 'rgba(88, 200, 58, 0.12)' : 'var(--bg-surface-elevated)'
            }}
          >
            <Eye size={15} />
            <span>{previewRole === selectedRole ? `Exit ${selectedRole} Preview` : `Preview as ${selectedRole}`}</span>
          </Button>

          {/* Reset to Default */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResetModal(true)}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RotateCcw size={15} />
            <span>Reset to Default</span>
          </Button>

          {/* Cancel */}
          {hasUnsavedChanges && (
            <Button variant="ghost" size="sm" onClick={handleCancel} style={{ color: 'var(--color-text-muted)' }}>
              Discard
            </Button>
          )}

          {/* Save Changes */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            style={{ minWidth: '120px' }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* ======================================================================
          ROLE SELECTOR BAR
          ====================================================================== */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Role to Configure
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
              {ROLES_LIST.find(r => r.role === selectedRole)?.desc}
            </div>
          </div>

          <Badge variant="sage">
            {Object.values(localSidebar).filter(Boolean).length} Modules Active
          </Badge>
        </div>

        {/* Segmented Role Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px',
            backgroundColor: 'var(--bg-input)',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}
        >
          {ROLES_LIST.map(({ role, label }) => {
            const isSelected = selectedRole === role;
            const isCurrentPreview = previewRole === role;

            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid transparent',
                  backgroundColor: isSelected ? 'rgba(88, 200, 58, 0.12)' : 'transparent',
                  color: isSelected ? '#DCE5EF' : 'var(--color-text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 6px rgba(0, 0, 0, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{label}</span>
                {isCurrentPreview && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)'
                    }}
                    title="Currently in preview"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================================
          CONFIGURATION TABS & SEARCH
          ====================================================================== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('sidebar')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: activeTab === 'sidebar' ? 'var(--border-strong)' : 'var(--border-color)',
              backgroundColor: activeTab === 'sidebar' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              color: activeTab === 'sidebar' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Sliders size={15} />
            <span>Sidebar & Modules</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: activeTab === 'sidebar' ? 'rgba(88, 200, 58, 0.15)' : 'var(--bg-subtle)',
                color: activeTab === 'sidebar' ? '#86E56B' : 'var(--color-text-muted)'
              }}
            >
              {MODULE_DEFINITIONS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('widgets')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: activeTab === 'widgets' ? 'var(--border-strong)' : 'var(--border-color)',
              backgroundColor: activeTab === 'widgets' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              color: activeTab === 'widgets' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <BarChart3 size={15} />
            <span>Dashboard Widgets</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: activeTab === 'widgets' ? 'rgba(88, 200, 58, 0.15)' : 'var(--bg-subtle)',
                color: activeTab === 'widgets' ? '#86E56B' : 'var(--color-text-muted)'
              }}
            >
              {WIDGET_DEFINITIONS.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search modules..."
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '34px',
              paddingRight: searchQuery ? '30px' : '12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-input)',
              fontSize: '0.85rem',
              color: 'var(--color-text-primary)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================================
          TAB 1: SIDEBAR MODULES CONFIGURATION
          ====================================================================== */}
      {activeTab === 'sidebar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {categories.map(category => {
            const modules = filteredModulesByCategory[category] || [];
            if (modules.length === 0) return null;

            const isCollapsed = !!collapsedCategories[category];
            const enabledCount = modules.filter(m => !!localSidebar[m.key]).length;

            return (
              <div
                key={category}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                {/* Category Header */}
                <div
                  onClick={() => toggleCategoryCollapse(category)}
                  style={{
                    padding: '1rem 1.5rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
                      {category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: enabledCount === modules.length ? 'rgba(88, 200, 58, 0.15)' : 'var(--bg-surface-elevated)',
                        color: enabledCount === modules.length ? '#86E56B' : 'var(--color-text-muted)',
                        fontWeight: 600
                      }}
                    >
                      {enabledCount} of {modules.length} enabled
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </div>
                </div>

                {/* Modules List */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {modules.map(mod => {
                      const isMandatory = mandatoryList.includes(mod.key);
                      const isEnabled = isMandatory ? true : !!localSidebar[mod.key];

                      return (
                        <div
                          key={mod.key}
                          style={{
                            padding: '1.1rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: 'transparent',
                            transition: 'background-color 0.12s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '75%' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: isEnabled ? 'rgba(88, 200, 58, 0.14)' : 'var(--bg-subtle)',
                                color: isEnabled ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: '2px',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              {getModuleIcon(mod.key)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--color-text-primary)' }}>
                                  {mod.label}
                                </span>
                                {isMandatory && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(88, 200, 58, 0.14)',
                                      color: '#86E56B',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      border: '1px solid rgba(88, 200, 58, 0.3)'
                                    }}
                                    title="Mandatory system module: required for this role"
                                  >
                                    <Lock size={10} /> Required
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                                {mod.description}
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div>
                            <button
                              type="button"
                              disabled={isMandatory}
                              onClick={() => handleToggleModule(mod.key)}
                              style={{
                                width: '46px',
                                height: '26px',
                                borderRadius: '999px',
                                backgroundColor: isEnabled ? 'var(--color-primary)' : '#263548',
                                border: '1px solid var(--border-color)',
                                position: 'relative',
                                cursor: isMandatory ? 'not-allowed' : 'pointer',
                                opacity: isMandatory ? 0.75 : 1,
                                transition: 'background-color 0.2s',
                                padding: 0
                              }}
                              title={isMandatory ? 'Required module (cannot be turned off)' : isEnabled ? 'Click to disable' : 'Click to enable'}
                            >
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  backgroundColor: isEnabled ? '#FFFFFF' : '#8495AA',
                                  position: 'absolute',
                                  top: '3px',
                                  left: isEnabled ? '23px' : '3px',
                                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================================
          TAB 2: DASHBOARD WIDGETS CONFIGURATION
          ====================================================================== */}
      {activeTab === 'widgets' && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Operational Dashboard Widgets for {selectedRole}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '3px 0 0 0' }}>
              Configure which analytics summary cards and live widgets appear on this role's dashboard.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredWidgets.map(widget => {
              const isEnabled = !!localWidgets[widget.key];

              return (
                <div
                  key={widget.key}
                  style={{
                    padding: '1.1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.12s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '75%' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: isEnabled ? 'rgba(88, 200, 58, 0.14)' : 'var(--bg-subtle)',
                        color: isEnabled ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--color-text-primary)' }}>
                          {widget.label}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--color-text-muted)',
                            fontWeight: 500,
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {widget.category}
                        </span>
                      </div>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                        {widget.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleToggleWidget(widget.key)}
                      style={{
                        width: '46px',
                        height: '26px',
                        borderRadius: '999px',
                        backgroundColor: isEnabled ? 'var(--color-primary)' : '#263548',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: 0
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: isEnabled ? '#FFFFFF' : '#8495AA',
                          position: 'absolute',
                          top: '3px',
                          left: isEnabled ? '23px' : '3px',
                          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================================
          RESET TO DEFAULT CONFIRMATION MODAL
          ====================================================================== */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => setShowResetModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              border: '1px solid var(--border-strong)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#FFC45C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                <RotateCcw size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Reset {selectedRole} Workspace?
              </h3>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to reset the workspace configuration for <strong>{selectedRole}</strong> to the system defaults?
              Any custom module visibility adjustments will be restored.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="ghost" size="sm" onClick={() => setShowResetModal(false)} disabled={isResetting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReset}
                disabled={isResetting}
                style={{ backgroundColor: '#D97706', borderColor: '#D97706', color: '#FFFFFF' }}
              >
                {isResetting ? 'Resetting...' : 'Reset to Default'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          UNSAVED CHANGES SWITCH CONFIRMATION MODAL
          ====================================================================== */}
      {pendingRoleSwitch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => setPendingRoleSwitch(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              border: '1px solid var(--border-strong)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#FFC45C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Unsaved Changes
              </h3>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              You have unsaved workspace configuration changes for <strong>{selectedRole}</strong>.
              Do you want to save your changes before switching to {pendingRoleSwitch}?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRole(pendingRoleSwitch);
                  setPendingRoleSwitch(null);
                }}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await handleSave();
                  setSelectedRole(pendingRoleSwitch);
                  setPendingRoleSwitch(null);
                }}
              >
                Save & Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
