import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TaskActivityModel, ITaskActivity } from '../models/TaskActivity.js';
import { TaskModel, ITask } from '../models/Task.js';
import { UserModel, IUser } from '../models/User.js';

// Helper to determine allowed user IDs for the current user's scope
async function getAllowedUserIds(currentUser: IUser): Promise<Types.ObjectId[] | null> {
  const role = currentUser.role.toUpperCase();
  if (role === 'FOUNDER' || role === 'HR') {
    return null; // Null means unrestricted / company-wide
  }

  if (role === 'MANAGER') {
    // Managers can see members of their own department
    const deptUsers = await UserModel.find({
      department: currentUser.department,
      status: 'ACTIVE'
    }).select('_id');
    const userIds = deptUsers.map(u => u._id);
    if (!userIds.some(id => id.toString() === currentUser._id.toString())) {
      userIds.push(currentUser._id);
    }
    return userIds;
  }

  // Employee or Intern: Only self
  return [currentUser._id];
}

// Helper to check if current user can view a target user's activity
async function canAccessUserActivity(currentUser: IUser, targetUserId: string): Promise<boolean> {
  const role = currentUser.role.toUpperCase();
  if (currentUser._id.toString() === targetUserId) {
    return true;
  }
  if (role === 'FOUNDER' || role === 'HR') {
    return true;
  }
  if (role === 'MANAGER') {
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) return false;
    return targetUser.department === currentUser.department;
  }
  return false;
}

export const activityController = {
  /**
   * GET /api/activity
   * Paginated, filterable activity feed based on real TaskActivity records
   */
  async getActivityFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const {
        page = '1',
        limit = '20',
        search = '',
        userId,
        department,
        role,
        status,
        priority,
        activityType,
        startDate,
        endDate
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const allowedUserIds = await getAllowedUserIds(user);

      // Build match conditions for TaskActivity
      const activityQuery: Record<string, any> = {};

      if (allowedUserIds !== null) {
        activityQuery.actorId = { $in: allowedUserIds };
      }

      // If specific userId is requested, verify RBAC
      if (typeof userId === 'string' && Types.ObjectId.isValid(userId)) {
        if (allowedUserIds !== null && !allowedUserIds.some(id => id.toString() === userId)) {
          res.status(403).json({ success: false, message: 'You do not have access to view this user\'s activity.' });
          return;
        }
        activityQuery.actorId = new Types.ObjectId(userId);
      }

      // Filter by activity type
      if (typeof activityType === 'string' && activityType && activityType !== 'ALL') {
        activityQuery.type = activityType.trim();
      }

      // Filter by date range
      if (startDate || endDate) {
        activityQuery.createdAt = {};
        if (startDate) {
          activityQuery.createdAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          activityQuery.createdAt.$lte = end;
        }
      }

      // If filtering by department, role, or search, resolve matching actors first
      const actorMatch: Record<string, any> = {};
      let needsActorFilter = false;

      if (typeof department === 'string' && department && department !== 'ALL') {
        actorMatch.department = department.trim();
        needsActorFilter = true;
      }
      if (typeof role === 'string' && role && role !== 'ALL') {
        actorMatch.role = (role as string).trim().toUpperCase();
        needsActorFilter = true;
      }

      if (needsActorFilter) {
        const matchingUsers = await UserModel.find(actorMatch).select('_id');
        const matchingIds = matchingUsers.map(u => u._id);
        if (activityQuery.actorId) {
          activityQuery.actorId = { $in: matchingIds.filter(id => 
            Array.isArray(activityQuery.actorId.$in) 
              ? activityQuery.actorId.$in.some((aId: Types.ObjectId) => aId.toString() === id.toString())
              : activityQuery.actorId.toString() === id.toString()
          )};
        } else {
          activityQuery.actorId = { $in: matchingIds };
        }
      }

      // Build task match filter if search, status, or priority specified
      let taskIdsFilter: Types.ObjectId[] | null = null;
      if (search || (status && status !== 'ALL') || (priority && priority !== 'ALL')) {
        const taskQuery: Record<string, any> = {};
        if (typeof search === 'string' && search.trim()) {
          taskQuery.title = { $regex: search.trim(), $options: 'i' };
        }
        if (typeof status === 'string' && status !== 'ALL') {
          taskQuery.status = (status as string).trim().toUpperCase();
        }
        if (typeof priority === 'string' && priority !== 'ALL') {
          taskQuery.priority = (priority as string).trim().toUpperCase();
        }

        const matchedTasks = await TaskModel.find(taskQuery).select('_id');
        taskIdsFilter = matchedTasks.map(t => t._id);
        activityQuery.taskId = { $in: taskIdsFilter };
      }

      const [activities, total] = await Promise.all([
        TaskActivityModel.find(activityQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('actorId', 'name email role department designation profilePhoto')
          .populate('taskId', 'title status priority deadline startedAt completedAt department assignedTo')
          .lean(),
        TaskActivityModel.countDocuments(activityQuery)
      ]);

      res.json({
        success: true,
        activities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('[activityController.getActivityFeed] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch activity feed.' });
    }
  },

  /**
   * GET /api/activity/summary
   * Top summary counters and today/weekly work metrics based on real database data
   */
  async getWorkSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const allowedUserIds = await getAllowedUserIds(user);

      const taskMatch: Record<string, any> = {};
      if (allowedUserIds !== null) {
        taskMatch.assignedTo = { $in: allowedUserIds };
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Start of week (Monday)
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);

      const allTasks = await TaskModel.find(taskMatch).lean();

      let activeTasks = 0;
      let pendingTasks = 0;
      let completedToday = 0;
      let overdueTasks = 0;
      let dueToday = 0;
      let completedThisWeek = 0;

      // Today's work summary
      let assignedToday = 0;
      let startedToday = 0;

      // Weekly summary
      let assignedThisWeek = 0;
      let startedThisWeek = 0;

      for (const t of allTasks) {
        const isCompleted = t.status === 'COMPLETED';
        const isCancelled = t.status === 'CANCELLED';
        const isOverdue = !isCompleted && !isCancelled && t.deadline && new Date(t.deadline).getTime() < now.getTime();

        if (t.status === 'IN_PROGRESS') activeTasks++;
        if (t.status === 'TODO') pendingTasks++;
        if (isOverdue) overdueTasks++;

        // Deadline today
        if (t.deadline && !isCompleted && !isCancelled) {
          const dDate = new Date(t.deadline);
          if (dDate >= startOfToday && dDate <= endOfToday) {
            dueToday++;
          }
        }

        // Completed today & this week
        if (isCompleted && t.completedAt) {
          const cDate = new Date(t.completedAt);
          if (cDate >= startOfToday && cDate <= endOfToday) {
            completedToday++;
          }
          if (cDate >= startOfWeek) {
            completedThisWeek++;
          }
        }

        // Assigned today & this week
        if (t.assignedAt || t.createdAt) {
          const aDate = new Date(t.assignedAt || t.createdAt);
          if (aDate >= startOfToday && aDate <= endOfToday) {
            assignedToday++;
          }
          if (aDate >= startOfWeek) {
            assignedThisWeek++;
          }
        }

        // Started today & this week
        if (t.startedAt) {
          const sDate = new Date(t.startedAt);
          if (sDate >= startOfToday && sDate <= endOfToday) {
            startedToday++;
          }
          if (sDate >= startOfWeek) {
            startedThisWeek++;
          }
        }
      }

      const weeklyCompletionRate = assignedThisWeek > 0 
        ? Math.round((completedThisWeek / assignedThisWeek) * 1000) / 10 
        : 0;

      res.json({
        success: true,
        summary: {
          activeTasks,
          pendingTasks,
          completedToday,
          overdueTasks,
          dueToday,
          completedThisWeek
        },
        todaySummary: {
          assignedToday,
          startedToday,
          completedToday,
          pendingTasks,
          overdueTasks
        },
        weeklySummary: {
          assignedThisWeek,
          startedThisWeek,
          completedThisWeek,
          overdueTasks,
          completionRate: weeklyCompletionRate
        }
      });
    } catch (error) {
      console.error('[activityController.getWorkSummary] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch work summary.' });
    }
  },

  /**
   * GET /api/activity/active
   * Returns tasks currently having status = 'IN_PROGRESS' with live duration calculation
   */
  async getActiveWork(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const allowedUserIds = await getAllowedUserIds(user);

      const query: Record<string, any> = {
        status: 'IN_PROGRESS'
      };

      if (allowedUserIds !== null) {
        query.assignedTo = { $in: allowedUserIds };
      }

      const activeTasks = await TaskModel.find(query)
        .populate('assignedTo', 'name email role department designation profilePhoto')
        .populate('assignedBy', 'name email role department designation')
        .sort({ startedAt: -1, updatedAt: -1 })
        .lean();

      const now = Date.now();
      const formattedActiveTasks = activeTasks.map(task => {
        let durationMs: number | null = null;
        if (task.startedAt) {
          durationMs = Math.max(0, now - new Date(task.startedAt).getTime());
        }
        return {
          ...task,
          durationMs,
          isActive: true
        };
      });

      res.json({
        success: true,
        activeTasks: formattedActiveTasks,
        total: formattedActiveTasks.length
      });
    } catch (error) {
      console.error('[activityController.getActiveWork] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch active work.' });
    }
  },

  /**
   * GET /api/activity/workload
   * Aggregates tasks per employee/intern (Assigned, Active, Completed, Overdue)
   */
  async getTeamWorkload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const allowedUserIds = await getAllowedUserIds(user);

      // Find relevant team members
      const userQuery: Record<string, any> = { status: 'ACTIVE' };
      if (allowedUserIds !== null) {
        userQuery._id = { $in: allowedUserIds };
      } else {
        // Founder/HR: Exclude founder from employee workload table if desired, or include all
        userQuery.role = { $in: ['EMPLOYEE', 'INTERN', 'MANAGER', 'HR'] };
      }

      const teamMembers = await UserModel.find(userQuery)
        .select('name email role department designation profilePhoto')
        .sort({ department: 1, name: 1 })
        .lean();

      const now = new Date();
      const memberIds = teamMembers.map(m => m._id);

      // Aggregate tasks for these members
      const tasks = await TaskModel.find({
        assignedTo: { $in: memberIds }
      }).select('assignedTo status deadline').lean();

      // Compute statistics per user in memory for precision
      const workloadMap = new Map<string, {
        assigned: number;
        active: number;
        completed: number;
        overdue: number;
      }>();

      for (const m of teamMembers) {
        workloadMap.set(m._id.toString(), {
          assigned: 0,
          active: 0,
          completed: 0,
          overdue: 0
        });
      }

      for (const t of tasks) {
        const assigneeId = t.assignedTo.toString();
        const stat = workloadMap.get(assigneeId);
        if (!stat) continue;

        stat.assigned++;
        if (t.status === 'IN_PROGRESS') stat.active++;
        if (t.status === 'COMPLETED') stat.completed++;

        const isOverdue = t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.deadline && new Date(t.deadline).getTime() < now.getTime();
        if (isOverdue) stat.overdue++;
      }

      const result = teamMembers.map(m => ({
        user: m,
        ...workloadMap.get(m._id.toString())!
      }));

      res.json({
        success: true,
        workload: result
      });
    } catch (error) {
      console.error('[activityController.getTeamWorkload] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to aggregate team workload.' });
    }
  },

  /**
   * GET /api/activity/trends
   * Completion trends (Today, This Week, This Month) and Task Status Distribution
   */
  async getCompletionTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const allowedUserIds = await getAllowedUserIds(user);
      const { range = 'week' } = req.query; // 'today' | 'week' | 'month'

      const taskMatch: Record<string, any> = {};
      if (allowedUserIds !== null) {
        taskMatch.assignedTo = { $in: allowedUserIds };
      }

      const now = new Date();
      let daysCount = 7;
      if (range === 'today') daysCount = 1;
      if (range === 'month') daysCount = 30;

      const startDate = new Date(now.getTime() - (daysCount - 1) * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);

      // Fetch completed tasks in range
      const completedTasks = await TaskModel.find({
        ...taskMatch,
        status: 'COMPLETED',
        completedAt: { $gte: startDate }
      }).select('completedAt startedAt').lean();

      // Fetch all current tasks for status distribution
      const allTasks = await TaskModel.find(taskMatch).select('status deadline').lean();

      // Compute status distribution
      let todoCount = 0;
      let inProgressCount = 0;
      let completedCount = 0;
      let overdueCount = 0;
      let cancelledCount = 0;

      for (const t of allTasks) {
        const isOverdue = t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.deadline && new Date(t.deadline).getTime() < now.getTime();
        if (isOverdue) {
          overdueCount++;
        }
        if (t.status === 'TODO') todoCount++;
        else if (t.status === 'IN_PROGRESS') inProgressCount++;
        else if (t.status === 'COMPLETED') completedCount++;
        else if (t.status === 'CANCELLED') cancelledCount++;
      }

      // Group completion by day
      const dailyCompletionMap = new Map<string, number>();
      for (let i = 0; i < daysCount; i++) {
        const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        dailyCompletionMap.set(key, 0);
      }

      for (const t of completedTasks) {
        if (t.completedAt) {
          const key = new Date(t.completedAt).toISOString().split('T')[0];
          if (dailyCompletionMap.has(key)) {
            dailyCompletionMap.set(key, (dailyCompletionMap.get(key) || 0) + 1);
          }
        }
      }

      const trendsData = Array.from(dailyCompletionMap.entries()).map(([dateStr, count]) => {
        const d = new Date(dateStr);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        return {
          date: dateStr,
          day: dayLabel,
          completed: count
        };
      });

      res.json({
        success: true,
        trends: trendsData,
        statusDistribution: {
          TODO: todoCount,
          IN_PROGRESS: inProgressCount,
          COMPLETED: completedCount,
          OVERDUE: overdueCount,
          CANCELLED: cancelledCount
        }
      });
    } catch (error) {
      console.error('[activityController.getCompletionTrends] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch completion trends.' });
    }
  },

  /**
   * GET /api/activity/user/:userId
   * Detailed work activity and historical profile for a specific user
   */
  async getUserActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { userId } = req.params;

      if (!Types.ObjectId.isValid(userId)) {
        res.status(400).json({ success: false, message: 'Invalid user ID.' });
        return;
      }

      // RBAC check
      const hasAccess = await canAccessUserActivity(user, userId);
      if (!hasAccess) {
        res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to view this user\'s work activity.' });
        return;
      }

      const targetUser = await UserModel.findById(userId).select('name email role department designation profilePhoto joiningDate status');
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      // Tasks assigned to this user
      const userTasks = await TaskModel.find({ assignedTo: targetUser._id }).lean();

      let assigned = userTasks.length;
      let inProgress = 0;
      let completed = 0;
      let overdue = 0;
      let completedThisWeek = 0;
      let completedThisMonth = 0;

      for (const t of userTasks) {
        if (t.status === 'IN_PROGRESS') inProgress++;
        if (t.status === 'COMPLETED') {
          completed++;
          if (t.completedAt) {
            const cDate = new Date(t.completedAt);
            if (cDate >= startOfWeek) completedThisWeek++;
            if (cDate >= startOfMonth) completedThisMonth++;
          }
        }
        const isOverdue = t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.deadline && new Date(t.deadline).getTime() < now.getTime();
        if (isOverdue) overdue++;
      }

      // Recent TaskActivity records where this user is the actor
      const activities = await TaskActivityModel.find({ actorId: targetUser._id })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('taskId', 'title status priority deadline startedAt completedAt')
        .lean();

      res.json({
        success: true,
        user: targetUser,
        summary: {
          assigned,
          inProgress,
          completed,
          overdue,
          completedThisWeek,
          completedThisMonth
        },
        activities
      });
    } catch (error) {
      console.error('[activityController.getUserActivity] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user activity details.' });
    }
  },

  /**
   * GET /api/activity/my
   * Personal work activity for the currently authenticated employee/intern
   */
  async getMyActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Tasks assigned to me
      const myTasks = await TaskModel.find({ assignedTo: user._id })
        .populate('assignedBy', 'name role')
        .sort({ createdAt: -1 })
        .lean();

      let assignedToday = 0;
      let inProgress = 0;
      let completed = 0;
      let pending = 0;
      let overdue = 0;

      const activeTasks: any[] = [];
      const completedTasks: any[] = [];
      const overdueTasks: any[] = [];

      for (const t of myTasks) {
        const isCompleted = t.status === 'COMPLETED';
        const isCancelled = t.status === 'CANCELLED';
        const isOverdue = !isCompleted && !isCancelled && t.deadline && new Date(t.deadline).getTime() < now.getTime();

        if (t.status === 'IN_PROGRESS') {
          inProgress++;
          let durationMs = null;
          if (t.startedAt) {
            durationMs = Math.max(0, now.getTime() - new Date(t.startedAt).getTime());
          }
          activeTasks.push({ ...t, durationMs });
        } else if (t.status === 'TODO') {
          pending++;
        }

        if (isCompleted) {
          completed++;
          let durationMs = null;
          if (t.startedAt && t.completedAt) {
            durationMs = Math.max(0, new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime());
          }
          completedTasks.push({ ...t, durationMs });
        }

        if (isOverdue) {
          overdue++;
          overdueTasks.push(t);
        }

        // Assigned today
        if (t.assignedAt || t.createdAt) {
          const aDate = new Date(t.assignedAt || t.createdAt);
          if (aDate >= startOfToday && aDate <= endOfToday) {
            assignedToday++;
          }
        }
      }

      // Recent activities performed by me
      const recentActivities = await TaskActivityModel.find({ actorId: user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('taskId', 'title status priority deadline startedAt completedAt')
        .lean();

      res.json({
        success: true,
        todaySummary: {
          assignedToday,
          inProgress,
          completed,
          pending,
          overdue
        },
        activeTasks,
        completedTasks: completedTasks.slice(0, 10),
        overdueTasks,
        recentActivities
      });
    } catch (error) {
      console.error('[activityController.getMyActivity] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch personal activity.' });
    }
  }
};
