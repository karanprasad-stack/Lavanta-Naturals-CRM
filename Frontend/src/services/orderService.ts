import { apiClient } from './apiClient';
import { Order, OrderStatus, PaymentStatus, CreateOrderInput } from '../types/sales';

export interface GetOrdersParams {
  salesChannel?: string;
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
    if (params.salesChannel && params.salesChannel !== 'ALL') query.append('salesChannel', params.salesChannel);
    if (params.orderStatus && params.orderStatus !== 'ALL') query.append('orderStatus', params.orderStatus);
    if (params.paymentStatus && params.paymentStatus !== 'ALL') query.append('paymentStatus', params.paymentStatus);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const queryString = query.toString();
    const endpoint = `/api/orders${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient<any>(endpoint);

    // Support both { success: true, data: { orders: [...], pagination: {...} } } and flat arrays
    const rawOrders: Order[] = Array.isArray(res?.data?.orders)
      ? res.data.orders
      : Array.isArray(res?.data)
      ? res.data
      : [];

    const rawPagination = res?.data?.pagination || res?.pagination || {
      page: 1,
      limit: 25,
      total: rawOrders.length,
      pages: Math.ceil(rawOrders.length / 25) || 1
    };

    return {
      data: rawOrders,
      pagination: {
        page: rawPagination.page || 1,
        limit: rawPagination.limit || 25,
        total: rawPagination.total !== undefined ? rawPagination.total : rawOrders.length,
        pages: rawPagination.totalPages || rawPagination.pages || 1
      }
    };
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await apiClient<{ success: boolean; data: any }>(`/api/orders/${id}`);
    return res?.data?.order || res?.data;
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
