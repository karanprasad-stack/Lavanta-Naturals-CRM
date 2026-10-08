import { apiClient } from './apiClient';
import { ProductItem, ProductCategory } from '../types/product';

export interface GetProductsParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  products: ProductItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const productService = {
  /**
   * Get paginated products list with filters and search
   */
  async getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';
    const response = await apiClient<{ success: boolean; data: ProductsResponse }>(endpoint);
    return response.data;
  },

  /**
   * Legacy alias: get all products
   */
  async getAllProducts(): Promise<any[]> {
    const res = await this.getProducts({ limit: 100 });
    return res.products.map(p => ({
      ...p,
      id: p._id,
      category: typeof p.categoryId === 'object' ? p.categoryId?.name : 'Skincare',
      mrp: p.sellingPrice,
      cost: p.costPrice
    }));
  },

  /**
   * Get single product by ID or slug with recent activity
   */
  async getProductById(id: string): Promise<{
    product: ProductItem;
    recentActivities: any[];
  }> {
    const response = await apiClient<{
      success: boolean;
      data: {
        product: ProductItem;
        recentActivities: any[];
      };
    }>(`/api/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product
   */
  async createProduct(payload: {
    name: string;
    sku: string;
    description?: string;
    categoryId: string;
    brand?: string;
    unit?: string;
    sellingPrice: number;
    costPrice?: number;
    tags?: string[];
    images?: string[];
    documentIds?: string[];
  }): Promise<ProductItem> {
    const response = await apiClient<{ success: boolean; data: ProductItem }>(
      '/api/products',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
    return response.data;
  },

  /**
   * Update product metadata
   */
  async updateProduct(
    id: string,
    payload: Partial<{
      name: string;
      sku: string;
      description: string;
      categoryId: string;
      brand: string;
      unit: string;
      sellingPrice: number;
      costPrice: number;
      tags: string[];
      images: string[];
      documentIds: string[];
    }>
  ): Promise<ProductItem> {
    const response = await apiClient<{ success: boolean; data: ProductItem }>(
      `/api/products/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }
    );
    return response.data;
  },

  /**
   * Archive or delete product
   */
  async deleteProduct(id: string): Promise<{
    success: boolean;
    message: string;
    action: 'ARCHIVED' | 'DELETED';
    data?: ProductItem;
  }> {
    return apiClient(`/api/products/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get product categories
   */
  async getCategories(includeCounts: boolean = true): Promise<ProductCategory[]> {
    const response = await apiClient<{ success: boolean; data: ProductCategory[] }>(
      `/api/product-categories?includeCounts=${includeCounts}`
    );
    return response.data;
  },

  /**
   * Create product category
   */
  async createCategory(payload: {
    name: string;
    description?: string;
    image?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<ProductCategory> {
    const response = await apiClient<{ success: boolean; data: ProductCategory }>(
      '/api/product-categories',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
    return response.data;
  }
};
