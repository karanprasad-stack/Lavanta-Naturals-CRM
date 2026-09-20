import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Unread count badge for header icon
router.get('/chat/unread-count', chatController.getUnreadCount);

// Conversations
router.get('/chat/conversations', chatController.getConversations);
router.post('/chat/conversations/direct', chatController.getOrCreateDirectConversation);
router.get('/chat/conversations/:id', chatController.getConversationById);

// Messages
router.get('/chat/conversations/:id/messages', chatController.getMessages);
router.post('/chat/conversations/:id/messages', chatController.sendMessage);

// Message actions (Edit & Delete)
router.patch('/chat/messages/:id', chatController.editMessage);
router.delete('/chat/messages/:id', chatController.deleteMessage);

// Read receipts
router.post('/chat/conversations/:id/read', chatController.markAsRead);

export default router;
