import mongoose from 'mongoose';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { UserModel } from '../models/User.js';
import { config } from '../config/env.js';

async function testCounts() {
  await mongoose.connect(config.mongodbUri);
  const users = await UserModel.find({});
  for (const u of users) {
    const convs = await ConversationModel.find({
      $or: [{ type: 'COMPANY' }, { participants: u._id }]
    }).select('_id');
    const convIds = convs.map(c => c._id);
    const agg = await MessageModel.aggregate([
      {
        $match: {
          conversationId: { $in: convIds },
          senderId: { $ne: u._id },
          readBy: { $ne: u._id },
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
    const total = agg.reduce((sum, item) => sum + item.count, 0);
    console.log(u.role.padEnd(8), u.email.padEnd(30), 'Real Unread Messages:', total, 'Per conv:', JSON.stringify(agg));
  }
  await mongoose.disconnect();
}
testCounts().catch(console.error);
