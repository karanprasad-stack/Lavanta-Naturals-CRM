import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Filter,
  X,
  Building,
  Calendar,
  Phone,
  Mail,
  ArrowRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Sparkles,
  Edit2
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../../types';
import { userService, UserStats } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const TeamDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const userRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();
  const isManagement = userRole === 'FOUNDER' || userRole === 'HR' || userRole === 'MANAGER' || userRole === 'HR_MANAGER';
  const isFounder = userRole === 'FOUNDER';

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    employees: 0,
    interns: 0,
    hrManagers: 0,
    founders: 0,
    active: 0,
    departments: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const roleQueryParam = searchParams.get('role') || 'all';
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedRole, setSelectedRole] = useState<string>(roleQueryParam);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(searchParams.get('department') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'all');

  // Add Team Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('EMPLOYEE');
  const [formDepartment, setFormDepartment] = useState('Marketing');
  const [formDesignation, setFormDesignation] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [formProfilePhoto, setFormProfilePhoto] = useState('');
  const [formStatus, setFormStatus] = useState<UserStatus>('ACTIVE');
  const [formError, setFormError] = useState('');

  // Fetch Team Data
  const loadTeamData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers({
        search: searchTerm.trim() || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        limit: 100
      });

      setUsers(response.users);
      setStats(response.stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to load team directory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedRole, selectedDepartment, selectedStatus, showToast]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Sync state if URL search params change
  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole && urlRole !== selectedRole) {
      setSelectedRole(urlRole);
    }
  }, [searchParams]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm !== '' || selectedRole !== 'all' || selectedDepartment !== 'all' || selectedStatus !== 'all';

  // Handle Add Member Submit
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await userService.createUser({
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        department: formDepartment,
        designation: formDesignation,
        joiningDate: formJoiningDate,
        profilePhoto: formProfilePhoto,
        status: formStatus
      });

      showToast(`Team member "${formName}" added successfully!`, 'success');
      setIsAddModalOpen(false);

      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormRole('EMPLOYEE');
      setFormDesignation('');
      setFormProfilePhoto('');
      loadTeamData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'FOUNDER') {
      return <Badge variant="green" size="sm">FOUNDER</Badge>;
    }
    if (r === 'HR' || r === 'MANAGER' || r === 'HR_MANAGER') {
      return <Badge variant="lavender" size="sm">{r.replace('_', ' ')}</Badge>;
    }
    if (r === 'INTERN') {
      return <Badge variant="warning" size="sm">INTERN</Badge>;
    }
    return <Badge variant="neutral" size="sm">EMPLOYEE</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.725rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: '#F0FDF4',
            color: '#16A34A',
            border: '1px solid rgba(22, 163, 74, 0.2)'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
          Active
        </span>
      );
    }
    if (s === 'ON_LEAVE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.725rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: '#FFFBEB',
            color: '#D97706',
            border: '1px solid rgba(217, 119, 6, 0.2)'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }} />
          On Leave
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.725rem',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: '#F8FAFC',
          color: '#64748B',
          border: '1px solid #CBD5E1'
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748B' }} />
        Inactive
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              People & Organization
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Team
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Manage your Lavanta Naturals team.
          </p>
        </div>

        {isManagement && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Team Member
          </Button>
        )}
      </div>

      {/* Summary KPI Cards Row (Real Database Values) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Total Members */}
        <div
          onClick={() => {
            setSelectedRole('all');
            setSearchParams({});
          }}
          style={{
            background: '#FFFFFF',
            border: selectedRole === 'all' && !hasActiveFilters ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Team Members
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Total registered members
          </div>
        </div>

        {/* Employees */}
        <div
          onClick={() => {
            setSelectedRole('EMPLOYEE');
            setSearchParams({ role: 'EMPLOYEE' });
          }}
          style={{
            background: '#FFFFFF',
            border: selectedRole.toUpperCase() === 'EMPLOYEE' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Employees
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-deep)', margin: '4px 0' }}>
            {stats.employees}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Full-time staff specialists
          </div>
        </div>

        {/* Interns */}
        <div
          onClick={() => {
            setSelectedRole('INTERN');
            setSearchParams({ role: 'INTERN' });
          }}
          style={{
            background: '#FFFFFF',
            border: selectedRole.toUpperCase() === 'INTERN' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interns
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#B45309', margin: '4px 0' }}>
            {stats.interns}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Active learning cohorts
          </div>
        </div>

        {/* HR / Managers */}
        <div
          onClick={() => {
            setSelectedRole('HR_MANAGER');
            setSearchParams({ role: 'HR_MANAGER' });
          }}
          style={{
            background: '#FFFFFF',
            border: selectedRole.toUpperCase() === 'HR_MANAGER' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease'
          }}
          className="luxury-card"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            HR / Managers
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6D28D9', margin: '4px 0' }}>
            {stats.hrManagers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Operations & People leads
          </div>
        </div>
      </div>

      {/* Multi-Criteria Filters Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--color-text-secondary)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by name, role, designation..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.15rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ minWidth: '150px' }}>
          <Select
            value={selectedRole}
            onChange={e => {
              setSelectedRole(e.target.value);
              setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (e.target.value !== 'all') next.set('role', e.target.value);
                else next.delete('role');
                return next;
              });
            }}
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
          >
            <option value="all">All Roles</option>
            <option value="FOUNDER">Founder</option>
            <option value="HR_MANAGER">HR / Manager</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="INTERN">Intern</option>
          </Select>
        </div>

        {/* Department Filter */}
        <div style={{ minWidth: '160px' }}>
          <Select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
          >
            <option value="all">All Departments</option>
            {stats.departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '140px' }}>
          <Select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            icon={<X size={14} />}
            style={{ fontSize: '0.8rem', color: '#DC2626' }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Content: Desktop Table & Mobile Card View */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #E8D8FF',
              borderTopColor: '#69C43F',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 0.75rem'
            }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Loading team roster...</span>
        </div>
      ) : users.length === 0 ? (
        /* Empty State */
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
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-soft-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-deep)'
            }}
          >
            <Users size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              No team members found
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
              No team members match your current filters.
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Active Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile screens <= 768px via CSS) */}
          <div
            className="team-table-wrapper"
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              overflowX: 'auto',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#FAFBF8', borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joining Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u.id}
                    onClick={() => navigate(`/team/${u.id}`)}
                    style={{
                      borderBottom: idx === users.length - 1 ? 'none' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="table-row-hover"
                  >
                    {/* Profile Avatar */}
                    <td style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <img
                        src={u.profilePhoto || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                        alt={u.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border-color)'
                        }}
                      />
                    </td>

                    {/* Name & Email */}
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)' }}>{u.email}</div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Designation */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                      {u.designation}
                    </td>

                    {/* Department */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {u.department}
                    </td>

                    {/* Joining Date */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {u.joiningDate || u.joinDate || '2023-01-15'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      {getStatusBadge(u.status || 'ACTIVE')}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/team/${u.id}`);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.775rem',
                          color: 'var(--color-primary-deep)',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View Profile →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Shown only on small screens) */}
          <div className="team-cards-mobile" style={{ display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => navigate(`/team/${u.id}`)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={u.profilePhoto || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                  alt={u.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name}
                    </span>
                    {getRoleBadge(u.role)}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {u.designation} • {u.department}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      Joined {u.joiningDate || u.joinDate}
                    </span>
                    {getStatusBadge(u.status || 'ACTIVE')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Team Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
        subtitle="Register a new staff member into the Lavanta Naturals team roster."
        size="md"
      >
        {formError && (
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
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Full Name *
            </label>
            <Input
              placeholder="e.g. Radhika Nair"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Work Email *
              </label>
              <Input
                type="email"
                placeholder="radhika@lavantanaturals.com"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+91 98000 12345"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Role *
              </label>
              <Select
                value={formRole}
                onChange={e => setFormRole(e.target.value as UserRole)}
              >
                {/* Founder creation is restricted to Founder administration only */}
                {isFounder && <option value="FOUNDER">Founder</option>}
                <option value="HR">HR</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="INTERN">Intern</option>
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Department *
              </label>
              <Select
                value={formDepartment}
                onChange={e => setFormDepartment(e.target.value)}
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
                Designation *
              </label>
              <Input
                placeholder="e.g. Content Strategist"
                value={formDesignation}
                onChange={e => setFormDesignation(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Joining Date *
              </label>
              <Input
                type="date"
                value={formJoiningDate}
                onChange={e => setFormJoiningDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Profile Photo URL
              </label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={formProfilePhoto}
                onChange={e => setFormProfilePhoto(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Status *
              </label>
              <Select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as UserStatus)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
              </Select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDirectory;
