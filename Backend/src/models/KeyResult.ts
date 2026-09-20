import mongoose, { Schema, Document, Types } from 'mongoose';
import './User.js';
import './Objective.js';
import './Goal.js';

export type MetricType = 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'BOOLEAN' | 'COUNT';
export type KeyResultStatus = 'ON_TRACK' | 'AT_RISK' | 'COMPLETED' | 'BEHIND';

export interface IKeyResult extends Document {
  _id: Types.ObjectId;
  objectiveId: Types.ObjectId;
  goalId: Types.ObjectId;
  title: string;
  description?: string;
  metricType: MetricType;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number; // 0 to 100
  owner: Types.ObjectId;
  deadline: Date;
  status: KeyResultStatus;
  createdAt: Date;
  updatedAt: Date;
}

const KeyResultSchema = new Schema(
  {
    objectiveId: { type: Schema.Types.ObjectId, ref: 'Objective', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, default: '', trim: true },
    metricType: {
      type: String,
      enum: ['NUMBER', 'PERCENTAGE', 'CURRENCY', 'BOOLEAN', 'COUNT'],
      default: 'NUMBER',
      required: true
    },
    startValue: { type: Number, default: 0 },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: '', trim: true },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deadline: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ON_TRACK', 'AT_RISK', 'COMPLETED', 'BEHIND'],
      default: 'ON_TRACK',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

KeyResultSchema.index({ objectiveId: 1, status: 1 });
KeyResultSchema.index({ owner: 1, deadline: 1 });

export const KeyResultModel = mongoose.model<IKeyResult>('KeyResult', KeyResultSchema);
