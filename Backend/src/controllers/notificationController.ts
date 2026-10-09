import { Response } from 'express';
import { Types } from 'mongoose';
import { NotificationModel } from '../models/Notification.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';

export const notificationController = {
  /**
   * GET /api/notifications
   * Retrieve notifications for current user with optional filters
   */
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { type, entityType, unreadOnly, limit } = req.query as Record<string, string>;

      const query: Record<string, any> = {
        $or: [
          { recipientId: user._id },
          { recipient: user._id }
        ]
      };

      if (type && type.toUpperCase() !== 'ALL') {
        query.type = type.toUpperCase();
      }

      if (entityType && entityType.toUpperCase() !== 'ALL') {
        query.relatedEntityType = entityType.toUpperCase();
      }

      if (unreadOnly === 'true') {
        query.$and = [
          {
            $or: [
              { isRead: false },
              { read: false }
            ]
          }
        ];
      }

      const fetchLimit = limit ? Math.min(parseInt(limit, 10), 100) : 50;

      const notifications = await NotificationModel.find(query)
        .populate('senderId', 'name role department designation profilePhoto')
        .sort({ createdAt: -1 })
        .limit(fetchLimit);

      const unreadCount = await NotificationModel.countDocuments({
        $or: [
          { recipientId: user._id },
          { recipient: user._id }
        ],
        isRead: false
      });

      // Format clean response
      const mapped = notifications.map(n => {
        const obj = n.toObject();
        const sender = obj.senderId || obj.sender || null;
        return {
          _id: obj._id,
          recipientId: obj.recipientId || obj.recipient,
          sender,
          type: obj.type,
          title: obj.title,
          message: obj.message,
          relatedEntityType: obj.relatedEntityType || (obj.taskId ? 'TASK' : 'SYSTEM'),
          relatedEntityId: obj.relatedEntityId || obj.taskId || null,
          taskId: obj.taskId || obj.relatedEntityId || null,
          link: obj.link || null,
          isRead: obj.isRead ?? obj.read ?? false,
          read: obj.isRead ?? obj.read ?? false,
          readAt: obj.readAt || null,
          createdAt: obj.createdAt
        };
      });

      res.json({
        success: true,
        notifications: mapped,
        unreadCount
      });
    } catch (error) {
      console.error('[notificationController.getNotifications] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error });
    }
  },

  /**
   * GET /api/notifications/unread-count
   * Efficient badge endpoint
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const unreadCount = await NotificationModel.countDocuments({
        $or: [
          { recipientId: user._id },
          { recipient: user._id }
        ],
        isRead: false
      });

      res.json({
        success: true,
        unreadCount
      });
    } catch (error) {
      console.error('[notificationController.getUnreadCount] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve unread count', error });
    }
  },

  /**
   * PATCH /api/notifications/:id/read
   * Mark a notification as read (Strictly user-owned)
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
        res.status(400).json({ success: false, message: 'Invalid notification ID' });
        return;
      }

      const notification = await NotificationModel.findOneAndUpdate(
        {
          _id: id,
          $or: [{ recipientId: user._id }, { recipient: user._id }]
        },
        {
          $set: {
            isRead: true,
            read: true,
            readAt: new Date()
          }
        },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found or access denied' });
        return;
      }

      // Notify real-time unread count update
      await notificationDispatcher.notifyUnreadCount(user._id);

      res.json({
        success: true,
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('[notificationController.markAsRead] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark notification as read', error });
    }
  },

  /**
   * PATCH /api/notifications/:id/unread
   * Toggle notification back to unread (Strictly user-owned)
   */
  async markAsUnread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid notification ID' });
        return;
      }

      const notification = await NotificationModel.findOneAndUpdate(
        {
          _id: id,
          $or: [{ recipientId: user._id }, { recipient: user._id }]
        },
        {
          $set: {
            isRead: false,
            read: false,
            readAt: null
          }
        },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found or access denied' });
        return;
      }

      await notificationDispatcher.notifyUnreadCount(user._id);

      res.json({
        success: true,
        message: 'Notification marked as unread',
        notification
      });
    } catch (error) {
      console.error('[notificationController.markAsUnread] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark notification as unread', error });
    }
  },

  /**
   * POST /api/notifications/read-all & PATCH /api/notifications/read-all
   * Mark all notifications for current user as read
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await NotificationModel.updateMany(
        {
          $or: [{ recipientId: user._id }, { recipient: user._id }],
          isRead: false
        },
        {
          $set: {
            isRead: true,
            read: true,
            readAt: new Date()
          }
        }
      );

      await notificationDispatcher.notifyUnreadCount(user._id);

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('[notificationController.markAllAsRead] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark all as read', error });
    }
  },

  /**
   * DELETE /api/notifications/:id
   * Delete a notification (Strictly user-owned)
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const deleted = await NotificationModel.findOneAndDelete({
        _id: id,
        $or: [{ recipientId: user._id }, { recipient: user._id }]
      });

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Notification not found or access denied' });
        return;
      }

      await notificationDispatcher.notifyUnreadCount(user._id);

      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('[notificationController.deleteNotification] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notification', error });
    }
  }
};
