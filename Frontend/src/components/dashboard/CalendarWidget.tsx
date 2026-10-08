import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, Users, AlertTriangle, ExternalLink } from 'lucide-react';
import { AnyCalendarEntry, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, isTaskDeadline } from '../../types/calendar';
import { calendarService } from '../../services/calendarService';

interface CalendarWidgetProps {
  maxItems?: number;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ maxItems = 5 }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AnyCalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calendarService.getToday()
      .then(evs => setEvents(evs.slice(0, maxItems)))
      .catch(err => setError(err?.message || 'Failed to load schedule'))
      .finally(() => setIsLoading(false));
  }, [maxItems]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const today = new Date();

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md, 12px)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}
    >
      {/* Widget Header */}
      <div
        style={{
          padding: '0.9rem 1.1rem 0.65rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px', height: '28px', borderRadius: '7px',
              backgroundColor: 'rgba(88, 200, 58, 0.14)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Calendar size={15} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Today's Schedule</h3>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              {today.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/calendar')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)',
            background: 'transparent', border: 'none', cursor: 'pointer'
          }}
        >
          View Calendar <ChevronRight size={14} />
        </button>
      </div>

      {/* Widget Body */}
      <div style={{ padding: '0.5rem 0' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem 1.1rem', fontSize: '0.775rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Unable to load schedule
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '1.5rem 1.1rem', textAlign: 'center' }}>
            <Calendar size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3, display: 'block', color: 'var(--color-text-muted)' }} />
            <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Your day is clear.</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>No events scheduled for today.</p>
            <button
              onClick={() => navigate('/calendar')}
              style={{ marginTop: '0.75rem', padding: '6px 14px', borderRadius: '7px', backgroundColor: 'rgba(88, 200, 58, 0.12)', border: '1px solid rgba(88, 200, 58, 0.3)', color: '#86E56B', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Event
            </button>
          </div>
        ) : (
          events.map((ev, i) => {
            const colors = EVENT_TYPE_COLORS[ev.type];
            const isTask = isTaskDeadline(ev);
            return (
              <div
                key={i}
                onClick={() => {
                  if (isTask) {
                    navigate(`/tasks/${(ev as any).taskId}`);
                  } else {
                    navigate(`/calendar?event=${ev._id}`);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                  padding: '0.6rem 1.1rem',
                  borderBottom: i < events.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer', transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Time column */}
                <div style={{ width: '56px', flexShrink: 0, paddingTop: '1px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {ev.allDay ? 'All Day' : formatTime(ev.startDateTime)}
                  </span>
                </div>

                {/* Color stripe */}
                <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '4px', backgroundColor: colors.dot, flexShrink: 0 }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1px' }}>
                    <span style={{ fontSize: '0.68rem', color: colors.text, fontWeight: 600, backgroundColor: colors.bg, padding: '1px 5px', borderRadius: '4px' }}>
                      {EVENT_TYPE_LABELS[ev.type]}
                    </span>
                    {isTask && (ev as any).priority === 'HIGH' && (
                      <AlertTriangle size={11} color="#EF4444" />
                    )}
                    {!isTask && (ev as any).participants?.length > 0 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Users size={10} />
                        {(ev as any).participants.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer if more events exist */}
      {events.length >= maxItems && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.6rem 1.1rem' }}>
          <button
            onClick={() => navigate('/calendar')}
            style={{ width: '100%', padding: '6px', borderRadius: '7px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--color-text-secondary)', fontSize: '0.775rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <ExternalLink size={13} />
            View full calendar
          </button>
        </div>
      )}
    </div>
  );
};
