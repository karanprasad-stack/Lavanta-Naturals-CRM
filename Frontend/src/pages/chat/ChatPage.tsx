import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatPane } from '../../components/chat/ChatPane';
import { NewChatModal } from '../../components/chat/NewChatModal';
import { useChat } from '../../context/ChatContext';

export const ChatPage: React.FC = () => {
  const { activeConversation } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // On resize, restore sidebar if desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowSidebar(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Left sidebar: conversation list */}
      {showSidebar && (
        <div style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <ChatSidebar
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onSelectConversation={() => {
              if (window.innerWidth < 768) setShowSidebar(false);
            }}
          />
        </div>
      )}

      {/* Right: active chat pane */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {activeConversation ? (
          <ChatPane
            conversation={activeConversation}
            onBack={() => setShowSidebar(true)}
          />
        ) : (
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#64748B', textAlign: 'center', padding: '2rem', gap: '0.75rem',
              minHeight: '400px'
            }}
          >
            <div style={{ fontSize: '2.5rem' }}>💬</div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1B2533' }}>
              Welcome to Lavanta Chat
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B', maxWidth: '300px', lineHeight: 1.5 }}>
              Select a conversation from the sidebar, or start a new direct message.
            </p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              style={{
                marginTop: '0.5rem', padding: '8px 20px', borderRadius: '8px',
                backgroundColor: '#69C43F', border: 'none', color: '#FFFFFF',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              + Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </div>
  );
};
