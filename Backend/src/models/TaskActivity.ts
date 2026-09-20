import mongoose, { Schema, Document, Types } from 'mongoose';

export type TaskActivityType =
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_CANCELLED'
  | 'COMMENT_ADDED'
  | 'FILE_UPLOADED'
  | 'PROOF_UPLOADED'
  | 'DEADLINE_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'STATUS_CHANGED';

export interface ITaskActivity extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: TaskActivityType;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const TaskActivitySchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'TASK_CREATED',
        'TASK_ASSIGNED',
        'TASK_UPDATED',
        'TASK_STARTED',
        'TASK_COMPLETED',
        'TASK_CANCELLED',
        'COMMENT_ADDED',
        'FILE_UPLOADED',
        'PROOF_UPLOADED',
        'DEADLINE_CHANGED',
        'PRIORITY_CHANGED',
        'STATUS_CHANGED'
      ]
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

export const TaskActivityModel = mongoose.model<ITaskActivity>('TaskActivity', TaskActivitySchema);
