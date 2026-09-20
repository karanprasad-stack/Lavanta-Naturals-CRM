import mongoose, { Schema, Document, Types } from 'mongoose';

export type ProductCategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface IProductCategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  status: ProductCategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    image: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const ProductCategoryModel = mongoose.model<IProductCategory>(
  'ProductCategory',
  ProductCategorySchema
);
