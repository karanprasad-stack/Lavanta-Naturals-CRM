export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'ROLE_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_DELETED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_DELETED'
  | 'PRODUCT_CREATED'
  | 'STOCK_ADJUSTED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'PERMISSION_CHANGED'
  | 'EXPORT_GENERATED';

export interface AuditLogItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  };
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
