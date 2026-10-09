import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Types } from 'mongoose';
import { verifyToken } from '../utils/jwt.js';
import { UserModel, IUser } from '../models/User.js';
import { ConversationModel, IConversation } from '../models/Conversation.js';
import { MessageModel, IMessage } from '../models/Message.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';
import { config } from '../config/env.js';

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
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
    }) => {
      try {
        const { conversationId, content, messageType, attachments, replyTo } = data;

        if (!Types.ObjectId.isValid(conversationId)) {
          socket.emit('error_message', { message: 'Invalid conversation ID' });
          return;
        }

        const trimmedContent = (content || '').trim();
        if (!trimmedContent && (!attachments || attachments.length === 0)) {
          socket.emit('error_message', { message: 'Message content cannot be empty' });
          return;
        }

        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
          socket.emit('error_message', { message: 'Conversation not found' });
          return;
        }

        // Verify membership
        const isParticipant =
          conversation.type === 'COMPANY' ||
          conversation.participants.some(p => p.toString() === userIdStr);

        if (!isParticipant) {
          socket.emit('error_message', { message: 'You are not a participant in this conversation' });
          return;
        }

        // Create Message
        const message = new MessageModel({
          conversationId: conversation._id,
          senderId: user._id,
          content: trimmedContent,
          messageType: messageType || 'TEXT',
          attachments: attachments || [],
          replyTo: replyTo && Types.ObjectId.isValid(replyTo) ? replyTo : null,
          readBy: [user._id],
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
          senderId: user._id,
          senderName: user.name,
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

        // 2. Also notify each participant's personal room to update conversation list previews
        conversation.participants.forEach(p => {
          io.to(`user:${p.toString()}`).emit('conversation_updated', {
            conversationId,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCounts: conversation.unreadCounts
          });
        });

        // 3. Dispatch persistent notifications for other participants
        for (const p of conversation.participants) {
          const pIdStr = p.toString();
          if (pIdStr === userIdStr) continue;

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
    socket.on('message_read', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        if (!Types.ObjectId.isValid(conversationId)) return;

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

        // Broadcast read receipt to the conversation room
        io.to(`conversation:${conversationId}`).emit('message_read_receipt', {
          conversationId,
          userId: userIdStr,
          readAt: new Date()
        });
      } catch (err) {
        console.error('[Socket message_read] Error:', err);
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
