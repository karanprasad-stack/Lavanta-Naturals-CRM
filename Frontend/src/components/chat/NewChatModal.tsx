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
  const [isInputFocused, setIsInputFocused] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsInputFocused(true);

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
          backgroundColor: 'var(--chat-modal-bg)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--chat-border)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--chat-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--chat-modal-header-bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--chat-tab-active-bg)',
                color: 'var(--chat-tab-active-text)',
                border: '1px solid var(--chat-tab-active-border, var(--chat-border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--chat-text-primary)' }}>
                New Direct Message
              </h3>
              <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--chat-text-secondary)' }}>
                Connect directly with any Lavanta team member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--chat-text-muted)',
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
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--chat-border)', backgroundColor: 'var(--chat-modal-bg)' }}>
          <div
            id="new-chat-search-container"
            className={`new-chat-search-container ${isInputFocused ? 'focused' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--chat-bg-input)',
              border: `1px solid ${isInputFocused ? '#65C943' : 'var(--chat-border)'}`,
              borderRadius: '10px',
              padding: '0.6rem 0.85rem',
              boxShadow: isInputFocused ? '0 0 0 2px rgba(101, 201, 67, 0.25)' : 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease'
            }}
          >
            <Search size={16} color="var(--chat-text-muted)" style={{ flexShrink: 0 }} />
            <input
              id="new-chat-search-input"
              type="text"
              className="new-chat-search-input"
              placeholder="Search team member by name, role, department..."
              aria-label="Search team member by name, role, department"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              autoFocus
              style={{
                background: 'transparent',
                backgroundColor: 'transparent',
                border: 'none',
                borderWidth: 0,
                outline: 'none',
                outlineWidth: 0,
                boxShadow: 'none',
                fontSize: '0.875rem',
                color: 'var(--chat-text-primary)',
                width: '100%',
                flex: 1,
                padding: 0,
                margin: 0
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                style={{ background: 'none', border: 'none', color: 'var(--chat-text-muted)', cursor: 'pointer', padding: 0 }}
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
                  border: selectedDept === dept ? '1px solid var(--chat-tab-active-border, #65C943)' : '1px solid var(--chat-border)',
                  backgroundColor: selectedDept === dept ? 'var(--chat-tab-active-bg)' : 'var(--chat-bg-input)',
                  color: selectedDept === dept ? 'var(--chat-tab-active-text)' : 'var(--chat-text-secondary)',
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
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              color: '#F87171',
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
            minHeight: '260px',
            backgroundColor: 'var(--chat-modal-bg)'
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '0.75rem' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  border: '3px solid var(--chat-border)',
                  borderTopColor: '#65C943',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--chat-text-muted)' }}>Loading team members...</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--chat-text-muted)' }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem', color: 'var(--chat-text-primary)' }}>No team members found</p>
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
                    border: '1px solid var(--chat-border)',
                    backgroundColor: 'var(--chat-bg-input)',
                    cursor: isBusy ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--chat-channel-hover-bg)';
                    e.currentTarget.style.borderColor = 'var(--chat-border)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'var(--chat-bg-input)';
                    e.currentTarget.style.borderColor = 'var(--chat-border)';
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
                          backgroundColor: 'var(--chat-bg-container)',
                          border: '1px solid var(--chat-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: 'var(--chat-text-primary)',
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
                          border: '2px solid var(--chat-modal-bg)'
                        }}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--chat-text-primary)' }}>
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
                                ? 'rgba(245, 158, 11, 0.15)'
                                : user.role === 'HR'
                                ? 'rgba(139, 92, 246, 0.15)'
                                : user.role === 'MANAGER'
                                ? 'rgba(14, 165, 233, 0.15)'
                                : 'var(--chat-bg-input)',
                            color:
                              user.role === 'FOUNDER'
                                ? '#F59E0B'
                                : user.role === 'HR'
                                ? '#A78BFA'
                                : user.role === 'MANAGER'
                                ? '#38BDF8'
                                : 'var(--chat-text-secondary)',
                            border: '1px solid var(--chat-border)'
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--chat-text-secondary)', marginTop: '2px' }}>
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
                      backgroundColor: 'var(--chat-tab-active-bg)',
                      border: '1px solid var(--chat-tab-active-border, var(--chat-border))',
                      color: 'var(--chat-tab-active-text)',
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
            borderTop: '1px solid var(--chat-border)',
            backgroundColor: 'var(--chat-modal-footer-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--chat-text-secondary)'
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
              border: '1px solid var(--chat-border)',
              backgroundColor: 'var(--chat-bg-input)',
              color: 'var(--chat-text-primary)',
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
