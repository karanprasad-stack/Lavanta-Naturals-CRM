import mongoose, { Schema, Document, Types } from 'mongoose';

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
  images: string[];
  tags: string[];
  documentIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.stockQuantity;
        delete ret.lowStockThreshold;
        delete ret.status;
        delete ret.stockStatus;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.stockQuantity;
        delete ret.lowStockThreshold;
        delete ret.status;
        delete ret.stockStatus;
        return ret;
      }
    }
  }
);

// Indexes for high performance searches and filters
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
ProductSchema.index({ createdAt: -1 });

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
