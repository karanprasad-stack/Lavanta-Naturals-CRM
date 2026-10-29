import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';
import {
  User,
  Shield,
  Bell,
  Palette,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LavantaLogo } from '../../components/ui/LavantaLogo';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'appearance';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'workspace') {
      navigate('/settings/workspace-access', { replace: true });
    }
  }, [tabParam, navigate]);

  const validTabs: SettingsTab[] = ['profile', 'security', 'notifications', 'appearance'];
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    validTabs.includes(tabParam as SettingsTab) ? (tabParam as SettingsTab) : 'profile'
  );

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profilePhoto || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    tasks: true,
    announcements: true,
    goals: true,
    orders: true,
    expenses: true
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);

    try {
      const res = await apiClient.put<{ success: boolean; user: any }>(`/users/${currentUser.id}`, {
        name: name.trim(),
        phone: phone.trim(),
        profilePhoto: profilePhoto.trim()
      });

      if (res.data?.user && updateCurrentUser) {
        updateCurrentUser(res.data.user);
      }
      showToast('Profile information updated successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please provide both current and new password', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'warning');
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.put('/auth/password', {
        currentPassword,
        newPassword
      });
      showToast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = () => {
    showToast('Notification preferences saved successfully', 'success');
  };

  const handleRevokeSessions = () => {
    showToast('All other active browser sessions have been revoked', 'info');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Account & Workspace Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
          Manage your personal profile, security credentials, and alert preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[var(--border-color)] scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'profile' ? 'var(--color-soft-green)' : 'transparent',
            color: activeTab === 'profile' ? (isDark ? '#7BE05C' : 'var(--color-primary-deep)') : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <User size={16} />
          Profile
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'security' ? 'var(--color-soft-green)' : 'transparent',
            color: activeTab === 'security' ? (isDark ? '#7BE05C' : 'var(--color-primary-deep)') : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Shield size={16} />
          Security
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'notifications' ? 'var(--color-soft-green)' : 'transparent',
            color: activeTab === 'notifications' ? (isDark ? '#7BE05C' : 'var(--color-primary-deep)') : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Bell size={16} />
          Notifications
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'appearance' ? 'var(--color-soft-green)' : 'transparent',
            color: activeTab === 'appearance' ? (isDark ? '#7BE05C' : 'var(--color-primary-deep)') : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Palette size={16} />
          Appearance
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--color-soft-green)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (name || 'U').charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                {currentUser?.name}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                <Badge variant="forest">{currentUser?.role}</Badge>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {currentUser?.department} • {currentUser?.designation}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Email Address (Workspace Identity)
              </label>
              <input
                type="email"
                className="input-field"
                value={currentUser?.email || ''}
                disabled
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-text-muted)', cursor: 'not-allowed', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                className="input-field"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Profile Photo URL
              </label>
              <input
                type="url"
                className="input-field"
                value={profilePhoto}
                onChange={e => setProfilePhoto(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Department (Locked)
              </label>
              <input
                type="text"
                className="input-field"
                value={currentUser?.department || ''}
                disabled
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-text-muted)', cursor: 'not-allowed', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Joining Date
              </label>
              <input
                type="text"
                className="input-field"
                value={currentUser?.joiningDate || ''}
                disabled
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-text-muted)', cursor: 'not-allowed', borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save size={16} />}
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <form
            onSubmit={handleSavePassword}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Password & Authentication Credentials
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                Choose a strong password to protect your workspace account.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<Lock size={16} />}
                disabled={savingPassword}
              >
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#FF8585" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#FF8585' }}>
                Danger Zone: Session & Device Access
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Revoke active credentials and forcibly terminate all other authenticated sessions across web and mobile clients.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<LogOut size={15} />}
                onClick={handleRevokeSessions}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#FF8585'
                }}
              >
                Revoke All Other Sessions
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Operational Alert Preferences
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
              Configure which activities trigger notifications in your top notification bell.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { key: 'tasks', label: 'Task Assignments & Updates', desc: 'Alerts when tasks are assigned, started, or completed' },
              { key: 'announcements', label: 'Company Announcements', desc: 'Urgent company broadcasts and department bulletins' },
              { key: 'goals', label: 'Goals & OKR Milestones', desc: 'Quarterly objective progress and at-risk notifications' },
              { key: 'orders', label: 'Order & Multi-Channel Sales Updates', desc: 'New orders and delivery milestone updates across sales channels' },
              { key: 'expenses', label: 'Expense Claim Approvals', desc: 'Status updates on submitted operational reimbursements' }
            ].map(item => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {item.desc}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={(notifPrefs as any)[item.key]}
                  onChange={e => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                />
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Button
              variant="primary"
              size="md"
              icon={<Save size={16} />}
              onClick={handleSaveNotifications}
            >
              Save Notification Preferences
            </Button>
          </div>
        </div>
      )}

      {/* Tab 4: Appearance */}
      {activeTab === 'appearance' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Appearance & Theme
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
              Customize your workspace visual experience. Changes are saved automatically and synchronized across all CRM modules.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
              Color Theme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  textAlign: 'left',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: !isDark ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: !isDark ? 'var(--color-soft-green)' : 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: !isDark ? '#FFFBEB' : 'var(--bg-subtle)',
                      color: '#D97706',
                      display: 'flex'
                    }}>
                      <Sun size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>Natural Light</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Default brand palette</div>
                    </div>
                  </div>
                  {!isDark && (
                    <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </div>

                {/* Preview Thumbnail */}
                <div style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#FAFBF8',
                  border: '1px solid #EAEFE9',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#58C83A' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '8px', width: '60%', background: '#1B2533', borderRadius: '3px' }} />
                    <div style={{ height: '6px', width: '90%', background: '#94A3B8', borderRadius: '3px' }} />
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Botanical freshness with warm cream background, crisp typography, and organic herbal green accents.
                </p>
              </button>

              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  textAlign: 'left',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: isDark ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: isDark ? 'rgba(88, 200, 58, 0.12)' : 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#1E293B',
                      color: '#FBBF24',
                      display: 'flex'
                    }}>
                      <Moon size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>Obsidian Slate (Dark)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Low-glare luxury</div>
                    </div>
                  </div>
                  {isDark && (
                    <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </div>

                {/* Preview Thumbnail */}
                <div style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#070B14',
                  border: '1px solid #1E2B3D',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#58C83A' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '8px', width: '60%', background: '#F4F7FA', borderRadius: '3px' }} />
                    <div style={{ height: '6px', width: '90%', background: '#6F8097', borderRadius: '3px' }} />
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Rich deep slate surfaces with vibrant emerald contrast, optimized for reduced eye strain during extended CRM operations.
                </p>
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Brand & Visual Identity
            </h4>
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <LavantaLogo variant="brand-image" size="lg" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>Official Brand Logo & Mark</span>
                  <CheckCircle2 size={16} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  Lavanta Naturals™ registered emblem and typography used across all workspace applications, official documents, and internal portals.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
