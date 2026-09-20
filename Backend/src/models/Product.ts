import mongoose, { Schema, Document, Types } from 'mongoose';

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ProductUnit =
  | 'PIECE'
  | 'BOX'
  | 'PACK'
  | 'KG'
  | 'GRAM'
  | 'LITRE'
  | 'ML'
  | 'BOTTLE'
  | 'OTHER';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: Types.ObjectId;
  brand: string;
  unit: ProductUnit;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
  images: string[];
  tags: string[];
  documentIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Virtual derived field
  stockStatus: StockStatus;
}

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Category is required'],
      index: true
    },
    brand: {
      type: String,
      default: 'Lavanta Naturals',
      trim: true
    },
    unit: {
      type: String,
      enum: ['PIECE', 'BOX', 'PACK', 'KG', 'GRAM', 'LITRE', 'ML', 'BOTTLE', 'OTHER'],
      default: 'PIECE'
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
      default: 0
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock quantity cannot be negative']
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative']
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    images: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    documentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Document'
      }
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual derived stockStatus
ProductSchema.virtual('stockStatus').get(function (this: IProduct) {
  if (this.stockQuantity <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (this.stockQuantity <= this.lowStockThreshold) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
});

// Indexes for high performance searches and filters
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
ProductSchema.index({ categoryId: 1, status: 1 });
ProductSchema.index({ stockQuantity: 1, lowStockThreshold: 1 });
ProductSchema.index({ createdAt: -1 });

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
