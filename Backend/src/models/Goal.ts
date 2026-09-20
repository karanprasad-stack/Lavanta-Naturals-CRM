import mongoose, { Schema, Document, Types } from 'mongoose';
import './User.js';

export type GoalType = 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL';
export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'AT_RISK' | 'PAUSED' | 'CANCELLED';
export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IGoalComment {
  _id?: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IGoal extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: GoalType;
  owner: Types.ObjectId;
  department?: string;
  team?: string;
  startDate: Date;
  endDate: Date;
  status: GoalStatus;
  progress: number; // 0 to 100
  priority: GoalPriority;
  createdBy: Types.ObjectId;
  comments: IGoalComment[];
  relatedDocumentIds?: Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const GoalCommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null }
  },
  { _id: true }
);

const GoalSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL'],
      default: 'COMPANY',
      required: true,
      index: true
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: String, default: 'General', index: true },
    team: { type: String, default: 'Core' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'AT_RISK', 'PAUSED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [GoalCommentSchema],
    relatedDocumentIds: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
GoalSchema.index({ owner: 1, status: 1 });
GoalSchema.index({ department: 1, type: 1 });
GoalSchema.index({ endDate: 1, status: 1 });

export const GoalModel = mongoose.model<IGoal>('Goal', GoalSchema);
