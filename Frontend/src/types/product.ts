export type ProductCategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductCategory {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  status: ProductCategoryStatus;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface ProductItem {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: ProductCategory | string;
  brand: string;
  unit: ProductUnit;
  sellingPrice: number;
  costPrice: number;
  images: string[];
  tags: string[];
  documentIds?: Array<{
    _id: string;
    title: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    category?: string;
  }>;
  createdBy?: {
    _id: string;
    name: string;
    email?: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
}
