import { Response } from 'express';
import { Types } from 'mongoose';
import { ConversationModel, IConversation } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { UserModel, IUser, UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { io, getOnlineUsers } from '../socket/index.js';

export const chatController = {
  /**
   * Helper: Check if user is permitted to start a direct chat with target user
   */
  canUserChatWith(currentUser: IUser, targetUser: IUser): boolean {
    const role = (currentUser.role || '').toUpperCase() as UserRole;
    const targetRole = (targetUser.role || '').toUpperCase() as UserRole;

    // Founder and HR can direct message anyone
    if (role === 'FOUNDER' || role === 'HR') return true;

    // Anyone can direct message Founder or HR
    if (targetRole === 'FOUNDER' || targetRole === 'HR') return true;

    // Managers can message anyone in their department, other managers, HR, founder
    if (role === 'MANAGER') {
      if (currentUser.department === targetUser.department) return true;
      if (targetRole === 'MANAGER') return true;
    }

    // Employees and Interns can message their department colleagues, managers, HR, and founder
    if (currentUser.department && targetUser.department) {
      if (currentUser.department.toLowerCase() === targetUser.department.toLowerCase()) {
        return true;
      }
    }

    return true; // Default internal workspace allows open collaboration across active staff
  },

  /**
   * Helper: Ensure default Company conversation "Lavanta Team" exists
   */
  async ensureCompanyConversation(): Promise<IConversation> {
    let companyConv = await ConversationModel.findOne({ type: 'COMPANY' });
    if (!companyConv) {
      // Find founder to set as creator if available
      const founder = await UserModel.findOne({ role: 'FOUNDER' });
      const allActiveUsers = await UserModel.find({ status: 'ACTIVE' }).select('_id');

      companyConv = await ConversationModel.create({
        type: 'COMPANY',
        name: 'Lavanta Team',
        avatar: '',
        participants: allActiveUsers.map(u => u._id),
        createdBy: founder?._id,
        lastMessage: {
          text: 'Welcome to the Lavanta Naturals company team workspace.',
          senderId: founder?._id,
          senderName: founder?.name || 'Lavanta HQ',
          createdAt: new Date()
        },
        lastMessageAt: new Date(),
        unreadCounts: {}
      });
    }
    return companyConv;
  },

  /**
   * GET /api/chat/conversations
   * Fetch all conversations accessible to current user
   */
  async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await chatController.ensureCompanyConversation();
      const onlineUserIds = new Set(getOnlineUsers());

      const conversations = await ConversationModel.find({
        $or: [
          { type: 'COMPANY' },
          { participants: user._id }
        ]
      })
        .populate('participants', 'name email role department designation profilePhoto status')
        .sort({ lastMessageAt: -1 });

      const mapped = conversations.map(conv => {
        const obj = conv.toObject();
        const unreadMap = obj.unreadCounts || {};
        const unread = Number(unreadMap[user._id.toString()] || 0);

        if (conv.type === 'COMPANY') {
          return {
            _id: conv._id,
            id: conv._id,
            type: 'COMPANY',
            name: 'Lavanta Team',
            avatar: '',
            isOnline: true,
            participantCount: conv.participants.length,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: unread
          };
        }

        // Direct Conversation: other participant represents the conversation name and photo
        const otherParticipant = (conv.participants as any[]).find(
          p => p._id.toString() !== user._id.toString()
        ) || conv.participants[0];

        const otherIdStr = otherParticipant?._id?.toString() || '';
        const isOnline = onlineUserIds.has(otherIdStr);

        return {
          _id: conv._id,
          id: conv._id,
          type: 'DIRECT',
          name: otherParticipant?.name || 'Team Member',
          avatar: otherParticipant?.profilePhoto || '',
          otherUser: otherParticipant,
          isOnline,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: unread
        };
      });

      res.json({
        success: true,
        conversations: mapped
      });
    } catch (error) {
      console.error('[chatController.getConversations] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve conversations', error });
    }
  },

  /**
   * POST /api/chat/conversations/direct
   * Start or open existing direct conversation between authenticated user and target user
   */
  async getOrCreateDirectConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { targetUserId } = req.body;
      if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) {
        res.status(400).json({ success: false, message: 'Valid targetUserId is required.' });
        return;
      }

      if (user._id.toString() === targetUserId) {
        res.status(400).json({ success: false, message: 'Cannot start conversation with yourself.' });
        return;
      }

      const targetUser = await UserModel.findById(targetUserId);
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'Target user not found.' });
        return;
      }

      // Authorization Check
      if (!chatController.canUserChatWith(user, targetUser)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to message this user.'
        });
        return;
      }

      // Check for existing direct conversation (Idempotency check)
      let conversation = await ConversationModel.findOne({
        type: 'DIRECT',
        participants: { $all: [user._id, targetUser._id], $size: 2 }
      }).populate('participants', 'name email role department designation profilePhoto status');

      if (!conversation) {
        // Create new conversation
        conversation = await ConversationModel.create({
          type: 'DIRECT',
          participants: [user._id, targetUser._id],
          createdBy: user._id,
          lastMessageAt: new Date(),
          unreadCounts: {}
        });

        conversation = await ConversationModel.findById(conversation._id)
          .populate('participants', 'name email role department designation profilePhoto status');
      }

      const onlineUserIds = new Set(getOnlineUsers());
      const otherIdStr = targetUser._id.toString();

      res.status(200).json({
        success: true,
        conversation: {
          _id: conversation!._id,
          id: conversation!._id,
          type: 'DIRECT',
          name: targetUser.name,
          avatar: targetUser.profilePhoto || '',
          otherUser: targetUser,
          isOnline: onlineUserIds.has(otherIdStr),
          lastMessage: conversation!.lastMessage,
          lastMessageAt: conversation!.lastMessageAt,
          unreadCount: (conversation!.unreadCounts as any)?.[user._id.toString()] || 0
        }
      });
    } catch (error) {
      console.error('[chatController.getOrCreateDirectConversation] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to open conversation', error });
    }
  },

  /**
   * GET /api/chat/conversations/:id
   * Get conversation details
   */
  async getConversationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid conversation ID' });
        return;
      }

      const conversation = await ConversationModel.findById(id)
        .populate('participants', 'name email role department designation profilePhoto status');

      if (!conversation) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
      }

      // Verify access
      const isParticipant =
        conversation.type === 'COMPANY' ||
        conversation.participants.some(p => (p as any)._id.toString() === user._id.toString());

      if (!isParticipant) {
        res.status(403).json({ success: false, message: 'You are not a participant in this conversation.' });
        return;
      }

      const onlineUserIds = new Set(getOnlineUsers());
      const otherParticipant = (conversation.participants as any[]).find(
        p => p._id.toString() !== user._id.toString()
      );

      res.json({
        success: true,
        conversation: {
          ...conversation.toObject(),
          id: conversation._id,
          otherUser: otherParticipant,
          isOnline: otherParticipant ? onlineUserIds.has(otherParticipant._id.toString()) : false
        }
      });
    } catch (error) {
      console.error('[chatController.getConversationById] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve conversation', error });
    }
  },

  /**
   * GET /api/chat/conversations/:id/messages
   * Fetch paginated messages for conversation
   */
  async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { limit, before } = req.query as Record<string, string>;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid conversation ID' });
        return;
      }

      const conversation = await ConversationModel.findById(id);
      if (!conversation) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
      }

      // Check membership
      const isParticipant =
        conversation.type === 'COMPANY' ||
        conversation.participants.some(p => p.toString() === user._id.toString());

      if (!isParticipant) {
        res.status(403).json({ success: false, message: 'Access denied to this conversation.' });
        return;
      }

      const query: Record<string, any> = { conversationId: conversation._id };
      if (before && Types.ObjectId.isValid(before)) {
        const cursorMessage = await MessageModel.findById(before);
        if (cursorMessage) {
          query.createdAt = { $lt: cursorMessage.createdAt };
        }
      }

      const pageLimit = limit ? Math.min(parseInt(limit, 10), 60) : 30;

      // Query newest first, then reverse for chronological display
      const messages = await MessageModel.find(query)
        .populate('senderId', 'name role department designation profilePhoto')
        .populate('replyTo', 'content senderId createdAt')
        .sort({ createdAt: -1 })
        .limit(pageLimit);

      res.json({
        success: true,
        messages: messages.reverse(),
        hasMore: messages.length === pageLimit
      });
    } catch (error) {
      console.error('[chatController.getMessages] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve messages', error });
    }
  },

  /**
   * POST /api/chat/conversations/:id/messages
   * Send message (REST fallback)
   */
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { content, messageType, attachments, replyTo } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid conversation ID' });
        return;
      }

      const trimmed = (content || '').trim();
      if (!trimmed && (!attachments || attachments.length === 0)) {
        res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
        return;
      }

      const conversation = await ConversationModel.findById(id);
      if (!conversation) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
      }

      // Check membership
      const isParticipant =
        conversation.type === 'COMPANY' ||
        conversation.participants.some(p => p.toString() === user._id.toString());

      if (!isParticipant) {
        res.status(403).json({ success: false, message: 'You are not a participant in this conversation.' });
        return;
      }

      const message = new MessageModel({
        conversationId: conversation._id,
        senderId: user._id,
        content: trimmed,
        messageType: messageType || 'TEXT',
        attachments: attachments || [],
        replyTo: replyTo && Types.ObjectId.isValid(replyTo) ? replyTo : null,
        readBy: [user._id]
      });

      const savedMessage = await message.save();

      // Populate sender
      const populatedMessage = await MessageModel.findById(savedMessage._id)
        .populate('senderId', 'name role department designation profilePhoto')
        .populate('replyTo', 'content senderId createdAt');

      // Update Conversation lastMessage & unread
      conversation.lastMessage = {
        text: trimmed,
        senderId: user._id,
        senderName: user.name,
        createdAt: new Date()
      };
      conversation.lastMessageAt = new Date();

      const unread: Record<string, number> = { ...((conversation.unreadCounts as any) || {}) };
      conversation.participants.forEach(p => {
        const pId = p.toString();
        if (pId !== user._id.toString()) {
          unread[pId] = (Number(unread[pId]) || 0) + 1;
        }
      });
      conversation.unreadCounts = unread;
      conversation.markModified('unreadCounts');
      await conversation.save();

      // Emit through Socket.IO if available
      if (io) {
        io.to(`conversation:${id}`).emit('new_message', {
          conversationId: id,
          message: populatedMessage
        });
        conversation.participants.forEach(p => {
          io.to(`user:${p.toString()}`).emit('conversation_updated', {
            conversationId: id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCounts: conversation.unreadCounts
          });
        });
      }

      res.status(201).json({
        success: true,
        message: populatedMessage
      });
    } catch (error) {
      console.error('[chatController.sendMessage] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to send message', error });
    }
  },

  /**
   * PATCH /api/chat/messages/:id
   * Edit message (Author only)
   */
  async editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: 'Updated message content is required.' });
        return;
      }

      const message = await MessageModel.findById(id);
      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      if (message.senderId.toString() !== user._id.toString()) {
        res.status(403).json({ success: false, message: 'You can only edit your own messages.' });
        return;
      }

      message.content = content.trim();
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      if (io) {
        io.to(`conversation:${message.conversationId}`).emit('message_edited', {
          conversationId: message.conversationId,
          messageId: message._id,
          content: message.content,
          editedAt: message.editedAt
        });
      }

      res.json({
        success: true,
        message
      });
    } catch (error) {
      console.error('[chatController.editMessage] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to edit message', error });
    }
  },

  /**
   * DELETE /api/chat/messages/:id
   * Soft delete message (Author only)
   */
  async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const message = await MessageModel.findById(id);
      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      if (message.senderId.toString() !== user._id.toString()) {
        res.status(403).json({ success: false, message: 'You can only delete your own messages.' });
        return;
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = user._id;
      message.content = 'This message was deleted.';
      await message.save();

      if (io) {
        io.to(`conversation:${message.conversationId}`).emit('message_deleted', {
          conversationId: message.conversationId,
          messageId: message._id,
          content: message.content,
          deletedAt: message.deletedAt
        });
      }

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('[chatController.deleteMessage] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete message', error });
    }
  },

  /**
   * POST /api/chat/conversations/:id/read
   * Mark all unread messages in conversation as read for current user
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
        res.status(400).json({ success: false, message: 'Invalid conversation ID' });
        return;
      }

      // Add user to readBy
      await MessageModel.updateMany(
        {
          conversationId: id,
          senderId: { $ne: user._id },
          readBy: { $ne: user._id }
        },
        {
          $addToSet: { readBy: user._id }
        }
      );

      // Reset unread count for current user
      const conversation = await ConversationModel.findById(id);
      if (conversation) {
        const unread: Record<string, number> = { ...((conversation.unreadCounts as any) || {}) };
        unread[user._id.toString()] = 0;
        conversation.unreadCounts = unread;
        conversation.markModified('unreadCounts');
        await conversation.save();
      }

      if (io) {
        io.to(`conversation:${id}`).emit('message_read_receipt', {
          conversationId: id,
          userId: user._id.toString(),
          readAt: new Date()
        });
      }

      res.json({ success: true, message: 'Conversation marked as read' });
    } catch (error) {
      console.error('[chatController.markAsRead] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark as read', error });
    }
  },

  /**
   * GET /api/chat/unread-count
   * Total unread messages across all conversations for header badge
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const conversations = await ConversationModel.find({
        $or: [
          { type: 'COMPANY' },
          { participants: user._id }
        ]
      });

      let totalUnread = 0;
      conversations.forEach(c => {
        const unreadMap = (c.unreadCounts || {}) as Record<string, number>;
        totalUnread += Number(unreadMap[user._id.toString()] || 0);
      });

      res.json({
        success: true,
        unreadCount: totalUnread
      });
    } catch (error) {
      console.error('[chatController.getUnreadCount] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve unread count', error });
    }
  }
};
