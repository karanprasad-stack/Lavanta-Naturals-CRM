import mongoose, { Schema, Document, Types } from 'mongoose';

export type AnnouncementType = 'GENERAL' | 'EVENT' | 'MEETING' | 'IMPORTANT' | 'NOTICE';
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type AnnouncementTargetType = 'EVERYONE' | 'ROLE' | 'DEPARTMENT' | 'USERS';
export type AnnouncementStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface IAnnouncementAttachment {
  filename: string;
  fileType?: string;
  size?: number;
  url: string;
}

export interface IAnnouncement extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  createdBy: Types.ObjectId;
  targetType: AnnouncementTargetType;
  targetUsers: Types.ObjectId[];
  targetRoles: string[];
  targetDepartments: string[];
  posterImage?: string;
  attachments: IAnnouncementAttachment[];
  relatedDocumentId?: Types.ObjectId | null;
  relatedProductId?: Types.ObjectId | null;
  publishedAt: Date;
  expiresAt?: Date | null;
  status: AnnouncementStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema(
  {
    filename: { type: String, required: true },
    fileType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    url: { type: String, required: true }
  },
  { _id: false }
);

const AnnouncementSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    type: {
      type: String,
      enum: ['GENERAL', 'EVENT', 'MEETING', 'IMPORTANT', 'NOTICE'],
      default: 'GENERAL',
      required: true
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'URGENT'],
      default: 'NORMAL',
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['EVERYONE', 'ROLE', 'DEPARTMENT', 'USERS'],
      default: 'EVERYONE',
      required: true
    },
    targetUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    targetRoles: [{ type: String }],
    targetDepartments: [{ type: String }],
    posterImage: { type: String, default: '' },
    attachments: { type: [AttachmentSchema], default: [] },
    relatedDocumentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
    relatedProductId: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    publishedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for efficient query filtering on active announcements feed
AnnouncementSchema.index({ status: 1, publishedAt: -1 });
AnnouncementSchema.index({ expiresAt: 1, status: 1 });

export const AnnouncementModel = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
