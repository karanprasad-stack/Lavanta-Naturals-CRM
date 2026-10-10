import { apiClient, getAuthToken, buildApiUrl } from './apiClient';
import { Expense, ExpenseSummary, CreateExpenseInput } from '../types/expenses';

export interface GetExpensesParams {
  status?: string;
  category?: string;
  salesChannel?: string;
  department?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ExpensesResponse {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const expenseService = {
  async getExpenses(params: GetExpensesParams = {}): Promise<ExpensesResponse> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.salesChannel && params.salesChannel !== 'ALL') query.append('salesChannel', params.salesChannel);
    if (params.department && params.department !== 'ALL') query.append('department', params.department);
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = `/api/expenses${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient<{ success: boolean; data: Expense[]; pagination: ExpensesResponse['pagination'] }>(endpoint);
    return {
      data: res.data || [],
      pagination: res.pagination || { page: 1, limit: 20, total: res.data?.length || 0, pages: 1 }
    };
  },

  async getExpenseById(id: string): Promise<Expense> {
    const res = await apiClient<{ success: boolean; data: Expense }>(`/api/expenses/${id}`);
    return res.data;
  },

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const token = getAuthToken();

    if (input.receipt) {
      const formData = new FormData();
      formData.append('title', input.title);
      if (input.description) formData.append('description', input.description);
      formData.append('amount', input.amount.toString());
      formData.append('category', input.category);
      if (input.salesChannel) formData.append('salesChannel', input.salesChannel);
      if (input.expenseDate) formData.append('expenseDate', input.expenseDate);
      if (input.paymentMethod) formData.append('paymentMethod', input.paymentMethod);
      if (input.department) formData.append('department', input.department);
      if (input.taxDeductible !== undefined) formData.append('taxDeductible', input.taxDeductible.toString());
      if (input.notes) formData.append('notes', input.notes);
      if (input.status) formData.append('status', input.status);
      formData.append('receipt', input.receipt);

      const response = await fetch(buildApiUrl('/api/expenses'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit expense with receipt');
      return data.data;
    }

    const res = await apiClient<{ success: boolean; data: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return res.data;
  },

  async submitExpense(id: string): Promise<Expense> {
    const res = await apiClient<{ success: boolean; data: Expense }>(`/api/expenses/${id}/submit`, {
      method: 'POST'
    });
    return res.data;
  },

  async approveExpense(id: string): Promise<Expense> {
    const res = await apiClient<{ success: boolean; data: Expense }>(`/api/expenses/${id}/approve`, {
      method: 'POST'
    });
    return res.data;
  },

  async rejectExpense(id: string, rejectionReason: string): Promise<Expense> {
    const res = await apiClient<{ success: boolean; data: Expense }>(`/api/expenses/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason })
    });
    return res.data;
  },

  async payExpense(id: string, paymentReference?: string): Promise<Expense> {
    const res = await apiClient<{ success: boolean; data: Expense }>(`/api/expenses/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentReference })
    });
    return res.data;
  },

  async cancelExpense(id: string): Promise<Expense> {
    const res = await apiClient<{ success: boolean; data: Expense }>(`/api/expenses/${id}/cancel`, {
      method: 'POST'
    });
    return res.data;
  },

  async getExpenseSummary(): Promise<ExpenseSummary> {
    const res = await apiClient<{ success: boolean; data: ExpenseSummary }>('/api/expenses/summary');
    return res.data;
  }
};
