import { CalendarEvent, TaskDeadlineEntry, AnyCalendarEntry, CalendarEventFormData } from '../types/calendar';
import { apiClient } from './apiClient';

export interface CalendarEventsResponse {
  success: boolean;
  events: CalendarEvent[];
  taskEntries: TaskDeadlineEntry[];
  count: number;
}

export interface UpcomingResponse {
  success: boolean;
  upcoming: AnyCalendarEntry[];
}

export interface TodayResponse {
  success: boolean;
  events: AnyCalendarEntry[];
  date: string;
}

export const calendarService = {

  /** Fetch events for a date range with optional filters */
  async getEvents(params: {
    start?: string;
    end?: string;
    type?: string;
    search?: string;
  } = {}): Promise<CalendarEventsResponse> {
    const sp = new URLSearchParams();
    if (params.start) sp.append('start', params.start);
    if (params.end) sp.append('end', params.end);
    if (params.type && params.type !== 'ALL') sp.append('type', params.type);
    if (params.search) sp.append('search', params.search);
    const q = sp.toString();
    return apiClient<CalendarEventsResponse>(`/api/calendar/events${q ? `?${q}` : ''}`);
  },

  /** Fetch a single event by ID */
  async getEventById(id: string): Promise<CalendarEvent> {
    const res = await apiClient<{ success: boolean; event: CalendarEvent }>(`/api/calendar/events/${id}`);
    return res.event;
  },

  /** Create a new calendar event */
  async createEvent(data: Partial<CalendarEventFormData>): Promise<CalendarEvent> {
    const res = await apiClient<{ success: boolean; event: CalendarEvent }>('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.event;
  },

  /** Update an existing event */
  async updateEvent(id: string, data: Partial<CalendarEventFormData>): Promise<CalendarEvent> {
    const res = await apiClient<{ success: boolean; event: CalendarEvent }>(`/api/calendar/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.event;
  },

  /** Soft-delete an event */
  async deleteEvent(id: string): Promise<void> {
    await apiClient<{ success: boolean }>(`/api/calendar/events/${id}`, {
      method: 'DELETE'
    });
  },

  /** Respond to an event invitation */
  async respondToEvent(id: string, response: 'ACCEPTED' | 'DECLINED' | 'MAYBE'): Promise<CalendarEvent> {
    const res = await apiClient<{ success: boolean; event: CalendarEvent }>(`/api/calendar/events/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response })
    });
    return res.event;
  },

  /** Fetch next N upcoming events (calendar + tasks) */
  async getUpcoming(limit: number = 8): Promise<AnyCalendarEntry[]> {
    const res = await apiClient<UpcomingResponse>(`/api/calendar/upcoming?limit=${limit}`);
    return res.upcoming;
  },

  /** Fetch today's events */
  async getToday(): Promise<AnyCalendarEntry[]> {
    const res = await apiClient<TodayResponse>('/api/calendar/today');
    return res.events;
  }
};
