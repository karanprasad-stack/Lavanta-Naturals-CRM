import mongoose, { Schema, Document, Types } from 'mongoose';

export type InventoryMovementType =
  | 'OPENING_STOCK'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'DAMAGED'
  | 'LOST'
  | 'RETURNED'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export interface IInventoryMovement extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  type: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}

const InventoryMovementSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Movement type is required'],
      enum: [
        'OPENING_STOCK',
        'STOCK_IN',
        'STOCK_OUT',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'DAMAGED',
        'LOST',
        'RETURNED',
        'TRANSFER_IN',
        'TRANSFER_OUT'
      ],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: [0, 'Previous quantity cannot be negative']
    },
    newQuantity: {
      type: Number,
      required: true,
      min: [0, 'New quantity cannot be negative']
    },
    reason: {
      type: String,
      required: [true, 'Reason is required for inventory movements'],
      trim: true
    },
    reference: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by user is required'],
      index: true
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

// Indexes
InventoryMovementSchema.index({ productId: 1, createdAt: -1 });
InventoryMovementSchema.index({ type: 1, createdAt: -1 });
InventoryMovementSchema.index({ performedBy: 1, createdAt: -1 });

export const InventoryMovementModel = mongoose.model<IInventoryMovement>(
  'InventoryMovement',
  InventoryMovementSchema
);
