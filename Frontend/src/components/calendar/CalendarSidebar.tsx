import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckSquare,
  Users,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  AnyCalendarEntry,
  CalendarEventType,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  isTaskDeadline
} from '../../types/calendar';

export interface CalendarCategoryFilters {
  personal: boolean;
  meetings: boolean;
  taskDeadlines: boolean;
  teamEvents: boolean;
  companyEvents: boolean;
}

interface CalendarSidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  categoryFilters: CalendarCategoryFilters;
  onToggleCategory: (category: keyof CalendarCategoryFilters) => void;
  events: AnyCalendarEntry[];
  onSelectEvent: (event: AnyCalendarEntry) => void;
}

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  currentDate,
  onSelectDate,
  categoryFilters,
  onToggleCategory,
  events,
  onSelectEvent
}) => {
  const [miniCalendarMonth, setMiniCalendarMonth] = useState<Date>(new Date(currentDate));

  const year = miniCalendarMonth.getFullYear();
  const month = miniCalendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const miniDays: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) miniDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) miniDays.push(new Date(year, month, d));
  while (miniDays.length % 7 !== 0) miniDays.push(null);

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) => d.toDateString() === currentDate.toDateString();

  const navigateMiniMonth = (delta: number) => {
    setMiniCalendarMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  // Today's events
  const todayStr = new Date().toDateString();
  const todayEvents = events.filter(e => new Date(e.startDateTime).toDateString() === todayStr);

  const nextMeeting = todayEvents.find(e => e.type === 'MEETING' || e.type === 'CALL');
  const nextTaskDeadline = todayEvents.find(e => isTaskDeadline(e) || e.type === 'TASK_DEADLINE');

  // Upcoming 5 events
  const nowTime = new Date().getTime();
  const upcomingFive = [...events]
    .filter(e => new Date(e.startDateTime).getTime() >= nowTime - 60 * 60 * 1000)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
    .slice(0, 5);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <aside
      style={{
        width: '280px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        fontSize: '0.825rem'
      }}
    >
      {/* 1. Mini Calendar Picker */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span style={{ fontWeight: 700, color: '#1B2533', fontSize: '0.85rem' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={() => navigateMiniMonth(-1)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '4px',
                display: 'flex',
                color: '#64748B'
              }}
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => navigateMiniMonth(1)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '4px',
                display: 'flex',
                color: '#64748B'
              }}
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '4px' }}>
          {DAYS_SHORT.map(d => (
            <span key={d} style={{ fontSize: '0.675rem', fontWeight: 600, color: '#94A3B8' }}>
              {d}
            </span>
          ))}
        </div>

        {/* Calendar days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
          {miniDays.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} style={{ height: '26px' }} />;
            const isTod = isToday(d);
            const isSel = isSelected(d);
            return (
              <button
                key={d.getDate()}
                onClick={() => onSelectDate(d)}
                style={{
                  height: '26px',
                  width: '26px',
                  margin: '0 auto',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.725rem',
                  fontWeight: isTod || isSel ? 700 : 500,
                  backgroundColor: isSel ? '#69C43F' : isTod ? '#EAF7E6' : 'transparent',
                  color: isSel ? '#FFFFFF' : isTod ? '#377E1E' : '#1B2533',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.1s'
                }}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. My Calendars Section */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.65rem', fontSize: '0.8rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          My Calendars
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={categoryFilters.personal}
              onChange={() => onToggleCategory('personal')}
              style={{ accentColor: '#64748B' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
              <User size={13} color="#64748B" /> Personal Events
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={categoryFilters.meetings}
              onChange={() => onToggleCategory('meetings')}
              style={{ accentColor: '#69C43F' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
              <Clock size={13} color="#69C43F" /> Meetings & Calls
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={categoryFilters.taskDeadlines}
              onChange={() => onToggleCategory('taskDeadlines')}
              style={{ accentColor: '#8B5CF6' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
              <CheckSquare size={13} color="#8B5CF6" /> Task Deadlines
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={categoryFilters.teamEvents}
              onChange={() => onToggleCategory('teamEvents')}
              style={{ accentColor: '#377E1E' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
              <Users size={13} color="#377E1E" /> Team Events
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={categoryFilters.companyEvents}
              onChange={() => onToggleCategory('companyEvents')}
              style={{ accentColor: '#7C3AED' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
              <Building size={13} color="#7C3AED" /> Company Events
            </span>
          </label>
        </div>
      </div>

      {/* 3. Today Panel */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Today's Focus
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
            {new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {nextMeeting ? (
          <div
            onClick={() => onSelectEvent(nextMeeting)}
            style={{
              backgroundColor: '#EAF7E6',
              border: '1px solid #C4E9B7',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              cursor: 'pointer',
              marginBottom: '0.5rem'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#377E1E', textTransform: 'uppercase' }}>
              Next Meeting · {formatTime(nextMeeting.startDateTime)}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B2533', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nextMeeting.title}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
            No meetings scheduled today.
          </div>
        )}

        {nextTaskDeadline ? (
          <div
            onClick={() => onSelectEvent(nextTaskDeadline)}
            style={{
              backgroundColor: '#EDE9FE',
              border: '1px solid #C4B5FD',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase' }}>
              Task Due · {formatTime(nextTaskDeadline.startDateTime)}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B2533', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nextTaskDeadline.title}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            No task deadlines today.
          </div>
        )}
      </div>

      {/* 4. Upcoming Section (Next 5) */}
      <div style={{ padding: '1rem', flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.65rem', fontSize: '0.8rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Upcoming (Next 5)
        </div>

        {upcomingFive.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', padding: '1rem 0' }}>
            No upcoming events.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {upcomingFive.map((ev, i) => {
              const colors = EVENT_TYPE_COLORS[ev.type];
              const isTask = isTaskDeadline(ev);
              const participantCount = !isTask && (ev as any).participants ? (ev as any).participants.length : 0;
              const dateFormatted = new Date(ev.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
              return (
                <div
                  key={i}
                  onClick={() => onSelectEvent(ev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.55rem',
                    borderRadius: '7px',
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#FAFBF8',
                    cursor: 'pointer',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.bg)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FAFBF8')}
                >
                  <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '3px', backgroundColor: colors.dot }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1B2533', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.675rem', color: '#64748B', marginTop: '1px' }}>
                      <span>{dateFormatted} · {ev.allDay ? 'All Day' : formatTime(ev.startDateTime)}</span>
                      {participantCount > 0 && (
                        <span>· 👥 {participantCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
