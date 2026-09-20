import mongoose, { Schema, Document, Types } from 'mongoose';

export type ProductActivityAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_ARCHIVED'
  | 'STOCK_ADDED'
  | 'STOCK_REMOVED'
  | 'STOCK_ADJUSTED'
  | 'PRODUCT_LOW_STOCK'
  | 'PRODUCT_OUT_OF_STOCK';

export interface IProductActivity extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  action: ProductActivityAction;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ProductActivitySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'PRODUCT_CREATED',
        'PRODUCT_UPDATED',
        'PRODUCT_ARCHIVED',
        'STOCK_ADDED',
        'STOCK_REMOVED',
        'STOCK_ADJUSTED',
        'PRODUCT_LOW_STOCK',
        'PRODUCT_OUT_OF_STOCK'
      ],
      index: true
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

// Indexes
ProductActivitySchema.index({ productId: 1, createdAt: -1 });
ProductActivitySchema.index({ userId: 1, createdAt: -1 });

export const ProductActivityModel = mongoose.model<IProductActivity>(
  'ProductActivity',
  ProductActivitySchema
);
