import mongoose, { Schema, Document, Types } from 'mongoose';
import { SALES_CHANNELS, SalesChannelType } from '../config/salesChannels.js';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'FAILED'
  | 'REFUNDED';

export type OrderSource =
  | 'WEBSITE'
  | 'MANUAL'
  | 'PHONE'
  | 'SOCIAL'
  | 'OTHER';

export interface IOrderItem {
  productId: Types.ObjectId;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string; // Internal CRM Order ID (e.g. CRM-000123 / LN-2026-...)
  externalOrderId?: string | null; // Platform Order ID (e.g. Amazon 403-..., Flipkart OD..., Website LVN-...)
  salesChannel: SalesChannelType; // WEBSITE, AMAZON, FLIPKART, etc.
  orderDate: Date;
  customerId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  marketplaceFee: number;
  grossAmount: number;
  netAmount: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status?: OrderStatus;
  source: OrderSource;
  notes?: string;
  cancelReason?: string;
  createdBy: Types.ObjectId;
  confirmedBy?: Types.ObjectId | null;
  cancelledBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productNameSnapshot: {
      type: String,
      required: true,
      trim: true
    },
    skuSnapshot: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    externalOrderId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    salesChannel: {
      type: String,
      required: [true, 'Sales channel is mandatory'],
      enum: SALES_CHANNELS,
      default: 'WEBSITE',
      index: true
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items && items.length > 0,
        message: 'Order must contain at least one product item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cannot be negative']
    },
    marketplaceFee: {
      type: Number,
      default: 0,
      min: [0, 'Marketplace fee cannot be negative']
    },
    grossAmount: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    orderStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED'
      ],
      default: 'PENDING',
      index: true
    },
    source: {
      type: String,
      enum: ['WEBSITE', 'MANUAL', 'PHONE', 'SOCIAL', 'OTHER'],
      default: 'MANUAL'
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancelReason: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for status compatibility
OrderSchema.virtual('status')
  .get(function () {
    return this.orderStatus;
  })
  .set(function (val: OrderStatus) {
    this.orderStatus = val;
  });

// Deduplication compound unique index: an external order ID can only exist once per sales channel
OrderSchema.index(
  { salesChannel: 1, externalOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalOrderId: { $type: 'string', $gt: '' }
    }
  }
);

// Secondary query indexes
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ orderStatus: 1, paymentStatus: 1 });
OrderSchema.index({ salesChannel: 1, orderStatus: 1 });
OrderSchema.index({ 'items.productId': 1 });

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
