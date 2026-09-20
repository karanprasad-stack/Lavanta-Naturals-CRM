import { apiClient } from './apiClient';
import { GlobalSearchResponse } from '../types/search';

export const searchService = {
  /**
   * Search across people, tasks, announcements, documents, goals, products, and orders
   */
  async globalSearch(query: string): Promise<GlobalSearchResponse> {
    const res = await apiClient.get<GlobalSearchResponse>('/search', {
      params: { q: query }
    });
    return res.data;
  }
};
