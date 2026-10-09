import { Response } from 'express';
import { Types } from 'mongoose';
import {
  AnnouncementModel,
  IAnnouncement,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementTargetType
} from '../models/Announcement.js';
import { AnnouncementReadModel } from '../models/AnnouncementRead.js';
import { NotificationModel } from '../models/Notification.js';
import { UserModel, IUser, UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';

export const announcementController = {
  /**
   * Helper: verify if a user is permitted to view an announcement
   */
  canUserViewAnnouncement(user: IUser, announcement: IAnnouncement): boolean {
    const role = (user.role || '').toUpperCase();
    // Founder has full visibility
    if (role === 'FOUNDER') return true;

    // Author always has access
    if (announcement.createdBy.toString() === user._id.toString()) return true;

    // Everyone
    if (announcement.targetType === 'EVERYONE') return true;

    // Target Role
    if (announcement.targetType === 'ROLE') {
      return (
        Array.isArray(announcement.targetRoles) &&
        announcement.targetRoles.some(r => r.toUpperCase() === role)
      );
    }

    // Target Department
    if (announcement.targetType === 'DEPARTMENT') {
      return (
        Array.isArray(announcement.targetDepartments) &&
        announcement.targetDepartments.some(
          d => d.toLowerCase() === (user.department || '').toLowerCase()
        )
      );
    }

    // Target Specific Users
    if (announcement.targetType === 'USERS') {
      return (
        Array.isArray(announcement.targetUsers) &&
        announcement.targetUsers.some(uId => uId.toString() === user._id.toString())
      );
    }

    return false;
  },

  /**
   * Helper: get all user IDs eligible for an announcement's targeting
   */
  async getTargetRecipients(announcement: IAnnouncement, authorId: Types.ObjectId): Promise<IUser[]> {
    if (announcement.targetType === 'EVERYONE') {
      return UserModel.find({ _id: { $ne: authorId }, status: 'ACTIVE' });
    }

    if (announcement.targetType === 'ROLE') {
      const normalizedRoles = (announcement.targetRoles || []).map(r => r.toUpperCase());
      return UserModel.find({
        role: { $in: normalizedRoles },
        _id: { $ne: authorId },
        status: 'ACTIVE'
      });
    }

    if (announcement.targetType === 'DEPARTMENT') {
      return UserModel.find({
        department: { $in: announcement.targetDepartments || [] },
        _id: { $ne: authorId },
        status: 'ACTIVE'
      });
    }

    if (announcement.targetType === 'USERS') {
      return UserModel.find({
        _id: { $in: announcement.targetUsers || [], $ne: authorId },
        status: 'ACTIVE'
      });
    }

    return [];
  },

  /**
   * GET /api/announcements
   * Returns announcements viewable by current user with read indicators and expiry filtering
   */
  async getAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const role = (user.role || '').toUpperCase();
      const now = new Date();
      const { type, priority, unreadOnly, search, includeExpired } = req.query as Record<string, string>;

      // Build target scope filter for MongoDB
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

      // Expiry filter: Active feeds hide expired announcements
      const expiryFilter: Record<string, any> = {};
      if (includeExpired !== 'true') {
        expiryFilter.$or = [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ];
      }

      // Base query
      const query: Record<string, any> = {
        status: 'PUBLISHED',
        ...visibilityFilter
      };

      if (expiryFilter.$or) {
        query.$and = query.$and || [];
        query.$and.push(expiryFilter);
      }

      // Type filter
      if (type && type.toUpperCase() !== 'ALL') {
        query.type = type.toUpperCase();
      }

      // Priority filter
      if (priority && priority.toUpperCase() !== 'ALL') {
        query.priority = priority.toUpperCase();
      }

      // Search filter
      if (search && search.trim().length > 0) {
        const regex = new RegExp(search.trim(), 'i');
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ title: regex }, { description: regex }, { content: regex }]
        });
      }

      // Execute query
      const announcements = await AnnouncementModel.find(query)
        .populate('createdBy', 'name role department designation profilePhoto')
        .sort({ publishedAt: -1 })
        .limit(50);

      // Get read records for current user
      const announcementIds = announcements.map(a => a._id);
      const readRecords = await AnnouncementReadModel.find({
        announcementId: { $in: announcementIds },
        userId: user._id
      });
      const readMap = new Map<string, Date>();
      readRecords.forEach(r => {
        readMap.set(r.announcementId.toString(), r.readAt);
      });

      // Map announcements with isRead flag
      const mappedAnnouncements = announcements.map(a => {
        const isRead = readMap.has(a._id.toString());
        const readAt = readMap.get(a._id.toString()) || null;
        return {
          ...a.toObject(),
          isRead,
          readAt
        };
      });

      // Filter unread if requested
      const filtered = unreadOnly === 'true'
        ? mappedAnnouncements.filter(a => !a.isRead)
        : mappedAnnouncements;

      const unreadTotal = mappedAnnouncements.filter(a => !a.isRead).length;

      res.json({
        success: true,
        announcements: filtered,
        unreadCount: unreadTotal,
        total: mappedAnnouncements.length
      });
    } catch (error) {
      console.error('[announcementController.getAnnouncements] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve announcements', error });
    }
  },

  /**
   * GET /api/announcements/:id
   * Get single announcement detail
   */
  async getAnnouncementById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid announcement ID' });
        return;
      }

      const announcement = await AnnouncementModel.findById(id)
        .populate('createdBy', 'name role department designation profilePhoto email');

      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' });
        return;
      }

      // Check access permission
      if (!announcementController.canUserViewAnnouncement(user, announcement)) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to view this announcement.'
        });
        return;
      }

      // Check read status for user
      const readRecord = await AnnouncementReadModel.findOne({
        announcementId: announcement._id,
        userId: user._id
      });

      res.json({
        success: true,
        announcement: {
          ...announcement.toObject(),
          isRead: !!readRecord,
          readAt: readRecord ? readRecord.readAt : null
        }
      });
    } catch (error) {
      console.error('[announcementController.getAnnouncementById] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve announcement', error });
    }
  },

  /**
   * POST /api/announcements
   * Create and publish announcement with recipient notifications
   */
  async createAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const role = (user.role || '').toUpperCase();

      // Authorization: Employees and Interns CANNOT publish company announcements
      if (role === 'EMPLOYEE' || role === 'INTERN') {
        res.status(403).json({
          success: false,
          message: 'Employees and Interns do not have permission to publish company announcements.'
        });
        return;
      }

      const {
        title,
        description,
        content,
        type,
        priority,
        targetType,
        targetRoles,
        targetDepartments,
        targetUsers,
        posterImage,
        attachments,
        expiresAt
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Announcement title is required.' });
        return;
      }

      if (!description || !description.trim()) {
        res.status(400).json({ success: false, message: 'Announcement description is required.' });
        return;
      }

      // Validations
      const validTypes: AnnouncementType[] = ['GENERAL', 'EVENT', 'MEETING', 'IMPORTANT', 'NOTICE'];
      const annType = (type || 'GENERAL').toUpperCase() as AnnouncementType;
      if (!validTypes.includes(annType)) {
        res.status(400).json({ success: false, message: 'Invalid announcement type.' });
        return;
      }

      const validPriorities: AnnouncementPriority[] = ['NORMAL', 'IMPORTANT', 'URGENT'];
      const annPriority = (priority || 'NORMAL').toUpperCase() as AnnouncementPriority;
      if (!validPriorities.includes(annPriority)) {
        res.status(400).json({ success: false, message: 'Invalid priority level.' });
        return;
      }

      const validTargets: AnnouncementTargetType[] = ['EVERYONE', 'ROLE', 'DEPARTMENT', 'USERS'];
      const annTarget = (targetType || 'EVERYONE').toUpperCase() as AnnouncementTargetType;
      if (!validTargets.includes(annTarget)) {
        res.status(400).json({ success: false, message: 'Invalid targeting type.' });
        return;
      }

      // Manager targeting constraints: can only target their own department or team
      if (role === 'MANAGER') {
        if (annTarget === 'EVERYONE') {
          res.status(403).json({
            success: false,
            message: 'Managers cannot publish company-wide announcements. Please target your department.'
          });
          return;
        }
        if (annTarget === 'DEPARTMENT') {
          const deptMatches = (targetDepartments || []).every(
            (d: string) => d.toLowerCase() === (user.department || '').toLowerCase()
          );
          if (!deptMatches) {
            res.status(403).json({
              success: false,
              message: `Managers can only publish announcements for their own department (${user.department}).`
            });
            return;
          }
        }
      }

      // Poster image validation (if provided as base64 or URL)
      if (posterImage && typeof posterImage === 'string') {
        if (posterImage.startsWith('data:image/')) {
          // Check size limit: ~5MB base64 is ~6.7MB string length
          if (posterImage.length > 7 * 1024 * 1024) {
            res.status(400).json({ success: false, message: 'Poster image file size exceeds 5MB limit.' });
            return;
          }
          // Validate format
          const mimeMatch = posterImage.match(/^data:image\/(png|jpe?g|webp);base64,/i);
          if (!mimeMatch) {
            res.status(400).json({
              success: false,
              message: 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.'
            });
            return;
          }
        }
      }

      // Expiry validation
      let expiryDate: Date | null = null;
      if (expiresAt) {
        expiryDate = new Date(expiresAt);
        if (isNaN(expiryDate.getTime())) {
          res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
          return;
        }
      }

      // Create Announcement
      const announcement = new AnnouncementModel({
        title: title.trim(),
        description: description.trim(),
        content: (content || description).trim(),
        type: annType,
        priority: annPriority,
        createdBy: user._id,
        targetType: annTarget,
        targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
        targetDepartments: Array.isArray(targetDepartments) ? targetDepartments : [],
        targetUsers: Array.isArray(targetUsers) ? targetUsers : [],
        posterImage: posterImage || '',
        attachments: Array.isArray(attachments) ? attachments : [],
        publishedAt: (req.body.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED' ? new Date() : null,
        expiresAt: expiryDate,
        status: (req.body.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
      });

      const savedAnnouncement = await announcement.save();

      // Dispatch Notifications to all targeted recipients only if PUBLISHED
      let recipientsCount = 0;
      if (savedAnnouncement.status === 'PUBLISHED') {
        const recipients = await announcementController.getTargetRecipients(
          savedAnnouncement,
          user._id
        );
        recipientsCount = recipients.length;

        const notifType =
          annPriority === 'URGENT' ? 'ANNOUNCEMENT_IMPORTANT' : 'ANNOUNCEMENT_PUBLISHED';
        const notifTitle =
          annPriority === 'URGENT' ? 'IMPORTANT ANNOUNCEMENT' : 'NEW ANNOUNCEMENT';

        if (recipients.length > 0) {
          const notificationsToCreate = recipients.map(recipient => ({
            recipientId: recipient._id,
            senderId: user._id,
            type: notifType as any,
            title: notifTitle,
            message: `${user.name} published: "${savedAnnouncement.title}"`,
            relatedEntityType: 'ANNOUNCEMENT' as any,
            relatedEntityId: savedAnnouncement._id,
            link: `/announcements/${savedAnnouncement._id}`,
            idempotencyKey: `announcement_pub_${savedAnnouncement._id}_${recipient._id}`
          }));

          await notificationDispatcher.dispatchBatch(notificationsToCreate);
        }
      }

      const populated = await AnnouncementModel.findById(savedAnnouncement._id)
        .populate('createdBy', 'name role department designation profilePhoto email');

      res.status(201).json({
        success: true,
        message: savedAnnouncement.status === 'PUBLISHED'
          ? 'Announcement published successfully.'
          : 'Announcement saved as draft.',
        announcement: populated,
        recipientsCount
      });
    } catch (error) {
      console.error('[announcementController.createAnnouncement] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to create announcement', error });
    }
  },

  /**
   * PATCH /api/announcements/:id
   * Update announcement (Author or FOUNDER/HR)
   */
  async updateAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const announcement = await AnnouncementModel.findById(id);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' });
        return;
      }

      const role = (user.role || '').toUpperCase();
      const isAuthor = announcement.createdBy.toString() === user._id.toString();
      const isPrivileged = role === 'FOUNDER' || role === 'HR';

      if (!isAuthor && !isPrivileged) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to update this announcement.'
        });
        return;
      }

      const {
        title,
        description,
        content,
        type,
        priority,
        posterImage,
        expiresAt,
        status
      } = req.body;

      if (title) announcement.title = title.trim();
      if (description) announcement.description = description.trim();
      if (content !== undefined) announcement.content = content.trim();
      if (type) announcement.type = type.toUpperCase();
      if (priority) announcement.priority = priority.toUpperCase();
      if (posterImage !== undefined) announcement.posterImage = posterImage;
      if (expiresAt !== undefined) {
        announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }
      const wasDraft = announcement.status === 'DRAFT';
      if (status) announcement.status = status;
      if (wasDraft && announcement.status === 'PUBLISHED' && !announcement.publishedAt) {
        announcement.publishedAt = new Date();
      }

      await announcement.save();

      // If transitioning from DRAFT to PUBLISHED, dispatch notifications
      if (wasDraft && announcement.status === 'PUBLISHED') {
        const recipients = await announcementController.getTargetRecipients(
          announcement,
          user._id
        );
        const notifType =
          announcement.priority === 'URGENT' ? 'ANNOUNCEMENT_IMPORTANT' : 'ANNOUNCEMENT_PUBLISHED';
        const notifTitle =
          announcement.priority === 'URGENT' ? 'IMPORTANT ANNOUNCEMENT' : 'NEW ANNOUNCEMENT';

        if (recipients.length > 0) {
          const notificationsToCreate = recipients.map(recipient => ({
            recipientId: recipient._id,
            senderId: user._id,
            type: notifType as any,
            title: notifTitle,
            message: `${user.name} published: "${announcement.title}"`,
            relatedEntityType: 'ANNOUNCEMENT' as any,
            relatedEntityId: announcement._id,
            link: `/announcements/${announcement._id}`,
            idempotencyKey: `announcement_pub_${announcement._id}_${recipient._id}`
          }));

          await notificationDispatcher.dispatchBatch(notificationsToCreate);
        }
      }

      const populated = await AnnouncementModel.findById(announcement._id)
        .populate('createdBy', 'name role department designation profilePhoto email');

      res.json({
        success: true,
        message: 'Announcement updated successfully',
        announcement: populated
      });
    } catch (error) {
      console.error('[announcementController.updateAnnouncement] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update announcement', error });
    }
  },

  /**
   * DELETE /api/announcements/:id
   * Soft-delete/Archive an announcement
   */
  async deleteAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const announcement = await AnnouncementModel.findById(id);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' });
        return;
      }

      const role = (user.role || '').toUpperCase();
      const isAuthor = announcement.createdBy.toString() === user._id.toString();
      const isPrivileged = role === 'FOUNDER' || role === 'HR';

      if (!isAuthor && !isPrivileged) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to remove this announcement.'
        });
        return;
      }

      announcement.status = 'ARCHIVED';
      await announcement.save();

      res.json({ success: true, message: 'Announcement archived successfully' });
    } catch (error) {
      console.error('[announcementController.deleteAnnouncement] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to archive announcement', error });
    }
  },

  /**
   * POST /api/announcements/:id/read
   * Record that the authenticated user has viewed this announcement
   * Idempotent: multiple visits never duplicate records
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid announcement ID' });
        return;
      }

      const announcement = await AnnouncementModel.findById(id);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' });
        return;
      }

      // Upsert into AnnouncementReadModel
      const record = await AnnouncementReadModel.findOneAndUpdate(
        { announcementId: announcement._id, userId: user._id },
        { $setOnInsert: { readAt: new Date() } },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: 'Announcement marked as read',
        readAt: record.readAt
      });
    } catch (error) {
      console.error('[announcementController.markAsRead] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark announcement as read', error });
    }
  },

  /**
   * GET /api/announcements/:id/read-receipts
   * Retrieve read receipt metrics and user breakdowns
   * RESTRICTED: Founder, HR, and Announcement author only! Ordinary employees/interns receive 403 Forbidden.
   */
  async getReadReceipts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const announcement = await AnnouncementModel.findById(id);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' });
        return;
      }

      const role = (user.role || '').toUpperCase();
      const isAuthor = announcement.createdBy.toString() === user._id.toString();
      const isPrivileged = role === 'FOUNDER' || role === 'HR';

      // Security check: ordinary employees/interns cannot view read receipts
      if (!isPrivileged && !isAuthor) {
        res.status(403).json({
          success: false,
          message: 'Read receipts are confidential to Leadership and HR.'
        });
        return;
      }

      // Get all targeted users
      const targetedUsers = await announcementController.getTargetRecipients(
        announcement,
        announcement.createdBy
      );

      // Get all read records for this announcement
      const readRecords = await AnnouncementReadModel.find({
        announcementId: announcement._id
      }).populate('userId', 'name email role department designation profilePhoto');

      const readUserMap = new Map<string, { user: any; readAt: Date }>();
      readRecords.forEach(r => {
        if (r.userId) {
          const u = r.userId as any;
          readUserMap.set(u._id.toString(), { user: u, readAt: r.readAt });
        }
      });

      const readUsersList: Array<{ user: any; readAt: Date }> = [];
      const unreadUsersList: Array<{ user: any }> = [];

      targetedUsers.forEach(tUser => {
        const uId = tUser._id.toString();
        if (readUserMap.has(uId)) {
          readUsersList.push(readUserMap.get(uId)!);
        } else {
          unreadUsersList.push({
            user: {
              _id: tUser._id,
              name: tUser.name,
              email: tUser.email,
              role: tUser.role,
              department: tUser.department,
              designation: tUser.designation,
              profilePhoto: tUser.profilePhoto
            }
          });
        }
      });

      const totalTargeted = targetedUsers.length;
      const readCount = readUsersList.length;
      const unreadCount = unreadUsersList.length;
      const readRatio = `${readCount} / ${totalTargeted}`;
      const percentage = totalTargeted > 0 ? Math.round((readCount / totalTargeted) * 100) : 0;

      res.json({
        success: true,
        readReceipts: {
          announcementId: announcement._id,
          totalTargeted,
          readCount,
          unreadCount,
          readRatio,
          percentage,
          readUsers: readUsersList,
          unreadUsers: unreadUsersList
        }
      });
    } catch (error) {
      console.error('[announcementController.getReadReceipts] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to get read receipts', error });
    }
  }
};
