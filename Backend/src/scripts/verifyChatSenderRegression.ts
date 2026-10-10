import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { config } from '../config/env.js';
import { UserModel, IUser } from '../models/User.js';
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

export async function runChatSenderRegressionTests(): Promise<void> {
  console.log('\n🌿 ========================================================');
  console.log('🌿 CHAT SENDER IDENTITY REGRESSION TEST SUITE');
  console.log('🌿 ========================================================\n');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodbUri);
  }

  // Retrieve test accounts
  const [founder, hr, manager, employee, intern] = await Promise.all([
    UserModel.findOne({ email: 'founder@lavantanaturals.com' }),
    UserModel.findOne({ email: 'hr@lavantanaturals.com' }),
    UserModel.findOne({ email: 'manager@lavantanaturals.com' }),
    UserModel.findOne({ email: 'employee@lavantanaturals.com' }),
    UserModel.findOne({ email: 'intern@lavantanaturals.com' })
  ]);

  if (!founder || !hr || !manager || !employee || !intern) {
    throw new Error('Required demo accounts are missing in MongoDB.');
  }

  // Setup ephemeral test HTTP + Socket.IO server
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

  // Helper to create authenticated client socket
  const createAuthSocket = async (user: IUser): Promise<ClientSocketType> => {
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    const socket = ClientSocket(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', (err) => reject(err));
      setTimeout(() => reject(new Error('Socket connection timeout')), 4000);
    });

    return socket;
  };

  try {
    // 1. Ensure Company Conversation exists and has all participants
    const companyConv = await chatController.ensureCompanyConversation();
    const convId = companyConv._id.toString();

    // 2. Connect live sockets for each role
    const founderSocket = await createAuthSocket(founder);
    const hrSocket = await createAuthSocket(hr);
    const managerSocket = await createAuthSocket(manager);
    const employeeSocket = await createAuthSocket(employee);
    const internSocket = await createAuthSocket(intern);

    // Join room for company conversation
    founderSocket.emit('join_conversation', convId);
    hrSocket.emit('join_conversation', convId);
    managerSocket.emit('join_conversation', convId);
    employeeSocket.emit('join_conversation', convId);
    internSocket.emit('join_conversation', convId);

    // Allow room joins to process
    await new Promise(r => setTimeout(r, 200));

    // -------------------------------------------------------------------------
    // SCENARIO 1: Intern sends a group message -> Intern appears as sender
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 1: Intern sends group message ---');
    const internMessagePromise = new Promise<any>((resolve) => {
      founderSocket.once('new_message', (payload) => resolve(payload));
    });

    internSocket.emit('send_message', {
      conversationId: convId,
      content: 'Intern group message: Campaign assets draft completed.'
    });

    const internBroadcast = await internMessagePromise;
    const internSenderObj = internBroadcast.message.senderId;

    assert(
      internSenderObj._id?.toString() === intern._id.toString(),
      'Scenario 1: Broadcast senderId matches Intern ObjectId, NOT Founder'
    );
    assert(
      internSenderObj.role === 'INTERN',
      'Scenario 1: Broadcast sender role is strictly INTERN'
    );
    assert(
      internSenderObj.name === intern.name,
      'Scenario 1: Broadcast sender name matches Intern name'
    );

    const internDbMsg = await MessageModel.findById(internBroadcast.message._id);
    assert(
      internDbMsg?.senderId?.toString() === intern._id.toString(),
      'Scenario 1: Stored MongoDB senderId is Intern ObjectId'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 2: Employee sends a group message -> Correct Employee appears
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Employee sends group message ---');
    const empMessagePromise = new Promise<any>((resolve) => {
      internSocket.once('new_message', (payload) => resolve(payload));
    });

    employeeSocket.emit('send_message', {
      conversationId: convId,
      content: 'Employee message: New formulation batch sent for lab testing.'
    });

    const empBroadcast = await empMessagePromise;
    assert(
      empBroadcast.message.senderId._id?.toString() === employee._id.toString(),
      'Scenario 2: Broadcast senderId matches Employee ObjectId'
    );
    assert(
      empBroadcast.message.senderId.role === 'EMPLOYEE',
      'Scenario 2: Broadcast sender role is EMPLOYEE'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 3: HR user sends a message -> Correct HR profile appears
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 3: HR sends group message ---');
    const hrMessagePromise = new Promise<any>((resolve) => {
      internSocket.once('new_message', (payload) => resolve(payload));
    });

    hrSocket.emit('send_message', {
      conversationId: convId,
      content: 'HR message: Q3 Team wellness survey is now live.'
    });

    const hrBroadcast = await hrMessagePromise;
    assert(
      hrBroadcast.message.senderId._id?.toString() === hr._id.toString(),
      'Scenario 3: Broadcast senderId matches HR ObjectId'
    );
    assert(
      hrBroadcast.message.senderId.role === 'HR',
      'Scenario 3: Broadcast sender role is HR'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 4: Manager sends a message -> Correct Manager profile appears
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Manager sends group message ---');
    const managerMessagePromise = new Promise<any>((resolve) => {
      internSocket.once('new_message', (payload) => resolve(payload));
    });

    managerSocket.emit('send_message', {
      conversationId: convId,
      content: 'Manager message: Packaging inventory restocked.'
    });

    const managerBroadcast = await managerMessagePromise;
    assert(
      managerBroadcast.message.senderId._id?.toString() === manager._id.toString(),
      'Scenario 4: Broadcast senderId matches Manager ObjectId'
    );
    assert(
      managerBroadcast.message.senderId.role === 'MANAGER',
      'Scenario 4: Broadcast sender role is MANAGER'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 5: Founder sends a message -> Founder appears correctly
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Founder sends group message ---');
    const founderMessagePromise = new Promise<any>((resolve) => {
      internSocket.once('new_message', (payload) => resolve(payload));
    });

    founderSocket.emit('send_message', {
      conversationId: convId,
      content: 'Founder message: Stellar results across all channels this month!'
    });

    const founderBroadcast = await founderMessagePromise;
    assert(
      founderBroadcast.message.senderId._id?.toString() === founder._id.toString(),
      'Scenario 5: Broadcast senderId matches Founder ObjectId'
    );
    assert(
      founderBroadcast.message.senderId.role === 'FOUNDER',
      'Scenario 5: Broadcast sender role is FOUNDER'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 6: Other group members receive correct sender identity in real-time
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Group members receive real-time identity ---');
    let managerReceivedRole = '';
    let employeeReceivedRole = '';

    const multiReceivePromise = Promise.all([
      new Promise<void>((res) => {
        managerSocket.once('new_message', (p) => {
          managerReceivedRole = p.message.senderId.role;
          res();
        });
      }),
      new Promise<void>((res) => {
        employeeSocket.once('new_message', (p) => {
          employeeReceivedRole = p.message.senderId.role;
          res();
        });
      })
    ]);

    internSocket.emit('send_message', {
      conversationId: convId,
      content: 'Intern broadcast test for all peers.'
    });

    await multiReceivePromise;
    assert(
      managerReceivedRole === 'INTERN' && employeeReceivedRole === 'INTERN',
      'Scenario 6: All connected group members receive the author as INTERN in real-time'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 7: Reloading conversation preserves correct sender identity
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Reloading conversation preserves identity ---');
    const mockReloadReq: any = {
      user: intern,
      params: { id: convId },
      query: { limit: '20' }
    };
    const mockReloadRes = createMockResponse();
    await chatController.getMessages(mockReloadReq, mockReloadRes);

    const reloadedMessages = mockReloadRes.data?.messages || [];
    const lastMsg = reloadedMessages[reloadedMessages.length - 1];
    assert(
      lastMsg && lastMsg.senderId && lastMsg.senderId._id.toString() === intern._id.toString(),
      'Scenario 7: Reloaded conversation retains Intern as author of intern message'
    );
    assert(
      lastMsg.senderId.role === 'INTERN',
      'Scenario 7: Reloaded message senderId object contains role: INTERN'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 8: Unauthenticated user cannot impersonate another user
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Unauthenticated user cannot impersonate ---');
    const mockUnauthReq: any = {
      user: null,
      params: { id: convId },
      body: { content: 'Impersonation attempt', senderId: founder._id.toString() }
    };
    const mockUnauthRes = createMockResponse();
    await chatController.sendMessage(mockUnauthReq, mockUnauthRes);

    assert(
      mockUnauthRes.statusCode === 401,
      'Scenario 8: Unauthenticated request rejected with HTTP 401'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 9: Member cannot forge senderId on behalf of another member
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 9: Forged senderId in payload is ignored ---');
    const mockForgedReq: any = {
      user: intern,
      params: { id: convId },
      body: {
        content: 'Forged sender test message',
        senderId: founder._id.toString(), // Attacker tries to pass Founder's ID
        role: 'FOUNDER'
      }
    };
    const mockForgedRes = createMockResponse();
    await chatController.sendMessage(mockForgedReq, mockForgedRes);

    assert(mockForgedRes.statusCode === 201, 'Scenario 9: Message processed by authenticated session');
    const savedForgedMsg = mockForgedRes.data?.message;
    assert(
      savedForgedMsg.senderId._id.toString() === intern._id.toString(),
      'Scenario 9: Backend ignores client senderId and saves actual Intern ID'
    );
    assert(
      savedForgedMsg.senderId.role === 'INTERN',
      'Scenario 9: Populated sender role is strictly INTERN'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 10: Existing direct messaging and notifications remain operational
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 10: Direct messaging & notifications intact ---');
    const mockDirectReq: any = {
      user: intern,
      body: { targetUserId: hr._id.toString() }
    };
    const mockDirectRes = createMockResponse();
    await chatController.getOrCreateDirectConversation(mockDirectReq, mockDirectRes);

    const directConv = mockDirectRes.data?.conversation;
    assert(
      mockDirectRes.statusCode === 200 && directConv?.type === 'DIRECT',
      'Scenario 10: Intern can open direct conversation with HR'
    );

    const mockDirectMsgReq: any = {
      user: intern,
      params: { id: directConv._id.toString() },
      body: { content: 'Direct inquiry to HR regarding orientation.' }
    };
    const mockDirectMsgRes = createMockResponse();
    await chatController.sendMessage(mockDirectMsgReq, mockDirectMsgRes);

    assert(
      mockDirectMsgRes.statusCode === 201 &&
      mockDirectMsgRes.data?.message?.senderId?._id?.toString() === intern._id.toString(),
      'Scenario 10: Direct message sent with correct Intern identity'
    );

    // Disconnect all test sockets
    founderSocket.disconnect();
    hrSocket.disconnect();
    managerSocket.disconnect();
    employeeSocket.disconnect();
    internSocket.disconnect();

  } finally {
    server.close();
  }

  console.log('\n========================================================');
  console.log(`🌿 REGRESSION SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL 10 REGRESSION SCENARIOS VERIFIED SUCCESSFULLY!\n');
  } else {
    throw new Error(`Regression test suite failed: ${totalTests - passedTests} tests failed.`);
  }
}

if (process.argv[1]?.endsWith('verifyChatSenderRegression.ts')) {
  runChatSenderRegressionTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
