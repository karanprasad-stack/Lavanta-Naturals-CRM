import { TaskActivityModel } from '../models/TaskActivity.js';
import { DocumentActivityModel } from '../models/DocumentActivity.js';
import { ProductActivityModel } from '../models/ProductActivity.js';
import { OrderActivityModel } from '../models/OrderActivity.js';
import { ExpenseActivityModel } from '../models/ExpenseActivity.js';
import { GoalActivityModel } from '../models/GoalActivity.js';
import '../models/index.js';
import { IUser } from '../models/User.js';

export interface UnifiedActivityItem {
  id: string;
  type: string;
  action: string;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
    department?: string;
    role?: string;
  };
  entity: string;
  entityType: 'TASK' | 'DOCUMENT' | 'PRODUCT' | 'ORDER' | 'EXPENSE' | 'GOAL';
  entityId: string;
  message: string;
  link: string;
  timestamp: string;
}

export async function getUnifiedActivities(limit = 25): Promise<UnifiedActivityItem[]> {
  try {
    const [tasks, docs, products, orders, expenses, goals]: any[] = await Promise.all([
      TaskActivityModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('actorId', 'name profilePhoto department role')
        .populate('taskId', 'title')
        .lean(),

      DocumentActivityModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name profilePhoto department role')
        .populate('documentId', 'title')
        .lean(),

      ProductActivityModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name profilePhoto department role')
        .populate('productId', 'name sku')
        .lean(),

      OrderActivityModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name profilePhoto department role')
        .populate('orderId', 'orderNumber total')
        .lean(),

      ExpenseActivityModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name profilePhoto department role')
        .populate('expenseId', 'title amount category')
        .lean(),

      GoalActivityModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('actorId', 'name profilePhoto department role')
        .populate('goalId', 'title progress')
        .lean()
    ]);

    const items: UnifiedActivityItem[] = [];

    // Map Task activities
    for (const t of tasks) {
      const user = t.actorId as unknown as IUser;
      const task = t.taskId as any;
      if (!user) continue;
      const entityTitle = task?.title || 'Task';
      items.push({
        id: `task-${t._id}`,
        type: 'TASK_ACTIVITY',
        action: t.type,
        user: {
          id: user._id?.toString() || '',
          name: user.name || 'Team Member',
          profilePhoto: user.profilePhoto,
          department: user.department,
          role: user.role
        },
        entity: entityTitle,
        entityType: 'TASK',
        entityId: task?._id?.toString() || t.taskId?.toString() || '',
        message: t.message || `${user.name} updated task "${entityTitle}"`,
        link: `/tasks/${task?._id || t.taskId}`,
        timestamp: t.createdAt.toISOString()
      });
    }

    // Map Document activities
    for (const d of docs) {
      const user = d.userId as unknown as IUser;
      const doc = d.documentId as any;
      if (!user) continue;
      const entityTitle = doc?.title || 'Document';
      items.push({
        id: `doc-${d._id}`,
        type: 'DOCUMENT_ACTIVITY',
        action: d.type,
        user: {
          id: user._id?.toString() || '',
          name: user.name || 'Team Member',
          profilePhoto: user.profilePhoto,
          department: user.department,
          role: user.role
        },
        entity: entityTitle,
        entityType: 'DOCUMENT',
        entityId: doc?._id?.toString() || d.documentId?.toString() || '',
        message: `${user.name} ${d.type.toLowerCase().replace('document_', '').replace('_', ' ')} "${entityTitle}"`,
        link: `/documents/${doc?._id || d.documentId}`,
        timestamp: d.createdAt.toISOString()
      });
    }

    // Map Product activities
    for (const p of products) {
      const user = p.userId as unknown as IUser;
      const prod = p.productId as any;
      if (!user) continue;
      const entityTitle = prod?.name || prod?.sku || 'Product';
      items.push({
        id: `prod-${p._id}`,
        type: 'PRODUCT_ACTIVITY',
        action: p.action,
        user: {
          id: user._id?.toString() || '',
          name: user.name || 'Staff',
          profilePhoto: user.profilePhoto,
          department: user.department,
          role: user.role
        },
        entity: entityTitle,
        entityType: 'PRODUCT',
        entityId: prod?._id?.toString() || p.productId?.toString() || '',
        message: `${user.name} performed ${p.action.toLowerCase().replace('_', ' ')} on "${entityTitle}"`,
        link: `/products/${prod?._id || p.productId}`,
        timestamp: p.createdAt.toISOString()
      });
    }

    // Map Order activities
    for (const o of orders) {
      const user = o.userId as unknown as IUser;
      const order = o.orderId as any;
      if (!user) continue;
      const entityTitle = order?.orderNumber || 'Sales Order';
      items.push({
        id: `ord-${o._id}`,
        type: 'ORDER_ACTIVITY',
        action: o.type,
        user: {
          id: user._id?.toString() || '',
          name: user.name || 'Commercial Team',
          profilePhoto: user.profilePhoto,
          department: user.department,
          role: user.role
        },
        entity: entityTitle,
        entityType: 'ORDER',
        entityId: order?._id?.toString() || o.orderId?.toString() || '',
        message: `${user.name} processed order "${entityTitle}" (${o.type.toLowerCase().replace('order_', '')})`,
        link: `/orders/${order?._id || o.orderId}`,
        timestamp: o.createdAt.toISOString()
      });
    }

    // Map Expense activities
    for (const e of expenses) {
      const user = e.userId as unknown as IUser;
      const exp = e.expenseId as any;
      if (!user) continue;
      const entityTitle = exp?.title || 'Expense';
      items.push({
        id: `exp-${e._id}`,
        type: 'EXPENSE_ACTIVITY',
        action: e.type,
        user: {
          id: user._id?.toString() || '',
          name: user.name || 'Finance Team',
          profilePhoto: user.profilePhoto,
          department: user.department,
          role: user.role
        },
        entity: entityTitle,
        entityType: 'EXPENSE',
        entityId: exp?._id?.toString() || e.expenseId?.toString() || '',
        message: `${user.name} updated expense "${entityTitle}" (${e.type.toLowerCase().replace('expense_', '')})`,
        link: `/expenses/${exp?._id || e.expenseId}`,
        timestamp: e.createdAt.toISOString()
      });
    }

    // Map Goal activities
    for (const g of goals) {
      const user = g.actorId as unknown as IUser;
      const goal = g.goalId as any;
      if (!user) continue;
      const entityTitle = goal?.title || 'Goal';
      items.push({
        id: `goal-${g._id}`,
        type: 'GOAL_ACTIVITY',
        action: g.type,
        user: {
          id: user._id?.toString() || '',
          name: user.name || 'Strategy Team',
          profilePhoto: user.profilePhoto,
          department: user.department,
          role: user.role
        },
        entity: entityTitle,
        entityType: 'GOAL',
        entityId: goal?._id?.toString() || g.goalId?.toString() || '',
        message: g.message || `${user.name} updated goal "${entityTitle}"`,
        link: `/goals/${goal?._id || g.goalId}`,
        timestamp: g.createdAt.toISOString()
      });
    }

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items.slice(0, limit);
  } catch (error) {
    console.error('[UnifiedActivityService] Failed to aggregate activities:', error);
    return [];
  }
}

export const unifiedActivityService = {
  getRecentActivities: getUnifiedActivities
};
