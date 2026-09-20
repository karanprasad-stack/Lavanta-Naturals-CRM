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

export type ProductCatalogStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type StockStatusType = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

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
  stockQuantity: number;
  lowStockThreshold: number;
  status: ProductCatalogStatus;
  stockStatus: StockStatusType;
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

export interface InventoryMovementItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    sku: string;
    unit?: string;
    categoryId?: { _id: string; name: string };
    images?: string[];
    sellingPrice?: number;
    lowStockThreshold?: number;
  };
  type: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  performedBy: {
    _id: string;
    name: string;
    email?: string;
    role?: string;
  };
  createdAt: string;
}

export interface InventorySummaryStats {
  totalProducts: number;
  totalUnits: number;
  lowStock: number;
  outOfStock: number;
  inStock: number;
}

export interface InventoryTrendPoint {
  date: string;
  stockIn: number;
  stockOut: number;
  movementCount: number;
}
