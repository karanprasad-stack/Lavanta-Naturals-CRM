import mongoose, { Schema, Document, Types } from 'mongoose';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'ROLE_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_DELETED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_DELETED'
  | 'PRODUCT_CREATED'
  | 'STOCK_ADJUSTED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'PERMISSION_CHANGED'
  | 'EXPORT_GENERATED';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'FAILED_LOGIN',
        'USER_CREATED',
        'USER_UPDATED',
        'ROLE_CHANGED',
        'TASK_CREATED',
        'TASK_DELETED',
        'DOCUMENT_SHARED',
        'DOCUMENT_DELETED',
        'PRODUCT_CREATED',
        'STOCK_ADJUSTED',
        'ORDER_CONFIRMED',
        'ORDER_CANCELLED',
        'EXPENSE_APPROVED',
        'EXPENSE_REJECTED',
        'PERMISSION_CHANGED',
        'EXPORT_GENERATED'
      ]
    },
    entityType: {
      type: String,
      required: false,
      trim: true
    },
    entityId: {
      type: String,
      required: false,
      trim: true
    },
    ipAddress: {
      type: String,
      required: false,
      trim: true
    },
    userAgent: {
      type: String,
      required: false,
      trim: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// High-performance compound indexes for security queries and audit filtering
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
