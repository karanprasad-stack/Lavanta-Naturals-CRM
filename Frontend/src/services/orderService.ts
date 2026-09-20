import { apiClient } from './apiClient';
import { Order, OrderStatus, PaymentStatus, CreateOrderInput } from '../types/sales';

export interface GetOrdersParams {
  orderStatus?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const orderService = {
  async getOrders(params: GetOrdersParams = {}): Promise<OrdersResponse> {
    const query = new URLSearchParams();
    if (params.orderStatus && params.orderStatus !== 'ALL') query.append('orderStatus', params.orderStatus);
    if (params.paymentStatus && params.paymentStatus !== 'ALL') query.append('paymentStatus', params.paymentStatus);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const queryString = query.toString();
    const endpoint = `/api/orders${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient<{ success: boolean; data: Order[]; pagination: OrdersResponse['pagination'] }>(endpoint);
    return {
      data: res.data || [],
      pagination: res.pagination || { page: 1, limit: 20, total: res.data?.length || 0, pages: 1 }
    };
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await apiClient<{ success: boolean; data: Order }>(`/api/orders/${id}`);
    return res.data;
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const res = await apiClient<{ success: boolean; data: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return res.data;
  },

  async confirmOrder(id: string): Promise<Order> {
    const res = await apiClient<{ success: boolean; data: Order }>(`/api/orders/${id}/confirm`, {
      method: 'POST'
    });
    return res.data;
  },

  async cancelOrder(id: string, cancelReason?: string): Promise<Order> {
    const res = await apiClient<{ success: boolean; data: Order }>(`/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason })
    });
    return res.data;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const res = await apiClient<{ success: boolean; data: Order }>(`/api/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    return res.data;
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    const res = await apiClient<{ success: boolean; data: Order }>(`/api/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus })
    });
    return res.data;
  }
};
