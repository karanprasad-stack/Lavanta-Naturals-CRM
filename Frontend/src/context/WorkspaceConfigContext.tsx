import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { roleWorkspaceService, RoleWorkspaceConfig } from '../services/roleWorkspaceService';
import { UserRole } from '../types';

interface WorkspaceConfigContextType {
  activeConfig: RoleWorkspaceConfig | null;
  allConfigs: Record<UserRole, RoleWorkspaceConfig> | null;
  isLoading: boolean;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  exitPreview: () => void;
  isModuleVisible: (moduleKey: string) => boolean;
  isWidgetVisible: (widgetKey: string) => boolean;
  refreshConfig: () => Promise<void>;
  updateRoleConfig: (
    role: UserRole,
    data: { sidebarModules: Record<string, boolean>; dashboardWidgets: Record<string, boolean> }
  ) => Promise<void>;
  resetRoleConfig: (role: UserRole) => Promise<void>;
}

const WorkspaceConfigContext = createContext<WorkspaceConfigContextType | undefined>(undefined);

export const WorkspaceConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [activeConfig, setActiveConfig] = useState<RoleWorkspaceConfig | null>(null);
  const [allConfigs, setAllConfigs] = useState<Record<UserRole, RoleWorkspaceConfig> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewRole, setPreviewRoleState] = useState<UserRole | null>(null);

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase() as UserRole;
  const isFounder = userRole === 'FOUNDER';

  const loadConfig = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveConfig(null);
      setAllConfigs(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const configs = await roleWorkspaceService.getAllConfigs();

      if (isFounder) {
        const configMap: Record<string, RoleWorkspaceConfig> = {};
        configs.forEach((c: RoleWorkspaceConfig) => {
          configMap[c.role] = c;
        });
        setAllConfigs(configMap as Record<UserRole, RoleWorkspaceConfig>);

        // Active config depends on whether Founder is in preview mode
        const targetRole = previewRole || 'FOUNDER';
        setActiveConfig(configMap[targetRole] || configs[0] || null);
      } else {
        const ownConfig = configs.find((c: RoleWorkspaceConfig) => c.role === userRole) || configs[0] || null;
        setActiveConfig(ownConfig);
      }
    } catch (err) {
      console.warn('[WorkspaceConfig] Failed to load workspace configuration:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isFounder, userRole, previewRole]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Handle preview role changes for Founder
  const setPreviewRole = (role: UserRole | null) => {
    if (!isFounder) return;
    setPreviewRoleState(role);
  };

  const exitPreview = () => {
    setPreviewRoleState(null);
  };

  // Check if a sidebar module is enabled/visible
  const isModuleVisible = useCallback(
    (moduleKey: string): boolean => {
      // If no config loaded yet, default to true so nothing breaks during initialization
      if (!activeConfig) return true;

      // Mandatory modules are ALWAYS visible
      if (activeConfig.mandatoryModules?.includes(moduleKey)) return true;

      // Check configured value
      if (activeConfig.sidebarModules && typeof activeConfig.sidebarModules[moduleKey] === 'boolean') {
        return activeConfig.sidebarModules[moduleKey];
      }

      // Default fallback
      return true;
    },
    [activeConfig]
  );

  // Check if a dashboard widget is enabled/visible
  const isWidgetVisible = useCallback(
    (widgetKey: string): boolean => {
      if (!activeConfig) return true;

      if (activeConfig.dashboardWidgets && typeof activeConfig.dashboardWidgets[widgetKey] === 'boolean') {
        return activeConfig.dashboardWidgets[widgetKey];
      }

      return true;
    },
    [activeConfig]
  );

  // Update role config (Founder only)
  const updateRoleConfig = async (
    role: UserRole,
    data: { sidebarModules: Record<string, boolean>; dashboardWidgets: Record<string, boolean> }
  ) => {
    const updated = await roleWorkspaceService.updateRoleConfig(role, data);

    setAllConfigs(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [role]: updated
      };
    });

    if ((previewRole || userRole) === role) {
      setActiveConfig(updated);
    }
  };

  // Reset role config (Founder only)
  const resetRoleConfig = async (role: UserRole) => {
    const reset = await roleWorkspaceService.resetRoleConfig(role);

    setAllConfigs(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [role]: reset
      };
    });

    if ((previewRole || userRole) === role) {
      setActiveConfig(reset);
    }
  };

  return (
    <WorkspaceConfigContext.Provider
      value={{
        activeConfig,
        allConfigs,
        isLoading,
        previewRole,
        setPreviewRole,
        exitPreview,
        isModuleVisible,
        isWidgetVisible,
        refreshConfig: loadConfig,
        updateRoleConfig,
        resetRoleConfig
      }}
    >
      {children}
    </WorkspaceConfigContext.Provider>
  );
};

export const useWorkspaceConfig = () => {
  const context = useContext(WorkspaceConfigContext);
  if (!context) {
    throw new Error('useWorkspaceConfig must be used within a WorkspaceConfigProvider');
  }
  return context;
};
