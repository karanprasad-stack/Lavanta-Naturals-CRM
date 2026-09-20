import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Users,
  Shield,
  Circle,
  Wifi,
  WifiOff,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { Conversation } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface ChatSidebarProps {
  onOpenNewChat: () => void;
  onSelectConversation?: () => void; // for mobile drawer close
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onOpenNewChat, onSelectConversation }) => {
  const { currentUser } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    isLoadingConversations,
    totalUnreadCount,
    onlineUsers,
    connectionStatus
  } = useChat();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIRECT' | 'CHANNELS'>('ALL');

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const q = searchTerm.toLowerCase().trim();

      // Tab filter
      if (activeTab === 'DIRECT' && conv.type !== 'DIRECT') return false;
      if (activeTab === 'CHANNELS' && conv.type === 'DIRECT') return false;

      if (!q) return true;

      const nameMatches = conv.name?.toLowerCase().includes(q);
      const otherUserMatches =
        conv.otherUser?.name?.toLowerCase().includes(q) ||
        conv.otherUser?.role?.toLowerCase().includes(q) ||
        conv.otherUser?.department?.toLowerCase().includes(q);
      const lastMsgMatches = conv.lastMessage?.text?.toLowerCase().includes(q);

      return nameMatches || otherUserMatches || lastMsgMatches;
    });
  }, [conversations, searchTerm, activeTab]);

  // Separate pinned company chat vs direct chats
  const companyChat = useMemo(() => {
    return conversations.find(c => c.type === 'COMPANY');
  }, [conversations]);

  const directChats = useMemo(() => {
    return filteredConversations.filter(c => c.type === 'DIRECT');
  }, [filteredConversations]);

  const handleSelect = (convId: string) => {
    selectConversation(convId);
    if (onSelectConversation) {
      onSelectConversation();
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        width: '100%'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.25rem 1.25rem 0.85rem',
          borderBottom: '1px solid #F1F5F9'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1B2533', letterSpacing: '-0.01em' }}>
              Messages
            </h2>
            {totalUnreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#69C43F',
                  color: '#FFFFFF',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                {totalUnreadCount}
              </span>
            )}
          </div>

          <button
            onClick={onOpenNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#69C43F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#58A835')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#69C43F')}
            title="Start new direct message"
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem'
          }}
        >
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search messages or people..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.825rem',
              color: '#1B2533',
              width: '100%'
            }}
          />
        </div>

        {/* Tab Filters */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            marginTop: '0.75rem'
          }}
        >
          {(['ALL', 'DIRECT', 'CHANNELS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '0.725rem',
                fontWeight: activeTab === tab ? 600 : 500,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#EAF7E6' : 'transparent',
                color: activeTab === tab ? '#377E1E' : '#64748B',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'ALL' ? 'All' : tab === 'DIRECT' ? 'Direct' : 'Channels'}
            </button>
          ))}
        </div>

        {/* Connection status warning */}
        {connectionStatus !== 'connected' && (
          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              fontSize: '0.7rem'
            }}
          >
            <WifiOff size={12} />
            <span>
              {connectionStatus === 'reconnecting' ? 'Reconnecting live socket...' : 'Offline. Reconnecting...'}
            </span>
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem 0'
        }}
      >
        {isLoadingConversations ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', gap: '0.5rem' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid #E2E8F0',
                borderTopColor: '#69C43F',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <span style={{ fontSize: '0.775rem', color: '#94A3B8' }}>Loading conversations...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>
              {searchTerm ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>
              {searchTerm ? 'Try a different search term' : 'Click "+ New Chat" to message a colleague'}
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Company Channels */}
            {activeTab !== 'DIRECT' && companyChat && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div
                  style={{
                    padding: '0.25rem 1.25rem 0.4rem',
                    fontSize: '0.675rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94A3B8'
                  }}
                >
                  Workspace Channels
                </div>

                {(() => {
                  const isSelected = (activeConversation?._id || activeConversation?.id) === (companyChat._id || companyChat.id);
                  const hasUnread = (companyChat.unreadCount || 0) > 0;

                  return (
                    <div
                      key={companyChat._id || companyChat.id}
                      onClick={() => handleSelect(companyChat._id || companyChat.id!)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.25rem',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#EAF7E6' : 'transparent',
                        borderLeft: isSelected ? '4px solid #69C43F' : '4px solid transparent',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Channel Icon */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? '#D6F2CB' : '#F1F5F9',
                          color: '#377E1E',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Users size={19} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span
                              style={{
                                fontWeight: hasUnread ? 700 : isSelected ? 600 : 500,
                                fontSize: '0.85rem',
                                color: '#1B2533',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {companyChat.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                backgroundColor: '#EAF7E6',
                                color: '#377E1E',
                                padding: '1px 5px',
                                borderRadius: '4px'
                              }}
                            >
                              All Team
                            </span>
                          </div>

                          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            {formatTimestamp(companyChat.lastMessageAt)}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '2px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: hasUnread ? '#1B2533' : '#64748B',
                              fontWeight: hasUnread ? 600 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px'
                            }}
                          >
                            {companyChat.lastMessage ? (
                              <>
                                <span style={{ color: '#94A3B8' }}>{companyChat.lastMessage.senderName}: </span>
                                {companyChat.lastMessage.text}
                              </>
                            ) : (
                              'Company-wide general discussion'
                            )}
                          </span>

                          {hasUnread && (
                            <span
                              style={{
                                backgroundColor: '#69C43F',
                                color: '#FFFFFF',
                                fontSize: '0.675rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '10px'
                              }}
                            >
                              {companyChat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Section 2: Direct Messages */}
            {activeTab !== 'CHANNELS' && (
              <div>
                <div
                  style={{
                    padding: '0.25rem 1.25rem 0.4rem',
                    fontSize: '0.675rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Direct Messages</span>
                  <span>{directChats.length}</span>
                </div>

                {directChats.length === 0 ? (
                  <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.775rem', color: '#94A3B8', fontStyle: 'italic' }}>
                    No 1-on-1 messages yet. Click "+ New Chat" above.
                  </div>
                ) : (
                  directChats.map(conv => {
                    const convId = conv._id || conv.id!;
                    const isSelected = (activeConversation?._id || activeConversation?.id) === convId;
                    const hasUnread = (conv.unreadCount || 0) > 0;
                    const otherUser = conv.otherUser;
                    const isOnline = otherUser && (otherUser._id || otherUser.id)
                      ? onlineUsers.has(otherUser._id || otherUser.id!)
                      : false;

                    const lastSenderIsMe = conv.lastMessage && conv.lastMessage.senderId === (currentUser?._id || currentUser?.id);

                    return (
                      <div
                        key={convId}
                        onClick={() => handleSelect(convId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.7rem 1.25rem',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#EAF7E6' : 'transparent',
                          borderLeft: isSelected ? '4px solid #69C43F' : '4px solid transparent',
                          transition: 'background 0.12s ease'
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Avatar with live online dot */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              color: '#334155',
                              overflow: 'hidden'
                            }}
                          >
                            {otherUser?.profilePhoto ? (
                              <img
                                src={otherUser.profilePhoto}
                                alt={otherUser.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              otherUser?.name
                                ?.split(' ')
                                .map(n => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase() || 'DM'
                            )}
                          </div>

                          {/* Online Presence Dot */}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '0',
                              right: '0',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: isOnline ? '#22C55E' : '#CBD5E1',
                              border: '2px solid #FFFFFF'
                            }}
                            title={isOnline ? 'Online now' : 'Offline'}
                          />
                        </div>

                        {/* Middle Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span
                                style={{
                                  fontWeight: hasUnread ? 700 : isSelected ? 600 : 500,
                                  fontSize: '0.85rem',
                                  color: '#1B2533',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {otherUser?.name || conv.name}
                              </span>
                              {otherUser?.role && (
                                <span
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 600,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor:
                                      otherUser.role === 'FOUNDER'
                                        ? '#FEF3C7'
                                        : otherUser.role === 'HR' || otherUser.role === 'HR_MANAGER'
                                        ? '#EDE9FE'
                                        : otherUser.role === 'MANAGER'
                                        ? '#E0F2FE'
                                        : '#F1F5F9',
                                    color:
                                      otherUser.role === 'FOUNDER'
                                        ? '#92400E'
                                        : otherUser.role === 'HR' || otherUser.role === 'HR_MANAGER'
                                        ? '#6D28D9'
                                        : otherUser.role === 'MANAGER'
                                        ? '#0369A1'
                                        : '#475569'
                                  }}
                                >
                                  {otherUser.role}
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                              {formatTimestamp(conv.lastMessageAt)}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: '2px'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: hasUnread ? '#1B2533' : '#64748B',
                                fontWeight: hasUnread ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '180px'
                              }}
                            >
                              {conv.lastMessage ? (
                                <>
                                  {lastSenderIsMe && <span style={{ color: '#94A3B8' }}>You: </span>}
                                  {conv.lastMessage.text}
                                </>
                              ) : (
                                <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>No messages yet</span>
                              )}
                            </span>

                            {hasUnread && (
                              <span
                                style={{
                                  backgroundColor: '#69C43F',
                                  color: '#FFFFFF',
                                  fontSize: '0.675rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '10px'
                                }}
                              >
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
