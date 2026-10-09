import { apiClient } from './apiClient';
import {
  SalesSummary,
  SalesTrendPoint,
  TopProduct,
  SalesByChannelResponse
} from '../types/sales';

export const salesService = {
  async getSalesSummary(
    range?: string,
    startDate?: string,
    endDate?: string
  ): Promise<SalesSummary> {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString();
    const res = await apiClient<{ success: boolean; data: SalesSummary }>(
      `/api/sales/summary${query ? `?${query}` : ''}`
    );
    return res.data;
  },

  async getSalesByChannel(
    range: string = 'all',
    startDate?: string,
    endDate?: string
  ): Promise<SalesByChannelResponse> {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString();
    const res = await apiClient<{ success: boolean; data: SalesByChannelResponse }>(
      `/api/sales/channels${query ? `?${query}` : ''}`
    );
    return res.data;
  },

  async getSalesTrends(
    range: string = '30d',
    channel?: string
  ): Promise<SalesTrendPoint[]> {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (channel && channel !== 'ALL') params.append('channel', channel);

    const query = params.toString();
    const res = await apiClient<{ success: boolean; data: { range: string; trends: SalesTrendPoint[] } }>(
      `/api/sales/trends${query ? `?${query}` : ''}`
    );
    return res.data?.trends || [];
  },

  async getTopProducts(
    limit: number = 5,
    channel?: string,
    range?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TopProduct[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (channel && channel !== 'ALL') params.append('channel', channel);
    if (range) params.append('range', range);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString();
    const res = await apiClient<{ success: boolean; data: TopProduct[] }>(
      `/api/sales/top-products${query ? `?${query}` : ''}`
    );
    return res.data || [];
  }
};
