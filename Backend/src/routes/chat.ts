import { Router, Request, Response } from 'express';
import { MessageModel } from '../models/Message.js';

const router = Router();

// GET /api/chat/messages
router.get('/chat/messages', async (req: Request, res: Response) => {
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

    const messages = await MessageModel.find(query).sort({ createdAt: 1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error });
  }
});

// POST /api/chat/messages
router.post('/chat/messages', async (req: Request, res: Response) => {
  try {
    const msg = new MessageModel(req.body);
    const saved = await msg.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to send message', error });
  }
});

export default router;
