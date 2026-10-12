import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { ErrorBoundary } from '../ui/ErrorState';
import { RolePreviewBanner } from './RolePreviewBanner';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');

  return (
    <div
      className={`app-layout min-h-screen transition-colors duration-200 ${
        isChatRoute ? 'chat-route-active h-screen max-h-screen overflow-hidden' : ''
      }`}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className="main-wrapper flex-1 flex flex-col min-w-0"
        style={{
          backgroundColor: 'var(--bg-main)',
          ...(isChatRoute ? { height: '100%', maxHeight: '100dvh', overflow: 'hidden' } : {})
        }}
      >
        <RolePreviewBanner />
        <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main
          className={`main-content flex-1 max-w-[1560px] w-full mx-auto ${
            isChatRoute
              ? 'flex flex-col min-h-0 overflow-hidden p-2 sm:p-3 md:p-6 pb-2 sm:pb-3 md:pb-6'
              : 'p-3 sm:p-4 md:p-6 lg:p-8'
          }`}
        >
          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={isChatRoute ? 'flex-1 flex flex-col min-h-0 min-w-0 h-full' : ''}
              style={
                isChatRoute
                  ? { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }
                  : undefined
              }
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

