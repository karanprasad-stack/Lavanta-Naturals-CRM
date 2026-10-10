import { io as Client } from 'socket.io-client';
import { generateToken } from '../utils/jwt.js';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import { ConversationModel } from '../models/Conversation.js';
import { config } from '../config/env.js';

async function test() {
  await mongoose.connect(config.mongodbUri);
  const intern = await UserModel.findOne({ role: 'INTERN' });
  const companyConv = await ConversationModel.findOne({ type: 'COMPANY' });
  if (!intern || !companyConv) {
    console.error('Intern or Company conv not found');
    process.exit(1);
  }

  const token = generateToken({
    userId: intern._id.toString(),
    email: intern.email,
    role: intern.role
  });

  console.log('Connecting socket as Intern:', intern.name);
  const socket = Client('http://localhost:5000', {
    auth: { token },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Socket connected! ID:', socket.id);
    socket.emit('join_conversation', companyConv._id.toString());
    console.log('Emitted join_conversation:', companyConv._id.toString());

    setTimeout(() => {
      console.log('Emitting send_message...');
      socket.emit('send_message', {
        conversationId: companyConv._id.toString(),
        content: 'Test real-time message at ' + Date.now()
      });
    }, 500);
  });

  socket.on('new_message', (data) => {
    console.log('SUCCESS! Received new_message event:', data);
    socket.disconnect();
    mongoose.disconnect();
    process.exit(0);
  });

  socket.on('error_message', (err) => {
    console.error('Socket error_message:', err);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err);
  });

  setTimeout(() => {
    console.error('TIMEOUT: Did not receive new_message after 5s');
    socket.disconnect();
    mongoose.disconnect();
    process.exit(1);
  }, 5000);
}

test().catch(console.error);
