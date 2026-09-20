import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building,
  Shield,
  ShieldCheck,
  Edit2,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  FileText,
  Activity,
  Award
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../../types';
import { userService, UpdateUserData } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs } from '../../components/ui/Tabs';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isFounder = userRole === 'FOUNDER';
  const isHRorManager = userRole === 'HR' || userRole === 'MANAGER' || userRole === 'HR_MANAGER';
  const isManagement = isFounder || isHRorManager;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('EMPLOYEE');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');
  const [editProfilePhoto, setEditProfilePhoto] = useState('');
  const [editError, setEditError] = useState('');

  const loadProfile = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await userService.getUserById(id);
      setUser(data);
      // Pre-fill edit form
      setEditName(data.name);
      setEditPhone(data.phone || '');
      setEditDesignation(data.designation);
      setEditDepartment(data.department);
      setEditRole(data.role);
      setEditStatus(data.status);
      setEditProfilePhoto(data.profilePhoto || data.avatar || '');
    } catch (err: any) {
      showToast(err.message || 'Failed to load employee profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E8D8FF',
            borderTopColor: '#69C43F',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Loading profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: '600px', margin: '2rem auto' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Employee Not Found</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0 1.5rem' }}>
          The requested team member profile does not exist in the directory.
        </p>
        <Button variant="primary" onClick={() => navigate('/team')}>
          Back to Team Directory
        </Button>
      </div>
    );
  }

  const isSelf = currentUser?.id === user.id;
  const canEdit = isFounder || (isHRorManager && user.role !== 'FOUNDER') || isSelf;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setIsSaving(true);

    try {
      const updates: UpdateUserData = {
        name: editName,
        phone: editPhone,
        profilePhoto: editProfilePhoto
      };

      if (isFounder || isHRorManager) {
        updates.designation = editDesignation;
        updates.department = editDepartment;
        updates.status = editStatus;
        if (isFounder || (isHRorManager && editRole !== 'FOUNDER')) {
          updates.role = editRole;
        }
      }

      const updated = await userService.updateUser(user.id, updates);
      setUser(updated);
      showToast('Profile updated successfully!', 'success');
      setIsEditModalOpen(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update employee details');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'FOUNDER') return <Badge variant="green" size="md">FOUNDER</Badge>;
    if (r === 'HR' || r === 'MANAGER' || r === 'HR_MANAGER') return <Badge variant="lavender" size="md">{r.replace('_', ' ')}</Badge>;
    if (r === 'INTERN') return <Badge variant="warning" size="md">INTERN</Badge>;
    return <Badge variant="neutral" size="md">EMPLOYEE</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1040px', margin: '0 auto' }}>
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/team')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-primary-deep)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-xs)',
            background: 'transparent'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Team Directory</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '2rem 2.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={user.profilePhoto || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={user.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--color-primary)',
                boxShadow: 'var(--shadow-xs)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '3px',
                right: '3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: user.status === 'ACTIVE' ? '#16A34A' : user.status === 'ON_LEAVE' ? '#D97706' : '#94A3B8',
                border: '2px solid #FFFFFF'
              }}
              title={`Status: ${user.status}`}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {user.name}
              </h1>
              {getRoleBadge(user.role)}
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500 }}>
              {user.designation} • <span style={{ color: 'var(--color-primary-deep)', fontWeight: 600 }}>{user.department}</span>
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="var(--color-primary-deep)" />
                Joined: <strong>{user.joiningDate || user.joinDate || '2023-01-15'}</strong>
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={14} color="#16A34A" />
                Status: <strong style={{ textTransform: 'capitalize' }}>{user.status || 'Active'}</strong>
              </span>
            </div>
          </div>
        </div>

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            icon={<Edit2 size={14} />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Team Member
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview & Info' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'activity', label: 'Activity' },
          { id: 'performance', label: 'Performance' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Contact Details Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                  Work Email
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  <Mail size={15} color="var(--color-primary-deep)" />
                  <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                  Phone Number
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  <Phone size={15} color="var(--color-primary-deep)" />
                  <span>{user.phone || '+91 98000 00000'}</span>
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                  Department
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  <Building size={15} color="var(--color-primary-deep)" />
                  <span>{user.department}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Professional Mandate & Responsibilities
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              {user.bio || `${user.name} serves as ${user.designation} in the ${user.department} team at Lavanta Naturals HQ, responsible for daily business workflows, team coordination, and departmental targets.`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Key Responsibilities:
              </span>
              {(user.responsibilities && user.responsibilities.length > 0 ? user.responsibilities : [
                `Manage and execute ${user.department} deliverables according to brand guidelines.`,
                'Coordinate cross-functionally with executive leadership and team members.',
                'Maintain high operational precision and quality standards for Lavanta Naturals.'
              ]).map((resp, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', color: 'var(--color-text-primary)' }}>
                  <CheckCircle2 size={14} color="var(--color-primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tasks (Clean Placeholder) */}
      {activeTab === 'tasks' && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
            <Briefcase size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            No tasks assigned yet.
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: 0 }}>
            Individual task delegations, Kanban tracking, and deliverables will appear here once the Task Management module is connected.
          </p>
        </div>
      )}

      {/* Tab 3: Activity (Clean Placeholder) */}
      {activeTab === 'activity' && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
            <Activity size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            No recent activity recorded.
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: 0 }}>
            Session logs, task completions, and team interactions will be logged in upcoming phases.
          </p>
        </div>
      )}

      {/* Tab 4: Performance (Clean Placeholder) */}
      {activeTab === 'performance' && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-deep)' }}>
            <Award size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Performance reviews will be available in future modules.
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: 0 }}>
            Quarterly evaluations, KPI completion rates, and feedback will be tracked here.
          </p>
        </div>
      )}

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Profile: ${user.name}`}
        subtitle="Update employee information and workspace privileges."
        size="md"
      >
        {editError && (
          <div
            style={{
              background: '#FFF5F5',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              color: '#DC2626',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={15} />
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Full Name *
            </label>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Phone Number
              </label>
              <Input
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+91 98000 00000"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Profile Photo URL
              </label>
              <Input
                value={editProfilePhoto}
                onChange={e => setEditProfilePhoto(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          {/* Privileged Management Fields */}
          {(isFounder || isHRorManager) && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Designation *
                  </label>
                  <Input
                    value={editDesignation}
                    onChange={e => setEditDesignation(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Department *
                  </label>
                  <Select
                    value={editDepartment}
                    onChange={e => setEditDepartment(e.target.value)}
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Product & R&D">Product & R&D</option>
                    <option value="Sales">Sales</option>
                    <option value="People & Culture">People & Culture</option>
                    <option value="Executive">Executive</option>
                  </Select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Role *
                  </label>
                  <Select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    disabled={!isFounder && user.role === 'FOUNDER'}
                  >
                    {isFounder && <option value="FOUNDER">Founder</option>}
                    <option value="HR">HR</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="INTERN">Intern</option>
                  </Select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Status *
                  </label>
                  <Select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as UserStatus)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeProfile;
