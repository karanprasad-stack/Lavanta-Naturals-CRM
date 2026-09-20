import mongoose, { Schema, Document, Types } from 'mongoose';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';

export interface ITaskComment {
  _id?: Types.ObjectId;
  author: Types.ObjectId;
  message: string;
  createdAt: Date;
}

export interface ITaskAttachment {
  _id?: Types.ObjectId;
  filename: string;
  fileType: string;
  size: number;
  url: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface ITaskProofOfWork {
  _id?: Types.ObjectId;
  filename: string;
  fileType: string;
  size: number;
  url: string;
  comment?: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  assignedTo: Types.ObjectId;
  assignedBy: Types.ObjectId;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: Date;
  assignedAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  comments: ITaskComment[];
  attachments: ITaskAttachment[];
  proofOfWork: ITaskProofOfWork[];
  goalId?: Types.ObjectId | null;
  objectiveId?: Types.ObjectId | null;
  keyResultId?: Types.ObjectId | null;
  relatedDocumentId?: Types.ObjectId | null;
  relatedProductId?: Types.ObjectId | null;
  isOverdue?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const TaskAttachmentSchema = new Schema(
  {
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const TaskProofOfWorkSchema = new Schema(
  {
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    comment: { type: String, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: String, default: 'General', index: true },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'],
      default: 'TODO',
      index: true
    },
    deadline: { type: Date, required: true, index: true },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    comments: [TaskCommentSchema],
    attachments: [TaskAttachmentSchema],
    proofOfWork: [TaskProofOfWorkSchema],
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null, index: true },
    objectiveId: { type: Schema.Types.ObjectId, ref: 'Objective', default: null, index: true },
    keyResultId: { type: Schema.Types.ObjectId, ref: 'KeyResult', default: null, index: true },
    relatedDocumentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null, index: true },
    relatedProductId: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for dynamic overdue calculation
TaskSchema.virtual('isOverdue').get(function (this: ITask) {
  if (!this.deadline) return false;
  const isPast = new Date(this.deadline).getTime() < Date.now();
  return isPast && this.status !== 'COMPLETED' && this.status !== 'CANCELLED';
});

export const TaskModel = mongoose.model<ITask>('Task', TaskSchema);
