import { Types } from 'mongoose';
import { NotificationModel, NotificationType, RelatedEntityType, INotification } from '../models/Notification.js';
import { io } from '../socket/index.js';

export interface DispatchNotificationParams {
  recipientId: Types.ObjectId | string;
  senderId?: Types.ObjectId | string | null;
  actorId?: Types.ObjectId | string | null;
  type: NotificationType;
  title: string;
  message?: string;
  description?: string;
  relatedEntityType?: RelatedEntityType;
  entityType?: RelatedEntityType;
  relatedEntityId?: Types.ObjectId | string | null;
  entityId?: Types.ObjectId | string | null;
  link?: string | null;
  idempotencyKey?: string | null;
}

export interface DispatchBatchParams {
  recipientIds: (Types.ObjectId | string)[];
  senderId?: Types.ObjectId | string | null;
  actorId?: Types.ObjectId | string | null;
  type: NotificationType;
  title: string;
  message?: string;
  description?: string;
  relatedEntityType?: RelatedEntityType;
  entityType?: RelatedEntityType;
  relatedEntityId?: Types.ObjectId | string | null;
  entityId?: Types.ObjectId | string | null;
  link?: string | null;
  idempotencyKeyPrefix?: string | null;
}

export const notificationDispatcher = {
  /**
   * Format a notification document into a clean client object
   */
  formatNotification(doc: any) {
    const obj = doc.toObject ? doc.toObject() : doc;
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
      idempotencyKey: obj.idempotencyKey || null,
      isRead: obj.isRead ?? obj.read ?? false,
      read: obj.isRead ?? obj.read ?? false,
      readAt: obj.readAt || null,
      createdAt: obj.createdAt || new Date()
    };
  },

  /**
   * Dispatch a single notification with deduplication and real-time delivery
   */
  async dispatch(params: DispatchNotificationParams): Promise<INotification | null> {
    try {
      const recipientId = new Types.ObjectId(params.recipientId.toString());
      const rawSender = params.senderId || params.actorId || null;
      const senderId = rawSender ? new Types.ObjectId(rawSender.toString()) : null;

      // Do not notify a user about their own actions
      if (senderId && recipientId.toString() === senderId.toString()) {
        return null;
      }

      // Check idempotency if provided
      if (params.idempotencyKey) {
        const existing = await NotificationModel.findOne({
          recipientId,
          idempotencyKey: params.idempotencyKey
        });
        if (existing) {
          return existing;
        }
      }

      const rawEntityType = params.relatedEntityType || params.entityType || 'SYSTEM';
      const entityType = rawEntityType as RelatedEntityType;
      const rawEntityId = params.relatedEntityId || params.entityId || null;
      const entityId = rawEntityId ? new Types.ObjectId(rawEntityId.toString()) : null;

      const title = (params.title || '').trim();
      const message = (params.message || params.description || '').trim();

      const notification = await NotificationModel.create({
        recipientId,
        senderId,
        type: params.type,
        title,
        message,
        relatedEntityType: entityType,
        relatedEntityId: entityId,
        link: params.link || null,
        idempotencyKey: params.idempotencyKey || null,
        isRead: false,
        readAt: null,
        createdAt: new Date()
      });

      // Populate sender details for real-time notification
      const populated = await NotificationModel.findById(notification._id)
        .populate('senderId', 'name role department designation profilePhoto email');

      // Real-time Socket.IO emission to user's dedicated room
      if (io) {
        const recipientRoom = `user:${recipientId.toString()}`;
        const formatted = this.formatNotification(populated || notification);
        const unreadCount = await NotificationModel.countDocuments({
          $or: [{ recipientId }, { recipient: recipientId }],
          isRead: false
        });

        io.to(recipientRoom).emit('notification_created', formatted);
        io.to(recipientRoom).emit('unread_count_updated', { unreadCount });
      }

      return populated || notification;
    } catch (err) {
      console.error('[notificationDispatcher.dispatch] Error:', err);
      return null;
    }
  },

  /**
   * Dispatch notifications to multiple recipients (supports array of params or batch params with recipientIds)
   */
  async dispatchBatch(
    payload: DispatchNotificationParams[] | DispatchBatchParams
  ): Promise<any[]> {
    if (!payload) return [];

    // If passed a DispatchBatchParams object with recipientIds
    if ('recipientIds' in payload) {
      const results: any[] = [];
      const senderId = payload.senderId || payload.actorId || null;
      for (const recId of payload.recipientIds) {
        const itemKey = payload.idempotencyKeyPrefix ? `${payload.idempotencyKeyPrefix}_${recId.toString()}` : null;
        const res = await this.dispatch({
          recipientId: recId,
          senderId,
          type: payload.type,
          title: payload.title,
          message: payload.message || payload.description || '',
          relatedEntityType: payload.relatedEntityType || payload.entityType,
          relatedEntityId: payload.relatedEntityId || payload.entityId,
          link: payload.link,
          idempotencyKey: itemKey
        });
        if (res) results.push(res);
      }
      return results;
    }

    // Array of DispatchNotificationParams
    const results: any[] = [];
    for (const params of payload) {
      const result = await this.dispatch(params);
      if (result) results.push(result);
    }

    return results;
  },

  /**
   * Emit updated unread count when notifications are read/unread
   */
  async notifyUnreadCount(userId: Types.ObjectId | string): Promise<number> {
    try {
      const uId = new Types.ObjectId(userId.toString());
      const unreadCount = await NotificationModel.countDocuments({
        $or: [{ recipientId: uId }, { recipient: uId }],
        isRead: false
      });

      if (io) {
        io.to(`user:${uId.toString()}`).emit('unread_count_updated', { unreadCount });
      }

      return unreadCount;
    } catch (err) {
      console.error('[notificationDispatcher.notifyUnreadCount] Error:', err);
      return 0;
    }
  }
};
