import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { ErrorBoundary } from '../ui/ErrorState';
import { RolePreviewBanner } from './RolePreviewBanner';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-layout min-h-screen transition-colors duration-200">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-wrapper flex-1 flex flex-col min-w-0" style={{ backgroundColor: 'var(--bg-main)' }}>
        <RolePreviewBanner />
        <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="main-content flex-1 p-6 md:p-8 max-w-[1560px] w-full mx-auto">
          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
};
