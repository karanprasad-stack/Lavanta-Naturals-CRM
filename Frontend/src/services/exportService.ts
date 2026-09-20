import { apiClient } from './apiClient';

export const exportService = {
  /**
   * Download secure CSV export
   */
  async downloadExport(type: 'tasks' | 'team' | 'inventory' | 'orders' | 'expenses'): Promise<void> {
    const response = await apiClient.get(`/export/${type}`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lavanta_${type}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
