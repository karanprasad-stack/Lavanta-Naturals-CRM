import { Router } from 'express';
import { announcementController } from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All announcement endpoints require authentication
router.use(authenticate);

// Main feed & collection routes
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', announcementController.createAnnouncement);

// Individual item routes
router.get('/announcements/:id', announcementController.getAnnouncementById);
router.patch('/announcements/:id', announcementController.updateAnnouncement);
router.delete('/announcements/:id', announcementController.deleteAnnouncement);

// Read tracking & receipts
router.post('/announcements/:id/read', announcementController.markAsRead);
router.get('/announcements/:id/read-receipts', announcementController.getReadReceipts);

export default router;
