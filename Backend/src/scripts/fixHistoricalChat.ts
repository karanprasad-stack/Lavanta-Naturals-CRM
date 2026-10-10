import mongoose from 'mongoose';
import '../models/User.js';
import { config } from '../config/env.js';
import { MessageModel } from '../models/Message.js';
import { UserModel } from '../models/User.js';
import { ConversationModel } from '../models/Conversation.js';

async function fixHistoricalMessages() {
  await mongoose.connect(config.mongodbUri);
  console.log('[FixHistory] Connected to MongoDB');

  const intern = await UserModel.findOne({ email: 'intern@lavantanaturals.com' });
  if (!intern) {
    console.error('[FixHistory] Intern user not found.');
    await mongoose.disconnect();
    return;
  }

  // Target message verified by audit log 6ac933e351082ed8e939e0b0
  const targetMsgId = '6ac9340751082ed8e939e146';
  const msg = await MessageModel.findById(targetMsgId);

  if (msg) {
    console.log(`[FixHistory] Correcting message ${targetMsgId}: setting senderId to Intern (${intern._id} - ${intern.name})`);
    msg.senderId = intern._id;
    await msg.save();
    console.log('[FixHistory] Message updated successfully.');

    // Also update conversation lastMessage if it references this message
    const companyConv = await ConversationModel.findOne({ type: 'COMPANY' });
    if (companyConv && companyConv.lastMessage?.text === 'HIII TEAM') {
      companyConv.lastMessage.senderId = intern._id;
      companyConv.lastMessage.senderName = intern.name;
      await companyConv.save();
      console.log('[FixHistory] Company conversation lastMessage updated successfully.');
    }
  } else {
    console.log('[FixHistory] Target message not found (may already be corrected or purged).');
  }

  await mongoose.disconnect();
}

fixHistoricalMessages().catch(console.error);
