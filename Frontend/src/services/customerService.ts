import { apiClient } from './apiClient';
import { Customer, CreateCustomerInput } from '../types/customer';

export const customerService = {
  async getCustomers(query?: string): Promise<Customer[]> {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await apiClient<{ success: boolean; data: Customer[] }>(`/api/customers${params}`);
    return res.data || [];
  },

  async getCustomerById(id: string): Promise<Customer> {
    const res = await apiClient<{ success: boolean; data: Customer }>(`/api/customers/${id}`);
    return res.data;
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const res = await apiClient<{ success: boolean; data: Customer }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return res.data;
  }
};
