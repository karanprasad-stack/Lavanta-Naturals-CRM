import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, MapPin, Link, Users, Bell, Calendar, Clock, Tag,
  Edit2, Trash2, ExternalLink, Check, CheckCheck, HelpCircle, XCircle,
  User, Shield, ChevronRight, AlertTriangle
} from 'lucide-react';
import { CalendarEvent, TaskDeadlineEntry, isTaskDeadline, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, REMINDER_LABELS } from '../../types/calendar';
import { useAuth } from '../../context/AuthContext';
import { calendarService } from '../../services/calendarService';

interface EventDetailPanelProps {
  event: CalendarEvent | TaskDeadlineEntry | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDeleted: () => void;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ event, onClose, onEdit, onDeleted }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!event) return null;

  const isTask = isTaskDeadline(event);
  const userId = currentUser?._id || currentUser?.id;
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  const colors = EVENT_TYPE_COLORS[event.type];

  const fmt = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const fmtTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isTask) {
    const te = event as TaskDeadlineEntry;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.dot, display: 'inline-block' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.text }}>Task Deadline</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{te.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
            <Calendar size={16} color="var(--primary-color)" />
            <span style={{ fontWeight: 600 }}>Deadline: {fmt(te.startDateTime)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <Clock size={16} color="var(--color-text-muted)" />
            <span>{fmtTime(te.startDateTime)}</span>
          </div>

          {te.priority && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={15} color={te.priority === 'HIGH' ? '#EF4444' : te.priority === 'MEDIUM' ? '#F59E0B' : '#22C55E'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: te.priority === 'HIGH' ? '#EF4444' : te.priority === 'MEDIUM' ? '#F59E0B' : '#22C55E' }}>
                {te.priority} Priority
              </span>
            </div>
          )}

          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', fontSize: '0.775rem', color: '#FBBF24' }}>
            Task deadlines can only be changed from the task itself.
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => navigate(`/tasks/${te.taskId}`)}
            style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.3)', backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#C4B5FD', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <ExternalLink size={16} />
            Open Task
          </button>
        </div>
      </div>
    );
  }

  const ce = event as CalendarEvent;
  const isCreator = ce.createdBy?._id === userId || ce.createdBy?.id === userId;
  const canEdit = isCreator || ['FOUNDER', 'HR'].includes(role);
  const canDelete = isCreator || ['FOUNDER', 'HR'].includes(role);

  const myParticipation = ce.participants?.find(p => {
    const pId = p.userId?._id || (p.userId as any);
    return pId === userId;
  });

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setIsDeleting(true);
    try {
      await calendarService.deleteEvent(ce._id || ce.id!);
      onDeleted();
      onClose();
    } catch (err) {
      console.error('[EventDetailPanel] Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleRespond = async (response: 'ACCEPTED' | 'DECLINED' | 'MAYBE') => {
    setIsResponding(true);
    try {
      await calendarService.respondToEvent(ce._id || ce.id!, response);
      onDeleted(); // Refresh
    } catch (err) {
      console.error('[EventDetailPanel] Respond failed:', err);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: `linear-gradient(to right, ${colors.bg}, var(--bg-surface))` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, marginRight: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.dot, display: 'inline-block' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.text }}>
                {EVENT_TYPE_LABELS[ce.type]}
              </span>
              {ce.visibility === 'COMPANY' && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#C4B5FD', padding: '1px 6px', borderRadius: '4px' }}>Company</span>
              )}
              {ce.visibility === 'TEAM' && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(88, 200, 58, 0.15)', color: '#86E56B', padding: '1px 6px', borderRadius: '4px' }}>Team</span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{ce.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Action buttons */}
        {(canEdit || canDelete) && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
            {canEdit && (
              <button
                onClick={() => onEdit(ce)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--color-text-primary)', fontSize: '0.775rem', fontWeight: 500, cursor: 'pointer' }}
              >
                <Edit2 size={13} />Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${deleteConfirm ? '#EF4444' : 'rgba(239, 68, 68, 0.35)'}`, backgroundColor: deleteConfirm ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface-elevated)', color: deleteConfirm ? '#FF8585' : '#EF4444', fontSize: '0.775rem', fontWeight: deleteConfirm ? 700 : 500, cursor: isDeleting ? 'wait' : 'pointer' }}
              >
                <Trash2 size={13} />
                {isDeleting ? 'Deleting...' : deleteConfirm ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
            {deleteConfirm && !isDeleting && (
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--color-text-muted)', fontSize: '0.775rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Date/Time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
            <Calendar size={16} color="var(--primary-color)" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{fmt(ce.startDateTime)}</span>
          </div>
          {!ce.allDay && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', paddingLeft: '24px' }}>
              <Clock size={14} color="var(--color-text-muted)" />
              <span>
                {fmtTime(ce.startDateTime)}
                {ce.endDateTime && ` — ${fmtTime(ce.endDateTime)}`}
              </span>
            </div>
          )}
          {ce.allDay && (
            <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', paddingLeft: '24px' }}>All Day</div>
          )}
        </div>

        {/* Location */}
        {ce.location && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <MapPin size={16} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{ce.location}</span>
          </div>
        )}

        {/* Meeting Link */}
        {ce.meetingLink && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem' }}>
            <Link size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
            <a href={ce.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', textDecoration: 'underline', wordBreak: 'break-all' }}>
              Join Meeting
            </a>
          </div>
        )}

        {/* Organizer */}
        {ce.createdBy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <User size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 500 }}>Organized by </span>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{ce.createdBy.name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}> · {ce.createdBy.role}</span>
            </div>
          </div>
        )}

        {/* Reminder */}
        {ce.reminder && ce.reminder !== 'NONE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            <Bell size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
            <span>{REMINDER_LABELS[ce.reminder]}</span>
          </div>
        )}

        {/* Description */}
        {ce.description && (
          <div style={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap', border: '1px solid var(--border-subtle)' }}>
            {ce.description}
          </div>
        )}

        {/* Participants */}
        {ce.participants && ce.participants.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={14} />
              Participants ({ce.participants.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {ce.participants.map((p, i) => {
                const pu = p.userId;
                const pName = typeof pu === 'object' ? pu.name : 'Team Member';
                const pRole = typeof pu === 'object' ? pu.role : '';
                const ResponseIcon = p.response === 'ACCEPTED' ? Check : p.response === 'DECLINED' ? XCircle : p.response === 'MAYBE' ? HelpCircle : null;
                const respColor = p.response === 'ACCEPTED' ? '#22C55E' : p.response === 'DECLINED' ? '#EF4444' : p.response === 'MAYBE' ? '#F59E0B' : 'var(--color-text-muted)';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-primary)', border: '1px solid var(--border-subtle)' }}>
                        {pName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{pName}</div>
                        {pRole && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{pRole}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: respColor, fontSize: '0.725rem', fontWeight: 600 }}>
                      {ResponseIcon && <ResponseIcon size={13} />}
                      {p.response}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Linked Task */}
        {ce.relatedTask && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>Linked Task</div>
            <button
              onClick={() => navigate(`/tasks/${ce.relatedTask!._id}`)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', backgroundColor: 'rgba(139, 92, 246, 0.12)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#C4B5FD' }}>{ce.relatedTask.title}</span>
              <ChevronRight size={15} color="#A78BFA" />
            </button>
          </div>
        )}
      </div>

      {/* Response buttons (if participant) */}
      {myParticipation && myParticipation.response !== 'ACCEPTED' && (
        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Your response: <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{myParticipation.response}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={() => handleRespond('ACCEPTED')} disabled={isResponding} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid rgba(88, 200, 58, 0.35)', backgroundColor: 'rgba(88, 200, 58, 0.12)', color: '#86E56B', fontSize: '0.775rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <Check size={13} />Accept
            </button>
            <button onClick={() => handleRespond('MAYBE')} disabled={isResponding} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.35)', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#FFC45C', fontSize: '0.775rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <HelpCircle size={13} />Maybe
            </button>
            <button onClick={() => handleRespond('DECLINED')} disabled={isResponding} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.35)', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#FF8585', fontSize: '0.775rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <XCircle size={13} />Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
