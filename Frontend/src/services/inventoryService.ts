import { apiClient } from './apiClient';
import {
  ProductItem,
  InventoryMovementItem,
  InventorySummaryStats,
  InventoryTrendPoint,
  InventoryMovementType
} from '../types/inventory';

export interface GetInventoryParams {
  search?: string;
  category?: string;
  stockStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryResponse {
  inventory: ProductItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetHistoryParams {
  productId?: string;
  type?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface HistoryResponse {
  history: InventoryMovementItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const inventoryService = {
  /**
   * Get paginated inventory table
   */
  async getInventory(params: GetInventoryParams = {}): Promise<InventoryResponse> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.stockStatus) query.append('stockStatus', params.stockStatus);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/inventory?${queryString}` : '/api/inventory';
    const response = await apiClient<{ success: boolean; data: InventoryResponse }>(endpoint);
    return response.data;
  },

  /**
   * Legacy alias: getAllInventory
   */
  async getAllInventory(): Promise<any[]> {
    const res = await this.getInventory({ limit: 100 });
    return res.inventory.map(item => ({
      id: item._id,
      itemName: item.name,
      sku: item.sku,
      category: typeof item.categoryId === 'object' ? item.categoryId?.name : 'Finished Products',
      currentStock: item.stockQuantity,
      unit: item.unit,
      threshold: item.lowStockThreshold,
      supplier: item.brand || 'Lavanta Naturals',
      status: item.stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : item.stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'Healthy',
      lastUpdated: new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }));
  },

  /**
   * Get high-level inventory metrics
   */
  async getSummary(): Promise<InventorySummaryStats> {
    const response = await apiClient<{ success: boolean; data: InventorySummaryStats }>(
      '/api/inventory/summary'
    );
    return response.data;
  },

  /**
   * Get low-stock and out-of-stock products
   */
  async getLowStock(): Promise<ProductItem[]> {
    const response = await apiClient<{ success: boolean; data: ProductItem[] }>(
      '/api/inventory/low-stock'
    );
    return response.data;
  },

  /**
   * Get paginated inventory movements audit trail
   */
  async getHistory(params: GetHistoryParams = {}): Promise<HistoryResponse> {
    const query = new URLSearchParams();
    if (params.productId) query.append('productId', params.productId);
    if (params.type) query.append('type', params.type);
    if (params.performedBy) query.append('performedBy', params.performedBy);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = queryString ? `/api/inventory/history?${queryString}` : '/api/inventory/history';
    const response = await apiClient<{ success: boolean; data: HistoryResponse }>(endpoint);
    return response.data;
  },

  /**
   * Record standard inventory movement (Stock In, Stock Out, Returned, Transfers)
   */
  async recordMovement(payload: {
    productId: string;
    type: InventoryMovementType;
    quantity: number;
    reason: string;
    reference?: string;
    notes?: string;
  }): Promise<{ product: ProductItem; movement: InventoryMovementItem }> {
    const response = await apiClient<{
      success: boolean;
      data: { product: ProductItem; movement: InventoryMovementItem };
    }>('/api/inventory/movement', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.data;
  },

  /**
   * Record stock adjustment (physical audit, damage, loss, correction)
   */
  async recordAdjustment(payload: {
    productId: string;
    type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'DAMAGED' | 'LOST' | 'RETURNED';
    quantity: number;
    reason: string;
    notes?: string;
    reference?: string;
  }): Promise<{ product: ProductItem; movement: InventoryMovementItem }> {
    const response = await apiClient<{
      success: boolean;
      data: { product: ProductItem; movement: InventoryMovementItem };
    }>('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.data;
  },

  /**
   * Legacy adjustStock alias
   */
  async adjustStock(id: string, delta: number, actionReason: string = 'Manual Adjustment'): Promise<any> {
    const type = delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    const res = await this.recordAdjustment({
      productId: id,
      type,
      quantity: Math.abs(delta),
      reason: actionReason
    });
    return res.product;
  },

  /**
   * Get 7, 30, or 90 day inventory trends for Recharts
   */
  async getTrends(days: number = 30): Promise<InventoryTrendPoint[]> {
    const response = await apiClient<{ success: boolean; data: InventoryTrendPoint[] }>(
      `/api/inventory/trends?days=${days}`
    );
    return response.data;
  }
};
