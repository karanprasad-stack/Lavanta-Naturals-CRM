import { Response } from 'express';
import { Types } from 'mongoose';
import { TaskModel, ITask, TaskPriority, TaskStatus } from '../models/Task.js';
import { TaskActivityModel, TaskActivityType } from '../models/TaskActivity.js';
import { NotificationModel } from '../models/Notification.js';
import { UserModel, IUser, UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';
import { io } from '../socket/index.js';

export const taskController = {
  /**
   * Helper: check if a user is permitted to manage/view a task
   */
  canAccessTask(user: IUser, task: ITask): boolean {
    const role = user.role.toUpperCase();
    if (role === 'FOUNDER' || role === 'HR') return true;

    const userIdStr = user._id.toString();
    const isAssignee =
      (Array.isArray(task.assignees) &&
        task.assignees.some((a: any) => (a._id ? a._id.toString() : a.toString()) === userIdStr)) ||
      Boolean(task.assignedTo && (task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString()) === userIdStr);

    const isAssigner = Boolean(
      task.assignedBy &&
      (task.assignedBy._id ? task.assignedBy._id.toString() : task.assignedBy.toString()) === userIdStr
    );

    if (role === 'MANAGER') {
      return (
        task.department === user.department ||
        isAssigner ||
        isAssignee
      );
    }
    // Employee & Intern: strictly own tasks
    return isAssignee || isAssigner;
  },

  /**
   * Helper: build role-scoped base query for tasks
   */
  getScopeQuery(user: IUser): Record<string, any> {
    const role = user.role.toUpperCase();
    if (role === 'FOUNDER' || role === 'HR') {
      return {};
    }
    if (role === 'MANAGER') {
      return {
        $or: [
          { department: user.department },
          { assignedBy: user._id },
          { assignees: user._id },
          { assignedTo: user._id }
        ]
      };
    }
    // EMPLOYEE or INTERN: own tasks
    return {
      $or: [
        { assignees: user._id },
        { assignedTo: user._id }
      ]
    };
  },

  /**
   * Helper: Resolve and validate recipient user IDs based on targetType and payload
   */
  async resolveAssignees(
    creator: IUser,
    payload: {
      targetType?: string;
      assigneeIds?: string[];
      assignees?: string[];
      assignedTo?: string;
    }
  ): Promise<{ error?: string; status?: number; users: IUser[] }> {
    const creatorRole = creator.role.toUpperCase();
    const creatorIdStr = creator._id.toString();

    // Determine target mode
    const mode = (payload.targetType || 'MEMBERS').toUpperCase();
    let targetUsers: IUser[] = [];

    if (mode === 'INTERNS') {
      const filter: Record<string, any> = { role: 'INTERN', status: 'ACTIVE' };
      if (creatorRole === 'MANAGER') {
        filter.department = creator.department;
      }
      targetUsers = await UserModel.find(filter);
    } else if (mode === 'EMPLOYEES') {
      const filter: Record<string, any> = { role: 'EMPLOYEE', status: 'ACTIVE' };
      if (creatorRole === 'MANAGER') {
        filter.department = creator.department;
      }
      targetUsers = await UserModel.find(filter);
    } else if (mode === 'HR') {
      if (creatorRole === 'MANAGER') {
        return { error: 'Managers cannot assign tasks to HR.', status: 403, users: [] };
      }
      targetUsers = await UserModel.find({ role: 'HR', status: 'ACTIVE' });
    }

    // If specific members are selected or provided in addition/instead
    const rawIds: string[] = Array.isArray(payload.assigneeIds)
      ? payload.assigneeIds
      : Array.isArray(payload.assignees)
      ? payload.assignees
      : payload.assignedTo
      ? [payload.assignedTo]
      : [];

    if (mode === 'MEMBERS' || (rawIds.length > 0 && ['INTERNS', 'EMPLOYEES', 'HR'].includes(mode))) {
      // Validate IDs
      const uniqueIds = Array.from(new Set(rawIds.map(id => (id ? id.toString().trim() : '')))).filter(Boolean);
      for (const id of uniqueIds) {
        if (!Types.ObjectId.isValid(id)) {
          return { error: `Invalid assignee user ID: ${id}`, status: 400, users: [] };
        }
      }

      if (uniqueIds.length === 0 && mode === 'MEMBERS') {
        return { error: 'Please select at least one assignee.', status: 400, users: [] };
      }

      if (uniqueIds.length > 0) {
        const found = await UserModel.find({ _id: { $in: uniqueIds }, status: 'ACTIVE' });
        if (found.length !== uniqueIds.length) {
          return { error: 'One or more selected assignees could not be found or are inactive.', status: 404, users: [] };
        }
        targetUsers = found;
      }
    }

    // Filter out self-assignment
    const filteredUsers = targetUsers.filter(u => u._id.toString() !== creatorIdStr);
    if (filteredUsers.length === 0) {
      if (targetUsers.length > 0) {
        return { error: 'You cannot assign a task to yourself. Please select team members.', status: 400, users: [] };
      }
      return { error: 'No eligible assignees found for the selected target.', status: 400, users: [] };
    }

    // Role-based permissions checks
    for (const assignee of filteredUsers) {
      const aRole = assignee.role.toUpperCase();
      if (creatorRole === 'HR' && aRole === 'FOUNDER') {
        return { error: 'HR cannot assign tasks to Founders.', status: 403, users: [] };
      }
      if (creatorRole === 'MANAGER') {
        if (assignee.department !== creator.department) {
          return {
            error: `Managers can only assign tasks within their department (${creator.department}). (${assignee.name} is in ${assignee.department})`,
            status: 403,
            users: []
          };
        }
      }
    }

    return { users: filteredUsers };
  },

  /**
   * GET /api/tasks
   * List tasks with multi-parameter filtering and role-based counters
   */
  async getTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // Idempotently check and dispatch overdue alerts
      await taskController.checkOverdueTasks();

      const scopeQuery = taskController.getScopeQuery(user);
      const {
        search,
        status,
        priority,
        assignee,
        assignedBy,
        department,
        deadline
      } = req.query as Record<string, string>;

      const query: Record<string, any> = { ...scopeQuery };

      // Priority filter
      if (priority && priority.toUpperCase() !== 'ALL') {
        query.priority = priority.toUpperCase();
      }

      // Assignee filter (matches assignees array or legacy assignedTo)
      if (assignee && Types.ObjectId.isValid(assignee)) {
        const aOid = new Types.ObjectId(assignee);
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ assignees: aOid }, { assignedTo: aOid }]
        });
      }

      // Assigned By filter
      if (assignedBy && Types.ObjectId.isValid(assignedBy)) {
        query.assignedBy = new Types.ObjectId(assignedBy);
      }

      // Department filter
      if (department && department.toUpperCase() !== 'ALL') {
        query.department = department;
      }

      // Status & Overdue filter
      const now = new Date();
      if (status) {
        const s = status.toUpperCase();
        if (s === 'OVERDUE') {
          query.status = { $nin: ['COMPLETED', 'CANCELLED'] };
          query.deadline = { $lt: now };
        } else if (s === 'ACTIVE') {
          query.status = { $in: ['TODO', 'IN_PROGRESS'] };
        } else if (s !== 'ALL') {
          query.status = s;
        }
      }

      // Deadline window filter
      if (deadline) {
        const d = deadline.toLowerCase();
        if (d === 'overdue') {
          query.status = { $nin: ['COMPLETED', 'CANCELLED'] };
          query.deadline = { $lt: now };
        } else if (d === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          query.deadline = { $gte: startOfToday, $lte: endOfToday };
        } else if (d === 'this_week') {
          const startOfWeek = new Date();
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date();
          endOfWeek.setDate(startOfWeek.getDate() + (7 - startOfWeek.getDay()));
          endOfWeek.setHours(23, 59, 59, 999);
          query.deadline = { $gte: startOfWeek, $lte: endOfWeek };
        }
      }

      // Search filter (title, description, or matched user names)
      if (search && search.trim().length > 0) {
        const regex = new RegExp(search.trim(), 'i');
        // Find users matching search
        const matchedUsers = await UserModel.find({ name: regex }).select('_id');
        const userIds = matchedUsers.map(u => u._id);

        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { title: regex },
            { description: regex },
            { assignedTo: { $in: userIds } },
            { assignees: { $in: userIds } },
            { assignedBy: { $in: userIds } }
          ]
        });
      }

      // Execute task query with populated references
      const tasks = await TaskModel.find(query)
        .populate('assignedTo', 'name email role department designation profilePhoto')
        .populate('assignees', 'name email role department designation profilePhoto')
        .populate('assignedBy', 'name email role department designation profilePhoto')
        .sort({ deadline: 1, createdAt: -1 });

      // Compute counters for user's scope
      const [allCount, todoCount, inProgressCount, completedCount, overdueCount] =
        await Promise.all([
          TaskModel.countDocuments(scopeQuery),
          TaskModel.countDocuments({ ...scopeQuery, status: 'TODO' }),
          TaskModel.countDocuments({ ...scopeQuery, status: 'IN_PROGRESS' }),
          TaskModel.countDocuments({ ...scopeQuery, status: 'COMPLETED' }),
          TaskModel.countDocuments({
            ...scopeQuery,
            status: { $nin: ['COMPLETED', 'CANCELLED'] },
            deadline: { $lt: now }
          })
        ]);

      res.json({
        success: true,
        tasks,
        counters: {
          all: allCount,
          todo: todoCount,
          inProgress: inProgressCount,
          completed: completedCount,
          overdue: overdueCount
        }
      });
    } catch (error) {
      console.error('[taskController.getTasks] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve tasks', error });
    }
  },

  /**
   * GET /api/tasks/:id
   * Fetch a single task with populated references and permission checks
   */
  async getTaskById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid task ID' });
        return;
      }

      const task = await TaskModel.findById(id)
        .populate('assignedTo', 'name email role department designation profilePhoto phone')
        .populate('assignees', 'name email role department designation profilePhoto phone')
        .populate('assignedBy', 'name email role department designation profilePhoto')
        .populate('comments.author', 'name role profilePhoto')
        .populate('attachments.uploadedBy', 'name role')
        .populate('proofOfWork.uploadedBy', 'name role');

      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      if (!taskController.canAccessTask(user, task)) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this task.'
        });
        return;
      }

      res.json({ success: true, task });
    } catch (error) {
      console.error('[taskController.getTaskById] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve task', error });
    }
  },

  /**
   * POST /api/tasks
   * Create a new task (FOUNDER, HR, MANAGER only) with single or multi-member assignees
   */
  async createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userRole = user.role.toUpperCase();
      if (userRole !== 'FOUNDER' && userRole !== 'HR' && userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          message: 'Employees and Interns cannot create or assign tasks.'
        });
        return;
      }

      const { title, description, priority, deadline, targetType, assigneeIds, assignees, assignedTo } = req.body;

      // Validation
      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Task title is required.' });
        return;
      }

      const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
      const taskPriority = (priority || 'MEDIUM').toUpperCase() as TaskPriority;
      if (!validPriorities.includes(taskPriority)) {
        res.status(400).json({ success: false, message: 'Invalid priority level.' });
        return;
      }

      if (!deadline) {
        res.status(400).json({ success: false, message: 'Task deadline is required.' });
        return;
      }

      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        res.status(400).json({ success: false, message: 'Invalid deadline format.' });
        return;
      }

      if (deadlineDate.getTime() <= Date.now()) {
        res.status(400).json({ success: false, message: 'Deadline must be in the future.' });
        return;
      }

      // Resolve and validate assignees based on targetType / IDs
      const resolution = await taskController.resolveAssignees(user, {
        targetType,
        assigneeIds,
        assignees,
        assignedTo
      });

      if (resolution.error || !resolution.users || resolution.users.length === 0) {
        res.status(resolution.status || 400).json({
          success: false,
          message: resolution.error || 'At least one valid assignee is required.'
        });
        return;
      }

      const validAssignees = resolution.users;
      const primaryAssignee = validAssignees[0];

      // Create the Task canonical document
      const task = new TaskModel({
        title: title.trim(),
        description: (description || '').trim(),
        assignedTo: primaryAssignee._id,
        assignees: validAssignees.map(u => u._id),
        assignedBy: user._id,
        department: primaryAssignee.department || user.department || 'General',
        priority: taskPriority,
        status: 'TODO',
        deadline: deadlineDate,
        assignedAt: new Date(),
        startedAt: null,
        completedAt: null,
        comments: [],
        attachments: [],
        proofOfWork: []
      });

      const savedTask = await task.save();

      // Create activity logs
      const assigneeNames = validAssignees.map(u => u.name).join(', ');
      await TaskActivityModel.create([
        {
          taskId: savedTask._id,
          actorId: user._id,
          type: 'TASK_CREATED',
          message: `${user.name} created task "${savedTask.title}".`
        },
        {
          taskId: savedTask._id,
          actorId: user._id,
          type: 'TASK_ASSIGNED',
          message: `${user.name} assigned this task to ${assigneeNames}.`,
          metadata: {
            assignees: validAssignees.map(u => u._id),
            priority: taskPriority,
            deadline: deadlineDate
          }
        }
      ]);

      // Dispatch idempotent Notification & Socket.IO message for each newly assigned member
      for (const assigneeUser of validAssignees) {
        await notificationDispatcher.dispatch({
          recipientId: assigneeUser._id,
          senderId: user._id,
          type: 'TASK_ASSIGNED',
          title: 'NEW TASK ASSIGNED',
          message: `${user.name} assigned you a new task: "${savedTask.title}". Deadline: ${deadlineDate.toLocaleDateString()}`,
          relatedEntityType: 'TASK',
          relatedEntityId: savedTask._id,
          link: `/tasks/${savedTask._id}`,
          idempotencyKey: `task_assigned_${savedTask._id}_${assigneeUser._id}`
        });

        if (io) {
          io.to(`user:${assigneeUser._id.toString()}`).emit('task_assigned', {
            taskId: savedTask._id,
            title: savedTask.title,
            assignedBy: user.name
          });
        }
      }

      const populatedTask = await TaskModel.findById(savedTask._id)
        .populate('assignedTo', 'name email role department designation profilePhoto')
        .populate('assignees', 'name email role department designation profilePhoto')
        .populate('assignedBy', 'name email role department designation profilePhoto');

      res.status(201).json({
        success: true,
        message: 'Task assigned successfully.',
        task: populatedTask
      });
    } catch (error) {
      console.error('[taskController.createTask] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to create task', error });
    }
  },

  /**
   * PATCH /api/tasks/:id
   * Edit task metadata and reassign / add / remove members (FOUNDER, HR, MANAGER)
   */
  async updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const task = await TaskModel.findById(id);
      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      const userRole = user.role.toUpperCase();
      if (userRole !== 'FOUNDER' && userRole !== 'HR' && userRole !== 'MANAGER') {
        res.status(403).json({ success: false, message: 'Only managers and HR can edit task details.' });
        return;
      }

      if (userRole === 'MANAGER' && task.department !== user.department) {
        res.status(403).json({ success: false, message: 'You can only edit tasks for your department.' });
        return;
      }

      const { title, description, priority, deadline, assignedTo, assignees, assigneeIds, status, targetType } = req.body;
      const updates: Record<string, any> = {};
      const activities: Array<{ type: TaskActivityType; message: string }> = [];

      if (title && title.trim()) {
        updates.title = title.trim();
      }

      if (description !== undefined) {
        updates.description = description.trim();
      }

      if (status && ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
        const s = status.toUpperCase() as TaskStatus;
        if (s !== task.status) {
          updates.status = s;
          if (s === 'IN_PROGRESS' && !task.startedAt) updates.startedAt = new Date();
          if (s === 'COMPLETED' && !task.completedAt) updates.completedAt = new Date();
          activities.push({
            type: 'STATUS_CHANGED' as any,
            message: `${user.name} changed status from ${task.status} to ${s}.`
          });

          // Notify all assignees of status change
          const allMemberIds: Types.ObjectId[] =
            task.assignees && task.assignees.length > 0 ? task.assignees : task.assignedTo ? [task.assignedTo] : [];
          for (const mId of allMemberIds) {
            if (mId.toString() !== user._id.toString()) {
              await notificationDispatcher.dispatch({
                recipientId: mId,
                senderId: user._id,
                type: 'TASK_STATUS_CHANGED',
                title: 'Task Status Updated',
                message: `Status of "${task.title}" changed to ${s} by ${user.name}.`,
                relatedEntityType: 'TASK',
                relatedEntityId: task._id,
                link: `/tasks/${task._id}`
              });
            }
          }
        }
      }

      if (priority && ['HIGH', 'MEDIUM', 'LOW'].includes(priority.toUpperCase())) {
        const p = priority.toUpperCase() as TaskPriority;
        if (p !== task.priority) {
          updates.priority = p;
          activities.push({
            type: 'PRIORITY_CHANGED',
            message: `${user.name} changed priority from ${task.priority} to ${p}.`
          });
        }
      }

      if (deadline) {
        const d = new Date(deadline);
        if (!isNaN(d.getTime())) {
          updates.deadline = d;
          activities.push({
            type: 'DEADLINE_CHANGED',
            message: `${user.name} updated deadline to ${d.toLocaleDateString()}.`
          });

          // Notify all current assignees of deadline change
          const curAssignees: Types.ObjectId[] =
            task.assignees && task.assignees.length > 0 ? task.assignees : task.assignedTo ? [task.assignedTo] : [];
          for (const aId of curAssignees) {
            if (aId.toString() !== user._id.toString()) {
              await notificationDispatcher.dispatch({
                recipientId: aId,
                senderId: user._id,
                type: 'TASK_DEADLINE_CHANGED',
                title: 'Task Deadline Updated',
                message: `Deadline for "${task.title}" updated to ${d.toLocaleDateString()} by ${user.name}.`,
                relatedEntityType: 'TASK',
                relatedEntityId: task._id,
                link: `/tasks/${task._id}`
              });
            }
          }
        }
      }

      // Member assignment / reassignment
      const hasAssigneeUpdate = assignedTo !== undefined || assignees !== undefined || assigneeIds !== undefined || targetType !== undefined;
      if (hasAssigneeUpdate) {
        const resolution = await taskController.resolveAssignees(user, {
          targetType,
          assigneeIds,
          assignees,
          assignedTo
        });

        if (resolution.error || !resolution.users || resolution.users.length === 0) {
          res.status(resolution.status || 400).json({
            success: false,
            message: resolution.error || 'Failed to update assignees.'
          });
          return;
        }

        const newAssignees = resolution.users;
        const newAssigneeIdStrs = new Set(newAssignees.map(u => u._id.toString()));
        const oldAssigneeIdStrs = new Set(
          (task.assignees && task.assignees.length > 0 ? task.assignees.map(a => a.toString()) : [task.assignedTo?.toString()]).filter(Boolean) as string[]
        );

        // Detect newly added and removed assignees
        const newlyAdded = newAssignees.filter(u => !oldAssigneeIdStrs.has(u._id.toString()));
        const removedIds = Array.from(oldAssigneeIdStrs).filter(id => !newAssigneeIdStrs.has(id));

        updates.assignees = newAssignees.map(u => u._id);
        updates.assignedTo = newAssignees[0]._id;
        updates.department = newAssignees[0].department || task.department;

        if (newlyAdded.length > 0) {
          const addedNames = newlyAdded.map(u => u.name).join(', ');
          activities.push({
            type: 'TASK_ASSIGNED',
            message: `${user.name} added ${addedNames} to this task.`
          });

          // Dispatch notification ONLY to newly added assignees
          for (const newMember of newlyAdded) {
            await notificationDispatcher.dispatch({
              recipientId: newMember._id,
              senderId: user._id,
              type: 'TASK_ASSIGNED',
              title: 'NEW TASK ASSIGNED',
              message: `${user.name} added you to task "${task.title}". Deadline: ${new Date(task.deadline).toLocaleDateString()}`,
              relatedEntityType: 'TASK',
              relatedEntityId: task._id,
              link: `/tasks/${task._id}`,
              idempotencyKey: `task_assigned_${task._id}_${newMember._id}`
            });

            if (io) {
              io.to(`user:${newMember._id.toString()}`).emit('task_assigned', {
                taskId: task._id,
                title: task.title,
                assignedBy: user.name
              });
            }
          }
        }

        if (removedIds.length > 0) {
          activities.push({
            type: 'TASK_UPDATED',
            message: `${user.name} updated assigned members.`
          });
        }
      }

      const updatedTask = await TaskModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      )
        .populate('assignedTo', 'name email role department designation profilePhoto')
        .populate('assignees', 'name email role department designation profilePhoto')
        .populate('assignedBy', 'name email role department designation profilePhoto');

      // Record any changes
      for (const act of activities) {
        await TaskActivityModel.create({
          taskId: task._id,
          actorId: user._id,
          type: act.type,
          message: act.message
        });
      }

      res.json({ success: true, message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
      console.error('[taskController.updateTask] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update task', error });
    }
  },

  /**
   * DELETE /api/tasks/:id
   * Cancel task
   */
  async cancelTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const task = await TaskModel.findById(id);
      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      const userRole = user.role.toUpperCase();
      if (userRole !== 'FOUNDER' && userRole !== 'HR' && userRole !== 'MANAGER') {
        res.status(403).json({ success: false, message: 'Unauthorized to cancel this task.' });
        return;
      }

      task.status = 'CANCELLED';
      await task.save();

      await TaskActivityModel.create({
        taskId: task._id,
        actorId: user._id,
        type: 'TASK_CANCELLED',
        message: `${user.name} cancelled this task.`
      });

      // Notify all assignees
      const allAssigneeIds: Types.ObjectId[] =
        task.assignees && task.assignees.length > 0 ? task.assignees : task.assignedTo ? [task.assignedTo] : [];
      for (const aId of allAssigneeIds) {
        if (aId.toString() !== user._id.toString()) {
          await notificationDispatcher.dispatch({
            recipientId: aId,
            senderId: user._id,
            type: 'TASK_STATUS_CHANGED',
            title: 'Task Cancelled',
            message: `"${task.title}" was cancelled by ${user.name}.`,
            relatedEntityType: 'TASK',
            relatedEntityId: task._id,
            link: `/tasks/${task._id}`
          });
        }
      }

      res.json({ success: true, message: 'Task cancelled successfully', task });
    } catch (error) {
      console.error('[taskController.cancelTask] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel task', error });
    }
  },

  /**
   * POST /api/tasks/:id/start
   * Start task: transitions TODO -> IN_PROGRESS
   */
  async startTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const task = await TaskModel.findById(id);
      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      const userIdStr = user._id.toString();
      const isAssignee =
        (Array.isArray(task.assignees) &&
          task.assignees.some((a: any) => (a._id ? a._id.toString() : a.toString()) === userIdStr)) ||
        Boolean(task.assignedTo && (task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString()) === userIdStr);

      const isManager = ['FOUNDER', 'HR', 'MANAGER'].includes(user.role.toUpperCase());
      if (!isAssignee && !isManager) {
        res.status(403).json({ success: false, message: 'You can only start tasks assigned to you.' });
        return;
      }

      // Status transition validation
      if (task.status === 'IN_PROGRESS') {
        res.json({ success: true, message: 'Task is already in progress.', task });
        return;
      }

      if (task.status === 'COMPLETED') {
        res.status(400).json({ success: false, message: 'Cannot start an already completed task.' });
        return;
      }

      if (task.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'Cannot start a cancelled task.' });
        return;
      }

      task.status = 'IN_PROGRESS';
      task.startedAt = new Date();
      await task.save();

      // Record activity
      await TaskActivityModel.create({
        taskId: task._id,
        actorId: user._id,
        type: 'TASK_STARTED',
        message: `${user.name} started working on this task.`
      });

      // Notify assignor if not self
      if (task.assignedBy.toString() !== user._id.toString()) {
        await notificationDispatcher.dispatch({
          recipientId: task.assignedBy,
          senderId: user._id,
          type: 'TASK_STARTED',
          title: 'TASK STARTED',
          message: `${user.name} started work on "${task.title}".`,
          relatedEntityType: 'TASK',
          relatedEntityId: task._id,
          link: `/tasks/${task._id}`
        });
      }

      const populatedTask = await TaskModel.findById(task._id)
        .populate('assignedTo', 'name email role department designation profilePhoto')
        .populate('assignees', 'name email role department designation profilePhoto')
        .populate('assignedBy', 'name email role department designation profilePhoto');

      res.json({ success: true, message: 'Task started successfully', task: populatedTask });
    } catch (error) {
      console.error('[taskController.startTask] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to start task', error });
    }
  },

  /**
   * POST /api/tasks/:id/complete
   * Complete task: transitions IN_PROGRESS (or TODO) -> COMPLETED
   * Accepts optional completion notes and proof of work
   */
  async completeTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const task = await TaskModel.findById(id);
      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      const userIdStr = user._id.toString();
      const isAssignee =
        (Array.isArray(task.assignees) &&
          task.assignees.some((a: any) => (a._id ? a._id.toString() : a.toString()) === userIdStr)) ||
        Boolean(task.assignedTo && (task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString()) === userIdStr);

      const isManager = ['FOUNDER', 'HR', 'MANAGER'].includes(user.role.toUpperCase());
      if (!isAssignee && !isManager) {
        res.status(403).json({ success: false, message: 'You can only complete tasks assigned to you.' });
        return;
      }

      if (task.status === 'COMPLETED') {
        res.json({ success: true, message: 'Task is already completed.', task });
        return;
      }

      if (task.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'Cannot complete a cancelled task.' });
        return;
      }

      const { completionComment, proofOfWork } = req.body;

      task.status = 'COMPLETED';
      task.completedAt = new Date();

      // If proof of work provided
      if (proofOfWork && proofOfWork.filename && proofOfWork.url) {
        task.proofOfWork.push({
          filename: proofOfWork.filename,
          fileType: proofOfWork.fileType || 'application/octet-stream',
          size: proofOfWork.size || 0,
          url: proofOfWork.url,
          comment: completionComment || proofOfWork.comment || '',
          uploadedBy: user._id,
          uploadedAt: new Date()
        });

        await TaskActivityModel.create({
          taskId: task._id,
          actorId: user._id,
          type: 'PROOF_UPLOADED',
          message: `${user.name} attached proof of work: ${proofOfWork.filename}`
        });
      }

      // If completion comment provided
      if (completionComment && completionComment.trim()) {
        task.comments.push({
          author: user._id,
          message: completionComment.trim(),
          createdAt: new Date()
        });
      }

      await task.save();

      // Record activity
      await TaskActivityModel.create({
        taskId: task._id,
        actorId: user._id,
        type: 'TASK_COMPLETED',
        message: `${user.name} marked this task completed.`
      });

      // Notify assignor and fellow assignees
      const notifyRecipients = new Set<string>();
      if (task.assignedBy) notifyRecipients.add(task.assignedBy.toString());
      if (task.assignees) {
        task.assignees.forEach(a => notifyRecipients.add(a.toString()));
      }
      if (task.assignedTo) notifyRecipients.add(task.assignedTo.toString());
      notifyRecipients.delete(user._id.toString());

      for (const recId of Array.from(notifyRecipients)) {
        await notificationDispatcher.dispatch({
          recipientId: recId,
          senderId: user._id,
          type: 'TASK_COMPLETED',
          title: 'TASK COMPLETED',
          message: `${user.name} completed: "${task.title}".`,
          relatedEntityType: 'TASK',
          relatedEntityId: task._id,
          link: `/tasks/${task._id}`
        });
      }

      const populatedTask = await TaskModel.findById(task._id)
        .populate('assignedTo', 'name email role department designation profilePhoto')
        .populate('assignees', 'name email role department designation profilePhoto')
        .populate('assignedBy', 'name email role department designation profilePhoto')
        .populate('comments.author', 'name role profilePhoto')
        .populate('proofOfWork.uploadedBy', 'name role');

      res.json({ success: true, message: 'Task marked as completed!', task: populatedTask });
    } catch (error) {
      console.error('[taskController.completeTask] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to complete task', error });
    }
  },

  /**
   * POST /api/tasks/:id/comments
   * Add a comment to task
   */
  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
        return;
      }

      const task = await TaskModel.findById(id);
      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      if (!taskController.canAccessTask(user, task)) {
        res.status(403).json({ success: false, message: 'Not authorized to comment on this task.' });
        return;
      }

      task.comments.push({
        author: user._id,
        message: message.trim(),
        createdAt: new Date()
      });

      await task.save();

      // Record activity
      await TaskActivityModel.create({
        taskId: task._id,
        actorId: user._id,
        type: 'COMMENT_ADDED',
        message: `${user.name} added a comment.`
      });

      // Notify all participants (assigner and fellow assignees, except the commenter)
      const notifyRecipientIds = new Set<string>();
      if (task.assignedBy) notifyRecipientIds.add(task.assignedBy.toString());
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach(a => notifyRecipientIds.add(a.toString()));
      }
      if (task.assignedTo) notifyRecipientIds.add(task.assignedTo.toString());
      notifyRecipientIds.delete(user._id.toString());

      for (const recId of Array.from(notifyRecipientIds)) {
        await notificationDispatcher.dispatch({
          recipientId: recId,
          senderId: user._id,
          type: 'COMMENT_ADDED',
          title: 'New Comment on Task',
          message: `${user.name} commented on "${task.title}": "${message.trim().slice(0, 80)}"`,
          relatedEntityType: 'TASK',
          relatedEntityId: task._id,
          link: `/tasks/${task._id}`
        });
      }

      const updated = await TaskModel.findById(id)
        .populate('comments.author', 'name role profilePhoto')
        .select('comments');

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comments: updated?.comments
      });
    } catch (error) {
      console.error('[taskController.addComment] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to add comment', error });
    }
  },

  /**
   * GET /api/tasks/:id/activity
   * Retrieve chronological activity trail
   */
  async getTaskActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const task = await TaskModel.findById(id);
      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      if (!taskController.canAccessTask(user, task)) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      const activities = await TaskActivityModel.find({ taskId: id })
        .populate('actorId', 'name email role profilePhoto')
        .sort({ createdAt: 1 });

      res.json({ success: true, activities });
    } catch (error) {
      console.error('[taskController.getTaskActivity] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve activity', error });
    }
  },

  /**
   * POST /api/tasks/:id/proof
   * Attach proof of work or attachment metadata
   */
  async uploadProofOfWork(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const task = await TaskModel.findById(id);
      if (!task) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }

      if (!taskController.canAccessTask(user, task)) {
        res.status(403).json({ success: false, message: 'Not authorized.' });
        return;
      }

      const { filename, fileType, size, url, comment } = req.body;

      if (!filename || !url) {
        res.status(400).json({ success: false, message: 'Filename and URL are required.' });
        return;
      }

      // Safe file type validation
      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (fileType && !allowedTypes.includes(fileType.toLowerCase()) && !fileType.startsWith('image/')) {
        res.status(400).json({
          success: false,
          message: 'Unsupported file type. Please upload images (PNG/JPEG/WEBP) or PDF documents.'
        });
        return;
      }

      // Size validation: max 15MB
      if (size && size > 15 * 1024 * 1024) {
        res.status(400).json({ success: false, message: 'File size exceeds 15MB limit.' });
        return;
      }

      task.proofOfWork.push({
        filename,
        fileType: fileType || 'image/jpeg',
        size: size || 1024,
        url,
        comment: comment || '',
        uploadedBy: user._id,
        uploadedAt: new Date()
      });

      await task.save();

      await TaskActivityModel.create({
        taskId: task._id,
        actorId: user._id,
        type: 'PROOF_UPLOADED',
        message: `${user.name} uploaded proof of work: ${filename}`
      });

      const updated = await TaskModel.findById(id)
        .populate('proofOfWork.uploadedBy', 'name role');

      res.status(201).json({
        success: true,
        message: 'Proof of work uploaded successfully',
        proofOfWork: updated?.proofOfWork
      });
    } catch (error) {
      console.error('[taskController.uploadProofOfWork] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to upload proof of work', error });
    }
  },

  /**
   * Idempotent check for overdue tasks:
   * Dispatches TASK_OVERDUE notifications to assignees and assigner if not already notified.
   */
  async checkOverdueTasks(): Promise<number> {
    try {
      const now = new Date();
      const overdueTasks = await TaskModel.find({
        status: { $nin: ['COMPLETED', 'CANCELLED'] },
        deadline: { $lt: now }
      });

      let alertsCreated = 0;

      for (const task of overdueTasks) {
        const recipientIds = new Set<string>();
        if (task.assignedTo) recipientIds.add(task.assignedTo.toString());
        if (task.assignees && task.assignees.length > 0) {
          task.assignees.forEach(a => recipientIds.add(a.toString()));
        }
        if (task.assignedBy) recipientIds.add(task.assignedBy.toString());

        for (const recipientIdStr of Array.from(recipientIds)) {
          const recipientId = new Types.ObjectId(recipientIdStr);

          // Idempotency: verify no existing TASK_OVERDUE notification for this task & recipient
          const existing = await NotificationModel.findOne({
            $and: [
              { $or: [{ recipientId }, { recipient: recipientId }] },
              { type: 'TASK_OVERDUE' },
              { $or: [{ relatedEntityId: task._id }, { taskId: task._id }] }
            ]
          });

          if (!existing) {
            await notificationDispatcher.dispatch({
              recipientId,
              type: 'TASK_OVERDUE',
              title: 'TASK OVERDUE',
              message: `"${task.title}" is overdue. (Deadline: ${new Date(task.deadline).toLocaleDateString()})`,
              relatedEntityType: 'TASK',
              relatedEntityId: task._id,
              link: `/tasks/${task._id}`,
              idempotencyKey: `task_overdue_${task._id}_${recipientId}`
            });
            alertsCreated++;
          }
        }
      }

      return alertsCreated;
    } catch (err) {
      console.error('[taskController.checkOverdueTasks] Error:', err);
      return 0;
    }
  }
};
