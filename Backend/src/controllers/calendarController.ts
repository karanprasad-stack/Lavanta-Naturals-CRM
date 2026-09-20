import { Response } from 'express';
import { Types } from 'mongoose';
import { CalendarEventModel, ICalendarEvent, CalendarEventType, EventVisibility } from '../models/CalendarEvent.js';
import { TaskModel } from '../models/Task.js';
import { GoalModel } from '../models/Goal.js';
import { UserModel } from '../models/User.js';
import { NotificationModel } from '../models/Notification.js';
import { AnnouncementModel } from '../models/Announcement.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function canManageCompanyEvents(role: string): boolean {
  return ['FOUNDER', 'HR'].includes(role);
}

function canManageTeamEvents(role: string): boolean {
  return ['FOUNDER', 'HR', 'MANAGER'].includes(role);
}

/**
 * Build a MongoDB query that returns all events visible to the given user.
 * Enforces role-based and ownership-based access control.
 */
function buildVisibilityQuery(userId: string, role: string, department?: string): object {
  const uid = new Types.ObjectId(userId);

  // Conditions for different visibility scopes
  const conditions: object[] = [
    // Owner: always sees own events
    { createdBy: uid, isDeleted: false },
    // Participant: explicitly invited
    { 'participants.userId': uid, isDeleted: false }
  ];

  if (role === 'FOUNDER') {
    // Founder sees company events and team events (not private of others)
    conditions.push({ visibility: 'COMPANY', isDeleted: false });
    conditions.push({ visibility: 'TEAM', isDeleted: false });
  } else if (role === 'HR') {
    conditions.push({ visibility: 'COMPANY', isDeleted: false });
    conditions.push({ visibility: 'TEAM', isDeleted: false });
  } else if (role === 'MANAGER') {
    conditions.push({ visibility: 'COMPANY', isDeleted: false });
    if (department) {
      conditions.push({ visibility: 'TEAM', department, isDeleted: false });
    }
  } else {
    // EMPLOYEE / INTERN
    conditions.push({ visibility: 'COMPANY', isDeleted: false });
    // Team events where they belong to the same department
    if (department) {
      conditions.push({ visibility: 'TEAM', department, isDeleted: false });
    }
  }

  return { $or: conditions };
}

// ─────────────────────────────────────────────
// CREATE NOTIFICATION HELPER
// ─────────────────────────────────────────────
async function notifyEventParticipants(
  event: ICalendarEvent,
  organizerName: string,
  notifType: 'EVENT_INVITATION' | 'EVENT_UPDATED' | 'EVENT_CANCELLED'
): Promise<void> {
  const participantIds = event.participants.map(p => p.userId);
  if (participantIds.length === 0) return;

  const titleMap: Record<string, string> = {
    EVENT_INVITATION: 'New Meeting Invitation',
    EVENT_UPDATED: 'Event Updated',
    EVENT_CANCELLED: 'Event Cancelled'
  };

  const msgMap: Record<string, string> = {
    EVENT_INVITATION: `${organizerName} invited you to "${event.title}".`,
    EVENT_UPDATED: `${organizerName} updated "${event.title}".`,
    EVENT_CANCELLED: `"${event.title}" has been cancelled.`
  };

  const notifications = participantIds.map(uid => ({
    recipientId: uid,
    senderId: event.createdBy,
    type: notifType,
    title: titleMap[notifType],
    message: msgMap[notifType],
    relatedEntityType: 'EVENT',
    relatedEntityId: event._id,
    isRead: false,
    createdAt: new Date()
  }));

  await NotificationModel.insertMany(notifications);
}

// ─────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────
export const calendarController = {

  // ── GET /api/calendar/events ──────────────
  async getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const role = user.role.toUpperCase();
      const userId = user._id.toString();

      const {
        start,
        end,
        type,
        search
      } = req.query as Record<string, string>;

      // Base visibility query
      let query: any = buildVisibilityQuery(userId, role, user.department);

      // Date range filter
      if (start || end) {
        const dateFilter: any = {};
        if (start) dateFilter.$gte = new Date(start);
        if (end) dateFilter.$lte = new Date(end);
        query = {
          $and: [
            query,
            { startDateTime: dateFilter }
          ]
        };
      }

      // Type filter
      if (type && type !== 'ALL') {
        query = {
          $and: [query, { type: type.toUpperCase() }]
        };
      }

      // Text search (title, description)
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query = {
          $and: [
            query,
            { $or: [{ title: regex }, { description: regex }] }
          ]
        };
      }

      const events = await CalendarEventModel.find(query)
        .populate('createdBy', 'name role department designation profilePhoto')
        .populate('participants.userId', 'name role department designation profilePhoto')
        .populate('relatedTask', 'title status priority deadline assignedTo')
        .sort({ startDateTime: 1 })
        .limit(200);

      // Inject task & goal deadlines for authorized users (virtual calendar entries)
      const [taskEntries, goalEntries] = await Promise.all([
        getTaskDeadlineEntries(user._id.toString(), role, user.department),
        getGoalDeadlineEntries(user._id.toString(), role, user.department)
      ]);

      const combinedVirtualEntries = [...taskEntries, ...goalEntries];

      res.json({
        success: true,
        events,
        taskEntries: combinedVirtualEntries,
        count: events.length + combinedVirtualEntries.length
      });
    } catch (err) {
      console.error('[calendarController.getEvents]', err);
      res.status(500).json({ success: false, message: 'Failed to load calendar events.' });
    }
  },

  // ── GET /api/calendar/events/:id ──────────
  async getEventById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid event ID.' });
        return;
      }

      const event = await CalendarEventModel.findById(id)
        .populate('createdBy', 'name role department designation profilePhoto')
        .populate('participants.userId', 'name role department designation profilePhoto')
        .populate('relatedTask', 'title status priority deadline assignedTo')
        .populate('relatedAnnouncement', 'title');

      if (!event || event.isDeleted) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      // Access check
      if (!canAccessEvent(event, user._id.toString(), user.role, user.department)) {
        res.status(403).json({ success: false, message: 'You do not have access to this event.' });
        return;
      }

      res.json({ success: true, event });
    } catch (err) {
      console.error('[calendarController.getEventById]', err);
      res.status(500).json({ success: false, message: 'Failed to load event.' });
    }
  },

  // ── POST /api/calendar/events ─────────────
  async createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const role = user.role.toUpperCase();
      const {
        title,
        description,
        type,
        startDateTime,
        endDateTime,
        allDay,
        participants: participantIds,
        department,
        location,
        meetingLink,
        reminder,
        visibility,
        relatedTask,
        relatedAnnouncement
      } = req.body;

      // Validation
      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Event title is required.' });
        return;
      }
      if (!startDateTime) {
        res.status(400).json({ success: false, message: 'Start date/time is required.' });
        return;
      }
      const start = new Date(startDateTime);
      if (isNaN(start.getTime())) {
        res.status(400).json({ success: false, message: 'Invalid start date/time.' });
        return;
      }

      let end: Date | null = null;
      if (!allDay && endDateTime) {
        end = new Date(endDateTime);
        if (isNaN(end.getTime())) {
          res.status(400).json({ success: false, message: 'Invalid end date/time.' });
          return;
        }
        if (end <= start) {
          res.status(400).json({ success: false, message: 'End time must be after start time.' });
          return;
        }
      }

      // Permission check for company-wide events
      if (visibility === 'COMPANY' && !canManageCompanyEvents(role)) {
        res.status(403).json({ success: false, message: 'Only Founder or HR can create company-wide events.' });
        return;
      }
      if (visibility === 'TEAM' && !canManageTeamEvents(role)) {
        res.status(403).json({ success: false, message: 'Only Founder, HR, or Managers can create team events.' });
        return;
      }

      // Prevent duplicate event creation if already added for relatedAnnouncement
      if (relatedAnnouncement && Types.ObjectId.isValid(relatedAnnouncement)) {
        const existingEvent = await CalendarEventModel.findOne({
          createdBy: user._id,
          relatedAnnouncement: new Types.ObjectId(relatedAnnouncement),
          isDeleted: false
        });
        if (existingEvent) {
          res.status(200).json({ success: true, event: existingEvent, message: 'Event already exists on calendar.' });
          return;
        }
      }

      // Build participant list (include the creator)
      const participantList: { userId: Types.ObjectId; response: 'PENDING' | 'ACCEPTED' }[] = [];
      if (participantIds && Array.isArray(participantIds)) {
        for (const pid of participantIds) {
          if (Types.ObjectId.isValid(pid) && pid !== user._id.toString()) {
            participantList.push({ userId: new Types.ObjectId(pid), response: 'PENDING' });
          }
        }
      }

      const event = await CalendarEventModel.create({
        title: title.trim(),
        description: description?.trim() || '',
        type: type || 'MEETING',
        startDateTime: start,
        endDateTime: end,
        allDay: !!allDay,
        createdBy: user._id,
        participants: participantList,
        department: department || user.department,
        location: location?.trim() || '',
        meetingLink: meetingLink?.trim() || '',
        reminder: reminder || 'NONE',
        visibility: visibility || 'PRIVATE',
        relatedTask: relatedTask && Types.ObjectId.isValid(relatedTask) ? new Types.ObjectId(relatedTask) : null,
        relatedAnnouncement: relatedAnnouncement && Types.ObjectId.isValid(relatedAnnouncement) ? new Types.ObjectId(relatedAnnouncement) : null
      });

      // Notify participants
      if (participantList.length > 0) {
        await notifyEventParticipants(event, user.name, 'EVENT_INVITATION');
      }

      const populated = await CalendarEventModel.findById(event._id)
        .populate('createdBy', 'name role department designation profilePhoto')
        .populate('participants.userId', 'name role department designation profilePhoto')
        .populate('relatedTask', 'title status priority deadline');

      res.status(201).json({ success: true, event: populated, message: 'Event created successfully.' });
    } catch (err) {
      console.error('[calendarController.createEvent]', err);
      res.status(500).json({ success: false, message: 'Failed to create event.' });
    }
  },

  // ── PATCH /api/calendar/events/:id ────────
  async updateEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const role = user.role.toUpperCase();

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid event ID.' });
        return;
      }

      const event = await CalendarEventModel.findById(id);
      if (!event || event.isDeleted) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      // Block editing TASK_DEADLINE type via calendar (must be changed via task)
      if (event.type === 'TASK_DEADLINE') {
        res.status(403).json({ success: false, message: 'Task deadlines can only be changed from the task itself.' });
        return;
      }

      // Only creator can edit, unless FOUNDER or HR
      const isCreator = event.createdBy.toString() === user._id.toString();
      if (!isCreator && !canManageCompanyEvents(role)) {
        res.status(403).json({ success: false, message: 'You do not have permission to edit this event.' });
        return;
      }

      const {
        title, description, type, startDateTime, endDateTime, allDay,
        participants: participantIds, department, location, meetingLink, reminder, visibility
      } = req.body;

      const updates: Partial<ICalendarEvent> = {};
      if (title !== undefined) updates.title = title.trim();
      if (description !== undefined) updates.description = description.trim();
      if (type !== undefined) updates.type = type;
      if (allDay !== undefined) updates.allDay = allDay;
      if (location !== undefined) updates.location = location.trim();
      if (meetingLink !== undefined) updates.meetingLink = meetingLink.trim();
      if (reminder !== undefined) updates.reminder = reminder;
      if (visibility !== undefined) {
        if (visibility === 'COMPANY' && !canManageCompanyEvents(role)) {
          res.status(403).json({ success: false, message: 'Only Founder or HR can set company-wide visibility.' });
          return;
        }
        updates.visibility = visibility;
      }
      if (department !== undefined) updates.department = department;

      if (startDateTime !== undefined) {
        const start = new Date(startDateTime);
        if (isNaN(start.getTime())) {
          res.status(400).json({ success: false, message: 'Invalid start date/time.' });
          return;
        }
        updates.startDateTime = start;
      }
      if (endDateTime !== undefined) {
        const end = new Date(endDateTime);
        if (!isNaN(end.getTime())) updates.endDateTime = end;
      }

      // Update participants
      if (participantIds && Array.isArray(participantIds)) {
        const newParticipants = participantIds
          .filter((pid: string) => Types.ObjectId.isValid(pid) && pid !== user._id.toString())
          .map((pid: string) => {
            const existing = event.participants.find(p => p.userId.toString() === pid);
            return existing || { userId: new Types.ObjectId(pid), response: 'PENDING' as const };
          });
        updates.participants = newParticipants;
      }

      const updated = await CalendarEventModel.findByIdAndUpdate(id, { $set: updates }, { new: true })
        .populate('createdBy', 'name role department designation profilePhoto')
        .populate('participants.userId', 'name role department designation profilePhoto')
        .populate('relatedTask', 'title status priority deadline');

      // Notify participants of update
      if (updated && updated.participants.length > 0) {
        await notifyEventParticipants(updated, user.name, 'EVENT_UPDATED');
      }

      res.json({ success: true, event: updated, message: 'Event updated successfully.' });
    } catch (err) {
      console.error('[calendarController.updateEvent]', err);
      res.status(500).json({ success: false, message: 'Failed to update event.' });
    }
  },

  // ── DELETE /api/calendar/events/:id ───────
  async deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const role = user.role.toUpperCase();

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid event ID.' });
        return;
      }

      const event = await CalendarEventModel.findById(id);
      if (!event || event.isDeleted) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      const isCreator = event.createdBy.toString() === user._id.toString();
      if (!isCreator && !canManageCompanyEvents(role)) {
        res.status(403).json({ success: false, message: 'You do not have permission to delete this event.' });
        return;
      }

      // Soft delete
      await CalendarEventModel.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });

      // Notify participants of cancellation
      if (event.participants.length > 0) {
        await notifyEventParticipants(event, user.name, 'EVENT_CANCELLED');
      }

      res.json({ success: true, message: 'Event deleted successfully.' });
    } catch (err) {
      console.error('[calendarController.deleteEvent]', err);
      res.status(500).json({ success: false, message: 'Failed to delete event.' });
    }
  },

  // ── POST /api/calendar/events/:id/respond ─
  async respondToEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { response } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid event ID.' });
        return;
      }

      const validResponses = ['ACCEPTED', 'DECLINED', 'MAYBE'];
      if (!validResponses.includes(response)) {
        res.status(400).json({ success: false, message: `Response must be one of: ${validResponses.join(', ')}` });
        return;
      }

      const event = await CalendarEventModel.findOneAndUpdate(
        { _id: id, 'participants.userId': user._id, isDeleted: false },
        {
          $set: {
            'participants.$.response': response,
            'participants.$.respondedAt': new Date()
          }
        },
        { new: true }
      ).populate('participants.userId', 'name role department');

      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found or you are not a participant.' });
        return;
      }

      res.json({ success: true, event, message: 'Response recorded successfully.' });
    } catch (err) {
      console.error('[calendarController.respondToEvent]', err);
      res.status(500).json({ success: false, message: 'Failed to record response.' });
    }
  },

  // ── GET /api/calendar/upcoming ────────────
  async getUpcoming(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const role = user.role.toUpperCase();
      const userId = user._id.toString();

      const limit = Math.min(parseInt((req.query.limit as string) || '8', 10), 20);
      const now = new Date();
      const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const visibilityQuery = buildVisibilityQuery(userId, role, user.department);

      const events = await CalendarEventModel.find({
        ...visibilityQuery,
        startDateTime: { $gte: now, $lte: twoWeeksAhead }
      })
        .populate('createdBy', 'name role')
        .populate('participants.userId', 'name role')
        .sort({ startDateTime: 1 })
        .limit(limit);

      // Also fetch upcoming task deadlines
      const taskEntries = await getTaskDeadlineEntries(userId, role, user.department, now, twoWeeksAhead, limit);

      // Merge and sort
      const allEntries = [
        ...events.map(e => ({ ...e.toObject(), isTaskDeadline: false })),
        ...taskEntries
      ].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
        .slice(0, limit);

      res.json({ success: true, upcoming: allEntries });
    } catch (err) {
      console.error('[calendarController.getUpcoming]', err);
      res.status(500).json({ success: false, message: 'Failed to load upcoming events.' });
    }
  },

  // ── GET /api/calendar/today ───────────────
  async getToday(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const role = user.role.toUpperCase();
      const userId = user._id.toString();

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const visibilityQuery = buildVisibilityQuery(userId, role, user.department);

      const events = await CalendarEventModel.find({
        ...visibilityQuery,
        startDateTime: { $gte: startOfDay, $lte: endOfDay }
      })
        .populate('createdBy', 'name role')
        .populate('participants.userId', 'name role profilePhoto')
        .sort({ startDateTime: 1 });

      const taskEntries = await getTaskDeadlineEntries(userId, role, user.department, startOfDay, endOfDay);

      const allEntries = [
        ...events.map(e => ({ ...e.toObject(), isTaskDeadline: false })),
        ...taskEntries
      ].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

      res.json({ success: true, events: allEntries, date: now.toISOString() });
    } catch (err) {
      console.error('[calendarController.getToday]', err);
      res.status(500).json({ success: false, message: 'Failed to load today\'s events.' });
    }
  }
};

// ─────────────────────────────────────────────
// ACCESS CHECK HELPER
// ─────────────────────────────────────────────
function canAccessEvent(event: ICalendarEvent, userId: string, role: string, department?: string): boolean {
  const isOwner = event.createdBy.toString() === userId;
  const isParticipant = event.participants.some(p => p.userId.toString() === userId);

  if (isOwner || isParticipant) return true;

  if (event.visibility === 'COMPANY' && ['FOUNDER', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN'].includes(role)) return true;
  if (event.visibility === 'TEAM' && ['FOUNDER', 'HR'].includes(role)) return true;
  if (event.visibility === 'TEAM' && role === 'MANAGER' && event.department === department) return true;
  if (event.visibility === 'TEAM' && (role === 'EMPLOYEE' || role === 'INTERN') && event.department === department) return true;

  return false;
}

// ─────────────────────────────────────────────
// TASK DEADLINE VIRTUAL ENTRIES
// ─────────────────────────────────────────────
async function getTaskDeadlineEntries(
  userId: string,
  role: string,
  department?: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 50
): Promise<any[]> {
  let taskQuery: any = {
    status: { $nin: ['COMPLETED', 'CANCELLED'] }
  };

  if (role === 'EMPLOYEE' || role === 'INTERN') {
    taskQuery.assignedTo = new Types.ObjectId(userId);
  } else if (role === 'MANAGER') {
    taskQuery.department = department;
  } else if (role === 'HR') {
    // HR sees all tasks
  } else if (role === 'FOUNDER') {
    // Founder sees all tasks
  }

  if (startDate) taskQuery.deadline = { ...taskQuery.deadline, $gte: startDate };
  if (endDate) taskQuery.deadline = { ...taskQuery.deadline, $lte: endDate };

  const tasks = await TaskModel.find(taskQuery)
    .populate('assignedTo', 'name role department designation profilePhoto')
    .populate('assignedBy', 'name role')
    .sort({ deadline: 1 })
    .limit(limit)
    .lean();

  return tasks.map(task => ({
    _id: `task_deadline_${task._id}`,
    title: task.title,
    description: task.description,
    type: 'TASK_DEADLINE',
    startDateTime: task.deadline,
    endDateTime: task.deadline,
    allDay: false,
    isTaskDeadline: true,
    taskId: task._id,
    priority: task.priority,
    status: task.status,
    assignedTo: task.assignedTo,
    visibility: 'TEAM' as EventVisibility
  }));
}

// ─────────────────────────────────────────────
// GOAL DEADLINE VIRTUAL ENTRIES
// ─────────────────────────────────────────────
async function getGoalDeadlineEntries(
  userId: string,
  role: string,
  department?: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 20
): Promise<any[]> {
  const goalQuery: any = {
    isDeleted: false,
    status: { $nin: ['COMPLETED', 'CANCELLED'] }
  };

  if (role === 'EMPLOYEE' || role === 'INTERN') {
    goalQuery.$or = [{ type: 'COMPANY' }, { owner: new Types.ObjectId(userId) }, { department }];
  } else if (role === 'MANAGER') {
    goalQuery.$or = [{ type: 'COMPANY' }, { department }, { owner: new Types.ObjectId(userId) }];
  }

  if (startDate) goalQuery.endDate = { ...goalQuery.endDate, $gte: startDate };
  if (endDate) goalQuery.endDate = { ...goalQuery.endDate, $lte: endDate };

  const goals = await GoalModel.find(goalQuery)
    .populate('owner', 'name role department profilePhoto')
    .sort({ endDate: 1 })
    .limit(limit)
    .lean();

  return goals.map(g => ({
    _id: `goal_deadline_${g._id}`,
    title: `🎯 Goal: ${g.title}`,
    description: g.description || `Target completion for ${g.type.toLowerCase()} goal.`,
    type: 'COMPANY_EVENT' as CalendarEventType,
    startDateTime: g.endDate,
    endDateTime: g.endDate,
    allDay: true,
    isGoalDeadline: true,
    goalId: g._id,
    priority: g.priority || 'MEDIUM',
    status: g.status,
    assignedTo: g.owner,
    visibility: (g.type === 'COMPANY' ? 'COMPANY' : 'TEAM') as EventVisibility
  }));
}

