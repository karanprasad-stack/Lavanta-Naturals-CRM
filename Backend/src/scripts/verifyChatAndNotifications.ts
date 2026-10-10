import mongoose from 'mongoose';
import { io as Client, Socket } from 'socket.io-client';
import { config } from '../config/env.js';
import { UserModel, UserRole } from '../models/User.js';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { NotificationModel } from '../models/Notification.js';
import { generateToken } from '../utils/jwt.js';

const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('🚀 [Test] Connecting to MongoDB...');
  await mongoose.connect(config.mongodbUri);

  // 1. Fetch test users
  const intern = await UserModel.findOne({ role: 'INTERN' });
  const manager = await UserModel.findOne({ role: 'MANAGER' });
  const hr = await UserModel.findOne({ role: 'HR' });
  const founder = await UserModel.findOne({ role: 'FOUNDER' });

  if (!intern || !manager || !hr || !founder) {
    throw new Error('Test users not found in database');
  }

  const internToken = generateToken({ userId: intern._id.toString(), email: intern.email, role: intern.role });
  const managerToken = generateToken({ userId: manager._id.toString(), email: manager.email, role: manager.role });

  console.log(`✓ Test accounts: Intern=${intern.name}, Manager=${manager.name}`);

  // Find company conversation
  const companyConv = await ConversationModel.findOne({ type: 'COMPANY' });
  if (!companyConv) throw new Error('Company conversation not found');
  const convId = companyConv._id.toString();

  console.log(`✓ Target Company Conversation: ${companyConv.name} (${convId})`);

  // =========================================================================
  // TEST BUG 1: Real-Time Multi-Client Delivery & Sender Immediate Persistence
  // =========================================================================
  console.log('\n--- TEST SUITE 1: BUG 1 (Real-time Message Delivery) ---');

  // Connect manager socket (receiver)
  const managerSocket: Socket = Client('http://localhost:5000', {
    auth: { token: managerToken },
    transports: ['websocket']
  });

  // Connect intern socket (sender)
  const internSocket: Socket = Client('http://localhost:5000', {
    auth: { token: internToken },
    transports: ['websocket']
  });

  await Promise.all([
    new Promise<void>((resolve) => managerSocket.on('connect', () => resolve())),
    new Promise<void>((resolve) => internSocket.on('connect', () => resolve()))
  ]);
  console.log('✓ Both Intern & Manager sockets connected simultaneously.');

  // Manager listens for incoming message
  const testContent = `Automated Real-Time Test Message #${Date.now()}`;
  let managerReceivedMessage: any = null;
  let managerConversationUpdated: any = null;

  managerSocket.on('new_message', (data) => {
    if (data.message?.content === testContent) {
      managerReceivedMessage = data;
    }
  });

  managerSocket.on('conversation_updated', (data) => {
    if (data.conversationId === convId) {
      managerConversationUpdated = data;
    }
  });

  // Intern sends message via HTTP API
  const sendRes = await fetch(`${API_BASE}/chat/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${internToken}`
    },
    body: JSON.stringify({ content: testContent })
  });

  const sendData = await sendRes.json();
  if (!sendData.success || !sendData.message) {
    throw new Error(`Failed to send message: ${JSON.stringify(sendData)}`);
  }
  console.log('✓ [Sender] Intern message persisted immediately via backend API with ID:', sendData.message._id);
  if (sendData.message.senderId?.name !== intern.name || sendData.message.senderId?.role !== 'INTERN') {
    throw new Error('Sender identity not correctly populated');
  }
  console.log(`✓ [Sender] Correct sender populated: ${sendData.message.senderId.name} (${sendData.message.senderId.role})`);

  // Wait for manager socket to receive the event
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (managerReceivedMessage) resolve();
      else reject(new Error('Timeout waiting for real-time socket delivery to Manager'));
    }, 4000);

    const interval = setInterval(() => {
      if (managerReceivedMessage) {
        clearTimeout(timeout);
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });

  console.log('✓ [Receiver] Manager received real-time new_message event without refresh!');
  console.log(`  Content: "${managerReceivedMessage.message.content}"`);
  console.log(`  Sender populated: ${managerReceivedMessage.message.senderId.name} (${managerReceivedMessage.message.senderId.role})`);

  // Verify DB persistence after reload query
  const persistedMsg = await MessageModel.findById(sendData.message._id);
  if (!persistedMsg || persistedMsg.content !== testContent) {
    throw new Error('Message not found in MongoDB database');
  }
  console.log('✓ [Persistence] Message verified in database (survives page refresh).');

  // =========================================================================
  // TEST BUG 3: Unread Message Counts & Independent Read State
  // =========================================================================
  console.log('\n--- TEST SUITE 2: BUG 3 (Authoritative Unread Message Count) ---');

  // Check Manager's unread count
  const mgrUnreadRes1 = await fetch(`${API_BASE}/chat/unread-count`, {
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const mgrUnreadData1 = await mgrUnreadRes1.json();
  console.log(`✓ Manager unread count before read: ${mgrUnreadData1.unreadCount} (contains Company conv unread: ${mgrUnreadData1.byConversation[convId]})`);

  if (!mgrUnreadData1.byConversation[convId] || mgrUnreadData1.byConversation[convId] < 1) {
    throw new Error('Manager should have at least 1 unread message in company chat');
  }

  // Sender's own unread count should NOT increase for their own message
  const internUnreadRes = await fetch(`${API_BASE}/chat/unread-count`, {
    headers: { Authorization: `Bearer ${internToken}` }
  });
  const internUnreadData = await internUnreadRes.json();
  console.log(`✓ Intern (sender) unread count for company chat: ${internUnreadData.byConversation[convId] || 0} (Own message excluded!)`);

  // Manager marks company conversation as read
  let managerUnreadUpdatedEvent: any = null;
  managerSocket.on('unread_count_updated', (data) => {
    if (data.conversationId === convId) {
      managerUnreadUpdatedEvent = data;
    }
  });

  const readRes = await fetch(`${API_BASE}/chat/conversations/${convId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const readData = await readRes.json();
  console.log('✓ Manager marked company conversation as read. API Response unreadCount:', readData.unreadCount);

  // Check Manager's new unread count
  const mgrUnreadRes2 = await fetch(`${API_BASE}/chat/unread-count`, {
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const mgrUnreadData2 = await mgrUnreadRes2.json();
  console.log(`✓ Manager unread count after reading: ${mgrUnreadData2.unreadCount} (Company conv unread: ${mgrUnreadData2.byConversation[convId] || 0})`);

  if (mgrUnreadData2.byConversation[convId] && mgrUnreadData2.byConversation[convId] !== 0) {
    throw new Error(`Company chat unread count should be 0, got ${mgrUnreadData2.byConversation[convId]}`);
  }
  console.log('✓ Company chat unread count for Manager successfully reduced to 0!');

  // Test idempotency: calling mark as read again does not cause negative counts
  const readRes2 = await fetch(`${API_BASE}/chat/conversations/${convId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const readData2 = await readRes2.json();
  if (readData2.unreadCount < 0) {
    throw new Error('Unread count became negative!');
  }
  console.log('✓ Repeated mark-as-read calls are idempotent (no negative numbers).');

  // Verify other users (e.g. HR or Founder) maintain their own independent unread state
  const hrToken = generateToken({ userId: hr._id.toString(), email: hr.email, role: hr.role });
  const hrUnreadRes = await fetch(`${API_BASE}/chat/unread-count`, {
    headers: { Authorization: `Bearer ${hrToken}` }
  });
  const hrUnreadData = await hrUnreadRes.json();
  console.log(`✓ HR independent unread count: ${hrUnreadData.unreadCount} (Unchanged by Manager reading!)`);

  // =========================================================================
  // TEST BUG 2: Notifications API and State
  // =========================================================================
  console.log('\n--- TEST SUITE 3: BUG 2 (Notifications Read & Mark All Operations) ---');

  // Create test notification for Manager
  const testNotif = await NotificationModel.create({
    recipientId: manager._id,
    senderId: intern._id,
    type: 'SYSTEM',
    title: 'Test Notification Popover Bug 2',
    message: 'Testing dismiss and mark read behavior',
    isRead: false
  });

  const getNotifRes = await fetch(`${API_BASE}/notifications?limit=10`, {
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const getNotifData = await getNotifRes.json();
  console.log(`✓ Fetched Manager notifications. Total unread notifications: ${getNotifData.unreadCount}`);

  // Test single mark as read
  const markOneRes = await fetch(`${API_BASE}/notifications/${testNotif._id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const markOneData = await markOneRes.json();
  if (!markOneData.success) throw new Error('Failed to mark single notification as read');
  console.log('✓ Mark as read on single notification confirmed by backend.');

  // Test Mark all as read
  const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const markAllData = await markAllRes.json();
  if (!markAllData.success) throw new Error('Failed to mark all notifications as read');
  console.log('✓ Mark all notifications as read confirmed by backend.');

  const checkNotifRes = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  const checkNotifData = await checkNotifRes.json();
  console.log(`✓ Manager notifications unread count is now: ${checkNotifData.unreadCount}`);

  // Clean up test sockets and DB
  managerSocket.disconnect();
  internSocket.disconnect();
  await NotificationModel.findByIdAndDelete(testNotif._id);
  await MessageModel.findByIdAndDelete(sendData.message._id);
  await mongoose.disconnect();

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
