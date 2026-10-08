import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { WorkspaceConfigProvider } from './context/WorkspaceConfigContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Core Phase 1 Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/profile/ProfilePage';
import { RoleWorkspaceAccessPage } from './pages/settings/RoleWorkspaceAccessPage';
import { ModulePlaceholder } from './pages/placeholder/ModulePlaceholder';

import { TeamDirectory } from './pages/team/TeamDirectory';
import { EmployeeProfile } from './pages/team/EmployeeProfile';

// Phase 4: Task Management Pages
import { TaskList } from './pages/tasks/TaskList';
import { TaskDetail } from './pages/tasks/TaskDetail';

// Phase 5: Announcements & Notifications Pages
import { AnnouncementList } from './pages/announcements/AnnouncementList';
import { AnnouncementDetail } from './pages/announcements/AnnouncementDetail';
import { NotificationsPage } from './pages/notifications/NotificationsPage';

// Phase 6: Chat
import { ChatPage } from './pages/chat/ChatPage';
import { ChatProvider } from './context/ChatContext';

// Phase 7: Calendar
import { CalendarPage } from './pages/calendar/CalendarPage';

// Phase 8: Employee Activity & Work Monitoring
import { ActivityPage } from './pages/activity/ActivityPage';
import { UserActivityPage } from './pages/activity/UserActivityPage';
import { MyActivityPage } from './pages/activity/MyActivityPage';

// Phase 9: Goals, OKRs & Performance Planning
import { GoalsPage } from './pages/goals/GoalsPage';
import { GoalDetailPage } from './pages/goals/GoalDetailPage';
import { MyGoalsPage } from './pages/goals/MyGoalsPage';
import { TeamGoalsPage } from './pages/goals/TeamGoalsPage';

// Products Management (Catalog & Sales)
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { AddProductPage } from './pages/products/AddProductPage';
import { EditProductPage } from './pages/products/EditProductPage';

// Phase 12: Sales, Orders & Expense Management
import { OrdersPage } from './pages/orders/OrdersPage';
import { CreateOrderPage } from './pages/orders/CreateOrderPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { SalesDashboardPage } from './pages/sales/SalesDashboardPage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { CreateExpensePage } from './pages/expenses/CreateExpensePage';
import { ExpenseDetailPage } from './pages/expenses/ExpenseDetailPage';
import { FinancePage } from './pages/finance/FinancePage';

// Phase 13: Founder Command Center, Audit, System Status, Settings & Error Pages
import { FounderCommandCenter } from './pages/founder/FounderCommandCenter';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { SystemStatusPage } from './pages/system/SystemStatusPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AccessDeniedPage } from './pages/error/AccessDeniedPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

// Route guard component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FAFBF8' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #E8D8FF',
              borderTopColor: '#69C43F',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span style={{ fontSize: '0.85rem', color: '#5A667A', fontWeight: 500 }}>
            Loading Lavanta Naturals Workspace...
          </span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Founder Route: redirects backward-compatible /founder requests to /dashboard
const FounderRoute: React.FC = () => {
  return <Navigate to="/dashboard" replace />;
};

// Audit Route Guard: strictly restricts access to FOUNDER and HR
const AuditRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  if (role !== 'FOUNDER' && role !== 'HR' && role !== 'HR_MANAGER') {
    return <Navigate to="/403" replace />;
  }

  return <AuditLogPage />;
};

// System Status Route Guard: strictly restricts access to FOUNDER
const SystemStatusRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  if (role !== 'FOUNDER') {
    return <Navigate to="/403" replace />;
  }

  return <SystemStatusPage />;
};

// Team Route Guard: strictly restricts access to FOUNDER, HR, and MANAGER
const TeamRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER' && role !== 'HR_MANAGER') {
    return <Navigate to="/dashboard" replace />;
  }

  return <TeamDirectory />;
};

// Activity Route Guard: redirects non-managers to /my-activity
const ActivityRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER' && role !== 'HR_MANAGER') {
    return <Navigate to="/my-activity" replace />;
  }

  return <ActivityPage />;
};

// Goals Route Guard: redirects non-managers to /my-goals
const GoalsRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER' && role !== 'HR_MANAGER') {
    return <Navigate to="/my-goals" replace />;
  }

  return <GoalsPage />;
};

// Sales Route Guard: strictly restricts analytics to FOUNDER, HR, and MANAGER
const SalesRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER' && role !== 'HR_MANAGER') {
    return <Navigate to="/orders" replace />;
  }

  return <SalesDashboardPage />;
};

// Finance Route Guard: strictly restricts executive financials to FOUNDER, HR, and MANAGER
const FinanceRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER' && role !== 'HR_MANAGER') {
    return <Navigate to="/expenses" replace />;
  }

  return <FinancePage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <ChatProvider>
                <CommandPaletteProvider>
                  <WorkspaceConfigProvider>
                    <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                {/* Protected Workspace Layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />

                  {/* Core Phase 1 User Profile */}
                  <Route path="profile" element={<ProfilePage />} />

                  {/* Phase 2: Real Team Management & Directory */}
                  <Route path="team" element={<TeamRoute />} />
                  <Route path="team/:id" element={<EmployeeProfile />} />

                  {/* Phase 4: Task Management System */}
                  <Route path="tasks" element={<TaskList />} />
                  <Route path="tasks/:id" element={<TaskDetail />} />

                  {/* Phase 8: Employee Activity & Work Monitoring */}
                  <Route path="activity" element={<ActivityRoute />} />
                  <Route path="activity/user/:id" element={<UserActivityPage />} />
                  <Route path="my-activity" element={<MyActivityPage />} />

                  {/* Phase 7: Calendar */}
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route
                    path="meetings"
                    element={
                      <ModulePlaceholder
                        moduleName="Meetings & Video Sync"
                        description="Meeting agendas, video links, and action items will be launched in the next module."
                        category="Workspace"
                      />
                    }
                  />
                  <Route
                    path="meetings/:id"
                    element={
                      <ModulePlaceholder
                        moduleName="Meeting Details"
                        description="Meeting recap and notes will be launched in the next module."
                        category="Workspace"
                      />
                    }
                  />

                  {/* Phase 6: Real-Time Chat */}
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="announcements" element={<AnnouncementList />} />
                  <Route path="announcements/:id" element={<AnnouncementDetail />} />
                  <Route path="notices" element={<AnnouncementList />} />
                  <Route path="notices/:id" element={<AnnouncementDetail />} />

                  {/* System & Operations */}
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="settings/workspace-access" element={<RoleWorkspaceAccessPage />} />
                  <Route path="workspace-access" element={<Navigate to="/settings/workspace-access" replace />} />

                  {/* Phase 13: Founder Command Center & System Management */}
                  <Route path="founder" element={<FounderRoute />} />
                  <Route path="audit" element={<AuditRoute />} />
                  <Route path="system" element={<SystemStatusRoute />} />
                  <Route path="403" element={<AccessDeniedPage />} />

                  {/* Products Catalog & Sales */}
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/new" element={<AddProductPage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route path="products/:id/edit" element={<EditProductPage />} />
                  {/* Inventory module completely removed: safely redirect to products */}
                  <Route path="inventory" element={<Navigate to="/products" replace />} />
                  <Route path="inventory/*" element={<Navigate to="/products" replace />} />

                  {/* Phase 12: Sales, Orders & Expense Management */}
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="orders/new" element={<CreateOrderPage />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />
                  <Route path="sales" element={<SalesRoute />} />
                  <Route path="sales-analytics" element={<SalesRoute />} />
                  <Route path="sales-analytics/*" element={<SalesRoute />} />
                  <Route path="sales/:id" element={<Navigate to="/orders/:id" replace />} />
                  <Route path="finance" element={<FinanceRoute />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="expenses/new" element={<CreateExpensePage />} />
                  <Route path="expenses/:id" element={<ExpenseDetailPage />} />
                  {/* Documents module removed: safely redirect any old bookmarks to dashboard */}
                  <Route path="documents" element={<Navigate to="/dashboard" replace />} />
                  <Route path="documents/*" element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="reports"
                    element={
                      <ModulePlaceholder
                        moduleName="Executive & Team Reports"
                        description="Periodic performance summaries and metrics exports will be launched in future modules."
                        category="Resources"
                      />
                    }
                  />
                  <Route
                    path="ideas"
                    element={
                      <ModulePlaceholder
                        moduleName="Idea Box & Innovation"
                        description="Internal product ideas and team suggestions will be launched in future modules."
                        category="Resources"
                      />
                    }
                  />
                  {/* Phase 9: Goals, OKRs & Performance Planning */}
                  <Route path="goals" element={<GoalsRoute />} />
                  <Route path="goals/:id" element={<GoalDetailPage />} />
                  <Route path="my-goals" element={<MyGoalsPage />} />
                  <Route path="team-goals" element={<TeamGoalsPage />} />

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
                </WorkspaceConfigProvider>
              </CommandPaletteProvider>
            </ChatProvider>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
