import { apiClient } from './apiClient';
import { SalesSummary, SalesTrendPoint, TopProduct } from '../types/sales';

export const salesService = {
  async getSalesSummary(): Promise<SalesSummary> {
    const res = await apiClient<{ success: boolean; data: SalesSummary }>('/api/sales/summary');
    return res.data;
  },

  async getSalesTrends(range: '7d' | '30d' | '90d' = '30d'): Promise<SalesTrendPoint[]> {
    const res = await apiClient<{ success: boolean; data: { range: string; trends: SalesTrendPoint[] } }>(
      `/api/sales/trends?range=${range}`
    );
    return res.data?.trends || [];
  },

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const res = await apiClient<{ success: boolean; data: TopProduct[] }>(
      `/api/sales/top-products?limit=${limit}`
    );
    return res.data || [];
  }
};
