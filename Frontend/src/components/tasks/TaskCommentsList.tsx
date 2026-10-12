import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { TaskComment } from '../../types/task';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface TaskCommentsListProps {
  comments: TaskComment[];
  onAddComment: (message: string) => Promise<void>;
  currentUserId?: string;
}

export const TaskCommentsList: React.FC<TaskCommentsListProps> = ({
  comments,
  onAddComment,
  currentUserId
}) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddComment(text.trim());
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {comments && comments.length > 0 ? (
          comments.map(c => {
            const isMe = c.author?._id === currentUserId;
            const dateObj = new Date(c.createdAt);

            return (
              <div
                key={c._id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <img
                  src={
                    c.author?.profilePhoto ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={c.author?.name || 'User'}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)',
                    marginTop: '2px'
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 0.85rem',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.825rem',
                          color: 'var(--color-text-primary)',
                          wordBreak: 'break-word'
                        }}
                      >
                        {c.author?.name || 'Team Member'}
                      </span>
                      {c.author?.role && (
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {c.author.role}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                      {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--color-text-primary)',
                      margin: 0,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {c.message}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.825rem'
            }}
          >
            No discussion on this task yet. Leave a note below.
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginTop: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Add a comment or question..."
          value={text}
          onChange={e => setText(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '0.55rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            background: 'var(--bg-surface-elevated)',
            outline: 'none',
            color: 'var(--color-text-primary)'
          }}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!text.trim() || submitting}
          icon={<Send size={14} />}
          style={{ flexShrink: 0, minHeight: '36px' }}
        >
          {submitting ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
};
