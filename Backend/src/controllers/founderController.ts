import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserModel } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { GoalModel } from '../models/Goal.js';
import { ProductModel } from '../models/Product.js';
import { OrderModel } from '../models/Order.js';
import { CustomerModel } from '../models/Customer.js';
import { ExpenseModel } from '../models/Expense.js';
import { AnnouncementModel } from '../models/Announcement.js';
import '../models/index.js';
import { getUnifiedActivities } from '../services/unifiedActivityService.js';

export const founderController = {
  /**
   * GET /api/founder/overview
   * Consolidated operational cockpit data for the Founder Command Center
   */
  async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Execute primary aggregate queries in parallel
      const [
        totalMembers,
        userRoleCounts,
        recentJoiners,
        allTasks,
        activeGoalsData,
        productsData,
        ordersData,
        expensesData,
        announcements,
        recentActivity
      ] = await Promise.all([
        // 1. Team stats
        UserModel.countDocuments({ status: 'ACTIVE' }),
        UserModel.aggregate([
          { $match: { status: 'ACTIVE' } },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        UserModel.find({ status: 'ACTIVE' })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name role department designation profilePhoto joiningDate')
          .lean(),

        // 2. Task metrics
        TaskModel.find().populate('assignedTo', 'name profilePhoto department role').lean(),

        // 3. Goal metrics
        GoalModel.find().select('title type status progress endDate').lean(),

        // 4. Product / Inventory metrics
        ProductModel.find({ status: { $ne: 'ARCHIVED' } })
          .select('name sku stockQuantity lowStockThreshold sellingPrice categoryId status')
          .lean(),

        // 5. Order metrics
        OrderModel.find()
          .sort({ createdAt: -1 })
          .populate('customerId', 'name email phone')
          .lean(),

        // 6. Expense metrics
        ExpenseModel.find()
          .sort({ createdAt: -1 })
          .populate('submittedBy', 'name profilePhoto department')
          .lean(),

        // 7. Latest Announcements
        AnnouncementModel.find()
          .sort({ createdAt: -1 })
          .limit(4)
          .select('title type priority targetType targetRoles targetDepartments createdAt createdBy')
          .populate('createdBy', 'name')
          .lean(),

        // 8. Unified recent activity
        getUnifiedActivities(12)
      ]);

      // Process Team Overview
      const roleMap: Record<string, number> = {
        FOUNDER: 0,
        HR: 0,
        MANAGER: 0,
        EMPLOYEE: 0,
        INTERN: 0
      };
      userRoleCounts.forEach((r: any) => {
        if (roleMap[r._id] !== undefined) roleMap[r._id] = r.count;
      });

      // Process Task / Work Overview
      let activeTasksCount = 0;
      let pendingTasksCount = 0;
      let completedTodayCount = 0;
      let overdueTasksCount = 0;
      const statusDistribution = {
        TODO: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        OVERDUE: 0
      };

      const inProgressTasks: any[] = [];

      allTasks.forEach((t: any) => {
        const isCompleted = t.status === 'COMPLETED';
        const isCancelled = t.status === 'CANCELLED';
        const isOverdue = !isCompleted && !isCancelled && t.dueDate && new Date(t.dueDate) < now;

        if (isOverdue) {
          overdueTasksCount++;
          statusDistribution.OVERDUE++;
        } else if (t.status === 'TODO') {
          statusDistribution.TODO++;
        } else if (t.status === 'IN_PROGRESS') {
          statusDistribution.IN_PROGRESS++;
        } else if (isCompleted) {
          statusDistribution.COMPLETED++;
        }

        if (t.status === 'IN_PROGRESS' || t.status === 'TODO') {
          activeTasksCount++;
        }
        if (t.status === 'PENDING' || t.status === 'TODO') {
          pendingTasksCount++;
        }
        if (isCompleted && t.updatedAt && new Date(t.updatedAt) >= startOfDay) {
          completedTodayCount++;
        }

        if (t.status === 'IN_PROGRESS') {
          inProgressTasks.push({
            id: t._id,
            title: t.title,
            priority: t.priority,
            assignedTo: t.assignedTo,
            startedAt: t.updatedAt || t.createdAt,
            dueDate: t.dueDate
          });
        }
      });

      // Process Goals
      let activeGoalsCount = 0;
      let completedGoalsCount = 0;
      let atRiskGoalsCount = 0;
      let totalGoalProgress = 0;

      activeGoalsData.forEach((g: any) => {
        if (g.status === 'ACTIVE') activeGoalsCount++;
        if (g.status === 'COMPLETED') completedGoalsCount++;
        if (g.status === 'AT_RISK') atRiskGoalsCount++;
        totalGoalProgress += g.progress || 0;
      });

      const avgGoalProgress = activeGoalsData.length > 0
        ? Math.round(totalGoalProgress / activeGoalsData.length)
        : 0;

      const topActiveGoals = activeGoalsData
        .filter((g: any) => g.status === 'ACTIVE' || g.status === 'AT_RISK')
        .sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0))
        .slice(0, 4)
        .map((g: any) => ({
          id: g._id,
          title: g.title,
          category: g.type,
          progress: g.progress || 0,
          status: g.status,
          targetDate: g.endDate
        }));

      // Process Inventory
      let lowStockCount = 0;
      let outOfStockCount = 0;
      const lowStockProductsList: any[] = [];

      productsData.forEach((p: any) => {
        if (p.stockQuantity === 0) {
          outOfStockCount++;
        } else if (p.stockQuantity <= p.lowStockThreshold) {
          lowStockCount++;
          lowStockProductsList.push({
            id: p._id,
            name: p.name,
            sku: p.sku,
            stockQuantity: p.stockQuantity,
            threshold: p.lowStockThreshold
          });
        }
      });

      // Process Orders & Sales
      let todayRevenue = 0;
      let monthRevenue = 0;
      let totalRecognizedRevenue = 0;
      let pendingOrdersCount = 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const dailyRevenueMap: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dailyRevenueMap[key] = 0;
      }

      ordersData.forEach((o: any) => {
        const orderDate = new Date(o.createdAt);
        const isPaid = o.paymentStatus === 'PAID';

        if (o.orderStatus === 'PENDING') {
          pendingOrdersCount++;
        }

        if (isPaid) {
          totalRecognizedRevenue += o.total || 0;

          if (orderDate >= startOfDay) {
            todayRevenue += o.total || 0;
          }
          if (orderDate >= startOfMonth) {
            monthRevenue += o.total || 0;
          }

          const dateKey = orderDate.toISOString().split('T')[0];
          if (dailyRevenueMap[dateKey] !== undefined) {
            dailyRevenueMap[dateKey] += o.total || 0;
          }
        }
      });

      const salesTrend = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue
      }));

      // Process Expenses
      let pendingExpensesCount = 0;
      let approvedThisMonth = 0;
      let paidThisMonth = 0;
      let totalExpenseMonth = 0;
      let totalRecognizedExpenses = 0;

      const pendingApprovalsList: any[] = [];

      expensesData.forEach((e: any) => {
        const expenseDate = new Date(e.createdAt);
        const inMonth = expenseDate >= startOfMonth;

        if (e.status === 'SUBMITTED') {
          pendingExpensesCount++;
          pendingApprovalsList.push({
            id: e._id,
            title: e.title,
            amount: e.amount,
            category: e.category,
            department: e.department,
            submittedBy: e.submittedBy || e.userId,
            date: e.expenseDate || e.createdAt
          });
        }

        if (e.status === 'APPROVED' || e.status === 'PAID') {
          totalRecognizedExpenses += e.amount || 0;
        }

        if (inMonth) {
          if (e.status === 'APPROVED') approvedThisMonth += e.amount || 0;
          if (e.status === 'PAID') paidThisMonth += e.amount || 0;
          if (e.status === 'APPROVED' || e.status === 'PAID') {
            totalExpenseMonth += e.amount || 0;
          }
        }
      });

      // Net operating calculation (Operational Summary)
      const netOperatingDifference = totalRecognizedRevenue - totalRecognizedExpenses;

      res.json({
        success: true,
        data: {
          timestamp: now.toISOString(),
          // 1. Company Overview
          companyOverview: {
            teamMembers: totalMembers,
            activeTasks: activeTasksCount,
            overdueTasks: overdueTasksCount,
            activeGoals: activeGoalsCount,
            lowStock: lowStockCount,
            pendingOrders: pendingOrdersCount,
            pendingExpenses: pendingExpensesCount
          },
          // 2. Work Overview
          workOverview: {
            activeTasks: activeTasksCount,
            pendingTasks: pendingTasksCount,
            completedToday: completedTodayCount,
            overdue: overdueTasksCount,
            statusDistribution
          },
          // 3. Team Overview
          teamOverview: {
            totalMembers,
            employees: roleMap.EMPLOYEE,
            interns: roleMap.INTERN,
            managers: roleMap.MANAGER,
            hr: roleMap.HR,
            recentJoiners
          },
          // 4. Active Work
          activeWork: inProgressTasks.slice(0, 6),
          // 5. Goals Overview
          goalsOverview: {
            active: activeGoalsCount,
            completed: completedGoalsCount,
            atRisk: atRiskGoalsCount,
            averageProgress: avgGoalProgress,
            topActiveGoals
          },
          // 6. Inventory Overview
          inventoryOverview: {
            totalProducts: productsData.length,
            lowStock: lowStockCount,
            outOfStock: outOfStockCount,
            lowStockProducts: lowStockProductsList.slice(0, 5)
          },
          // 7. Sales Overview
          salesOverview: {
            todayRevenue,
            monthRevenue,
            totalOrders: ordersData.length,
            pendingOrders: pendingOrdersCount,
            salesTrend
          },
          // 8. Expense Overview
          expenseOverview: {
            pendingApproval: pendingExpensesCount,
            approvedThisMonth,
            paidThisMonth,
            totalThisMonth: totalExpenseMonth,
            pendingApprovalsList: pendingApprovalsList.slice(0, 5)
          },
          // 9. Financial Summary
          financialSummary: {
            recognizedRevenue: totalRecognizedRevenue,
            recognizedExpenses: totalRecognizedExpenses,
            netOperatingDifference,
            isOperationalSummary: true
          },
          // 10. Announcements & Recent Activity
          announcements,
          recentActivity
        }
      });
    } catch (error) {
      console.error('[FounderController] Failed to generate overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Founder Command Center overview',
        error
      });
    }
  }
};
