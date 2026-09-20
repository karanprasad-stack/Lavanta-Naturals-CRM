import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { GoalModel, IGoal, GoalType, GoalStatus } from '../models/Goal.js';
import { ObjectiveModel, IObjective } from '../models/Objective.js';
import { KeyResultModel, IKeyResult } from '../models/KeyResult.js';
import { GoalActivityModel, IGoalActivity } from '../models/GoalActivity.js';
import { TaskModel, ITask } from '../models/Task.js';
import { UserModel, IUser } from '../models/User.js';
import { NotificationModel } from '../models/Notification.js';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export async function recalculateGoalHierarchyProgress(goalId: Types.ObjectId | string): Promise<IGoal | null> {
  const gId = new Types.ObjectId(goalId);
  const goal = await GoalModel.findById(gId);
  if (!goal || goal.isDeleted) return null;

  const objectives = await ObjectiveModel.find({ goalId: gId });

  let totalObjWeightedProgress = 0;
  let totalObjWeight = 0;

  for (const obj of objectives) {
    const keyResults = await KeyResultModel.find({ objectiveId: obj._id });

    if (keyResults.length > 0) {
      let krProgressSum = 0;

      for (const kr of keyResults) {
        let krProgress = 0;
        if (kr.metricType === 'BOOLEAN') {
          krProgress = kr.currentValue ? 100 : 0;
        } else {
          const denominator = kr.targetValue - kr.startValue;
          if (denominator !== 0) {
            krProgress = Math.round(((kr.currentValue - kr.startValue) / denominator) * 100);
          } else {
            krProgress = kr.currentValue >= kr.targetValue ? 100 : 0;
          }
        }
        krProgress = Math.max(0, Math.min(100, krProgress));
        kr.progress = krProgress;

        if (krProgress >= 100) {
          kr.status = 'COMPLETED';
        } else if (kr.deadline && new Date(kr.deadline).getTime() < Date.now()) {
          kr.status = 'BEHIND';
        }
        await kr.save();
        krProgressSum += krProgress;
      }

      obj.progress = Math.round(krProgressSum / keyResults.length);
      if (obj.progress >= 100) {
        obj.status = 'COMPLETED';
      }
      await obj.save();
    }

    const weight = obj.weight || 100;
    totalObjWeightedProgress += (obj.progress * weight);
    totalObjWeight += weight;
  }

  // Calculate goal progress
  if (totalObjWeight > 0) {
    goal.progress = Math.round(totalObjWeightedProgress / totalObjWeight);
  }

  // Calculate At-Risk status
  const now = Date.now();
  const startMs = new Date(goal.startDate).getTime();
  const endMs = new Date(goal.endDate).getTime();
  const totalDuration = endMs - startMs;

  if (goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED') {
    if (goal.progress >= 100) {
      goal.status = 'COMPLETED';
    } else if (totalDuration > 0 && now > startMs) {
      const elapsed = now - startMs;
      const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      // If actual progress is more than 20% behind expected progress, flag as AT_RISK
      if (expectedProgress - goal.progress > 20) {
        goal.status = 'AT_RISK';
      } else if (goal.status === 'AT_RISK' && expectedProgress - goal.progress <= 20) {
        goal.status = 'ACTIVE';
      }
    }
  }

  await goal.save();
  return goal;
}

function canUserModifyGoal(user: IUser, goal: IGoal): boolean {
  const role = user.role.toUpperCase();
  if (role === 'FOUNDER' || role === 'HR') return true;
  if (goal.createdBy.toString() === user._id.toString()) return true;
  if (goal.owner.toString() === user._id.toString()) return true;
  if (role === 'MANAGER' && goal.department === user.department) return true;
  return false;
}

export const goalController = {
  /**
   * GET /api/goals
   * List goals with RBAC, filters, and search
   */
  async getGoals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const role = user.role.toUpperCase();
      const {
        type,
        status,
        department,
        owner,
        search,
        page = '1',
        limit = '50'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const query: Record<string, any> = { isDeleted: false };

      // RBAC Scope
      if (role === 'FOUNDER' || role === 'HR') {
        // Full company visibility
      } else if (role === 'MANAGER') {
        // Company goals + department goals + created/owned goals
        query.$or = [
          { type: 'COMPANY' },
          { department: user.department },
          { owner: user._id },
          { createdBy: user._id }
        ];
      } else {
        // Employee/Intern: Company goals + assigned goals + own department
        query.$or = [
          { type: 'COMPANY' },
          { owner: user._id },
          { createdBy: user._id },
          { department: user.department }
        ];
      }

      // Filter: Type
      if (typeof type === 'string' && type !== 'ALL') {
        query.type = type.toUpperCase();
      }

      // Filter: Status
      if (typeof status === 'string' && status !== 'ALL') {
        query.status = status.toUpperCase();
      }

      // Filter: Department
      if (typeof department === 'string' && department !== 'ALL') {
        query.department = department;
      }

      // Filter: Owner
      if (typeof owner === 'string' && Types.ObjectId.isValid(owner)) {
        query.owner = new Types.ObjectId(owner);
      }

      // Filter: Search
      if (typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ title: regex }, { description: regex }]
        });
      }

      const [goals, total] = await Promise.all([
        GoalModel.find(query)
          .populate('owner', 'name email role department designation profilePhoto')
          .populate('createdBy', 'name email role department designation')
          .sort({ endDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        GoalModel.countDocuments(query)
      ]);

      res.json({
        success: true,
        goals,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('[goalController.getGoals] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch goals.' });
    }
  },

  /**
   * GET /api/goals/:id
   * Get single goal with its full hierarchy (Objectives, Key Results, and connected Tasks)
   */
  async getGoalById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid goal ID.' });
        return;
      }

      const goal = await GoalModel.findOne({ _id: id, isDeleted: false })
        .populate('owner', 'name email role department designation profilePhoto')
        .populate('createdBy', 'name email role department designation')
        .populate('comments.author', 'name role profilePhoto')
        .lean();

      if (!goal) {
        res.status(404).json({ success: false, message: 'Goal not found.' });
        return;
      }

      // Fetch all Objectives for this goal
      const objectives = await ObjectiveModel.find({ goalId: goal._id })
        .populate('owner', 'name email role department designation profilePhoto')
        .populate('contributors', 'name email role department designation profilePhoto')
        .lean();

      const objIds = objectives.map(o => o._id);

      // Fetch all KeyResults for these objectives
      const keyResults = await KeyResultModel.find({ objectiveId: { $in: objIds } })
        .populate('owner', 'name email role department designation profilePhoto')
        .lean();

      const krIds = keyResults.map(k => k._id);

      // Fetch all related Tasks linked to this goal, objectives, or key results
      const relatedTasks = await TaskModel.find({
        $or: [
          { goalId: goal._id },
          { objectiveId: { $in: objIds } },
          { keyResultId: { $in: krIds } }
        ]
      })
        .populate('assignedTo', 'name email role department profilePhoto')
        .select('title status priority deadline startedAt completedAt goalId objectiveId keyResultId')
        .lean();

      // Nest KeyResults and Tasks inside their respective Objectives
      const enrichedObjectives = objectives.map(obj => {
        const objKRs = keyResults.filter(kr => kr.objectiveId.toString() === obj._id.toString());
        const enrichedKRs = objKRs.map(kr => {
          const krTasks = relatedTasks.filter(t => t.keyResultId && t.keyResultId.toString() === kr._id.toString());
          const completedTasksCount = krTasks.filter(t => t.status === 'COMPLETED').length;
          return {
            ...kr,
            tasks: krTasks,
            taskStats: {
              total: krTasks.length,
              completed: completedTasksCount,
              percentage: krTasks.length > 0 ? Math.round((completedTasksCount / krTasks.length) * 100) : 0
            }
          };
        });

        const objTasks = relatedTasks.filter(t => t.objectiveId && t.objectiveId.toString() === obj._id.toString());
        return {
          ...obj,
          keyResults: enrichedKRs,
          tasks: objTasks
        };
      });

      // Recent GoalActivity
      const activities = await GoalActivityModel.find({ goalId: goal._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('actorId', 'name role profilePhoto')
        .lean();

      res.json({
        success: true,
        goal: {
          ...goal,
          objectives: enrichedObjectives,
          activities,
          relatedTasksCount: relatedTasks.length
        }
      });
    } catch (error) {
      console.error('[goalController.getGoalById] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch goal details.' });
    }
  },

  /**
   * POST /api/goals
   * Create a new goal
   */
  async createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const role = user.role.toUpperCase();
      const {
        title,
        description,
        type = 'COMPANY',
        owner,
        department,
        team,
        startDate,
        endDate,
        priority = 'MEDIUM',
        status = 'ACTIVE'
      } = req.body;

      if (!title || !startDate || !endDate) {
        res.status(400).json({ success: false, message: 'Title, start date, and end date are required.' });
        return;
      }

      if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
        res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
        return;
      }

      // Role check: Only Founder & HR can create COMPANY goals
      if (type.toUpperCase() === 'COMPANY' && !['FOUNDER', 'HR'].includes(role)) {
        res.status(403).json({ success: false, message: 'Only Founder or HR can create Company-level goals.' });
        return;
      }

      const assignedOwnerId = owner && Types.ObjectId.isValid(owner)
        ? new Types.ObjectId(owner)
        : user._id;

      const newGoal = await GoalModel.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        type: type.toUpperCase() as GoalType,
        owner: assignedOwnerId,
        department: department || user.department || 'General',
        team: team || 'Core',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority: priority.toUpperCase(),
        status: status.toUpperCase() as GoalStatus,
        progress: 0,
        createdBy: user._id
      });

      // Log activity
      await GoalActivityModel.create({
        goalId: newGoal._id,
        actorId: user._id,
        type: 'GOAL_CREATED',
        message: `${user.name} created goal "${newGoal.title}".`
      });

      // Send notification to owner if not creator
      if (assignedOwnerId.toString() !== user._id.toString()) {
        await NotificationModel.create({
          recipientId: assignedOwnerId,
          senderId: user._id,
          type: 'GOAL_ASSIGNED',
          title: 'Goal Assigned',
          message: `You were assigned as owner of goal "${newGoal.title}".`,
          relatedEntityType: 'GOAL',
          relatedEntityId: newGoal._id
        });
      }

      res.status(201).json({ success: true, message: 'Goal created successfully.', goal: newGoal });
    } catch (error) {
      console.error('[goalController.createGoal] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to create goal.' });
    }
  },

  /**
   * PATCH /api/goals/:id
   * Update goal details
   */
  async updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid goal ID.' });
        return;
      }

      const goal = await GoalModel.findById(id);
      if (!goal || goal.isDeleted) {
        res.status(404).json({ success: false, message: 'Goal not found.' });
        return;
      }

      if (!canUserModifyGoal(user, goal)) {
        res.status(403).json({ success: false, message: 'Not authorized to modify this goal.' });
        return;
      }

      const { title, description, type, owner, department, team, startDate, endDate, priority, status } = req.body;

      if (title) goal.title = title.trim();
      if (description !== undefined) goal.description = description.trim();
      if (type && ['FOUNDER', 'HR'].includes(user.role.toUpperCase())) goal.type = type.toUpperCase();
      if (owner && Types.ObjectId.isValid(owner)) goal.owner = new Types.ObjectId(owner);
      if (department) goal.department = department.trim();
      if (team) goal.team = team.trim();
      if (startDate) goal.startDate = new Date(startDate);
      if (endDate) goal.endDate = new Date(endDate);
      if (priority) goal.priority = priority.toUpperCase();
      if (status) goal.status = status.toUpperCase();

      await goal.save();
      await recalculateGoalHierarchyProgress(goal._id);

      await GoalActivityModel.create({
        goalId: goal._id,
        actorId: user._id,
        type: 'GOAL_UPDATED',
        message: `${user.name} updated goal details.`
      });

      res.json({ success: true, message: 'Goal updated successfully.', goal });
    } catch (error) {
      console.error('[goalController.updateGoal] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update goal.' });
    }
  },

  /**
   * DELETE /api/goals/:id
   * Soft-delete goal
   */
  async deleteGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid goal ID.' });
        return;
      }

      const goal = await GoalModel.findById(id);
      if (!goal || goal.isDeleted) {
        res.status(404).json({ success: false, message: 'Goal not found.' });
        return;
      }

      if (!canUserModifyGoal(user, goal)) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this goal.' });
        return;
      }

      goal.isDeleted = true;
      goal.deletedAt = new Date();
      await goal.save();

      res.json({ success: true, message: 'Goal deleted successfully.' });
    } catch (error) {
      console.error('[goalController.deleteGoal] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete goal.' });
    }
  },

  /**
   * POST /api/goals/:goalId/objectives
   * Add an Objective under a goal
   */
  async addObjective(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { goalId } = req.params;
      const { title, description, owner, contributors = [], startDate, endDate, weight = 100 } = req.body;

      if (!Types.ObjectId.isValid(goalId)) {
        res.status(400).json({ success: false, message: 'Invalid goal ID.' });
        return;
      }

      const goal = await GoalModel.findOne({ _id: goalId, isDeleted: false });
      if (!goal) {
        res.status(404).json({ success: false, message: 'Goal not found.' });
        return;
      }

      if (!title) {
        res.status(400).json({ success: false, message: 'Objective title is required.' });
        return;
      }

      const assignedOwner = owner && Types.ObjectId.isValid(owner) ? new Types.ObjectId(owner) : user._id;

      const objective = await ObjectiveModel.create({
        goalId: goal._id,
        title: title.trim(),
        description: description ? description.trim() : '',
        owner: assignedOwner,
        contributors: Array.isArray(contributors) ? contributors.filter(id => Types.ObjectId.isValid(id)) : [],
        startDate: startDate ? new Date(startDate) : goal.startDate,
        endDate: endDate ? new Date(endDate) : goal.endDate,
        progress: 0,
        weight: Math.max(1, Number(weight) || 100),
        createdBy: user._id
      });

      await GoalActivityModel.create({
        goalId: goal._id,
        objectiveId: objective._id,
        actorId: user._id,
        type: 'OBJECTIVE_CREATED',
        message: `${user.name} added objective "${objective.title}".`
      });

      await recalculateGoalHierarchyProgress(goal._id);

      res.status(201).json({ success: true, message: 'Objective created successfully.', objective });
    } catch (error) {
      console.error('[goalController.addObjective] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to add objective.' });
    }
  },

  /**
   * POST /api/objectives/:objectiveId/key-results
   * Add a Key Result under an objective
   */
  async addKeyResult(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { objectiveId } = req.params;
      const {
        title,
        description,
        metricType = 'NUMBER',
        startValue = 0,
        targetValue,
        currentValue = 0,
        unit = '',
        deadline,
        owner
      } = req.body;

      if (!Types.ObjectId.isValid(objectiveId)) {
        res.status(400).json({ success: false, message: 'Invalid objective ID.' });
        return;
      }

      const objective = await ObjectiveModel.findById(objectiveId);
      if (!objective) {
        res.status(404).json({ success: false, message: 'Objective not found.' });
        return;
      }

      if (!title || targetValue === undefined) {
        res.status(400).json({ success: false, message: 'Key result title and target value are required.' });
        return;
      }

      const assignedOwner = owner && Types.ObjectId.isValid(owner) ? new Types.ObjectId(owner) : user._id;

      const keyResult = await KeyResultModel.create({
        objectiveId: objective._id,
        goalId: objective.goalId,
        title: title.trim(),
        description: description ? description.trim() : '',
        metricType: metricType.toUpperCase(),
        startValue: Number(startValue) || 0,
        targetValue: Number(targetValue),
        currentValue: Number(currentValue) || Number(startValue) || 0,
        unit: unit.trim(),
        deadline: deadline ? new Date(deadline) : objective.endDate,
        owner: assignedOwner,
        progress: 0,
        status: 'ON_TRACK'
      });

      await GoalActivityModel.create({
        goalId: objective.goalId,
        objectiveId: objective._id,
        keyResultId: keyResult._id,
        actorId: user._id,
        type: 'KEY_RESULT_CREATED',
        message: `${user.name} added key result "${keyResult.title}".`
      });

      await recalculateGoalHierarchyProgress(objective.goalId);

      res.status(201).json({ success: true, message: 'Key Result created successfully.', keyResult });
    } catch (error) {
      console.error('[goalController.addKeyResult] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to add key result.' });
    }
  },

  /**
   * PATCH /api/key-results/:id/progress
   * Update Key Result progress & currentValue with automatic hierarchy rollup
   */
  async updateKeyResultProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { currentValue, note } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid key result ID.' });
        return;
      }

      if (currentValue === undefined) {
        res.status(400).json({ success: false, message: 'currentValue is required.' });
        return;
      }

      const keyResult = await KeyResultModel.findById(id);
      if (!keyResult) {
        res.status(404).json({ success: false, message: 'Key Result not found.' });
        return;
      }

      const prevValue = keyResult.currentValue;
      keyResult.currentValue = Number(currentValue);

      // Recalculate KR progress
      if (keyResult.metricType === 'BOOLEAN') {
        keyResult.progress = keyResult.currentValue ? 100 : 0;
      } else {
        const denom = keyResult.targetValue - keyResult.startValue;
        if (denom !== 0) {
          keyResult.progress = Math.max(0, Math.min(100, Math.round(((keyResult.currentValue - keyResult.startValue) / denom) * 100)));
        } else {
          keyResult.progress = keyResult.currentValue >= keyResult.targetValue ? 100 : 0;
        }
      }

      if (keyResult.progress >= 100) {
        keyResult.status = 'COMPLETED';
      }

      await keyResult.save();

      // Rollup to Objective and Goal
      await recalculateGoalHierarchyProgress(keyResult.goalId);

      // Log activity
      await GoalActivityModel.create({
        goalId: keyResult.goalId,
        objectiveId: keyResult.objectiveId,
        keyResultId: keyResult._id,
        actorId: user._id,
        type: 'PROGRESS_UPDATED',
        message: `${user.name} updated "${keyResult.title}": ${prevValue} → ${keyResult.currentValue} ${keyResult.unit} (${keyResult.progress}%).${note ? ` Note: "${note}"` : ''}`
      });

      res.json({
        success: true,
        message: 'Key result progress updated successfully.',
        keyResult
      });
    } catch (error) {
      console.error('[goalController.updateKeyResultProgress] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update key result progress.' });
    }
  },

  /**
   * POST /api/goals/:id/comments
   * Add a discussion comment to a goal
   */
  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
        return;
      }

      const goal = await GoalModel.findById(id);
      if (!goal || goal.isDeleted) {
        res.status(404).json({ success: false, message: 'Goal not found.' });
        return;
      }

      goal.comments.push({
        author: user._id,
        content: content.trim(),
        createdAt: new Date()
      });

      await goal.save();

      await GoalActivityModel.create({
        goalId: goal._id,
        actorId: user._id,
        type: 'COMMENT_ADDED',
        message: `${user.name} added a comment on this goal.`
      });

      const updated = await GoalModel.findById(id).populate('comments.author', 'name role profilePhoto');

      res.status(201).json({
        success: true,
        message: 'Comment added successfully.',
        comments: updated?.comments
      });
    } catch (error) {
      console.error('[goalController.addComment] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to add comment.' });
    }
  },

  /**
   * GET /api/goals/summary
   * High-level summary metrics and upcoming deadlines for dashboards
   */
  async getGoalSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const role = user.role.toUpperCase();

      const query: Record<string, any> = { isDeleted: false };
      if (role === 'MANAGER') {
        query.$or = [{ type: 'COMPANY' }, { department: user.department }, { owner: user._id }];
      } else if (role !== 'FOUNDER' && role !== 'HR') {
        query.$or = [{ type: 'COMPANY' }, { owner: user._id }, { department: user.department }];
      }

      const goals = await GoalModel.find(query).select('title status progress endDate type owner').lean();

      let activeGoals = 0;
      let completedGoals = 0;
      let atRiskGoals = 0;
      let totalProgress = 0;

      for (const g of goals) {
        if (g.status === 'ACTIVE') activeGoals++;
        else if (g.status === 'COMPLETED') completedGoals++;
        else if (g.status === 'AT_RISK') atRiskGoals++;
        totalProgress += (g.progress || 0);
      }

      const averageProgress = goals.length > 0 ? Math.round(totalProgress / goals.length) : 0;

      // Upcoming deadlines (next 5 goals due soonest)
      const now = new Date();
      const upcoming = await GoalModel.find({
        ...query,
        status: { $in: ['ACTIVE', 'AT_RISK'] },
        endDate: { $gte: now }
      })
        .sort({ endDate: 1 })
        .limit(5)
        .populate('owner', 'name role profilePhoto')
        .lean();

      const upcomingDeadlines = upcoming.map(g => {
        const diffDays = Math.ceil((new Date(g.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          _id: g._id,
          title: g.title,
          endDate: g.endDate,
          daysRemaining: diffDays,
          progress: g.progress,
          status: g.status,
          owner: g.owner
        };
      });

      res.json({
        success: true,
        summary: {
          totalGoals: goals.length,
          activeGoals,
          completedGoals,
          atRiskGoals,
          averageProgress,
          upcomingDeadlines
        }
      });
    } catch (error) {
      console.error('[goalController.getGoalSummary] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch goal summary.' });
    }
  }
};
