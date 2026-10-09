import { Response } from 'express';
import { UserModel, UserRole, IUser } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { TaskActivityModel } from '../models/TaskActivity.js';
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
          totalEmployees,
          totalInterns,
          totalActive,
          recentJoiners,
          hrTasks,
          hrPendingCount,
          hrOverdueCount,
          recentActivities
        ] = await Promise.all([
          UserModel.countDocuments({ role: 'EMPLOYEE', status: 'ACTIVE' }),
          UserModel.countDocuments({ role: 'INTERN', status: 'ACTIVE' }),
          UserModel.countDocuments({ status: 'ACTIVE' }),
          UserModel.find({ status: 'ACTIVE' })
            .sort({ joiningDate: -1, createdAt: -1 })
            .limit(8),
          TaskModel.find({
            $or: [
              { department: 'HR' },
              { assignedTo: user._id }
            ],
            status: { $nin: ['COMPLETED', 'CANCELLED'] }
          })
            .populate('assignedTo', 'name role department designation profilePhoto')
            .populate('assignedBy', 'name role')
            .sort({ deadline: 1 })
            .limit(6),
          TaskModel.countDocuments({
            $or: [{ department: 'HR' }, { assignedTo: user._id }],
            status: { $in: ['TODO', 'IN_PROGRESS'] }
          }),
          TaskModel.countDocuments({
            $or: [{ department: 'HR' }, { assignedTo: user._id }],
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          }),
          TaskActivityModel.find()
            .populate('actorId', 'name designation role profilePhoto')
            .sort({ createdAt: -1 })
            .limit(6)
        ]);

        res.json({
          success: true,
          role: 'HR',
          user: sanitizedUser,
          unreadNotificationsCount,
          peopleStats: {
            totalEmployees,
            totalInterns,
            activeMembers: totalActive,
            newJoiners: Math.min(recentJoiners.length, 5)
          },
          teamDirectoryPreview: recentJoiners.map(u => ({
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
            tasksAssigned: hrPendingCount,
            tasksInProgress: hrTasks.filter(t => t.status === 'IN_PROGRESS').length,
            tasksCompleted: await TaskModel.countDocuments({ department: 'HR', status: 'COMPLETED' }),
            overdueTasks: hrOverdueCount
          },
          hrTasks: hrTasks.map(t => ({
            id: t._id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            }),
            assignedTo: t.assignedTo ? {
              id: (t.assignedTo as any)._id,
              name: (t.assignedTo as any).name,
              profilePhoto: (t.assignedTo as any).profilePhoto || ''
            } : null
          })),
          recentJoiners: recentJoiners.slice(0, 5).map(u => ({
            id: u._id,
            name: u.name,
            role: u.role,
            department: u.department,
            designation: u.designation,
            joiningDate: u.joiningDate,
            profilePhoto: u.profilePhoto || '',
            status: u.status
          })),
          recentActivities: recentActivities.map(a => ({
            id: a._id,
            actorName: (a.actorId as any)?.name || 'System',
            actorPhoto: (a.actorId as any)?.profilePhoto || '',
            message: a.message,
            type: a.type,
            time: new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          })),
          announcements: roleAnnouncements,
          quickActions: ['add_employee', 'add_intern', 'assign_task', 'create_announcement']
        });
        return;
      }

      // 3. MANAGER DASHBOARD: Team & Workflow Operations
      if (role === 'MANAGER') {
        const departmentMembers = await UserModel.find({
          $or: [
            { department },
            { role: { $in: ['EMPLOYEE', 'INTERN'] } }
          ],
          status: 'ACTIVE'
        }).sort({ name: 1 });

        const deptMemberIds = departmentMembers.map(m => m._id);

        const [
          assignedDeptTasks,
          inProgressDeptTasks,
          completedDeptTasks,
          overdueDeptTasks,
          inProgressTasksList,
          overdueTasksList,
          workloadAggregation,
          recentDeptActivities
        ] = await Promise.all([
          TaskModel.countDocuments({
            $or: [{ department }, { assignedTo: { $in: deptMemberIds } }],
            status: { $ne: 'CANCELLED' }
          }),
          TaskModel.countDocuments({
            $or: [{ department }, { assignedTo: { $in: deptMemberIds } }],
            status: 'IN_PROGRESS'
          }),
          TaskModel.countDocuments({
            $or: [{ department }, { assignedTo: { $in: deptMemberIds } }],
            status: 'COMPLETED'
          }),
          TaskModel.countDocuments({
            $or: [{ department }, { assignedTo: { $in: deptMemberIds } }],
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          }),
          TaskModel.find({
            $or: [{ department }, { assignedTo: { $in: deptMemberIds } }],
            status: 'IN_PROGRESS'
          })
            .populate('assignedTo', 'name role department designation profilePhoto')
            .sort({ deadline: 1 })
            .limit(6),
          TaskModel.find({
            $or: [{ department }, { assignedTo: { $in: deptMemberIds } }],
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          })
            .populate('assignedTo', 'name role department designation profilePhoto')
            .sort({ deadline: 1 })
            .limit(5),
          TaskModel.aggregate([
            {
              $match: {
                $or: [{ department }, { assignedTo: { $in: deptMemberIds } }],
                status: { $in: ['TODO', 'IN_PROGRESS'] }
              }
            },
            {
              $group: {
                _id: '$assignedTo',
                count: { $sum: 1 }
              }
            }
          ]),
          TaskActivityModel.find()
            .populate('actorId', 'name role designation profilePhoto')
            .sort({ createdAt: -1 })
            .limit(6)
        ]);

        const employeesInDept = departmentMembers.filter(u => u.role === 'EMPLOYEE').length;
        const internsInDept = departmentMembers.filter(u => u.role === 'INTERN').length;
        const activeInDept = departmentMembers.filter(u => u.status === 'ACTIVE').length;

        // Build workload map
        const workloadMap: Record<string, number> = {};
        workloadAggregation.forEach(w => {
          if (w._id) workloadMap[w._id.toString()] = w.count;
        });

        const teamWorkload = departmentMembers.slice(0, 8).map(u => ({
          user: {
            id: u._id,
            name: u.name,
            role: u.role,
            designation: u.designation,
            profilePhoto: u.profilePhoto || ''
          },
          taskCount: workloadMap[u._id.toString()] || 0
        }));

        res.json({
          success: true,
          role: 'MANAGER',
          user: sanitizedUser,
          unreadNotificationsCount,
          teamStats: {
            teamMembers: departmentMembers.length,
            employees: employeesInDept,
            interns: internsInDept,
            activeMembers: activeInDept
          },
          teamTaskOverview: {
            assigned: assignedDeptTasks,
            inProgress: inProgressDeptTasks,
            completed: completedDeptTasks,
            overdue: overdueDeptTasks
          },
          inProgressTasks: inProgressTasksList.map(t => ({
            id: t._id,
            title: t.title,
            priority: t.priority,
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            }),
            assignedTo: t.assignedTo ? {
              id: (t.assignedTo as any)._id,
              name: (t.assignedTo as any).name,
              designation: (t.assignedTo as any).designation,
              profilePhoto: (t.assignedTo as any).profilePhoto || ''
            } : null
          })),
          overdueTasks: overdueTasksList.map(t => ({
            id: t._id,
            title: t.title,
            priority: t.priority,
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            }),
            assignedTo: t.assignedTo ? {
              id: (t.assignedTo as any)._id,
              name: (t.assignedTo as any).name,
              profilePhoto: (t.assignedTo as any).profilePhoto || ''
            } : null
          })),
          teamWorkload,
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
          recentActivities: recentDeptActivities.map(a => ({
            id: a._id,
            actorName: (a.actorId as any)?.name || 'Team Member',
            actorPhoto: (a.actorId as any)?.profilePhoto || '',
            message: a.message,
            type: a.type,
            time: new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          })),
          announcements: roleAnnouncements,
          quickActions: ['assign_task', 'view_team', 'create_announcement', 'open_chat']
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
          activeTasksList,
          completedTasksList,
          recentActivities
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
            .populate('assignedBy', 'name role')
            .sort({ deadline: 1 })
            .limit(6),
          TaskModel.find({ assignedTo: user._id, status: 'COMPLETED' })
            .sort({ completedAt: -1, updatedAt: -1 })
            .limit(5),
          TaskActivityModel.find({ actorId: user._id })
            .sort({ createdAt: -1 })
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
          activeTasks: activeTasksList.map(t => ({
            id: t._id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            assignedBy: (t.assignedBy as any)?.name || 'Lead',
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })
          })),
          todayWork: activeTasksList.map(t => ({
            id: t._id,
            title: t.title,
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          })),
          completedTasks: completedTasksList.map(t => ({
            id: t._id,
            title: t.title,
            completedAt: t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'Recently'
          })),
          recentActivities: recentActivities.map(a => ({
            id: a._id,
            message: a.message,
            time: new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          })),
          announcement: roleAnnouncements[0] || null,
          announcements: roleAnnouncements,
          recentChat: await getDashboardRecentChat(user),
          quickActions: ['view_my_tasks', 'open_chat', 'view_announcements', 'view_profile']
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
          assignedTasksList,
          completedTasksList
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
            .populate('assignedBy', 'name role designation profilePhoto')
            .sort({ deadline: 1 })
            .limit(6),
          TaskModel.find({ assignedTo: user._id, status: 'COMPLETED' })
            .sort({ completedAt: -1, updatedAt: -1 })
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
          assignedTasks: assignedTasksList.map(t => ({
            id: t._id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            assignedBy: (t.assignedBy as any)?.name || 'Mentor',
            deadline: new Date(t.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })
          })),
          importantTasks: assignedTasksList.map(t => ({
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
          completedTasks: completedTasksList.map(t => ({
            id: t._id,
            title: t.title,
            completedAt: t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'Completed'
          })),
          announcement: roleAnnouncements[0] || null,
          announcements: roleAnnouncements,
          quickActions: ['view_my_tasks', 'open_chat', 'view_announcements']
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
