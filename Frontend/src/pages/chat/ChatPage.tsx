import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatPane } from '../../components/chat/ChatPane';
import { NewChatModal } from '../../components/chat/NewChatModal';
import { useChat } from '../../context/ChatContext';

export const ChatPage: React.FC = () => {
  const { activeConversation } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  // On resize, restore sidebar if desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      id="chat-page-container"
      className="chat-page-container"
      style={{
        display: 'flex',
        flex: 1,
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        background: 'var(--chat-bg-container, var(--bg-surface))',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--chat-border, var(--border-color))',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Left sidebar: conversation list */}
      {(showSidebar || !isMobile) && (
        <div
          id="chat-sidebar-wrapper"
          className="chat-sidebar-wrapper"
          style={{
            width: isMobile ? '100%' : '310px',
            flexShrink: 0,
            borderRight: isMobile ? 'none' : '1px solid var(--chat-border, var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          <ChatSidebar
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onSelectConversation={() => {
              setShowSidebar(false);
            }}
          />
        </div>
      )}

      {/* Right: active chat pane */}
      {(!showSidebar || !isMobile) && (
        <div
          id="chat-pane-wrapper"
          className="chat-pane-wrapper"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--chat-bg-history, var(--bg-main))',
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden'
          }}
        >
        {activeConversation ? (
          <ChatPane
            conversation={activeConversation}
            onBack={() => setShowSidebar(true)}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--chat-text-secondary)',
              textAlign: 'center',
              padding: '2rem',
              gap: '0.75rem',
              minHeight: 0
            }}
          >
            <div style={{ fontSize: '2.5rem' }}>💬</div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--chat-text-primary)' }}>
              Welcome to Lavanta Chat
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--chat-text-secondary)', maxWidth: '320px', lineHeight: 1.5 }}>
              Select a conversation from the sidebar, or start a new direct message.
            </p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              style={{
                marginTop: '0.5rem', padding: '9px 22px', borderRadius: '8px',
                backgroundColor: '#65C943', border: 'none', color: '#FFFFFF',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(101, 201, 67, 0.25)',
                transition: 'background-color 0.15s ease'
              }}
            >
              + Start New Chat
            </button>
          </div>
        )}
      </div>
      )}

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </div>
  );
};
