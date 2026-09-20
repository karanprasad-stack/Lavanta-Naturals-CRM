import mongoose, { Schema, Document, Types } from 'mongoose';
import './User.js';
import './Goal.js';

export type ObjectiveStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'AT_RISK' | 'PAUSED' | 'CANCELLED';

export interface IObjective extends Document {
  _id: Types.ObjectId;
  goalId: Types.ObjectId;
  title: string;
  description?: string;
  owner: Types.ObjectId;
  contributors: Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  status: ObjectiveStatus;
  progress: number; // 0 to 100
  weight: number; // 1 to 100, default 100 for equal weighting
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ObjectiveSchema = new Schema(
  {
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, default: '', trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contributors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
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
    weight: {
      type: Number,
      default: 100,
      min: 1
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ObjectiveSchema.index({ goalId: 1, status: 1 });
ObjectiveSchema.index({ owner: 1, status: 1 });

export const ObjectiveModel = mongoose.model<IObjective>('Objective', ObjectiveSchema);
