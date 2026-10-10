import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Types } from 'mongoose';
import { verifyToken } from '../utils/jwt.js';
import { UserModel, IUser } from '../models/User.js';
import { ConversationModel, IConversation } from '../models/Conversation.js';
import { MessageModel, IMessage } from '../models/Message.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';
import { calculateUnreadMessageCounts } from '../controllers/chatController.js';
import { config } from '../config/env.js';
import { isAllowedOrigin } from '../config/cors.js';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: IUser;
  };
}

// Map of userId -> Set of active socket IDs
const onlineUsers = new Map<string, Set<string>>();

export let io: SocketIOServer;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked socket origin: ${origin}`));
        }
      },
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 1. Authenticated Socket Handshake Middleware
  io.use(async (socket, next) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (!authHeader) {
        return next(new Error('Authentication required: No token provided'));
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

      const payload = verifyToken(token);
      if (!payload) {
        return next(new Error('Authentication required: Invalid or expired token'));
      }

      const user = await UserModel.findById(payload.userId);
      if (!user) {
        return next(new Error('Authenticated user account no longer exists'));
      }

      if (user.status === 'INACTIVE') {
        return next(new Error('User account is inactive'));
      }

      (socket as AuthenticatedSocket).data = { user };
      next();
    } catch (error) {
      console.error('[Socket Auth] Handshake verification error:', error);
      next(new Error('Internal authentication error'));
    }
  });

  // 2. Connection Lifecycle & Event Handlers
  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;
    const userIdStr = user._id.toString();

    // Track online state
    if (!onlineUsers.has(userIdStr)) {
      onlineUsers.set(userIdStr, new Set());
    }
    const userSockets = onlineUsers.get(userIdStr)!;
    userSockets.add(socket.id);

    // Join personal user room for direct alerts
    socket.join(`user:${userIdStr}`);

    // Auto-join all accessible conversation rooms (Company and Group/Direct channels)
    ConversationModel.find({
      $or: [
        { type: 'COMPANY' },
        { participants: user._id }
      ]
    })
      .select('_id')
      .then(convs => {
        convs.forEach(c => socket.join(`conversation:${c._id.toString()}`));
      })
      .catch(err => console.error('[Socket Auto-join] Error joining rooms:', err));

    // If this is the user's first active tab/connection, broadcast online status
    if (userSockets.size === 1) {
      io.emit('user_online', { userId: userIdStr, name: user.name });
    }

    // Send the current list of all online user IDs to the connected client
    const currentOnlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online_users_list', { userIds: currentOnlineUserIds });

    /**
     * Join Conversation Room
     */
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        if (!Types.ObjectId.isValid(conversationId)) return;

        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) return;

        // Authorization check: participant or COMPANY
        const isParticipant =
          conversation.type === 'COMPANY' ||
          conversation.participants.some(p => p.toString() === userIdStr);

        if (!isParticipant) {
          socket.emit('error_message', { message: 'Unauthorized conversation access' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        console.error('[Socket join_conversation] Error:', err);
      }
    });

    /**
     * Leave Conversation Room
     */
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    /**
     * Send Message in Real-Time
     */
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
      attachments?: any[];
      replyTo?: string;
    }, callback?: (response: any) => void) => {
      try {
        const { conversationId, content, messageType, attachments, replyTo } = data;

        // Verify authenticated identity of this socket connection
        if (!user || !user._id) {
          socket.emit('error_message', { message: 'Authentication required' });
          if (typeof callback === 'function') callback({ success: false, message: 'Authentication required' });
          return;
        }

        const currentUserDoc = await UserModel.findById(user._id);
        if (!currentUserDoc || currentUserDoc.status === 'INACTIVE') {
          socket.emit('error_message', { message: 'User account is inactive or no longer exists' });
          if (typeof callback === 'function') callback({ success: false, message: 'User account is inactive or no longer exists' });
          return;
        }

        if (!Types.ObjectId.isValid(conversationId)) {
          socket.emit('error_message', { message: 'Invalid conversation ID' });
          if (typeof callback === 'function') callback({ success: false, message: 'Invalid conversation ID' });
          return;
        }

        const trimmedContent = (content || '').trim();
        if (!trimmedContent && (!attachments || attachments.length === 0)) {
          socket.emit('error_message', { message: 'Message content cannot be empty' });
          if (typeof callback === 'function') callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
          socket.emit('error_message', { message: 'Conversation not found' });
          if (typeof callback === 'function') callback({ success: false, message: 'Conversation not found' });
          return;
        }

        // Verify membership
        const isParticipant =
          conversation.type === 'COMPANY' ||
          conversation.participants.some(p => p.toString() === userIdStr);

        if (!isParticipant) {
          socket.emit('error_message', { message: 'You are not a participant in this conversation' });
          if (typeof callback === 'function') callback({ success: false, message: 'You are not a participant in this conversation' });
          return;
        }

        // Create Message with strictly server-verified sender identity
        const message = new MessageModel({
          conversationId: conversation._id,
          senderId: currentUserDoc._id,
          content: trimmedContent,
          messageType: messageType || 'TEXT',
          attachments: attachments || [],
          replyTo: replyTo && Types.ObjectId.isValid(replyTo) ? replyTo : null,
          readBy: [currentUserDoc._id],
          isEdited: false,
          isDeleted: false
        });

        const savedMessage = await message.save();

        // Populate sender info
        const populatedMessage = await MessageModel.findById(savedMessage._id)
          .populate('senderId', 'name role department designation profilePhoto email')
          .populate('replyTo', 'content senderId createdAt');

        // Update Conversation's lastMessage and unread counts
        conversation.lastMessage = {
          text: trimmedContent,
          senderId: currentUserDoc._id,
          senderName: currentUserDoc.name,
          createdAt: new Date()
        };
        conversation.lastMessageAt = new Date();

        // Increment unread count for other participants
        const unread: Record<string, number> = { ...((conversation.unreadCounts as any) || {}) };
        conversation.participants.forEach(p => {
          const pId = p.toString();
          if (pId !== userIdStr) {
            unread[pId] = (Number(unread[pId]) || 0) + 1;
          }
        });
        conversation.unreadCounts = unread;
        conversation.markModified('unreadCounts');
        await conversation.save();

        // 1. Broadcast new message to everyone in the conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', {
          conversationId,
          message: populatedMessage
        });

        // 2. Also broadcast directly to each participant's personal user room
        for (const p of conversation.participants) {
          const pIdStr = p.toString();
          io.to(`user:${pIdStr}`).emit('new_message', {
            conversationId,
            message: populatedMessage
          });
          io.to(`user:${pIdStr}`).emit('conversation_updated', {
            conversationId,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCounts: conversation.unreadCounts
          });

          // Dispatch updated authoritative unread count to recipient
          if (pIdStr !== userIdStr) {
            calculateUnreadMessageCounts(p as Types.ObjectId)
              .then(pCounts => {
                io.to(`user:${pIdStr}`).emit('unread_count_updated', {
                  totalUnread: pCounts.totalUnread,
                  unreadCount: pCounts.totalUnread,
                  conversationId,
                  conversationUnreadCount: pCounts.byConversation[conversationId] || 0
                });
              })
              .catch(err => console.error('[Socket send_message] Error recalculating unread for participant:', err));
          }
        }

        // Acknowledge back to sender via callback if provided
        if (typeof callback === 'function') {
          callback({ success: true, message: populatedMessage });
        }

        // 3. Dispatch persistent notifications for other participants
        for (const p of conversation.participants) {
          const pIdStr = p.toString();
          if (pIdStr === userIdStr) continue;

          const isDirect = conversation.type === 'DIRECT';
          const notifType = isDirect ? 'DIRECT_MESSAGE' : 'MESSAGE_RECEIVED';
          const notifTitle = isDirect
            ? `New message from ${currentUserDoc.name}`
            : `${conversation.name || 'Team Chat'}: ${currentUserDoc.name}`;

          await notificationDispatcher.dispatch({
            recipientId: p,
            senderId: currentUserDoc._id,
            type: notifType,
            title: notifTitle,
            message: trimmedContent.length > 80 ? trimmedContent.substring(0, 80) + '...' : trimmedContent,
            relatedEntityType: 'CONVERSATION',
            relatedEntityId: conversation._id,
            link: `/chat?conversationId=${conversation._id}`,
            idempotencyKey: `msg_${savedMessage._id}_${pIdStr}`
          });
        }
      } catch (err) {
        console.error('[Socket send_message] Error:', err);
        socket.emit('error_message', { message: 'Failed to deliver message' });
        if (typeof callback === 'function') callback({ success: false, message: 'Failed to deliver message' });
      }
    });

    /**
     * Typing Indicator Start
     */
    socket.on('typing_start', (data: { conversationId: string }) => {
      if (!data?.conversationId) return;
      socket.to(`conversation:${data.conversationId}`).emit('typing_start', {
        conversationId: data.conversationId,
        userId: userIdStr,
        userName: user.name
      });
    });

    /**
     * Typing Indicator Stop
     */
    socket.on('typing_stop', (data: { conversationId: string }) => {
      if (!data?.conversationId) return;
      socket.to(`conversation:${data.conversationId}`).emit('typing_stop', {
        conversationId: data.conversationId,
        userId: userIdStr
      });
    });

    /**
     * Read Receipts
     */
    socket.on('message_read', async (data: { conversationId: string }, callback?: (response: any) => void) => {
      try {
        const { conversationId } = data;
        if (!Types.ObjectId.isValid(conversationId)) {
          if (typeof callback === 'function') callback({ success: false, message: 'Invalid conversation ID' });
          return;
        }

        // Mark messages as read by current user
        await MessageModel.updateMany(
          {
            conversationId,
            senderId: { $ne: user._id },
            readBy: { $ne: user._id }
          },
          {
            $addToSet: { readBy: user._id }
          }
        );

        // Reset unread count for current user
        const conversation = await ConversationModel.findById(conversationId);
        if (conversation) {
          const unread: Record<string, number> = { ...((conversation.unreadCounts as any) || {}) };
          unread[userIdStr] = 0;
          conversation.unreadCounts = unread;
          conversation.markModified('unreadCounts');
          await conversation.save();
        }

        const { totalUnread, byConversation } = await calculateUnreadMessageCounts(user._id);

        // Broadcast read receipt to the conversation room
        io.to(`conversation:${conversationId}`).emit('message_read_receipt', {
          conversationId,
          userId: userIdStr,
          readAt: new Date()
        });

        // Broadcast updated unread count to current user's personal room
        io.to(`user:${userIdStr}`).emit('unread_count_updated', {
          totalUnread,
          unreadCount: totalUnread,
          conversationId,
          conversationUnreadCount: 0,
          byConversation
        });

        if (typeof callback === 'function') {
          callback({ success: true, unreadCount: totalUnread, byConversation });
        }
      } catch (err) {
        console.error('[Socket message_read] Error:', err);
        if (typeof callback === 'function') callback({ success: false, message: 'Failed to mark as read' });
      }
    });

    /**
     * Edit Message
     */
    socket.on('edit_message', async (data: { messageId: string; content: string }) => {
      try {
        const { messageId, content } = data;
        if (!Types.ObjectId.isValid(messageId) || !content?.trim()) return;

        const message = await MessageModel.findById(messageId);
        if (!message) return;

        // Sender verification
        if (message.senderId.toString() !== userIdStr) {
          socket.emit('error_message', { message: 'You can only edit your own messages' });
          return;
        }

        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(`conversation:${message.conversationId}`).emit('message_edited', {
          conversationId: message.conversationId,
          messageId: message._id,
          content: message.content,
          editedAt: message.editedAt
        });
      } catch (err) {
        console.error('[Socket edit_message] Error:', err);
      }
    });

    /**
     * Delete Message (Soft delete)
     */
    socket.on('delete_message', async (data: { messageId: string }) => {
      try {
        const { messageId } = data;
        if (!Types.ObjectId.isValid(messageId)) return;

        const message = await MessageModel.findById(messageId);
        if (!message) return;

        // Sender verification
        if (message.senderId.toString() !== userIdStr) {
          socket.emit('error_message', { message: 'You can only delete your own messages' });
          return;
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.deletedBy = user._id;
        message.content = 'This message was deleted.';
        await message.save();

        io.to(`conversation:${message.conversationId}`).emit('message_deleted', {
          conversationId: message.conversationId,
          messageId: message._id,
          content: message.content,
          deletedAt: message.deletedAt
        });
      } catch (err) {
        console.error('[Socket delete_message] Error:', err);
      }
    });

    /**
     * Disconnect Handler
     */
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userIdStr);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userIdStr);
          io.emit('user_offline', { userId: userIdStr });
        }
      }
    });
  });

  return io;
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}
