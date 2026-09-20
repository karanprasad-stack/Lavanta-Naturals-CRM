import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Camera,
  Save,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profilePhoto || currentUser.avatar || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        profilePhoto
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedRole = (currentUser.role || 'EMPLOYEE').replace('_', ' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '980px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Account Management
          </span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          User Profile
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
          View account status, organizational role, and manage personal contact details.
        </p>
      </div>

      {/* Main Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Profile Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--color-primary)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#16A34A',
                border: '2px solid #FFFFFF'
              }}
              title="Active Status"
            />
          </div>

          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {currentUser.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              {currentUser.designation}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge variant="green" size="md">
              ROLE: {formattedRole}
            </Badge>
            <Badge variant="neutral" size="md">
              STATUS: {currentUser.status || 'ACTIVE'}
            </Badge>
          </div>

          <div
            style={{
              width: '100%',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              fontSize: '0.8rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
              <Building size={14} color="var(--color-primary-deep)" />
              <span>Department: <strong style={{ color: 'var(--color-text-primary)' }}>{currentUser.department}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
              <Calendar size={14} color="var(--color-primary-deep)" />
              <span>Joined: <strong style={{ color: 'var(--color-text-primary)' }}>{currentUser.joiningDate || currentUser.joinDate}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
              <Mail size={14} color="var(--color-primary-deep)" />
              <span style={{ wordBreak: 'break-all' }}>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Information Form */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Edit Personal Information
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              Update your name, contact phone number, and avatar image link.
            </p>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Full Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Email (Read-Only) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Work Email (Read-Only)
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Lock size={11} /> System Managed
                </span>
              </div>
              <Input
                type="email"
                value={currentUser.email}
                disabled
                style={{ background: 'var(--color-bg)', cursor: 'not-allowed' }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+91 98000 00000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            {/* Profile Photo URL */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Profile Photo URL
              </label>
              <Input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={profilePhoto}
                onChange={e => setProfilePhoto(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setProfilePhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80')}
                  style={{ fontSize: '0.7rem' }}
                >
                  Preset 1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setProfilePhoto('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80')}
                  style={{ fontSize: '0.7rem' }}
                >
                  Preset 2
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setProfilePhoto('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80')}
                  style={{ fontSize: '0.7rem' }}
                >
                  Preset 3
                </Button>
              </div>
            </div>

            {/* Role Notice (Disallow editing role) */}
            <div
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.875rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <Shield size={16} color="var(--color-primary-deep)" style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>
                  Assigned Workspace Role: {formattedRole}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Users cannot change their own roles. Role-based permissions are enforced by backend authorization middleware.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSaving}
                icon={<Save size={15} />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
