import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, MessageSquare, Shield, Sparkles, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { userService } from '../../services/userService';
import { User } from '../../types';
import { Badge } from '../ui/Badge';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { startDirectChat, onlineUsers } = useChat();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const team = await userService.getAllUsers();
        if (isMounted) {
          // Exclude the current user
          const otherUsers = team.filter(
            u => (u._id || u.id) !== (currentUser?._id || currentUser?.id)
          );
          setUsers(otherUsers);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load team directory');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [users]);

  // Filter users by search and department
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q) ||
        user.department?.toLowerCase().includes(q) ||
        user.designation?.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'ALL' || user.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [users, searchQuery, selectedDept]);

  const handleStartChat = async (targetUser: User) => {
    const targetId = targetUser._id || targetUser.id;
    if (!targetId) return;

    setIsStarting(targetId);
    try {
      await startDirectChat(targetId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize conversation');
    } finally {
      setIsStarting(null);
    }
  };

  if (!isOpen) return null;

  const currentRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #FAFBF8, #FFFFFF)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EAF7E6',
                color: '#4B9B2B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1B2533' }}>
                New Direct Message
              </h3>
              <p style={{ margin: 0, fontSize: '0.775rem', color: '#64748B' }}>
                Connect directly with any Lavanta team member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '0.6rem 0.85rem'
            }}
          >
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search team member by name, role, department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.875rem',
                color: '#1B2533',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Department Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              paddingTop: '0.75rem',
              scrollbarWidth: 'none'
            }}
          >
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '0.725rem',
                  fontWeight: selectedDept === dept ? 600 : 500,
                  whiteSpace: 'nowrap',
                  border: selectedDept === dept ? '1px solid #69C43F' : '1px solid #E2E8F0',
                  backgroundColor: selectedDept === dept ? '#EAF7E6' : '#FFFFFF',
                  color: selectedDept === dept ? '#377E1E' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {dept === 'ALL' ? 'All Departments' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div
            style={{
              margin: '0.75rem 1.5rem 0',
              padding: '0.6rem 0.85rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#B91C1C',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Member List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            minHeight: '260px'
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '0.75rem' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  border: '3px solid #E2E8F0',
                  borderTopColor: '#69C43F',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Loading team members...</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>No team members found</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>Try adjusting your search filter or department</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const userId = user._id || user.id;
              const isOnline = userId ? onlineUsers.has(userId) : false;
              const isBusy = isStarting === userId;

              return (
                <div
                  key={userId}
                  onClick={() => !isBusy && handleStartChat(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '12px',
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#FFFFFF',
                    cursor: isBusy ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#F1F5F9';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {/* User Avatar with Presence indicator */}
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: '#334155',
                          overflow: 'hidden'
                        }}
                      >
                        {user.profilePhoto ? (
                          <img
                            src={user.profilePhoto}
                            alt={user.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          user.name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase() || 'U'
                        )}
                      </div>
                      {/* Online dot */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          backgroundColor: isOnline ? '#22C55E' : '#94A3B8',
                          border: '2px solid #FFFFFF'
                        }}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B2533' }}>
                          {user.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor:
                              user.role === 'FOUNDER'
                                ? '#FEF3C7'
                                : user.role === 'HR'
                                ? '#EDE9FE'
                                : user.role === 'MANAGER'
                                ? '#E0F2FE'
                                : '#F1F5F9',
                            color:
                              user.role === 'FOUNDER'
                                ? '#92400E'
                                : user.role === 'HR'
                                ? '#6D28D9'
                                : user.role === 'MANAGER'
                                ? '#0369A1'
                                : '#475569'
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        {user.designation || user.department || user.email}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isBusy}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      backgroundColor: '#EAF7E6',
                      border: '1px solid #C4E9B7',
                      color: '#377E1E',
                      cursor: isBusy ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {isBusy ? (
                      'Connecting...'
                    ) : (
                      <>
                        <MessageSquare size={13} />
                        <span>Chat</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#FAFBF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#64748B'
          }}
        >
          <span>
            {filteredUsers.length} active colleague{filteredUsers.length === 1 ? '' : 's'} available
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '0.775rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
