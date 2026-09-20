import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserModel } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { AnnouncementModel } from '../models/Announcement.js';
import { DocumentModel } from '../models/Document.js';
import { GoalModel } from '../models/Goal.js';
import { ProductModel } from '../models/Product.js';
import { OrderModel } from '../models/Order.js';

export const searchController = {
  /**
   * GET /api/search?q=...
   * Unified backend multi-entity search across people, tasks, announcements, docs, goals, products, orders
   */
  async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const rawQuery = (req.query.q as string) || '';
      const q = rawQuery.trim();

      if (!q || q.length < 2) {
        res.json({
          success: true,
          query: q,
          total: 0,
          results: {
            people: [],
            tasks: [],
            announcements: [],
            documents: [],
            goals: [],
            products: [],
            orders: []
          },
          items: []
        });
        return;
      }

      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const role = user.role.toUpperCase();
      const canViewCommerce = role === 'FOUNDER' || role === 'HR' || role === 'MANAGER';

      // Parallel database queries with lean projections and limits
      const [people, tasks, announcements, documents, goals, products, orders] = await Promise.all([
        // 1. People
        UserModel.find({
          status: 'ACTIVE',
          $or: [{ name: regex }, { email: regex }, { department: regex }, { designation: regex }]
        })
          .limit(8)
          .select('name email department designation profilePhoto role')
          .lean(),

        // 2. Tasks
        TaskModel.find({
          $or: [{ title: regex }, { description: regex }]
        })
          .limit(8)
          .select('title priority status dueDate')
          .lean(),

        // 3. Announcements
        AnnouncementModel.find({
          $or: [{ title: regex }, { content: regex }, { summary: regex }]
        })
          .limit(6)
          .select('title type priority createdAt')
          .lean(),

        // 4. Documents (scoped to permissions)
        DocumentModel.find({
          status: 'ACTIVE',
          $or: [{ title: regex }, { description: regex }, { tags: regex }],
          $and: [
            role === 'FOUNDER'
              ? {}
              : {
                  $or: [
                    { visibility: 'COMPANY' },
                    { visibility: 'DEPARTMENT', department: user.department },
                    { uploadedBy: user._id }
                  ]
                }
          ]
        })
          .limit(8)
          .select('title category fileType fileSize')
          .lean(),

        // 5. Goals
        GoalModel.find({
          $or: [{ title: regex }, { description: regex }]
        })
          .limit(6)
          .select('title category progress status')
          .lean(),

        // 6. Products
        ProductModel.find({
          status: { $ne: 'ARCHIVED' },
          $or: [{ name: regex }, { sku: regex }, { brand: regex }, { tags: regex }]
        })
          .limit(8)
          .select('name sku sellingPrice stockQuantity unit')
          .lean(),

        // 7. Orders (restricted to Management)
        canViewCommerce
          ? OrderModel.find({
              $or: [
                { orderNumber: regex },
                { 'items.productNameSnapshot': regex },
                { 'items.skuSnapshot': regex }
              ]
            })
              .limit(8)
              .select('orderNumber total orderStatus paymentStatus createdAt')
              .lean()
          : Promise.resolve([])
      ]);

      const flatItems: any[] = [];

      // Format People
      people.forEach(p => {
        flatItems.push({
          id: `person-${p._id}`,
          category: 'PEOPLE',
          title: p.name,
          subtitle: `${p.designation} • ${p.department}`,
          url: `/team/${p._id}`,
          icon: 'User'
        });
      });

      // Format Tasks
      tasks.forEach(t => {
        flatItems.push({
          id: `task-${t._id}`,
          category: 'TASKS',
          title: t.title,
          subtitle: `${t.priority} Priority • ${t.status}`,
          url: `/tasks/${t._id}`,
          icon: 'CheckSquare'
        });
      });

      // Format Products
      products.forEach(p => {
        flatItems.push({
          id: `prod-${p._id}`,
          category: 'PRODUCTS',
          title: p.name,
          subtitle: `${p.sku} • Stock: ${p.stockQuantity} • ₹${p.sellingPrice}`,
          url: `/products/${p._id}`,
          icon: 'Package'
        });
      });

      // Format Orders
      orders.forEach((o: any) => {
        flatItems.push({
          id: `order-${o._id}`,
          category: 'ORDERS',
          title: o.orderNumber,
          subtitle: `₹${o.total?.toLocaleString() || 0} • ${o.orderStatus} • ${o.paymentStatus}`,
          url: `/orders/${o._id}`,
          icon: 'ShoppingBag'
        });
      });

      // Format Documents
      documents.forEach(d => {
        flatItems.push({
          id: `doc-${d._id}`,
          category: 'DOCUMENTS',
          title: d.title,
          subtitle: `${d.category} • ${d.fileType}`,
          url: `/documents/${d._id}`,
          icon: 'FileText'
        });
      });

      // Format Goals
      goals.forEach(g => {
        flatItems.push({
          id: `goal-${g._id}`,
          category: 'GOALS',
          title: g.title,
          subtitle: `${g.type} Goal • ${g.progress}% Completed`,
          url: `/goals/${g._id}`,
          icon: 'Target'
        });
      });

      // Format Announcements
      announcements.forEach(a => {
        flatItems.push({
          id: `ann-${a._id}`,
          category: 'ANNOUNCEMENTS',
          title: a.title,
          subtitle: `${a.type} • ${a.priority} Priority`,
          url: `/announcements/${a._id}`,
          icon: 'Bell'
        });
      });

      res.json({
        success: true,
        query: q,
        total: flatItems.length,
        results: {
          people,
          tasks,
          announcements,
          documents,
          goals,
          products,
          orders
        },
        items: flatItems
      });
    } catch (error) {
      console.error('[SearchController] Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Search query failed',
        error
      });
    }
  }
};
