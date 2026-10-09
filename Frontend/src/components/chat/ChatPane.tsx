import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Users,
  Paperclip,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Check,
  CheckCheck,
  ArrowLeft,
  Info,
  Shield,
  Smile,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Conversation, ChatMessage, ChatParticipant } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface ChatPaneProps {
  conversation: Conversation | null;
  onBack?: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({ conversation, onBack }) => {
  const { currentUser } = useAuth();
  const {
    messages,
    isLoadingMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    typingUsers,
    sendTypingStart,
    sendTypingStop,
    onlineUsers,
    connectionStatus
  } = useChat();

  const [inputContent, setInputContent] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ filename: string; url: string; size?: number }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = currentUser?._id || currentUser?.id;
  const currentUserRole = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  // Scroll to bottom on new messages or active conversation change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputContent(e.target.value);

    // Emit typing start
    sendTypingStart();

    // Debounce typing stop
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTypingStop();
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!inputContent.trim() && attachedFiles.length === 0) || isSending) return;

    const content = inputContent.trim();
    const attachments = [...attachedFiles];

    setInputContent('');
    setAttachedFiles([]);
    sendTypingStop();
    setIsSending(true);

    try {
      await sendMessage(content, attachments.length > 0 ? attachments : undefined);
    } catch (err) {
      console.error('[ChatPane] Failed to send message:', err);
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const startEditing = (msg: ChatMessage) => {
    setEditingMessageId(msg._id || msg.id!);
    setEditContent(msg.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const saveEdit = async (msgId: string) => {
    if (!editContent.trim()) return;
    try {
      await editMessage(msgId, editContent.trim());
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      console.error('[ChatPane] Failed to edit message:', err);
    }
  };

  const confirmDelete = async (msgId: string) => {
    try {
      await deleteMessage(msgId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('[ChatPane] Failed to delete message:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Simulate file attachment with object url
    const newAttachments = Array.from(files).map(file => ({
      filename: file.name,
      url: URL.createObjectURL(file),
      size: file.size
    }));

    setAttachedFiles(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format date dividers
  const getMessageDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!conversation) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#FAFBF8',
          color: '#64748B',
          textAlign: 'center',
          padding: '2rem'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#EAF7E6',
            color: '#4B9B2B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}
        >
          <Users size={32} />
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#1B2533' }}>
          Select a Conversation
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', maxWidth: '360px', lineHeight: 1.5 }}>
          Choose a conversation from the left or start a new direct message to begin communicating with your team.
        </p>
      </div>
    );
  }

  const isCompany = conversation.type === 'COMPANY';
  const otherUser = conversation.otherUser;
  const isOtherUserOnline =
    otherUser && (otherUser._id || otherUser.id)
      ? onlineUsers.has(otherUser._id || otherUser.id!)
      : false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--chat-bg-container)',
        position: 'relative'
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          padding: '0.85rem 1.5rem',
          backgroundColor: 'var(--chat-bg-header)',
          borderBottom: '1px solid var(--chat-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--chat-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                marginRight: '0.25rem'
              }}
              title="Back to conversations"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: isCompany ? '12px' : '50%',
                backgroundColor: isCompany ? 'var(--chat-tab-active-bg)' : 'var(--chat-bg-input)',
                color: isCompany ? 'var(--chat-tab-active-text)' : 'var(--chat-text-primary)',
                border: '1px solid var(--chat-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
                overflow: 'hidden'
              }}
            >
              {isCompany ? (
                <Users size={20} />
              ) : otherUser?.profilePhoto ? (
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
                  .toUpperCase() || 'U'
              )}
            </div>

            {/* Direct online presence dot */}
            {!isCompany && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  backgroundColor: isOtherUserOnline ? '#22C55E' : '#94A3B8',
                  border: '2px solid var(--chat-bg-header)'
                }}
                title={isOtherUserOnline ? 'Active now' : 'Offline'}
              />
            )}
          </div>

          {/* Title & Status */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: 'var(--chat-text-primary)' }}>
                {isCompany ? conversation.name : otherUser?.name || conversation.name}
              </h3>

              {!isCompany && otherUser?.role && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor:
                      otherUser.role === 'FOUNDER'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : otherUser.role === 'HR' || otherUser.role === 'HR_MANAGER'
                        ? 'rgba(139, 92, 246, 0.15)'
                        : otherUser.role === 'MANAGER'
                        ? 'rgba(14, 165, 233, 0.15)'
                        : 'var(--chat-bg-input)',
                    color:
                      otherUser.role === 'FOUNDER'
                        ? '#F59E0B'
                        : otherUser.role === 'HR' || otherUser.role === 'HR_MANAGER'
                        ? '#A78BFA'
                        : otherUser.role === 'MANAGER'
                        ? '#38BDF8'
                        : 'var(--chat-text-secondary)',
                    border: '1px solid var(--chat-border)'
                  }}
                >
                  {otherUser.role}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--chat-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1px' }}>
              {isCompany ? (
                <span>All Active Team Members • General Workspace</span>
              ) : (
                <>
                  <span>{otherUser?.designation || otherUser?.department || 'Colleague'}</span>
                  <span>•</span>
                  <span style={{ color: isOtherUserOnline ? '#65C943' : 'var(--chat-text-muted)', fontWeight: isOtherUserOnline ? 600 : 400 }}>
                    {isOtherUserOnline ? 'Active now' : 'Offline'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Right Badges / Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isCompany && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--chat-tab-active-bg)',
                color: 'var(--chat-tab-active-text)',
                border: '1px solid var(--chat-tab-active-border, var(--chat-border))',
                fontSize: '0.725rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '12px'
              }}
            >
              <Users size={13} />
              <span>Company Channel</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Messages List Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          backgroundColor: 'var(--chat-bg-history)'
        }}
      >
        {isLoadingMessages ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                border: '3px solid var(--chat-border)',
                borderTopColor: '#65C943',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--chat-text-muted)' }}>Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--chat-text-muted)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--chat-bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                color: '#65C943',
                border: '1px solid var(--chat-border)'
              }}
            >
              <Smile size={24} />
            </div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--chat-text-primary)' }}>
              No messages here yet
            </p>
            <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--chat-text-secondary)' }}>
              Say hello to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const msgId = msg._id || msg.id!;
            const sender = typeof msg.senderId === 'object' ? (msg.senderId as ChatParticipant) : null;
            const senderId = sender ? (sender._id || sender.id) : (msg.senderId as string);
            const isMe = senderId === currentUserId;

            // Show date divider if first message or different day from previous
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDateDivider =
              !prevMsg ||
              new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

            const isEditingThis = editingMessageId === msgId;
            const isDeletingThis = deleteConfirmId === msgId;

            // Check permissions for delete: Sender can delete their own; Founder / HR can moderate any in company chat
            const canDelete =
              !msg.isDeleted &&
              (isMe || (isCompany && (currentUserRole === 'FOUNDER' || currentUserRole === 'HR' || currentUserRole === 'HR_MANAGER')));

            const canEdit = !msg.isDeleted && isMe;

            return (
              <React.Fragment key={msgId}>
                {/* Date Divider */}
                {showDateDivider && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.75rem 0' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--chat-date-separator-bg)',
                        border: '1px solid var(--chat-date-separator-border)',
                        color: 'var(--chat-date-separator-text)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                      }}
                    >
                      {getMessageDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Message Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    position: 'relative'
                  }}
                  className="chat-message-row"
                >
                  {/* Sender Avatar (if not me) */}
                  {!isMe && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--chat-bg-input)',
                        color: 'var(--chat-text-primary)',
                        border: '1px solid var(--chat-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                        overflow: 'hidden',
                        marginTop: '2px'
                      }}
                      title={sender?.name || 'User'}
                    >
                      {sender?.profilePhoto ? (
                        <img
                          src={sender.profilePhoto}
                          alt={sender.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        sender?.name
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || 'U'
                      )}
                    </div>
                  )}

                  {/* Message Bubble Column */}
                  <div
                    style={{
                      maxWidth: '68%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {/* In group/company chat, display sender name and role if incoming */}
                    {!isMe && isCompany && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginBottom: '2px',
                          paddingLeft: '4px'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--chat-sender-text)' }}>
                          {sender?.name || 'Team Member'}
                        </span>
                        {sender?.role && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              fontWeight: 600,
                              color: 'var(--chat-text-secondary)',
                              backgroundColor: 'var(--chat-bg-input)',
                              border: '1px solid var(--chat-border)',
                              padding: '1px 4px',
                              borderRadius: '3px'
                            }}
                          >
                            {sender.role}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Main Bubble Content */}
                    <div
                      style={{
                        position: 'relative',
                        padding: msg.isDeleted ? '0.6rem 0.85rem' : '0.65rem 0.95rem',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: msg.isDeleted
                          ? 'var(--chat-bg-input)'
                          : isMe
                          ? 'var(--chat-bubble-out-bg)'
                          : 'var(--chat-bubble-in-bg)',
                        border: msg.isDeleted
                          ? '1px dashed var(--chat-border)'
                          : isMe
                          ? '1px solid var(--chat-bubble-out-border)'
                          : '1px solid var(--chat-bubble-in-border)',
                        color: msg.isDeleted
                          ? 'var(--chat-text-muted)'
                          : isMe
                          ? 'var(--chat-bubble-out-text)'
                          : 'var(--chat-bubble-in-text)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        wordBreak: 'break-word',
                        fontSize: '0.875rem',
                        lineHeight: 1.45
                      }}
                    >
                      {/* Editing state */}
                      {isEditingThis ? (
                        <div style={{ minWidth: '220px' }}>
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #65C943',
                              backgroundColor: 'var(--chat-bg-input)',
                              fontSize: '0.85rem',
                              color: 'var(--chat-text-primary)',
                              outline: 'none',
                              resize: 'none',
                              boxSizing: 'border-box'
                            }}
                            rows={2}
                            autoFocus
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '6px' }}>
                            <button
                              onClick={cancelEditing}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--chat-border)',
                                background: 'var(--chat-bg-header)',
                                color: 'var(--chat-text-secondary)',
                                fontSize: '0.725rem',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(msgId)}
                              style={{
                                padding: '3px 10px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#65C943',
                                color: '#FFFFFF',
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : msg.isDeleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontStyle: 'italic' }}>
                          <Shield size={14} color="var(--chat-text-muted)" />
                          <span>This message was deleted.</span>
                        </div>
                      ) : (
                        <>
                          {/* Attachments preview if any */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.4rem' }}>
                              {msg.attachments.map((att, i) => (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '4px 8px',
                                    backgroundColor: isMe ? 'rgba(0, 0, 0, 0.2)' : 'var(--chat-bg-container)',
                                    borderRadius: '6px',
                                    fontSize: '0.775rem',
                                    color: isMe ? '#86EFAC' : '#60A5FA',
                                    textDecoration: 'none'
                                  }}
                                >
                                  <FileText size={14} />
                                  <span style={{ textDecoration: 'underline' }}>{att.filename}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Message Text */}
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                          {/* Metadata: Time, Edited status, Read receipt */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '0.3rem',
                              marginTop: '4px',
                              fontSize: '0.675rem',
                              color: 'var(--chat-timestamp-text)'
                            }}
                          >
                            {msg.isEdited && <span>(edited)</span>}
                            <span>{formatMessageTime(msg.createdAt)}</span>

                            {/* Read Status for sender messages */}
                            {isMe && (
                              <span>
                                {msg.readBy && msg.readBy.length > 1 ? (
                                  <span title="Read" style={{ display: 'inline-flex' }}>
                                    <CheckCheck size={13} color="#65C943" />
                                  </span>
                                ) : (
                                  <span title="Delivered" style={{ display: 'inline-flex' }}>
                                    <Check size={13} color="var(--chat-timestamp-text)" />
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Delete Confirmation Banner */}
                    {isDeletingThis && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '4px 8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          color: '#F87171',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span>Delete message?</span>
                        <button
                          onClick={() => confirmDelete(msgId)}
                          style={{
                            border: 'none',
                            background: '#DC2626',
                            color: '#FFFFFF',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--chat-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          No
                        </button>
                      </div>
                    )}

                    {/* Hover Action Buttons */}
                    {!msg.isDeleted && !isEditingThis && !isDeletingThis && (canEdit || canDelete) && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          marginTop: '2px',
                          opacity: 0.8
                        }}
                      >
                        {canEdit && (
                          <button
                            onClick={() => startEditing(msg)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--chat-text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '4px'
                            }}
                            title="Edit message"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmId(msgId)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--chat-text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '4px'
                            }}
                            title="Delete message"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Typing indicator bubble */}
        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '40px' }}>
            <div
              style={{
                backgroundColor: 'var(--chat-bubble-in-bg)',
                border: '1px solid var(--chat-bubble-in-border)',
                padding: '6px 12px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', gap: '3px' }}>
                <span className="typing-dot" style={{ width: '5px', height: '5px', backgroundColor: '#65C943', borderRadius: '50%' }} />
                <span className="typing-dot" style={{ width: '5px', height: '5px', backgroundColor: '#65C943', borderRadius: '50%', animationDelay: '0.2s' }} />
                <span className="typing-dot" style={{ width: '5px', height: '5px', backgroundColor: '#65C943', borderRadius: '50%', animationDelay: '0.4s' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--chat-text-secondary)' }}>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
            <style>{`
              .typing-dot { animation: typingBlink 1.4s infinite ease-in-out both; }
              @keyframes typingBlink {
                0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                40% { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Message Composer */}
      <div
        style={{
          padding: '0.85rem 1.5rem 1rem',
          backgroundColor: 'var(--chat-bg-composer)',
          borderTop: '1px solid var(--chat-border)'
        }}
      >
        {/* Attachment Pills Preview */}
        {attachedFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '3px 8px',
                  backgroundColor: 'var(--chat-tab-active-bg)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--chat-tab-active-text)',
                  border: '1px solid var(--chat-tab-active-border, var(--chat-border))'
                }}
              >
                <Paperclip size={12} />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.filename}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--chat-tab-active-text)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-composer-container">
          {/* File Attachment Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            multiple
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--chat-text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--chat-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--chat-text-muted)')}
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            id="chat-message-composer"
            className="chat-composer-textarea"
            aria-label={`Message ${isCompany ? 'Lavanta Team' : otherUser?.name || 'colleague'}`}
            placeholder={`Message ${isCompany ? '#Lavanta Team' : otherUser?.name || 'colleague'}... (Enter to send, Shift+Enter for new line)`}
            value={inputContent}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputContent.trim() && attachedFiles.length === 0) || isSending}
            style={{
              backgroundColor: (!inputContent.trim() && attachedFiles.length === 0) || isSending ? 'var(--chat-border)' : '#65C943',
              color: (!inputContent.trim() && attachedFiles.length === 0) || isSending ? 'var(--chat-text-muted)' : '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!inputContent.trim() && attachedFiles.length === 0) || isSending ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={e => {
              if (inputContent.trim() || attachedFiles.length > 0) e.currentTarget.style.backgroundColor = '#54B033';
            }}
            onMouseLeave={e => {
              if (inputContent.trim() || attachedFiles.length > 0) e.currentTarget.style.backgroundColor = '#65C943';
            }}
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
