import mongoose, { Schema, Document, Types } from 'mongoose';
import './User.js';
import './Task.js';
import './Announcement.js';

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

export interface IEventParticipant {
  userId: Types.ObjectId;
  response: ParticipantResponse;
  respondedAt?: Date | null;
  notified?: boolean;
}

export interface ICalendarEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: CalendarEventType;
  startDateTime: Date;
  endDateTime?: Date | null;
  allDay: boolean;
  createdBy: Types.ObjectId;
  participants: IEventParticipant[];
  department?: string;
  location?: string;
  meetingLink?: string;
  reminder: ReminderOption;
  visibility: EventVisibility;
  relatedTask?: Types.ObjectId | null;
  relatedAnnouncement?: Types.ObjectId | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EventParticipantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    response: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE'],
      default: 'PENDING'
    },
    respondedAt: { type: Date, default: null },
    notified: { type: Boolean, default: false }
  },
  { _id: false }
);

const CalendarEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true },
    type: {
      type: String,
      required: true,
      enum: ['MEETING', 'TASK_DEADLINE', 'REMINDER', 'CALL', 'FOLLOW_UP', 'COMPANY_EVENT', 'PERSONAL', 'OTHER'],
      default: 'MEETING',
      index: true
    },
    startDateTime: { type: Date, required: true, index: true },
    endDateTime: { type: Date, default: null },
    allDay: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    participants: { type: [EventParticipantSchema], default: [] },
    department: { type: String, default: null },
    location: { type: String, default: '', trim: true },
    meetingLink: { type: String, default: '', trim: true },
    reminder: {
      type: String,
      enum: ['AT_TIME', '5_MIN', '10_MIN', '15_MIN', '30_MIN', '1_HOUR', '1_DAY', 'NONE'],
      default: 'NONE'
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'TEAM', 'COMPANY'],
      default: 'PRIVATE',
      index: true
    },
    relatedTask: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    relatedAnnouncement: { type: Schema.Types.ObjectId, ref: 'Announcement', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for fast calendar range queries
CalendarEventSchema.index({ startDateTime: 1, endDateTime: 1 });
CalendarEventSchema.index({ createdBy: 1, startDateTime: 1 });
CalendarEventSchema.index({ 'participants.userId': 1, startDateTime: 1 });
CalendarEventSchema.index({ relatedTask: 1 });
CalendarEventSchema.index({ visibility: 1, startDateTime: 1 });

export const CalendarEventModel = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
