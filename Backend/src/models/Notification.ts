import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_OVERDUE'
  | 'TASK_DEADLINE_APPROACHING'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'ANNOUNCEMENT_IMPORTANT'
  | 'SYSTEM'
  | 'TASK_STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'EVENT_INVITATION'
  | 'EVENT_UPDATED'
  | 'EVENT_CANCELLED'
  | 'EVENT_REMINDER'
  | 'GOAL_ASSIGNED'
  | 'OBJECTIVE_ASSIGNED'
  | 'KEY_RESULT_ASSIGNED'
  | 'GOAL_DEADLINE_APPROACHING'
  | 'GOAL_OVERDUE'
  | 'GOAL_COMPLETED'
  | 'GOAL_PROGRESS_UPDATED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_PUBLISHED'
  | 'DOCUMENT_UPDATED'
  | 'DOCUMENT_VERSION_UPDATED'
  | 'LOW_STOCK_ALERT'
  | 'OUT_OF_STOCK_ALERT'
  | 'STOCK_RESTOCKED'
  | 'STOCK_ADJUSTMENT'
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'EXPENSE_SUBMITTED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'EXPENSE_PAID';

export type RelatedEntityType =
  | 'TASK'
  | 'ANNOUNCEMENT'
  | 'SYSTEM'
  | 'EVENT'
  | 'GOAL'
  | 'OBJECTIVE'
  | 'DOCUMENT'
  | 'PRODUCT'
  | 'INVENTORY'
  | 'ORDER'
  | 'EXPENSE';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  recipient?: Types.ObjectId; // compatibility alias
  senderId?: Types.ObjectId | null;
  sender?: Types.ObjectId | null; // compatibility alias
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: RelatedEntityType;
  relatedEntityId?: Types.ObjectId | null;
  entityType?: RelatedEntityType; // compatibility alias
  entityId?: Types.ObjectId | null; // compatibility alias
  taskId?: Types.ObjectId | null; // compatibility alias
  isRead: boolean;
  read?: boolean; // compatibility alias
  readAt?: Date | null;
  createdAt: Date;
}

const NotificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      required: true,
      enum: [
        'TASK_ASSIGNED',
        'TASK_STARTED',
        'TASK_COMPLETED',
        'TASK_OVERDUE',
        'TASK_DEADLINE_APPROACHING',
        'ANNOUNCEMENT_PUBLISHED',
        'ANNOUNCEMENT_IMPORTANT',
        'SYSTEM',
        'TASK_STATUS_CHANGED',
        'COMMENT_ADDED',
        'EVENT_INVITATION',
        'EVENT_UPDATED',
        'EVENT_CANCELLED',
        'EVENT_REMINDER',
        'GOAL_ASSIGNED',
        'OBJECTIVE_ASSIGNED',
        'KEY_RESULT_ASSIGNED',
        'GOAL_DEADLINE_APPROACHING',
        'GOAL_OVERDUE',
        'GOAL_COMPLETED',
        'GOAL_PROGRESS_UPDATED',
        'DOCUMENT_SHARED',
        'DOCUMENT_PUBLISHED',
        'DOCUMENT_UPDATED',
        'DOCUMENT_VERSION_UPDATED',
        'LOW_STOCK_ALERT',
        'OUT_OF_STOCK_ALERT',
        'STOCK_RESTOCKED',
        'STOCK_ADJUSTMENT',
        'ORDER_CREATED',
        'ORDER_CONFIRMED',
        'ORDER_CANCELLED',
        'ORDER_SHIPPED',
        'ORDER_DELIVERED',
        'EXPENSE_SUBMITTED',
        'EXPENSE_APPROVED',
        'EXPENSE_REJECTED',
        'EXPENSE_PAID'
      ]
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    relatedEntityType: {
      type: String,
      enum: [
        'TASK',
        'ANNOUNCEMENT',
        'SYSTEM',
        'EVENT',
        'GOAL',
        'OBJECTIVE',
        'DOCUMENT',
        'PRODUCT',
        'INVENTORY',
        'ORDER',
        'EXPENSE'
      ],
      default: 'SYSTEM'
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases to maintain 100% backward compatibility
NotificationSchema.virtual('recipient').get(function () {
  return this.recipientId;
}).set(function (val) {
  this.recipientId = val;
});

NotificationSchema.virtual('sender').get(function () {
  return this.senderId;
}).set(function (val) {
  this.senderId = val;
});

NotificationSchema.virtual('read').get(function () {
  return this.isRead;
}).set(function (val) {
  this.isRead = val;
  if (val && !this.readAt) {
    this.readAt = new Date();
  }
});

NotificationSchema.virtual('taskId').get(function () {
  return this.relatedEntityType === 'TASK' ? this.relatedEntityId : null;
}).set(function (val) {
  if (val) {
    this.relatedEntityId = val;
    this.relatedEntityType = 'TASK';
  }
});

NotificationSchema.virtual('entityId').get(function () {
  return this.relatedEntityId;
}).set(function (val) {
  this.relatedEntityId = val;
});

NotificationSchema.virtual('entityType').get(function () {
  return this.relatedEntityType;
}).set(function (val) {
  this.relatedEntityType = val;
});

// Compound indexes for rapid lookup
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
