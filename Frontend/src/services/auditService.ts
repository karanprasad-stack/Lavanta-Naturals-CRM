import { apiClient } from './apiClient';
import { AuditLogsResponse, GetAuditLogsParams } from '../types/audit';

export const auditService = {
  /**
   * Query paginated security audit logs
   */
  async getAuditLogs(params?: GetAuditLogsParams): Promise<AuditLogsResponse> {
    const res = await apiClient.get<AuditLogsResponse>('/audit', { params });
    return res.data;
  }
};
