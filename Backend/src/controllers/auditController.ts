import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AuditLogModel } from '../models/AuditLog.js';

export const auditController = {
  /**
   * GET /api/audit
   * Paginated, filterable security audit logs
   */
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
      const skip = (page - 1) * limit;

      const { action, userId, entityType, startDate, endDate, search } = req.query;

      const filter: Record<string, any> = {};

      if (action) {
        filter.action = action;
      }

      if (userId) {
        filter.userId = userId;
      }

      if (entityType) {
        filter.entityType = entityType;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      if (search) {
        const regex = new RegExp((search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { entityId: regex },
          { entityType: regex },
          { ipAddress: regex },
          { action: regex }
        ];
      }

      const [logs, total] = await Promise.all([
        AuditLogModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'name email role department')
          .lean(),
        AuditLogModel.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        }
      });
    } catch (error) {
      console.error('[AuditController] Error querying audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs',
        error
      });
    }
  }
};
