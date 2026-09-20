import { apiClient } from './apiClient';
import { FinanceSummary, FinanceTrendPoint, ExpenseBreakdownResponse } from '../types/finance';

export const financeService = {
  async getFinanceSummary(): Promise<FinanceSummary> {
    const res = await apiClient<{ success: boolean; data: FinanceSummary }>('/api/finance/summary');
    return res.data;
  },

  async getFinanceTrends(range: '7d' | '30d' | '90d' = '30d'): Promise<FinanceTrendPoint[]> {
    const res = await apiClient<{ success: boolean; data: { range: string; trends: FinanceTrendPoint[] } }>(
      `/api/finance/trends?range=${range}`
    );
    return res.data?.trends || [];
  },

  async getExpenseBreakdown(): Promise<ExpenseBreakdownResponse> {
    const res = await apiClient<{ success: boolean; data: ExpenseBreakdownResponse }>('/api/finance/expense-breakdown');
    return res.data;
  }
};
