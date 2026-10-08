import mongoose, { Schema, Document, Types } from 'mongoose';
import { EXPENSE_CHANNELS, ExpenseChannelType } from '../config/salesChannels.js';

export type ExpenseCategory =
  | 'MARKETPLACE_FEES'
  | 'PAYMENT_FEES'
  | 'SHIPPING'
  | 'PACKAGING'
  | 'MARKETING'
  | 'ADVERTISING'
  | 'OPERATIONS'
  | 'SALARY'
  | 'RENT'
  | 'UTILITIES'
  | 'SOFTWARE'
  | 'OFFICE'
  | 'TRAVEL'
  | 'SUPPLIES'
  | 'MAINTENANCE'
  | 'INVENTORY' // legacy compatibility
  | 'OTHER';

export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PAID';

export interface IExpenseReceipt {
  fileName: string;
  fileUrl: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
}

export interface IExpense extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  salesChannel: ExpenseChannelType; // Related Sales Channel: Website, Amazon, Flipkart, General
  submittedBy: Types.ObjectId;
  submittedAt?: Date | null;
  department: string;
  expenseDate: Date;
  status: ExpenseStatus;
  receipt?: IExpenseReceipt;
  paymentMethod?: string;
  paymentReference?: string;
  taxDeductible?: boolean;
  notes?: string;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  rejectedBy?: Types.ObjectId | null;
  rejectedAt?: Date | null;
  rejectionReason?: string;
  paidBy?: Types.ObjectId | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema = new Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, default: 0 }
  },
  { _id: false }
);

const ExpenseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: [
        'MARKETPLACE_FEES',
        'PAYMENT_FEES',
        'SHIPPING',
        'PACKAGING',
        'MARKETING',
        'ADVERTISING',
        'OPERATIONS',
        'SALARY',
        'RENT',
        'UTILITIES',
        'SOFTWARE',
        'OFFICE',
        'TRAVEL',
        'SUPPLIES',
        'MAINTENANCE',
        'INVENTORY',
        'OTHER'
      ],
      index: true
    },
    salesChannel: {
      type: String,
      enum: EXPENSE_CHANNELS,
      default: 'GENERAL',
      index: true
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PAID'],
      default: 'SUBMITTED',
      index: true
    },
    submittedAt: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      default: 'BANK_TRANSFER'
    },
    paymentReference: {
      type: String,
      default: ''
    },
    taxDeductible: {
      type: Boolean,
      default: false
    },
    receipt: {
      type: ReceiptSchema,
      default: null
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ExpenseSchema.index({ createdAt: -1 });
ExpenseSchema.index({ salesChannel: 1, status: 1 });
ExpenseSchema.index({ submittedBy: 1, status: 1 });
ExpenseSchema.index({ department: 1, status: 1 });

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema);
