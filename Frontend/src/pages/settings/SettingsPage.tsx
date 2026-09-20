import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'appearance';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

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
    documents: true,
    inventory: true,
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
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'profile' ? '#E8F5E9' : 'transparent',
            color: activeTab === 'profile' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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
            background: activeTab === 'security' ? '#E8F5E9' : 'transparent',
            color: activeTab === 'security' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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
            background: activeTab === 'notifications' ? '#E8F5E9' : 'transparent',
            color: activeTab === 'notifications' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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
            background: activeTab === 'appearance' ? '#E8F5E9' : 'transparent',
            color: activeTab === 'appearance' ? 'var(--color-primary-deep)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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
            background: '#FFFFFF',
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
                background: '#E8F5E9',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                overflow: 'hidden'
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
                style={{ backgroundColor: '#FAFBF8', cursor: 'not-allowed' }}
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
                style={{ backgroundColor: '#FAFBF8', cursor: 'not-allowed' }}
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
                style={{ backgroundColor: '#FAFBF8', cursor: 'not-allowed' }}
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
        <form
          onSubmit={handleSavePassword}
          style={{
            background: '#FFFFFF',
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
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div
          style={{
            background: '#FFFFFF',
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
              { key: 'documents', label: 'Document Library Updates', desc: 'New SOPs, formulation sheets, and policies shared with you' },
              { key: 'inventory', label: 'Inventory & Stock Alerts', desc: 'Low-stock and out-of-stock warnings for catalog products' },
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
                  background: '#FAFBF8',
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
            background: '#FFFFFF',
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
              Brand & Visual Identity
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
              Lavanta Naturals platform adheres strictly to the official natural light luxury design system.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '8px', border: '2px solid var(--color-primary)', background: '#FAFBF8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Lavanta Natural</span>
                <CheckCircle2 size={16} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Active workspace theme: Clean botanical light background, herbal emerald accents, and clear typography.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
