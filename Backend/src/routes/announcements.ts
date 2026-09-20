import { Router, Request, Response } from 'express';
import { AnnouncementModel } from '../models/Announcement.js';

const router = Router();

// GET /api/announcements
router.get('/announcements', async (req: Request, res: Response) => {
  try {
    const list = await AnnouncementModel.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements', error });
  }
});

// POST /api/announcements
router.post('/announcements', async (req: Request, res: Response) => {
  try {
    const item = new AnnouncementModel(req.body);
    const saved = await item.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create announcement', error });
  }
});

export default router;
