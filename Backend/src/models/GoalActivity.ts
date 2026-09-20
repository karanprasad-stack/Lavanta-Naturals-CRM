import mongoose, { Schema, Document, Types } from 'mongoose';
import './User.js';
import './Goal.js';

export type GoalActivityType =
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'GOAL_STARTED'
  | 'GOAL_COMPLETED'
  | 'GOAL_PAUSED'
  | 'OBJECTIVE_CREATED'
  | 'OBJECTIVE_UPDATED'
  | 'KEY_RESULT_CREATED'
  | 'KEY_RESULT_UPDATED'
  | 'PROGRESS_UPDATED'
  | 'GOAL_DEADLINE_CHANGED'
  | 'COMMENT_ADDED';

export interface IGoalActivity extends Document {
  _id: Types.ObjectId;
  goalId: Types.ObjectId;
  objectiveId?: Types.ObjectId | null;
  keyResultId?: Types.ObjectId | null;
  actorId: Types.ObjectId;
  type: GoalActivityType;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const GoalActivitySchema = new Schema(
  {
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    objectiveId: { type: Schema.Types.ObjectId, ref: 'Objective', default: null },
    keyResultId: { type: Schema.Types.ObjectId, ref: 'KeyResult', default: null },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'GOAL_CREATED',
        'GOAL_UPDATED',
        'GOAL_STARTED',
        'GOAL_COMPLETED',
        'GOAL_PAUSED',
        'OBJECTIVE_CREATED',
        'OBJECTIVE_UPDATED',
        'KEY_RESULT_CREATED',
        'KEY_RESULT_UPDATED',
        'PROGRESS_UPDATED',
        'GOAL_DEADLINE_CHANGED',
        'COMMENT_ADDED'
      ]
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

GoalActivitySchema.index({ goalId: 1, createdAt: -1 });

export const GoalActivityModel = mongoose.model<IGoalActivity>('GoalActivity', GoalActivitySchema);
