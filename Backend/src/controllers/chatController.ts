import { Response } from 'express';
import { Types } from 'mongoose';
import { ConversationModel, IConversation } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { UserModel, IUser, UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { io, getOnlineUsers } from '../socket/index.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';

/**
 * Authoritative unread message count calculation using persisted MessageModel state.
 * Strictly excludes:
 * - Messages authored by current user (senderId === userId)
 * - Messages already acknowledged in readBy
 * - Soft-deleted messages
 */
export async function calculateUnreadMessageCounts(userId: Types.ObjectId): Promise<{
  totalUnread: number;
  byConversation: Record<string, number>;
}> {
  const accessibleConvs = await ConversationModel.find({
    $or: [
      { type: 'COMPANY' },
      { participants: userId }
    ]
  }).select('_id');

  const convIds = accessibleConvs.map(c => c._id);
  if (convIds.length === 0) {
    return { totalUnread: 0, byConversation: {} };
  }

  const unreadAgg = await MessageModel.aggregate([
    {
      $match: {
        conversationId: { $in: convIds },
        senderId: { $ne: userId },
        readBy: { $ne: userId },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: '$conversationId',
        count: { $sum: 1 }
      }
    }
  ]);

  const byConversation: Record<string, number> = {};
  let totalUnread = 0;
  for (const item of unreadAgg) {
    const cid = item._id.toString();
    byConversation[cid] = item.count;
    totalUnread += item.count;
  }

  return { totalUnread, byConversation };
}

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
    const allActiveUsers = await UserModel.find({ status: 'ACTIVE' }).select('_id');
    const allUserIds = allActiveUsers.map(u => u._id);

    if (!companyConv) {
      // Find founder to set as creator if available
      const founder = await UserModel.findOne({ role: 'FOUNDER' });

      companyConv = await ConversationModel.create({
        type: 'COMPANY',
        name: 'Lavanta Team',
        avatar: '',
        participants: allUserIds,
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
    } else {
      // Sync all active users into company conversation participants
      const existingParticipantSet = new Set(companyConv.participants.map(p => p.toString()));
      let hasMissing = false;
      for (const uid of allUserIds) {
        if (!existingParticipantSet.has(uid.toString())) {
          companyConv.participants.push(uid);
          hasMissing = true;
        }
      }
      if (hasMissing) {
        await companyConv.save();
      }
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

      const { byConversation } = await calculateUnreadMessageCounts(user._id);

      const mapped = conversations.map(conv => {
        const convIdStr = conv._id.toString();
        const unread = Number(byConversation[convIdStr] || 0);

        if (conv.type === 'COMPANY') {
          return {
            _id: conv._id,
            id: conv._id,
            type: 'COMPANY',
            name: conv.name || 'Lavanta Team',
            avatar: conv.avatar || '',
            isOnline: true,
            participants: conv.participants,
            participantCount: conv.participants.length,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: unread
          };
        }

        if (conv.type === 'GROUP') {
          return {
            _id: conv._id,
            id: conv._id,
            type: 'GROUP',
            name: conv.name || 'Group Conversation',
            avatar: conv.avatar || '',
            isOnline: false,
            participants: conv.participants,
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
          participants: conv.participants,
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

      const { byConversation } = await calculateUnreadMessageCounts(user._id);
      const unreadCount = Number(byConversation[conversation!._id.toString()] || 0);

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
          unreadCount
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
      const isDirect = conversation.type === 'DIRECT';
      const otherParticipant = isDirect
        ? (conversation.participants as any[]).find(p => p._id.toString() !== user._id.toString())
        : undefined;

      res.json({
        success: true,
        conversation: {
          ...conversation.toObject(),
          id: conversation._id,
          otherUser: otherParticipant,
          isOnline: isDirect && otherParticipant ? onlineUserIds.has(otherParticipant._id.toString()) : false
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
        .populate('senderId', 'name role department designation profilePhoto email')
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
        .populate('senderId', 'name role department designation profilePhoto email')
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
        // Broadcast to conversation room
        io.to(`conversation:${id}`).emit('new_message', {
          conversationId: id,
          message: populatedMessage
        });

        // Also broadcast directly to every participant's personal room
        for (const p of conversation.participants) {
          const pIdStr = p.toString();
          io.to(`user:${pIdStr}`).emit('new_message', {
            conversationId: id,
            message: populatedMessage
          });
          io.to(`user:${pIdStr}`).emit('conversation_updated', {
            conversationId: id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCounts: conversation.unreadCounts
          });

          if (pIdStr !== user._id.toString()) {
            calculateUnreadMessageCounts(p as Types.ObjectId)
              .then(pCounts => {
                io.to(`user:${pIdStr}`).emit('unread_count_updated', {
                  totalUnread: pCounts.totalUnread,
                  unreadCount: pCounts.totalUnread,
                  conversationId: id,
                  conversationUnreadCount: pCounts.byConversation[id] || 0
                });
              })
              .catch(err => console.error('[chatController.sendMessage] Error recalculating unread for participant:', err));
          }
        }
      }

      // Dispatch persistent notifications for other participants
      for (const p of conversation.participants) {
        const pIdStr = p.toString();
        if (pIdStr === user._id.toString()) continue;

        const isDirect = conversation.type === 'DIRECT';
        const notifType = isDirect ? 'DIRECT_MESSAGE' : 'MESSAGE_RECEIVED';
        const notifTitle = isDirect
          ? `New message from ${user.name}`
          : `${conversation.name || 'Team Chat'}: ${user.name}`;

        await notificationDispatcher.dispatch({
          recipientId: p,
          senderId: user._id,
          type: notifType,
          title: notifTitle,
          message: trimmed.length > 80 ? trimmed.substring(0, 80) + '...' : trimmed,
          relatedEntityType: 'CONVERSATION',
          relatedEntityId: conversation._id,
          link: `/chat?conversationId=${conversation._id}`,
          idempotencyKey: `msg_${savedMessage._id}_${pIdStr}`
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

      // Calculate new total unread count for the current user
      const { totalUnread, byConversation } = await calculateUnreadMessageCounts(user._id);

      if (io) {
        io.to(`conversation:${id}`).emit('message_read_receipt', {
          conversationId: id,
          userId: user._id.toString(),
          readAt: new Date()
        });
        io.to(`user:${user._id.toString()}`).emit('unread_count_updated', {
          totalUnread,
          unreadCount: totalUnread,
          conversationId: id,
          conversationUnreadCount: 0,
          byConversation
        });
      }

      res.json({
        success: true,
        message: 'Conversation marked as read',
        unreadCount: totalUnread,
        conversationUnreadCount: 0,
        byConversation
      });
    } catch (error) {
      console.error('[chatController.markAsRead] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark as read', error });
    }
  },

  /**
   * GET /api/chat/unread-count
   * Authoritative total unread messages across all conversations for header badge
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { totalUnread, byConversation } = await calculateUnreadMessageCounts(user._id);

      res.json({
        success: true,
        unreadCount: totalUnread,
        byConversation
      });
    } catch (error) {
      console.error('[chatController.getUnreadCount] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve unread count', error });
    }
  }
};
