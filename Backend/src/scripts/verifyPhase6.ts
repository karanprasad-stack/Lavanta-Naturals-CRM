import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { initSocketServer } from '../socket/index.js';
import { chatController } from '../controllers/chatController.js';
import { generateToken } from '../utils/jwt.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

// Mock Express response helper
function createMockResponse() {
  const res: any = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

export async function runPhase6Verification(): Promise<void> {
  console.log('\n🌿 ===================================================');
  console.log('🌿 RUNNING PHASE 6 AUTOMATED VERIFICATION SUITE');
  console.log('🌿 ===================================================\n');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodbUri);
  }

  // Load test users
  const [founder, hr, manager, employee, intern] = await Promise.all([
    UserModel.findOne({ email: 'founder@lavantanaturals.com' }),
    UserModel.findOne({ email: 'hr@lavantanaturals.com' }),
    UserModel.findOne({ email: 'manager@lavantanaturals.com' }),
    UserModel.findOne({ email: 'employee@lavantanaturals.com' }),
    UserModel.findOne({ email: 'intern@lavantanaturals.com' })
  ]);

  if (!founder || !hr || !manager || !employee || !intern) {
    throw new Error('Required demo accounts are missing in MongoDB. Run seed.ts first.');
  }

  // Setup test HTTP + Socket.IO server on ephemeral port
  const app = express();
  app.use(express.json());
  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as any;
  const testPort = address.port;
  const socketUrl = `http://127.0.0.1:${testPort}`;

  console.log(`Test Socket.IO server listening on ephemeral port ${testPort}`);

  try {
    // -------------------------------------------------------------
    // TEST 1: Socket.IO Authentication & Token Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Socket.IO Authentication & Token Rejection ---');
    const founderToken = generateToken({
      userId: founder._id.toString(),
      email: founder.email,
      role: founder.role
    });

    // 1a. Valid token connection
    const validSocket: ClientSocketType = ClientSocket(socketUrl, {
      auth: { token: founderToken },
      transports: ['websocket']
    });

    const connectedSuccessfully = await new Promise<boolean>((resolve) => {
      validSocket.on('connect', () => resolve(true));
      validSocket.on('connect_error', () => resolve(false));
      setTimeout(() => resolve(false), 3000);
    });
    assert(connectedSuccessfully, 'Socket connects with verified JWT handshake');

    // 1b. Missing token rejection
    const noTokenSocket: ClientSocketType = ClientSocket(socketUrl, {
      auth: {},
      transports: ['websocket'],
      reconnection: false
    });

    const noTokenError = await new Promise<string>((resolve) => {
      noTokenSocket.on('connect_error', (err) => resolve(err.message));
      noTokenSocket.on('connect', () => resolve('CONNECTED_UNEXPECTEDLY'));
      setTimeout(() => resolve('TIMEOUT'), 3000);
    });
    assert(
      noTokenError.includes('Authentication required') || noTokenError.includes('No token provided'),
      'Socket rejects connection when token is missing',
      `Got: ${noTokenError}`
    );

    // 1c. Invalid token rejection
    const invalidTokenSocket: ClientSocketType = ClientSocket(socketUrl, {
      auth: { token: 'invalid_malformed_token' },
      transports: ['websocket'],
      reconnection: false
    });

    const invalidTokenError = await new Promise<string>((resolve) => {
      invalidTokenSocket.on('connect_error', (err) => resolve(err.message));
      invalidTokenSocket.on('connect', () => resolve('CONNECTED_UNEXPECTEDLY'));
      setTimeout(() => resolve('TIMEOUT'), 3000);
    });
    assert(
      invalidTokenError.includes('Authentication required') || invalidTokenError.includes('Invalid or expired'),
      'Socket rejects connection with forged/invalid token',
      `Got: ${invalidTokenError}`
    );

    validSocket.disconnect();
    noTokenSocket.disconnect();
    invalidTokenSocket.disconnect();

    // -------------------------------------------------------------
    // TEST 2: Company-Wide Conversation ("Lavanta Team")
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Default Company Conversation ("Lavanta Team") ---');
    const companyConv = await chatController.ensureCompanyConversation();
    assert(companyConv.type === 'COMPANY', 'Company conversation type is COMPANY');
    assert(companyConv.name === 'Lavanta Team', 'Company conversation is titled "Lavanta Team"');

    // Verify all active team members have access
    const mockReqFounder: any = { user: founder };
    const mockResFounder = createMockResponse();
    await chatController.getConversations(mockReqFounder, mockResFounder);

    const founderConvs = mockResFounder.data?.conversations || [];
    const hasCompanyConvFounder = founderConvs.some((c: any) => c.type === 'COMPANY' && c.name === 'Lavanta Team');
    assert(hasCompanyConvFounder, 'Founder retrieves Lavanta Team company conversation');

    const mockReqIntern: any = { user: intern };
    const mockResIntern = createMockResponse();
    await chatController.getConversations(mockReqIntern, mockResIntern);

    const internConvs = mockResIntern.data?.conversations || [];
    const hasCompanyConvIntern = internConvs.some((c: any) => c.type === 'COMPANY' && c.name === 'Lavanta Team');
    assert(hasCompanyConvIntern, 'Intern retrieves Lavanta Team company conversation');

    // -------------------------------------------------------------
    // TEST 3: Direct Conversation Creation & Idempotency
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Direct Conversation Creation & Idempotency ---');
    // First call: Founder opens direct chat with Rahul (Manager)
    const mockDirectReq1: any = {
      user: founder,
      body: { targetUserId: manager._id.toString() }
    };
    const mockDirectRes1 = createMockResponse();
    await chatController.getOrCreateDirectConversation(mockDirectReq1, mockDirectRes1);

    const conv1 = mockDirectRes1.data?.conversation;
    assert(mockDirectRes1.statusCode === 200 && !!conv1, 'Direct conversation created between Founder and Manager');
    assert(conv1?.type === 'DIRECT', 'Conversation is marked DIRECT');

    // Second call: Call again with same target user
    const mockDirectReq2: any = {
      user: founder,
      body: { targetUserId: manager._id.toString() }
    };
    const mockDirectRes2 = createMockResponse();
    await chatController.getOrCreateDirectConversation(mockDirectReq2, mockDirectRes2);

    const conv2 = mockDirectRes2.data?.conversation;
    assert(
      conv1?._id?.toString() === conv2?._id?.toString(),
      'Idempotent: Subsequent call returns existing conversation without duplication'
    );

    // -------------------------------------------------------------
    // TEST 4: Message Flow & MongoDB Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Message Flow & MongoDB Persistence ---');
    const directConvId = conv1._id.toString();
    const testContent = `Automated stability test message at ${Date.now()}`;

    const mockSendReq: any = {
      user: founder,
      params: { id: directConvId },
      body: { content: testContent, messageType: 'TEXT' }
    };
    const mockSendRes = createMockResponse();
    await chatController.sendMessage(mockSendReq, mockSendRes);

    assert(mockSendRes.statusCode === 201, 'Message created successfully (HTTP 201)');
    const savedMsg = mockSendRes.data?.message;
    assert(savedMsg?.content === testContent, 'Message content matches payload');

    // Verify stored in DB
    const dbMsg = await MessageModel.findById(savedMsg._id);
    assert(!!dbMsg, 'Message found in MongoDB MessageModel collection');
    assert(dbMsg?.senderId?.toString() === founder._id.toString(), 'Sender ID correctly recorded as authenticated user');

    // Verify Conversation lastMessage updated
    const updatedConv = await ConversationModel.findById(directConvId);
    assert(updatedConv?.lastMessage?.text === testContent, 'Conversation lastMessage.text updated in MongoDB');
    assert(
      updatedConv?.lastMessage?.senderId?.toString() === founder._id.toString(),
      'Conversation lastMessage.senderId matches sender'
    );

    // -------------------------------------------------------------
    // TEST 5: Authorization & Confidentiality Matrix
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Authorization & Confidentiality Enforcement ---');
    // Intern attempts to read private Founder <-> Manager direct chat messages
    const mockUnauthorizedReadReq: any = {
      user: intern,
      params: { id: directConvId },
      query: {}
    };
    const mockUnauthorizedReadRes = createMockResponse();
    await chatController.getMessages(mockUnauthorizedReadReq, mockUnauthorizedReadRes);

    assert(
      mockUnauthorizedReadRes.statusCode === 403,
      'Unauthorized user cannot view private direct conversation messages (HTTP 403)'
    );

    // Intern attempts to send message to private Founder <-> Manager direct chat
    const mockUnauthorizedSendReq: any = {
      user: intern,
      params: { id: directConvId },
      body: { content: 'Intruder message' }
    };
    const mockUnauthorizedSendRes = createMockResponse();
    await chatController.sendMessage(mockUnauthorizedSendReq, mockUnauthorizedSendRes);

    assert(
      mockUnauthorizedSendRes.statusCode === 403,
      'Unauthorized user cannot post messages to private direct conversation (HTTP 403)'
    );

    // -------------------------------------------------------------
    // TEST 6: Message Edit (Author vs Non-author)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Message Edit (Author vs Non-author) ---');
    const msgToEditId = savedMsg._id.toString();

    // 6a. Non-author attempts edit
    const mockNonAuthorEditReq: any = {
      user: intern,
      params: { id: msgToEditId },
      body: { content: 'Hacked message' }
    };
    const mockNonAuthorEditRes = createMockResponse();
    await chatController.editMessage(mockNonAuthorEditReq, mockNonAuthorEditRes);

    assert(mockNonAuthorEditRes.statusCode === 403, 'Non-author rejected from editing message (HTTP 403)');

    // 6b. Author edits message
    const updatedContent = 'Founder edited: Batch sample verified at 4°C.';
    const mockAuthorEditReq: any = {
      user: founder,
      params: { id: msgToEditId },
      body: { content: updatedContent }
    };
    const mockAuthorEditRes = createMockResponse();
    await chatController.editMessage(mockAuthorEditReq, mockAuthorEditRes);

    assert(mockAuthorEditRes.statusCode === 200, 'Author successfully edits message (HTTP 200)');
    const editedDbMsg = await MessageModel.findById(msgToEditId);
    assert(editedDbMsg?.content === updatedContent, 'Message content updated in MongoDB');
    assert(editedDbMsg?.isEdited === true, 'Message flagged as isEdited: true');
    assert(!!editedDbMsg?.editedAt, 'editedAt timestamp recorded');

    // -------------------------------------------------------------
    // TEST 7: Message Soft Delete (Author vs Non-author)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Message Soft Delete (Author vs Non-author) ---');
    // 7a. Non-author attempts delete
    const mockNonAuthorDeleteReq: any = {
      user: intern,
      params: { id: msgToEditId }
    };
    const mockNonAuthorDeleteRes = createMockResponse();
    await chatController.deleteMessage(mockNonAuthorDeleteReq, mockNonAuthorDeleteRes);

    assert(mockNonAuthorDeleteRes.statusCode === 403, 'Non-author rejected from deleting message (HTTP 403)');

    // 7b. Author deletes message
    const mockAuthorDeleteReq: any = {
      user: founder,
      params: { id: msgToEditId }
    };
    const mockAuthorDeleteRes = createMockResponse();
    await chatController.deleteMessage(mockAuthorDeleteReq, mockAuthorDeleteRes);

    assert(mockAuthorDeleteRes.statusCode === 200, 'Author successfully deletes message (HTTP 200)');
    const deletedDbMsg = await MessageModel.findById(msgToEditId);
    assert(deletedDbMsg?.isDeleted === true, 'Message marked isDeleted: true');
    assert(deletedDbMsg?.content === 'This message was deleted.', 'Message content replaced with placeholder');
    assert(deletedDbMsg?.deletedBy?.toString() === founder._id.toString(), 'Audit deletedBy recorded');

    // -------------------------------------------------------------
    // TEST 8: Read Receipts & Unread Counts
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Read Receipts & Unread Counts ---');
    // Founder sends fresh unread message to Manager
    const freshMsgContent = `Unread test message at ${Date.now()}`;
    const mockFreshSendReq: any = {
      user: founder,
      params: { id: directConvId },
      body: { content: freshMsgContent }
    };
    const mockFreshSendRes = createMockResponse();
    await chatController.sendMessage(mockFreshSendReq, mockFreshSendRes);

    // Verify Manager's unread count in conversation is > 0
    const convBeforeRead = await ConversationModel.findById(directConvId);
    const unreadBefore = (convBeforeRead?.unreadCounts as any)?.[manager._id.toString()] || 0;
    assert(unreadBefore >= 1, 'Manager has unread messages recorded in conversation');

    // Manager marks conversation as read
    const mockReadReq: any = {
      user: manager,
      params: { id: directConvId }
    };
    const mockReadRes = createMockResponse();
    await chatController.markAsRead(mockReadReq, mockReadRes);

    assert(mockReadRes.statusCode === 200, 'Manager marked conversation as read (HTTP 200)');

    // Verify unread count reset
    const convAfterRead = await ConversationModel.findById(directConvId);
    const unreadAfter = (convAfterRead?.unreadCounts as any)?.[manager._id.toString()] || 0;
    assert(unreadAfter === 0, 'Manager unread count reset to 0 in conversation');

    // Verify Manager added to readBy
    const freshDbMsg = await MessageModel.findById(mockFreshSendRes.data?.message?._id);
    const isReadByManager = freshDbMsg?.readBy?.some((id: any) => id.toString() === manager._id.toString());
    assert(isReadByManager === true, 'Manager recorded in message readBy array');

  } finally {
    // Teardown test server
    server.close();
  }

  // Summary
  console.log('\n====================================================');
  console.log(`🌿 PHASE 6 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 6 REAL-TIME CHAT TESTS COMPLETED SUCCESSFULLY!\n');
  } else {
    throw new Error(`Verification failed: ${totalTests - passedTests} tests did not pass.`);
  }
}

if (process.argv[1]?.endsWith('verifyPhase6.ts')) {
  runPhase6Verification()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
