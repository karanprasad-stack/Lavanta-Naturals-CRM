import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Unread count badge endpoint
router.get('/notifications/unread-count', notificationController.getUnreadCount);

// Notification list
router.get('/notifications', notificationController.getNotifications);

// Mark read / unread
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.patch('/notifications/:id/unread', notificationController.markAsUnread);

// Mark all as read (supports both POST and PATCH)
router.post('/notifications/read-all', notificationController.markAllAsRead);
router.patch('/notifications/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/notifications/:id', notificationController.deleteNotification);

export default router;
