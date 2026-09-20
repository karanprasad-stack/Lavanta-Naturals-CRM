import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Search, X, PanelLeft, Filter
} from 'lucide-react';
import {
  AnyCalendarEntry, CalendarEvent, CalendarEventType,
  EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, isTaskDeadline
} from '../../types/calendar';
import { calendarService } from '../../services/calendarService';
import { CreateEventModal } from '../../components/calendar/CreateEventModal';
import { EventDetailPanel } from '../../components/calendar/EventDetailPanel';
import { CalendarSidebar, CalendarCategoryFilters } from '../../components/calendar/CalendarSidebar';
import { useAuth } from '../../context/AuthContext';

type CalendarView = 'month' | 'week' | 'day' | 'agenda';
type FilterType = 'ALL' | CalendarEventType;

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // Default: Month on desktop, Agenda on mobile
  const [view, setView] = useState<CalendarView>(() => (window.innerWidth < 768 ? 'agenda' : 'month'));
  const [events, setEvents] = useState<AnyCalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AnyCalendarEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => window.innerWidth > 960);

  const [categoryFilters, setCategoryFilters] = useState<CalendarCategoryFilters>({
    personal: true,
    meetings: true,
    taskDeadlines: true,
    teamEvents: true,
    companyEvents: true
  });

  // Check if event param in URL
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId) {
      calendarService.getEventById(eventId).then(e => setSelectedEvent(e)).catch(() => {});
    }
  }, [searchParams]);

  function getViewDateRange(date: Date, v: CalendarView) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    if (v === 'month') {
      return {
        start: new Date(year, month - 1, 20, 0, 0, 0),
        end: new Date(year, month + 2, 10, 23, 59, 59)
      };
    }
    if (v === 'week') {
      const dow = date.getDay();
      const start = new Date(year, month, day - dow, 0, 0, 0);
      const end = new Date(year, month, day - dow + 6, 23, 59, 59);
      return { start, end };
    }
    return {
      start: new Date(year, month, day, 0, 0, 0),
      end: new Date(year, month, day, 23, 59, 59)
    };
  }

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { start, end } = getViewDateRange(currentDate, view);
      const res = await calendarService.getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
        type: filterType === 'ALL' ? undefined : filterType,
        search: searchQuery || undefined
      });
      const all: AnyCalendarEntry[] = [
        ...res.events,
        ...res.taskEntries
      ];
      setEvents(all);
    } catch (err: any) {
      setError(err?.message || 'Failed to load calendar events.');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, view, filterType, searchQuery]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events based on sidebar checkboxes
  const visibleEvents = useMemo(() => {
    return events.filter(ev => {
      const isTask = isTaskDeadline(ev);
      if (isTask) {
        if (!categoryFilters.taskDeadlines) return false;
      }
      if (ev.type === 'PERSONAL' || ev.type === 'REMINDER' || ev.type === 'FOLLOW_UP') {
        if (!categoryFilters.personal) return false;
      }
      if (ev.type === 'MEETING' || ev.type === 'CALL') {
        if (!categoryFilters.meetings) return false;
      }
      if (ev.visibility === 'TEAM' && !isTask) {
        if (!categoryFilters.teamEvents) return false;
      }
      if (ev.type === 'COMPANY_EVENT' || ev.visibility === 'COMPANY') {
        if (!categoryFilters.companyEvents) return false;
      }
      return true;
    });
  }, [events, categoryFilters]);

  const toggleCategory = (cat: keyof CalendarCategoryFilters) => {
    setCategoryFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const navigate_calendar = (dir: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() + dir);
      else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const getEventsOnDate = (date: Date) => {
    return visibleEvents.filter(e => {
      const eDate = new Date(e.startDateTime);
      return (
        eDate.getDate() === date.getDate() &&
        eDate.getMonth() === date.getMonth() &&
        eDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Drag and Drop support
  const handleDragStart = (e: React.DragEvent, ev: AnyCalendarEntry) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        id: ev._id || (ev as any).id,
        isTaskDeadline: isTaskDeadline(ev),
        type: ev.type,
        title: ev.title
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDate = async (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.isTaskDeadline) {
        alert('Task deadline can only be changed from the task itself.');
        return;
      }

      const eventToMove = events.find(ev => (ev._id === data.id || (ev as any).id === data.id));
      if (!eventToMove) return;

      const oldStart = new Date(eventToMove.startDateTime);
      const newStart = new Date(targetDate);
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

      let newEnd: Date | undefined;
      if (eventToMove.endDateTime) {
        const duration = new Date(eventToMove.endDateTime).getTime() - oldStart.getTime();
        newEnd = new Date(newStart.getTime() + duration);
      }

      if (eventToMove.type === 'MEETING' || eventToMove.visibility === 'COMPANY') {
        const confirmed = window.confirm(
          `Reschedule "${eventToMove.title}" to ${newStart.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}?`
        );
        if (!confirmed) return;
      }

      await calendarService.updateEvent(eventToMove._id || (eventToMove as any).id, {
        startDateTime: newStart.toISOString(),
        endDateTime: newEnd ? newEnd.toISOString() : undefined
      });
      await fetchEvents();
    } catch (err: any) {
      console.error('[CalendarPage] Drop reschedule error:', err);
      alert(err?.message || 'Failed to reschedule event.');
    }
  };

  const handleCreateEvent = async (data: any) => {
    if (editEvent) {
      await calendarService.updateEvent(editEvent._id || editEvent.id!, data);
    } else {
      await calendarService.createEvent(data);
    }
    setEditEvent(null);
    await fetchEvents();
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditEvent(event);
    setSelectedEvent(null);
    setIsCreateOpen(true);
  };

  const handleEventDeleted = () => {
    setSelectedEvent(null);
    fetchEvents();
  };

  const formatCurrentPeriod = () => {
    if (view === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const dow = currentDate.getDay();
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - dow);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startStr = `${start.getDate()} ${MONTHS[start.getMonth()].substring(0, 3)}`;
      const endStr = `${end.getDate()} ${MONTHS[end.getMonth()].substring(0, 3)} ${end.getFullYear()}`;
      return `${startStr} – ${endStr}`;
    }
    return currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ── MONTH VIEW ──────────────────────────
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const cells: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const isToday = (d: Date) => d.toDateString() === today.toDateString();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9' }}>
          {DAYS_OF_WEEK.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ flex: 1, display: 'grid', gridTemplateRows: `repeat(${cells.length / 7}, 1fr)`, overflow: 'hidden' }}>
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <div key={week} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9' }}>
              {cells.slice(week * 7, (week + 1) * 7).map((cell, i) => {
                if (!cell) {
                  return (
                    <div key={`empty-${i}`} style={{ borderRight: i < 6 ? '1px solid #F1F5F9' : 'none', backgroundColor: '#FAFBF8', minHeight: '80px' }} />
                  );
                }
                const dayEvents = getEventsOnDate(cell);
                const isCurrentMonth = cell.getMonth() === month;
                const isTodayDate = isToday(cell);

                return (
                  <div
                    key={cell.getDate()}
                    onClick={() => {
                      setSelectedDate(cell);
                      setCurrentDate(cell);
                      if (view !== 'day') setView('day');
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropOnDate(cell, e)}
                    style={{
                      borderRight: i < 6 ? '1px solid #F1F5F9' : 'none',
                      minHeight: '80px',
                      padding: '0.35rem',
                      cursor: 'pointer',
                      backgroundColor: isTodayDate ? '#F0FFF4' : '#FFFFFF',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => {
                      if (!isTodayDate) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = isTodayDate ? '#F0FFF4' : '#FFFFFF';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        fontSize: '0.8rem',
                        fontWeight: isTodayDate ? 700 : 400,
                        backgroundColor: isTodayDate ? '#69C43F' : 'transparent',
                        color: isTodayDate ? '#FFFFFF' : isCurrentMonth ? '#1B2533' : '#CBD5E1',
                        marginBottom: '0.25rem'
                      }}
                    >
                      {cell.getDate()}
                    </div>
                    {dayEvents.slice(0, 3).map((ev, ei) => {
                      const colors = EVENT_TYPE_COLORS[ev.type];
                      return (
                        <div
                          key={ei}
                          draggable={true}
                          onDragStart={e => handleDragStart(e, ev)}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          style={{
                            backgroundColor: colors.bg,
                            borderLeft: `3px solid ${colors.dot}`,
                            color: colors.text,
                            borderRadius: '3px',
                            padding: '1px 5px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            marginBottom: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'grab'
                          }}
                        >
                          {!ev.allDay && `${new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} `}
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── WEEK VIEW ──────────────────────────
  const renderWeekView = () => {
    const dow = currentDate.getDay();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() - dow + i);
      return d;
    });
    const today = new Date();

    return (
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '2px solid #E2E8F0', position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 10 }}>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #F1F5F9' }} />
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} style={{ textAlign: 'center', padding: '0.5rem 0.25rem', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  {DAYS_OF_WEEK[d.getDay()]}
                </div>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: isToday ? '#69C43F' : 'transparent',
                    color: isToday ? '#FFFFFF' : '#1B2533',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: isToday ? 700 : 400,
                    margin: '0 auto'
                  }}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        {HOURS.map(hour => (
          <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #F8FAFC' }}>
            <div style={{ padding: '0.3rem 0.5rem', fontSize: '0.65rem', color: '#94A3B8', textAlign: 'right', borderRight: '1px solid #F1F5F9', paddingTop: '0.15rem' }}>
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            {weekDays.map((day, di) => {
              const dayEventsAtHour = getEventsOnDate(day).filter(ev => {
                const evHour = new Date(ev.startDateTime).getHours();
                return evHour === hour;
              });
              const cellDate = new Date(day);
              cellDate.setHours(hour, 0, 0, 0);

              return (
                <div
                  key={di}
                  onClick={() => {
                    setSelectedDate(cellDate);
                    setIsCreateOpen(true);
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropOnDate(cellDate, e)}
                  style={{ borderRight: di < 6 ? '1px solid #F1F5F9' : 'none', minHeight: '50px', padding: '2px', cursor: 'pointer', position: 'relative' }}
                >
                  {dayEventsAtHour.map((ev, ei) => {
                    const colors = EVENT_TYPE_COLORS[ev.type];
                    return (
                      <div
                        key={ei}
                        draggable={true}
                        onDragStart={e => handleDragStart(e, ev)}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        style={{
                          backgroundColor: colors.bg,
                          borderLeft: `3px solid ${colors.dot}`,
                          color: colors.text,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          marginBottom: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'grab'
                        }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ── DAY VIEW ──────────────────────────
  const renderDayView = () => {
    const dayEvents = getEventsOnDate(currentDate).sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );
    if (dayEvents.length === 0) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', textAlign: 'center', padding: '2rem' }}>
          <CalendarIcon size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#64748B' }}>Your day is clear.</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>No events scheduled for this day.</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{ marginTop: '1rem', padding: '8px 16px', borderRadius: '8px', backgroundColor: '#69C43F', border: 'none', color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer' }}
          >
            + Create Event
          </button>
        </div>
      );
    }

    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {dayEvents.map((ev, i) => {
          const colors = EVENT_TYPE_COLORS[ev.type];
          return (
            <div
              key={i}
              draggable={true}
              onDragStart={e => handleDragStart(e, ev)}
              onClick={() => setSelectedEvent(ev)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ width: '4px', alignSelf: 'stretch', borderRadius: '4px', backgroundColor: colors.dot, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1B2533' }}>{ev.title}</span>
                  <span style={{ fontSize: '0.7rem', color: colors.text, fontWeight: 600, backgroundColor: `${colors.dot}18`, padding: '2px 8px', borderRadius: '8px' }}>
                    {EVENT_TYPE_LABELS[ev.type]}
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                  {ev.allDay
                    ? 'All Day'
                    : `${new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${
                        ev.endDateTime ? ` — ${new Date(ev.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
                      }`}
                </div>
                {(ev as any).participants && (ev as any).participants.length > 0 && (
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    👥 {(ev as any).participants.length} participant{(ev as any).participants.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── AGENDA VIEW ──────────────────────────
  const renderAgendaView = () => {
    const sortedEvents = [...visibleEvents].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    if (sortedEvents.length === 0) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', padding: '2rem', textAlign: 'center' }}>
          <CalendarIcon size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#64748B' }}>No upcoming events.</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>Your schedule is clear for this period.</p>
        </div>
      );
    }

    // Group by date
    const byDate = new Map<string, AnyCalendarEntry[]>();
    sortedEvents.forEach(ev => {
      const key = new Date(ev.startDateTime).toDateString();
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(ev);
    });

    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.5rem' }}>
        {Array.from(byDate.entries()).map(([dateStr, dateEvents]) => {
          const date = new Date(dateStr);
          const isTod = date.toDateString() === new Date().toDateString();
          return (
            <div key={dateStr} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: isTod ? '#69C43F' : '#F1F5F9',
                    color: isTod ? '#FFFFFF' : '#334155',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
                    {DAYS_OF_WEEK[date.getDay()]}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>{date.getDate()}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B2533' }}>
                    {isTod ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {dateEvents.map((ev, i) => {
                const colors = EVENT_TYPE_COLORS[ev.type];
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${colors.border}`,
                      marginBottom: '0.4rem',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.bg)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                  >
                    <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '4px', backgroundColor: colors.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B2533', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                          {ev.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: colors.text, fontWeight: 600 }}>
                          {EVENT_TYPE_LABELS[ev.type]}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        {ev.allDay
                          ? 'All Day'
                          : `${new Date(ev.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${
                              ev.endDateTime ? ` — ${new Date(ev.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
                            }`}
                        {(ev as any).location && ` · ${(ev as any).location}`}
                        {!isTaskDeadline(ev) && (ev as CalendarEvent).participants?.length > 0 && ` · 👥 ${(ev as CalendarEvent).participants.length}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ── FILTER TYPES ──────────────────────────
  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'ALL', label: 'All Events' },
    { value: 'MEETING', label: 'Meetings' },
    { value: 'TASK_DEADLINE', label: 'Task Deadlines' },
    { value: 'REMINDER', label: 'Reminders' },
    { value: 'CALL', label: 'Calls' },
    { value: 'FOLLOW_UP', label: 'Follow-Ups' },
    { value: 'COMPANY_EVENT', label: 'Company Events' },
    { value: 'PERSONAL', label: 'Personal' }
  ];

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#FAFBF8', overflow: 'hidden' }}>
      {/* 1. Left Sidebar (Collapsible) */}
      {isSidebarOpen && (
        <CalendarSidebar
          currentDate={currentDate}
          onSelectDate={d => {
            setCurrentDate(d);
            setSelectedDate(d);
          }}
          categoryFilters={categoryFilters}
          onToggleCategory={toggleCategory}
          events={visibleEvents}
          onSelectEvent={ev => setSelectedEvent(ev)}
        />
      )}

      {/* 2. Main Calendar Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Calendar Toolbar */}
        <div style={{ padding: '0.85rem 1.5rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Sidebar Toggle & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: isSidebarOpen ? '#EAF7E6' : '#FFFFFF',
                color: isSidebarOpen ? '#377E1E' : '#334155',
                cursor: 'pointer',
                display: 'flex'
              }}
              title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <PanelLeft size={16} />
            </button>
            <button
              onClick={() => navigate_calendar(-1)}
              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', cursor: 'pointer', display: 'flex' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToToday}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Today
            </button>
            <button
              onClick={() => navigate_calendar(1)}
              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', cursor: 'pointer', display: 'flex' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Period label */}
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1B2533', flex: 1, minWidth: '150px' }}>
            {formatCurrentPeriod()}
          </h2>

          {/* View switcher */}
          <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.775rem',
                  fontWeight: view === v ? 700 : 500,
                  backgroundColor: view === v ? '#FFFFFF' : 'transparent',
                  color: view === v ? '#1B2533' : '#64748B',
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.1s'
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '5px 10px' }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8rem', color: '#1B2533', width: '130px' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Create button */}
          <button
            onClick={() => {
              setEditEvent(null);
              setIsCreateOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#69C43F', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={16} />
            <span>Create Event</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F5F9', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {filterOptions.map(opt => {
            const isActive = filterType === opt.value;
            const colors = opt.value !== 'ALL' ? EVENT_TYPE_COLORS[opt.value as CalendarEventType] : null;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.725rem',
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: isActive ? `2px solid ${colors ? colors.dot : '#69C43F'}` : '1px solid #E2E8F0',
                  backgroundColor: isActive ? (colors ? colors.bg : '#EAF7E6') : '#FFFFFF',
                  color: isActive ? (colors ? colors.text : '#377E1E') : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Loading / Error / Calendar Content */}
        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#69C43F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Loading calendar...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#64748B' }}>
            <span style={{ color: '#EF4444', fontWeight: 600 }}>⚠ {error}</span>
            <button
              onClick={fetchEvents}
              style={{ padding: '7px 14px', borderRadius: '8px', backgroundColor: '#69C43F', border: 'none', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
            {view === 'agenda' && renderAgendaView()}
          </>
        )}
      </div>

      {/* 3. Right: Event Detail Panel (when event selected) */}
      {selectedEvent && (
        <div style={{ width: '340px', flexShrink: 0, borderLeft: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', overflowY: 'auto' }}>
          <EventDetailPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onEdit={handleEditEvent}
            onDeleted={handleEventDeleted}
          />
        </div>
      )}

      {/* Create/Edit Event Modal */}
      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditEvent(null);
        }}
        onSubmit={handleCreateEvent}
        initialDate={selectedDate || new Date()}
        editEvent={editEvent}
      />
    </div>
  );
};
