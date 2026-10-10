import { Router, Response } from 'express';
import { MessageModel } from '../models/Message.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Secure all legacy message endpoints with authentication
router.use(authenticate);

// GET /api/chat/messages
router.get('/chat/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { channelId, user1, user2 } = req.query;

    let query: any = {};
    if (channelId) {
      query.channelId = channelId;
    } else if (user1 && user2) {
      query = {
        $or: [
          { senderId: user1, recipientId: user2 },
          { senderId: user2, recipientId: user1 }
        ]
      };
    }

    const messages = await MessageModel.find(query)
      .populate('senderId', 'name role department designation profilePhoto email')
      .sort({ createdAt: 1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error });
  }
});

// POST /api/chat/messages
router.post('/chat/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Never trust client-supplied senderId, derive strictly from authenticated user
    const msg = new MessageModel({
      ...req.body,
      senderId: user._id,
      readBy: [user._id]
    });
    const saved = await msg.save();
    const populated = await MessageModel.findById(saved._id)
      .populate('senderId', 'name role department designation profilePhoto email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to send message', error });
  }
});

export default router;
