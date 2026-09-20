export type CalendarEventType =
  | 'MEETING'
  | 'TASK_DEADLINE'
  | 'REMINDER'
  | 'CALL'
  | 'FOLLOW_UP'
  | 'COMPANY_EVENT'
  | 'PERSONAL'
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

export type AnyCalendarEntry = CalendarEvent | TaskDeadlineEntry;

export function isTaskDeadline(entry: AnyCalendarEntry): entry is TaskDeadlineEntry {
  return entry.isTaskDeadline === true;
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
  MEETING: { bg: '#EAF7E6', border: '#C4E9B7', text: '#377E1E', dot: '#69C43F' },
  TASK_DEADLINE: { bg: '#EDE9FE', border: '#C4B5FD', text: '#6D28D9', dot: '#8B5CF6' },
  REMINDER: { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569', dot: '#94A3B8' },
  CALL: { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', dot: '#22C55E' },
  FOLLOW_UP: { bg: '#FEF9C3', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
  COMPANY_EVENT: { bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6', dot: '#7C3AED' },
  PERSONAL: { bg: '#F8FAFC', border: '#E2E8F0', text: '#334155', dot: '#64748B' },
  OTHER: { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569', dot: '#94A3B8' }
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  MEETING: 'Meeting',
  TASK_DEADLINE: 'Task Deadline',
  REMINDER: 'Reminder',
  CALL: 'Call',
  FOLLOW_UP: 'Follow-Up',
  COMPANY_EVENT: 'Company Event',
  PERSONAL: 'Personal',
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
