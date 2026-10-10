import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TaskModel } from '../models/Task.js';
import { UserModel } from '../models/User.js';
import { ProductModel } from '../models/Product.js';
import { OrderModel } from '../models/Order.js';
import { ExpenseModel } from '../models/Expense.js';
import { logAuditEvent } from '../utils/auditLogger.js';

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\n');
}

export const exportController = {
  /**
   * GET /api/export/:type
   * Generates and downloads secure CSV export with mandatory security audit logging
   */
  async exportData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const user = req.user!;
      const role = user.role.toUpperCase();

      let headers: string[] = [];
      let rows: (string | number)[][] = [];

      switch (type) {
        case 'tasks': {
          const tasks = await TaskModel.find()
            .populate('assignedTo', 'name email')
            .populate('assignees', 'name email')
            .sort({ createdAt: -1 })
            .lean();

          headers = ['Task Title', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Created At'];
          rows = tasks.map((t: any) => [
            t.title,
            t.status,
            t.priority,
            t.assignees && t.assignees.length > 0
              ? t.assignees.map((a: any) => a.name).join(', ')
              : t.assignedTo?.name || 'Unassigned',
            t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : (t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''),
            new Date(t.createdAt).toISOString().split('T')[0]
          ]);
          break;
        }

        case 'team': {
          if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER') {
            res.status(403).json({ success: false, message: 'Unauthorized to export team directory' });
            return;
          }

          const members = await UserModel.find().sort({ name: 1 }).lean();
          headers = ['Name', 'Email', 'Role', 'Department', 'Designation', 'Status', 'Joining Date'];
          rows = members.map(m => [
            m.name,
            m.email,
            m.role,
            m.department,
            m.designation,
            m.status,
            m.joiningDate
          ]);
          break;
        }

        case 'products':
        case 'inventory': {
          const products = await ProductModel.find()
            .sort({ name: 1 })
            .lean();

          headers = ['Product Name', 'SKU', 'Unit', 'Selling Price', 'Cost Price', 'Description'];
          rows = products.map(p => [
            p.name,
            p.sku,
            p.unit,
            p.sellingPrice,
            p.costPrice || 0,
            p.description || ''
          ]);
          break;
        }

        case 'orders': {
          if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER') {
            res.status(403).json({ success: false, message: 'Unauthorized to export commercial orders' });
            return;
          }

          const orders = await OrderModel.find()
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

          headers = ['Order Number', 'External Order ID', 'Sales Channel', 'Customer', 'Customer Email', 'Items Count', 'Subtotal', 'Tax', 'Shipping', 'Total', 'Order Status', 'Payment Status', 'Date'];
          rows = orders.map((o: any) => [
            o.orderNumber,
            o.externalOrderId || '',
            o.salesChannel || 'WEBSITE',
            o.customerId?.name || '',
            o.customerId?.email || '',
            o.items?.length || 0,
            o.subtotal || 0,
            o.tax || 0,
            o.shipping || 0,
            o.total || 0,
            o.orderStatus,
            o.paymentStatus,
            new Date(o.createdAt).toISOString().split('T')[0]
          ]);
          break;
        }

        case 'expenses': {
          if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER') {
            res.status(403).json({ success: false, message: 'Unauthorized to export expense register' });
            return;
          }

          const expenses = await ExpenseModel.find()
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

          headers = ['Expense Title', 'Amount', 'Category', 'Sales Channel', 'Department', 'Status', 'Submitted By', 'Payment Method', 'Date'];
          rows = expenses.map((e: any) => [
            e.title,
            e.amount,
            e.category,
            e.salesChannel || 'GENERAL',
            e.department,
            e.status,
            e.submittedBy?.name || '',
            e.paymentMethod || '',
            e.expenseDate ? new Date(e.expenseDate).toISOString().split('T')[0] : ''
          ]);
          break;
        }

        default:
          res.status(400).json({ success: false, message: `Unsupported export type: ${type}` });
          return;
      }

      const csvContent = toCSV(headers, rows);

      // Audit the sensitive export operation
      await logAuditEvent(req, {
        action: 'EXPORT_GENERATED',
        entityType: 'EXPORT',
        metadata: {
          exportType: type,
          recordCount: rows.length
        }
      });

      const filename = `lavanta_${type}_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error('[ExportController] Export generation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate export file',
        error
      });
    }
  }
};
