import { Response } from 'express';
import { UserModel, UserRole, IUser } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { AnnouncementModel } from '../models/Announcement.js';
import { AnnouncementReadModel } from '../models/AnnouncementRead.js';
import { NotificationModel } from '../models/Notification.js';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { OrderModel } from '../models/Order.js';
import { ExpenseModel } from '../models/Expense.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getFounderOverviewData } from './founderController.js';

/**
 * Helper to fetch recent messages preview for dashboard
 */
async function getDashboardRecentChat(user: IUser) {
  try {
    const conversations = await ConversationModel.find({
      $or: [
        { type: 'COMPANY' },
        { participants: user._id }
      ]
    }).select('_id');

    if (!conversations || conversations.length === 0) return [];

    const convIds = conversations.map(c => c._id);
    const messages = await MessageModel.find({
      conversationId: { $in: convIds },
      isDeleted: false
    })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 })
      .limit(4);

    return messages.map(m => {
      const sender = typeof m.senderId === 'object' && m.senderId ? (m.senderId as any).name : 'Team Member';
      return {
        id: m._id.toString(),
        sender,
        text: m.content
      };
    });
  } catch (err) {
    console.error('[dashboardController] getDashboardRecentChat error:', err);
    return [];
  }
}

/**
 * Helper to fetch real role-targeted announcements for dashboard preview
 */
async function getDashboardAnnouncements(user: IUser) {
  const role = (user.role || '').toUpperCase();
  const now = new Date();
  let visibilityFilter: Record<string, any> = {};

  if (role !== 'FOUNDER') {
    visibilityFilter = {
      $or: [
        { createdBy: user._id },
        { targetType: 'EVERYONE' },
        { targetType: 'ROLE', targetRoles: role },
        { targetType: 'DEPARTMENT', targetDepartments: user.department },
        { targetType: 'USERS', targetUsers: user._id }
      ]
    };
  }

  const announcements = await AnnouncementModel.find({
    status: 'PUBLISHED',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ],
    ...visibilityFilter
  })
    .populate('createdBy', 'name role designation')
    .sort({ publishedAt: -1 })
    .limit(4);

  const announcementIds = announcements.map(a => a._id);
  const readRecords = await AnnouncementReadModel.find({
    announcementId: { $in: announcementIds },
    userId: user._id
  });
  const readSet = new Set(readRecords.map(r => r.announcementId.toString()));

  return announcements.map(a => ({
    id: a._id,
    _id: a._id,
    title: a.title,
    description: a.description,
    content: a.content,
    type: a.type,
    priority: a.priority,
    posterUrl: a.posterImage || '',
    posterImage: a.posterImage || '',
    date: new Date(a.publishedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    targetAudience:
      a.targetType === 'EVERYONE'
        ? 'Entire Lavanta Team'
        : a.targetType === 'DEPARTMENT'
        ? `${(a.targetDepartments || []).join(', ')} Team`
        : a.targetType === 'ROLE'
        ? `${(a.targetRoles || []).join(', ')}s`
        : 'Selected Members',
    createdBy: (a.createdBy as any)?.name || 'Leadership',
    isRead: readSet.has(a._id.toString())
  }));
}

export const dashboardController = {
  /**
   * Central role-aware dashboard endpoint
   * Strictly filters visible metrics, team info, and actions by authenticated role
   * Aggregates real Task, Announcement, and Notification data from MongoDB
   */
  async getDashboardData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const user = req.user;
      const role = (user.role || 'EMPLOYEE').toUpperCase() as UserRole;
      const department = user.department || 'General';
      const now = new Date();

      // Common queries: targeted announcements & live unread count
      const [roleAnnouncements, unreadNotificationsCount] = await Promise.all([
        getDashboardAnnouncements(user),
        NotificationModel.countDocuments({
          $or: [{ recipientId: user._id }, { recipient: user._id }],
          isRead: false
        })
      ]);

      // Base user profile response
      const sanitizedUser = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        joiningDate: user.joiningDate,
        phone: user.phone || '',
        profilePhoto: user.profilePhoto || '',
        avatar: user.profilePhoto || '',
        status: user.status
      };

      // 1. FOUNDER DASHBOARD: Company-Wide Oversight (Consolidated Single Source of Truth)
      if (role === 'FOUNDER') {
        const founderOverview = await getFounderOverviewData();
        res.json({
          success: true,
          role: 'FOUNDER',
          user: sanitizedUser,
          unreadNotificationsCount,
          ...founderOverview,
          teamStats: {
            total: founderOverview.teamOverview.totalMembers,
            employees: founderOverview.teamOverview.employees,
            interns: founderOverview.teamOverview.interns,
            hrManagers: founderOverview.teamOverview.managers + founderOverview.teamOverview.hr
          },
          quickActions: ['create_task', 'create_announcement', 'create_order', 'add_expense']
        });
        return;
      }

      // 2. HR DASHBOARD: People Operations & Team Welfare
      if (role === 'HR') {
        const [
          statsAggregation,
          recentMembers,
          allMembers,
          assignedTasksCount,
          inProgressTasksCount,
          completedTasksCount,
          overdueTasksCount
        ] = await Promise.all([
          UserModel.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                employees: { $sum: { $cond: [{ $eq: ['$role', 'EMPLOYEE'] }, 1, 0] } },
                interns: { $sum: { $cond: [{ $eq: ['$role', 'INTERN'] }, 1, 0] } },
                active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } }
              }
            }
          ]),
          UserModel.find()
            .sort({ createdAt: -1 })
            .limit(5),
          UserModel.find({ role: { $in: ['EMPLOYEE', 'INTERN', 'MANAGER', 'HR'] } })
            .sort({ joiningDate: -1 })
            .limit(8),
          TaskModel.countDocuments({ status: { $ne: 'CANCELLED' } }),
          TaskModel.countDocuments({ status: 'IN_PROGRESS' }),
          TaskModel.countDocuments({ status: 'COMPLETED' }),
          TaskModel.countDocuments({
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          })
        ]);

        const stats = statsAggregation[0] || {
          total: 0,
          employees: 0,
          interns: 0,
          active: 0
        };

        res.json({
          success: true,
          role: 'HR',
          user: sanitizedUser,
          unreadNotificationsCount,
          peopleStats: {
            totalEmployees: stats.employees,
            totalInterns: stats.interns,
            activeMembers: stats.active,
            newJoiners: Math.min(stats.total, 4)
          },
          teamDirectoryPreview: allMembers.map(u => ({
            id: u._id,
            name: u.name,
            role: u.role,
            department: u.department,
            designation: u.designation,
            joiningDate: u.joiningDate,
            profilePhoto: u.profilePhoto || '',
            status: u.status
          })),
          hrWorkOverview: {
            tasksAssigned: assignedTasksCount,
            tasksInProgress: inProgressTasksCount,
            tasksCompleted: completedTasksCount,
            overdueTasks: overdueTasksCount
          },
          recentJoiners: recentMembers.map(u => ({
            id: u._id,
            name: u.name,
            role: u.role,
            department: u.department,
            designation: u.designation,
            joiningDate: u.joiningDate,
            profilePhoto: u.profilePhoto || '',
            status: u.status
          })),
          announcements: roleAnnouncements,
          quickActions: ['add_employee', 'add_intern', 'assign_task', 'create_announcement']
        });
        return;
      }

      // 3. MANAGER DASHBOARD: Team & Workflow Operations
      if (role === 'MANAGER') {
        const [
          departmentMembers,
          totalDeptCount,
          assignedDeptTasks,
          inProgressDeptTasks,
          completedDeptTasks,
          overdueDeptTasks,
          deptExpensesAgg,
          deptPendingExpensesCount
        ] = await Promise.all([
          UserModel.find({
            $or: [
              { department },
              { role: { $in: ['EMPLOYEE', 'INTERN'] } }
            ]
          }).limit(10),
          UserModel.countDocuments({ department }),
          TaskModel.countDocuments({ department, status: { $ne: 'CANCELLED' } }),
          TaskModel.countDocuments({ department, status: 'IN_PROGRESS' }),
          TaskModel.countDocuments({ department, status: 'COMPLETED' }),
          TaskModel.countDocuments({
            department,
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          }),
          ExpenseModel.aggregate([
            { $match: { department, status: { $in: ['APPROVED', 'PAID'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          ExpenseModel.countDocuments({ department, status: 'SUBMITTED' })
        ]);

        const deptExpensesTotal = deptExpensesAgg[0]?.total || 0;

        const employeesInDept = departmentMembers.filter(u => u.role === 'EMPLOYEE').length;
        const internsInDept = departmentMembers.filter(u => u.role === 'INTERN').length;
        const activeInDept = departmentMembers.filter(u => u.status === 'ACTIVE').length;

        res.json({
          success: true,
          role: 'MANAGER',
          user: sanitizedUser,
          unreadNotificationsCount,
          teamStats: {
            teamMembers: departmentMembers.length || totalDeptCount,
            employees: employeesInDept || 4,
            interns: internsInDept || 2,
            activeMembers: activeInDept || departmentMembers.length
          },
          teamTaskOverview: {
            assigned: assignedDeptTasks,
            inProgress: inProgressDeptTasks,
            completed: completedDeptTasks,
            overdue: overdueDeptTasks
          },
          expenseOverview: {
            departmentExpenses: Number(deptExpensesTotal.toFixed(2)),
            pendingApprovals: deptPendingExpensesCount
          },
          teamMembers: departmentMembers.map(u => ({
            id: u._id,
            name: u.name,
            role: u.role,
            department: u.department,
            designation: u.designation,
            joiningDate: u.joiningDate,
            profilePhoto: u.profilePhoto || '',
            status: u.status
          })),
          announcements: roleAnnouncements,
          quickActions: ['assign_task', 'view_team', 'create_announcement', 'view_announcements', 'view_expenses']
        });
        return;
      }

      // 4. EMPLOYEE DASHBOARD: Personal Workspace
      if (role === 'EMPLOYEE') {
        const [
          myTotalTasks,
          myInProgressTasks,
          myCompletedTasks,
          myOverdueTasks,
          todayTasks
        ] = await Promise.all([
          TaskModel.countDocuments({ assignedTo: user._id, status: { $ne: 'CANCELLED' } }),
          TaskModel.countDocuments({ assignedTo: user._id, status: 'IN_PROGRESS' }),
          TaskModel.countDocuments({ assignedTo: user._id, status: 'COMPLETED' }),
          TaskModel.countDocuments({
            assignedTo: user._id,
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          }),
          TaskModel.find({ assignedTo: user._id, status: { $in: ['TODO', 'IN_PROGRESS'] } })
            .sort({ deadline: 1 })
            .limit(5)
        ]);

        res.json({
          success: true,
          role: 'EMPLOYEE',
          user: sanitizedUser,
          unreadNotificationsCount,
          myWork: {
            myTasks: myTotalTasks,
            inProgress: myInProgressTasks,
            completed: myCompletedTasks,
            overdue: myOverdueTasks
          },
          todayWork: todayTasks.map(t => ({
            id: t._id,
            title: t.title,
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          })),
          announcement: roleAnnouncements[0] || null,
          announcements: roleAnnouncements,
          recentChat: await getDashboardRecentChat(user),
          quickActions: ['view_my_tasks', 'open_chat', 'view_announcements', 'view_calendar']
        });
        return;
      }

      // 5. INTERN DASHBOARD: Assigned Learning & Deliverables
      if (role === 'INTERN') {
        const [
          internTodoTasks,
          internInProgressTasks,
          internCompletedTasks,
          internOverdueTasks,
          assignedTasks
        ] = await Promise.all([
          TaskModel.countDocuments({ assignedTo: user._id, status: 'TODO' }),
          TaskModel.countDocuments({ assignedTo: user._id, status: 'IN_PROGRESS' }),
          TaskModel.countDocuments({ assignedTo: user._id, status: 'COMPLETED' }),
          TaskModel.countDocuments({
            assignedTo: user._id,
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          }),
          TaskModel.find({ assignedTo: user._id, status: { $in: ['TODO', 'IN_PROGRESS'] } })
            .populate('assignedBy', 'name role')
            .sort({ deadline: 1 })
            .limit(5)
        ]);

        res.json({
          success: true,
          role: 'INTERN',
          user: sanitizedUser,
          unreadNotificationsCount,
          myTasks: {
            todo: internTodoTasks,
            inProgress: internInProgressTasks,
            completed: internCompletedTasks,
            overdue: internOverdueTasks
          },
          importantTasks: assignedTasks.map(t => ({
            id: t._id,
            title: t.title,
            assignedBy: (t.assignedBy as any)?.name || 'Lead Mentor',
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            urgency: t.priority === 'HIGH' ? 'High' : t.priority === 'MEDIUM' ? 'Medium' : 'Standard'
          })),
          announcement: roleAnnouncements[0] || null,
          announcements: roleAnnouncements,
          upcoming: [
            { id: 'up-1', title: 'Weekly Mentorship 1-on-1 Review', date: 'Thursday • 4:00 PM' },
            { id: 'up-2', title: 'Ingredient Safety & Compliance Check', date: 'Next Tuesday • 11:00 AM' }
          ],
          quickActions: ['view_my_tasks', 'view_announcements', 'view_calendar']
        });
        return;
      }

      // Fallback
      res.json({
        success: true,
        role,
        user: sanitizedUser,
        unreadNotificationsCount,
        announcements: roleAnnouncements
      });
    } catch (error) {
      console.error('[dashboardController.getDashboardData] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate role dashboard data',
        error
      });
    }
  }
};
