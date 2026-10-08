import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, MapPin, Link, Users, Bell, Eye, Tag, AlertCircle } from 'lucide-react';
import { CalendarEventType, EventVisibility, ReminderOption, CalendarEventFormData, EVENT_TYPE_LABELS, REMINDER_LABELS } from '../../types/calendar';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { User } from '../../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CalendarEventFormData>) => Promise<void>;
  initialDate?: Date;
  editEvent?: any; // for edit mode
}

const EVENT_TYPES: CalendarEventType[] = ['MEETING', 'CALL', 'REMINDER', 'FOLLOW_UP', 'COMPANY_EVENT', 'PERSONAL', 'OTHER'];

const TYPE_COLORS: Record<CalendarEventType, string> = {
  MEETING: '#69C43F',
  TASK_DEADLINE: '#8B5CF6',
  REMINDER: '#94A3B8',
  CALL: '#22C55E',
  FOLLOW_UP: '#F59E0B',
  COMPANY_EVENT: '#7C3AED',
  PERSONAL: '#64748B',
  FESTIVAL: '#EC4899',
  OTHER: '#94A3B8'
};

const VISIBILITY_OPTIONS: { value: EventVisibility; label: string; desc: string }[] = [
  { value: 'PRIVATE', label: 'Private', desc: 'Only visible to you' },
  { value: 'TEAM', label: 'Team', desc: 'Visible to your department' },
  { value: 'COMPANY', label: 'Company', desc: 'Visible to all team members' }
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  editEvent
}) => {
  const { currentUser } = useAuth();
  const role = (currentUser?.role || 'EMPLOYEE').toUpperCase();

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const defaultStart = initialDate ? formatDateTimeLocal(initialDate) : formatDateTimeLocal(new Date());
  const defaultEnd = initialDate
    ? formatDateTimeLocal(new Date(initialDate.getTime() + 60 * 60 * 1000))
    : formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CalendarEventType>('MEETING');
  const [startDateTime, setStartDateTime] = useState(defaultStart);
  const [endDateTime, setEndDateTime] = useState(defaultEnd);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [reminder, setReminder] = useState<ReminderOption>('NONE');
  const [visibility, setVisibility] = useState<EventVisibility>('PRIVATE');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load team members for participant selection
  useEffect(() => {
    if (!isOpen) return;
    userService.getAllUsers().then(users => {
      setTeamUsers(users.filter(u => (u._id || u.id) !== (currentUser?._id || currentUser?.id)));
    }).catch(console.error);
  }, [isOpen, currentUser]);

  // Populate form in edit mode
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || '');
      setDescription(editEvent.description || '');
      setType(editEvent.type || 'MEETING');
      setStartDateTime(formatDateTimeLocal(new Date(editEvent.startDateTime)));
      if (editEvent.endDateTime) setEndDateTime(formatDateTimeLocal(new Date(editEvent.endDateTime)));
      setAllDay(editEvent.allDay || false);
      setLocation(editEvent.location || '');
      setMeetingLink(editEvent.meetingLink || '');
      setReminder(editEvent.reminder || 'NONE');
      setVisibility(editEvent.visibility || 'PRIVATE');
      setSelectedParticipantIds(editEvent.participants?.map((p: any) => p.userId?._id || p.userId) || []);
    } else {
      setTitle(''); setDescription(''); setType('MEETING');
      setStartDateTime(defaultStart); setEndDateTime(defaultEnd);
      setAllDay(false); setLocation(''); setMeetingLink('');
      setReminder('NONE'); setVisibility('PRIVATE');
      setSelectedParticipantIds([]);
    }
    setErrors({});
  }, [isOpen, editEvent]);

  const filteredUsers = useMemo(() => {
    const q = participantSearch.toLowerCase();
    return q ? teamUsers.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    ) : teamUsers.slice(0, 8);
  }, [teamUsers, participantSearch]);

  const toggleParticipant = (uid: string) => {
    setSelectedParticipantIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!startDateTime) newErrors.startDateTime = 'Start date/time is required.';
    if (!allDay && !endDateTime) newErrors.endDateTime = 'End date/time is required.';
    if (!allDay && startDateTime && endDateTime && new Date(endDateTime) <= new Date(startDateTime)) {
      newErrors.endDateTime = 'End time must be after start time.';
    }
    if (visibility === 'COMPANY' && !['FOUNDER', 'HR'].includes(role)) {
      newErrors.visibility = 'Only Founder or HR can create company-wide events.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type,
        startDateTime,
        endDateTime: allDay ? undefined : endDateTime,
        allDay,
        participants: selectedParticipantIds,
        location: location.trim(),
        meetingLink: meetingLink.trim(),
        reminder,
        visibility,
        department: currentUser?.department
      });
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Failed to save event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const canCreateCompanyEvent = ['FOUNDER', 'HR'].includes(role);
  const canCreateTeamEvent = ['FOUNDER', 'HR', 'MANAGER'].includes(role);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)', borderRadius: '16px',
          width: '100%', maxWidth: '580px', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          border: '1px solid var(--border-strong)', overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--color-soft-green)', color: 'var(--color-primary-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {editEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {editEvent ? 'Update your calendar event' : 'Schedule a meeting, call, reminder, or event'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body (scrollable) */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Error Banner */}
          {errors.submit && (
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={15} />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Event Title <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Marketing Weekly Stand-Up"
              style={{
                width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px',
                border: errors.title ? '1.5px solid var(--color-danger)' : '1px solid var(--border-input)',
                fontSize: '0.875rem', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box',
                backgroundColor: 'var(--bg-input)'
              }}
            />
            {errors.title && <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.title}</p>}
          </div>

          {/* Event Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              <Tag size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Event Type
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {EVENT_TYPES.map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setType(t)}
                  style={{
                    padding: '5px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: type === t ? 700 : 500,
                    border: type === t ? `2px solid ${TYPE_COLORS[t]}` : '1px solid var(--border-color)',
                    backgroundColor: type === t ? `${TYPE_COLORS[t]}25` : 'var(--bg-surface-elevated)',
                    color: type === t ? TYPE_COLORS[t] : 'var(--color-text-secondary)', cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {EVENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Date/Time Row */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={13} />Date & Time
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ accentColor: '#58C83A' }} />
                All day
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: allDay ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Start</label>
                <input
                  type={allDay ? 'date' : 'datetime-local'}
                  value={allDay ? startDateTime.substring(0, 10) : startDateTime}
                  onChange={e => setStartDateTime(allDay ? `${e.target.value}T00:00` : e.target.value)}
                  style={{
                    width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
                    border: errors.startDateTime ? '1.5px solid var(--color-danger)' : '1px solid var(--border-input)',
                    fontSize: '0.825rem', color: 'var(--color-text-primary)', boxSizing: 'border-box', backgroundColor: 'var(--bg-input)'
                  }}
                />
              </div>
              {!allDay && (
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>End</label>
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={e => setEndDateTime(e.target.value)}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
                      border: errors.endDateTime ? '1.5px solid var(--color-danger)' : '1px solid var(--border-input)',
                      fontSize: '0.825rem', color: 'var(--color-text-primary)', boxSizing: 'border-box', backgroundColor: 'var(--bg-input)'
                    }}
                  />
                </div>
              )}
            </div>
            {errors.endDateTime && <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.endDateTime}</p>}
          </div>

          {/* Location & Meeting Link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={13} />Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Conference Room A"
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '0.825rem', color: 'var(--color-text-primary)', boxSizing: 'border-box', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Link size={13} />Meeting Link
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '0.825rem', color: 'var(--color-text-primary)', boxSizing: 'border-box', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={13} />Participants ({selectedParticipantIds.length})
            </label>
            <input
              type="text"
              placeholder="Search team member..."
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '0.825rem', color: 'var(--color-text-primary)', boxSizing: 'border-box', backgroundColor: 'var(--bg-input)', marginBottom: '0.4rem' }}
            />
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {filteredUsers.map(user => {
                const uid = user._id || user.id!;
                const selected = selectedParticipantIds.includes(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => toggleParticipant(uid)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                      padding: '0.45rem 0.65rem', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: selected ? 'var(--color-soft-green)' : 'var(--bg-surface-elevated)',
                      border: selected ? '1px solid var(--color-success-border)' : '1px solid transparent',
                      transition: 'all 0.1s'
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-primary)', flexShrink: 0 }}>
                      {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{user.role} · {user.department}</div>
                    </div>
                    {selected && <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#58C83A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reminder & Visibility Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Bell size={13} />Reminder
              </label>
              <select
                value={reminder}
                onChange={e => setReminder(e.target.value as ReminderOption)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '0.825rem', color: 'var(--color-text-primary)', backgroundColor: 'var(--bg-input)' }}
              >
                {Object.entries(REMINDER_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Eye size={13} />Visibility
              </label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as EventVisibility)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: errors.visibility ? '1.5px solid var(--color-danger)' : '1px solid var(--border-input)', fontSize: '0.825rem', color: 'var(--color-text-primary)', backgroundColor: 'var(--bg-input)' }}
              >
                {VISIBILITY_OPTIONS
                  .filter(opt => {
                    if (opt.value === 'COMPANY') return canCreateCompanyEvent;
                    if (opt.value === 'TEAM') return canCreateTeamEvent;
                    return true;
                  })
                  .map(opt => <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>)
                }
              </select>
              {errors.visibility && <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.visibility}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add any relevant notes or context for this event..."
              rows={3}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '0.825rem', color: 'var(--color-text-primary)', resize: 'vertical', boxSizing: 'border-box', backgroundColor: 'var(--bg-input)', fontFamily: 'inherit' }}
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button" onClick={onClose}
            style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleSubmit as any}
            disabled={isSubmitting}
            style={{
              padding: '0.55rem 1.5rem', borderRadius: '8px', border: 'none',
              backgroundColor: isSubmitting ? 'var(--border-strong)' : '#58C83A',
              color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: isSubmitting ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            {isSubmitting ? 'Saving...' : (editEvent ? 'Save Changes' : 'Create Event')}
          </button>
        </div>
      </div>
    </div>
  );
};
