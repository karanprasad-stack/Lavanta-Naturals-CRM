import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderActivityType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_REFUNDED'
  | 'PAYMENT_UPDATED';

export interface IOrderActivity extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  type: OrderActivityType;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const OrderActivitySchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
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
        'ORDER_CREATED',
        'ORDER_CONFIRMED',
        'ORDER_PROCESSING',
        'ORDER_SHIPPED',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED',
        'ORDER_REFUNDED',
        'PAYMENT_UPDATED'
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

OrderActivitySchema.index({ orderId: 1, createdAt: -1 });

export const OrderActivityModel = mongoose.model<IOrderActivity>(
  'OrderActivity',
  OrderActivitySchema
);
