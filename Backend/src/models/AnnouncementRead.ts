import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnnouncementRead extends Document {
  announcementId: Types.ObjectId;
  userId: Types.ObjectId;
  readAt: Date;
}

const AnnouncementReadSchema: Schema = new Schema(
  {
    announcementId: {
      type: Schema.Types.ObjectId,
      ref: 'Announcement',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound unique index ensuring idempotent read tracking:
// Opening an announcement multiple times never creates duplicate read records.
AnnouncementReadSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

export const AnnouncementReadModel = mongoose.model<IAnnouncementRead>(
  'AnnouncementRead',
  AnnouncementReadSchema
);
