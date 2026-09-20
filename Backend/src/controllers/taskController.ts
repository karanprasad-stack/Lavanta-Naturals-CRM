import { Response } from 'express';
import { Types } from 'mongoose';
import { TaskModel, ITask, TaskPriority, TaskStatus } from '../models/Task.js';
import { TaskActivityModel, TaskActivityType } from '../models/TaskActivity.js';
import { NotificationModel } from '../models/Notification.js';
import { UserModel, IUser, UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const taskController = {
  /**
   * Helper: check if a user is permitted to manage/view a task
   */
  canAccessTask(user: IUser, task: ITask): boolean {
    const role = user.role.toUpperCase();
    if (role === 'FOUNDER' || role === 'HR') return true;
    if (role === 'MANAGER') {
      return (
        task.department === user.department ||
        task.assignedBy.toString() === user._id.toString() ||
        task.assignedTo.toString() === user._id.toString()
      );
    }
    // Employee & Intern: strictly own tasks
    return (
      task.assignedTo.toString() === user._id.toString() ||
      task.assignedBy.toString() === user._id.toString()
    );
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
          { assignedTo: user._id }
        ]
      };
    }
    // EMPLOYEE or INTERN
    return { assignedTo: user._id };
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

      // Assignee filter
      if (assignee && Types.ObjectId.isValid(assignee)) {
        query.assignedTo = new Types.ObjectId(assignee);
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
            { assignedBy: { $in: userIds } }
          ]
        });
      }

      // Execute task query with populated references
      const tasks = await TaskModel.find(query)
        .populate('assignedTo', 'name email role department designation profilePhoto')
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
   * Create a new task (FOUNDER, HR, MANAGER only)
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

      const { title, description, assignedTo, priority, deadline } = req.body;

      // Validation
      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Task title is required.' });
        return;
      }

      if (!assignedTo || !Types.ObjectId.isValid(assignedTo)) {
        res.status(400).json({ success: false, message: 'Valid assignee is required.' });
        return;
      }

      if (assignedTo.toString() === user._id.toString()) {
        res.status(400).json({
          success: false,
          message: 'You cannot assign a task to yourself. Please select a team member.'
        });
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

      // Check assignee existence and role permission
      const assigneeUser = await UserModel.findById(assignedTo);
      if (!assigneeUser) {
        res.status(404).json({ success: false, message: 'Assignee user not found.' });
        return;
      }

      // Managers can only assign tasks within their own department
      if (userRole === 'MANAGER') {
        if (assigneeUser.department !== user.department) {
          res.status(403).json({
            success: false,
            message: `Managers can only assign tasks within their department (${user.department}).`
          });
          return;
        }
      }

      // Create the Task
      const task = new TaskModel({
        title: title.trim(),
        description: (description || '').trim(),
        assignedTo: assigneeUser._id,
        assignedBy: user._id,
        department: assigneeUser.department || user.department || 'General',
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
          message: `${user.name} assigned this task to ${assigneeUser.name}.`,
          metadata: { assignedTo: assigneeUser._id, priority: taskPriority, deadline: deadlineDate }
        }
      ]);

      // Create real Notification for assignee
      await NotificationModel.create({
        recipientId: assigneeUser._id,
        senderId: user._id,
        type: 'TASK_ASSIGNED',
        title: 'NEW TASK ASSIGNED',
        message: `${user.name} assigned you a new task: "${savedTask.title}". Deadline: ${deadlineDate.toLocaleDateString()}`,
        relatedEntityType: 'TASK',
        relatedEntityId: savedTask._id,
        isRead: false,
        createdAt: new Date()
      });

      const populatedTask = await TaskModel.findById(savedTask._id)
        .populate('assignedTo', 'name email role department designation profilePhoto')
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
   * Edit task metadata (FOUNDER, HR, MANAGER)
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

      const { title, description, priority, deadline, assignedTo } = req.body;
      const updates: Record<string, any> = {};
      const activities: Array<{ type: TaskActivityType; message: string }> = [];

      if (title && title.trim()) {
        updates.title = title.trim();
      }

      if (description !== undefined) {
        updates.description = description.trim();
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
        }
      }

      if (assignedTo && Types.ObjectId.isValid(assignedTo) && assignedTo !== task.assignedTo.toString()) {
        const newAssignee = await UserModel.findById(assignedTo);
        if (newAssignee) {
          updates.assignedTo = newAssignee._id;
          updates.department = newAssignee.department;
          activities.push({
            type: 'TASK_ASSIGNED',
            message: `${user.name} reassigned task to ${newAssignee.name}.`
          });
          // Notify new assignee
          await NotificationModel.create({
            recipient: newAssignee._id,
            sender: user._id,
            type: 'TASK_ASSIGNED',
            title: 'Task Reassigned to You',
            message: `"${task.title}" was assigned to you by ${user.name}.`,
            taskId: task._id
          });
        }
      }

      const updatedTask = await TaskModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      )
        .populate('assignedTo', 'name email role department designation profilePhoto')
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

      await NotificationModel.create({
        recipient: task.assignedTo,
        sender: user._id,
        type: 'TASK_STATUS_CHANGED',
        title: 'Task Cancelled',
        message: `"${task.title}" was cancelled by ${user.name}.`,
        taskId: task._id
      });

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

      // Check if current user is the assignee or an authorized manager
      const isAssignee = task.assignedTo.toString() === user._id.toString();
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
        await NotificationModel.create({
          recipientId: task.assignedBy,
          senderId: user._id,
          type: 'TASK_STARTED',
          title: 'TASK STARTED',
          message: `${user.name} started work on "${task.title}".`,
          relatedEntityType: 'TASK',
          relatedEntityId: task._id,
          isRead: false,
          createdAt: new Date()
        });
      }

      const populatedTask = await TaskModel.findById(task._id)
        .populate('assignedTo', 'name email role department designation profilePhoto')
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

      const isAssignee = task.assignedTo.toString() === user._id.toString();
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

      // Notify assignor
      if (task.assignedBy.toString() !== user._id.toString()) {
        await NotificationModel.create({
          recipientId: task.assignedBy,
          senderId: user._id,
          type: 'TASK_COMPLETED',
          title: 'TASK COMPLETED',
          message: `${user.name} completed: "${task.title}".`,
          relatedEntityType: 'TASK',
          relatedEntityId: task._id,
          isRead: false,
          createdAt: new Date()
        });
      }

      const populatedTask = await TaskModel.findById(task._id)
        .populate('assignedTo', 'name email role department designation profilePhoto')
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

      // Notify the other party
      const notifyRecipientId =
        task.assignedTo.toString() === user._id.toString() ? task.assignedBy : task.assignedTo;

      if (notifyRecipientId && notifyRecipientId.toString() !== user._id.toString()) {
        await NotificationModel.create({
          recipient: notifyRecipientId,
          sender: user._id,
          type: 'COMMENT_ADDED',
          title: 'New Comment on Task',
          message: `${user.name} commented on "${task.title}": "${message.trim().slice(0, 80)}"`,
          taskId: task._id
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
   * Dispatches TASK_OVERDUE notifications to assignee and assigner if not already notified.
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
        if (task.assignedBy) recipientIds.add(task.assignedBy.toString());

        for (const recipientIdStr of recipientIds) {
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
            await NotificationModel.create({
              recipientId,
              type: 'TASK_OVERDUE',
              title: 'TASK OVERDUE',
              message: `"${task.title}" is overdue. (Deadline: ${new Date(task.deadline).toLocaleDateString()})`,
              relatedEntityType: 'TASK',
              relatedEntityId: task._id,
              isRead: false,
              createdAt: new Date()
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
