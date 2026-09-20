import mongoose, { Schema, Document, Types } from 'mongoose';

export type ExpenseActivityType =
  | 'EXPENSE_CREATED'
  | 'EXPENSE_SUBMITTED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'EXPENSE_PAID'
  | 'EXPENSE_CANCELLED';

export interface IExpenseActivity extends Document {
  _id: Types.ObjectId;
  expenseId: Types.ObjectId;
  userId: Types.ObjectId;
  type: ExpenseActivityType;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ExpenseActivitySchema = new Schema(
  {
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: 'Expense',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'EXPENSE_CREATED',
        'EXPENSE_SUBMITTED',
        'EXPENSE_APPROVED',
        'EXPENSE_REJECTED',
        'EXPENSE_PAID',
        'EXPENSE_CANCELLED'
      ]
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
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

ExpenseActivitySchema.index({ expenseId: 1, createdAt: -1 });

export const ExpenseActivityModel = mongoose.model<IExpenseActivity>(
  'ExpenseActivity',
  ExpenseActivitySchema
);
