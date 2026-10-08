export type CalendarEventType =
  | 'MEETING'
  | 'TASK_DEADLINE'
  | 'REMINDER'
  | 'CALL'
  | 'FOLLOW_UP'
  | 'COMPANY_EVENT'
  | 'PERSONAL'
  | 'FESTIVAL'
  | 'OTHER';

export type EventVisibility = 'PRIVATE' | 'TEAM' | 'COMPANY';
export type ParticipantResponse = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE';
export type ReminderOption = 'AT_TIME' | '5_MIN' | '10_MIN' | '15_MIN' | '30_MIN' | '1_HOUR' | '1_DAY' | 'NONE';

export interface EventParticipant {
  userId: {
    _id: string;
    id?: string;
    name: string;
    role: string;
    department?: string;
    designation?: string;
    profilePhoto?: string;
  };
  response: ParticipantResponse;
  respondedAt?: string | null;
  notified?: boolean;
}

export interface CalendarEventBase {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  startDateTime: string;
  endDateTime?: string | null;
  allDay: boolean;
  visibility: EventVisibility;
  reminder: ReminderOption;
  location?: string;
  meetingLink?: string;
  department?: string;
  isDeleted?: boolean;
  isTaskDeadline?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent extends CalendarEventBase {
  createdBy: {
    _id: string;
    id?: string;
    name: string;
    role: string;
    department?: string;
    profilePhoto?: string;
  };
  participants: EventParticipant[];
  relatedTask?: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    deadline: string;
    assignedTo?: any;
  } | null;
  relatedAnnouncement?: {
    _id: string;
    title: string;
  } | null;
}

/** Lightweight task-deadline virtual entries injected by the API */
export interface TaskDeadlineEntry extends CalendarEventBase {
  isTaskDeadline: true;
  taskId: string;
  priority: string;
  status: string;
  assignedTo?: {
    _id: string;
    name: string;
    role: string;
  };
}

export interface FestivalCalendarEntry extends CalendarEventBase {
  isFestival: true;
  festivalId?: string;
  festivalType?: 'NATIONAL_HOLIDAY' | 'FESTIVAL' | 'GAZETTED_HOLIDAY' | 'RESTRICTED_HOLIDAY';
  isHoliday?: boolean;
  icon?: string;
  festivalData?: any;
}

export type AnyCalendarEntry = CalendarEvent | TaskDeadlineEntry | FestivalCalendarEntry;

export function isTaskDeadline(entry: AnyCalendarEntry): entry is TaskDeadlineEntry {
  return (entry as any).isTaskDeadline === true;
}

export function isFestivalEntry(entry: AnyCalendarEntry): entry is FestivalCalendarEntry {
  return (entry as any).isFestival === true;
}

/** Form values for creating/editing an event */
export interface CalendarEventFormData {
  title: string;
  description: string;
  type: CalendarEventType;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  participants: string[]; // user IDs
  department: string;
  location: string;
  meetingLink: string;
  reminder: ReminderOption;
  visibility: EventVisibility;
  relatedTask?: string;
  relatedAnnouncement?: string;
}

/** Color mapping per event type */
export const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; border: string; text: string; dot: string }> = {
  MEETING: { bg: 'var(--cal-event-green-bg)', border: 'var(--cal-event-green-border)', text: 'var(--cal-event-green-text)', dot: 'var(--cal-event-green-dot)' },
  TASK_DEADLINE: { bg: 'var(--cal-event-purple-bg)', border: 'var(--cal-event-purple-border)', text: 'var(--cal-event-purple-text)', dot: 'var(--cal-event-purple-dot)' },
  REMINDER: { bg: 'var(--cal-event-gray-bg)', border: 'var(--cal-event-gray-border)', text: 'var(--cal-event-gray-text)', dot: 'var(--cal-event-gray-dot)' },
  CALL: { bg: 'var(--cal-event-green-bg)', border: 'var(--cal-event-green-border)', text: 'var(--cal-event-green-text)', dot: 'var(--cal-event-green-dot)' },
  FOLLOW_UP: { bg: 'var(--cal-event-yellow-bg)', border: 'var(--cal-event-yellow-border)', text: 'var(--cal-event-yellow-text)', dot: 'var(--cal-event-yellow-dot)' },
  COMPANY_EVENT: { bg: 'var(--cal-event-purple-bg)', border: 'var(--cal-event-purple-border)', text: 'var(--cal-event-purple-text)', dot: 'var(--cal-event-purple-dot)' },
  PERSONAL: { bg: 'var(--cal-event-gray-bg)', border: 'var(--cal-event-gray-border)', text: 'var(--cal-event-gray-text)', dot: 'var(--cal-event-gray-dot)' },
  FESTIVAL: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
  OTHER: { bg: 'var(--cal-event-gray-bg)', border: 'var(--cal-event-gray-border)', text: 'var(--cal-event-gray-text)', dot: 'var(--cal-event-gray-dot)' }
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  MEETING: 'Meeting',
  TASK_DEADLINE: 'Task Deadline',
  REMINDER: 'Reminder',
  CALL: 'Call',
  FOLLOW_UP: 'Follow-Up',
  COMPANY_EVENT: 'Company Event',
  PERSONAL: 'Personal',
  FESTIVAL: 'Festival / Holiday',
  OTHER: 'Other'
};

export const REMINDER_LABELS: Record<ReminderOption, string> = {
  NONE: 'No Reminder',
  AT_TIME: 'At event time',
  '5_MIN': '5 minutes before',
  '10_MIN': '10 minutes before',
  '15_MIN': '15 minutes before',
  '30_MIN': '30 minutes before',
  '1_HOUR': '1 hour before',
  '1_DAY': '1 day before'
};
