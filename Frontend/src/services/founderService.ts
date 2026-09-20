import { apiClient } from './apiClient';
import { FounderOverviewResponse } from '../types/founder';

export const founderService = {
  /**
   * Fetch consolidated operational metrics for the Founder Command Center
   */
  async getOverview(): Promise<FounderOverviewResponse> {
    const res = await apiClient.get<{ success: boolean; data: FounderOverviewResponse }>('/founder/overview');
    return res.data.data;
  }
};
