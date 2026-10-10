import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';

export async function seedChat(): Promise<void> {
  try {
    console.log('[SeedChat] Connecting to MongoDB:', config.mongodbUri);
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }

    const [founder, hr, manager, employee, intern] = await Promise.all([
      UserModel.findOne({ email: 'founder@lavantanaturals.com' }),
      UserModel.findOne({ email: 'hr@lavantanaturals.com' }),
      UserModel.findOne({ email: 'manager@lavantanaturals.com' }),
      UserModel.findOne({ email: 'employee@lavantanaturals.com' }),
      UserModel.findOne({ email: 'intern@lavantanaturals.com' })
    ]);

    if (!founder || !hr || !manager || !employee || !intern) {
      console.error('[SeedChat] Required users missing. Run seed.ts first.');
      return;
    }

    const allActiveUsers = await UserModel.find({ status: 'ACTIVE' });
    const allUserIds = allActiveUsers.map(u => u._id);

    console.log('[SeedChat] Clearing old chat conversations and messages...');
    await ConversationModel.deleteMany({});
    await MessageModel.deleteMany({});

    const now = new Date();

    // 1. Create Default Company Chat: "Lavanta Team"
    const companyConv = await ConversationModel.create({
      type: 'COMPANY',
      name: 'Lavanta Team',
      avatar: '',
      participants: allUserIds,
      createdBy: founder._id,
      lastMessage: {
        text: 'Completed the color-grading cut for the Bakuchiol serum reel! Ready for review.',
        senderId: intern._id,
        senderName: intern.name,
        createdAt: new Date(now.getTime() - 5 * 60 * 1000)
      },
      lastMessageAt: new Date(now.getTime() - 5 * 60 * 1000),
      unreadCounts: {
        [founder._id.toString()]: 1,
        [intern._id.toString()]: 0
      }
    });

    await MessageModel.create([
      {
        conversationId: companyConv._id,
        senderId: hr._id,
        content: 'Marketing & Product sync is scheduled for 4:00 PM in Conference Room A.',
        messageType: 'TEXT',
        readBy: [hr._id, manager._id, employee._id, intern._id],
        createdAt: new Date(now.getTime() - 45 * 60 * 1000)
      },
      {
        conversationId: companyConv._id,
        senderId: manager._id,
        content: 'Operations team will present batch stability and logistics status.',
        messageType: 'TEXT',
        readBy: [manager._id, hr._id, employee._id, intern._id],
        createdAt: new Date(now.getTime() - 30 * 60 * 1000)
      },
      {
        conversationId: companyConv._id,
        senderId: employee._id,
        content: "I'll join with the formulation sample kit.",
        messageType: 'TEXT',
        readBy: [employee._id, intern._id],
        createdAt: new Date(now.getTime() - 15 * 60 * 1000)
      },
      {
        conversationId: companyConv._id,
        senderId: intern._id,
        content: 'Completed the color-grading cut for the Bakuchiol serum reel! Ready for review.',
        messageType: 'TEXT',
        readBy: [intern._id],
        createdAt: new Date(now.getTime() - 5 * 60 * 1000)
      }
    ]);

    // 2. Create Group Chat: "Product & Campaign Squad"
    const groupConv = await ConversationModel.create({
      type: 'GROUP',
      name: 'Product & Campaign Squad',
      participants: [founder._id, manager._id, employee._id, intern._id],
      createdBy: founder._id,
      lastMessage: {
        text: 'I have uploaded the social preview mockups to the shared workspace.',
        senderId: intern._id,
        senderName: intern.name,
        createdAt: new Date(now.getTime() - 2 * 60 * 1000)
      },
      lastMessageAt: new Date(now.getTime() - 2 * 60 * 1000),
      unreadCounts: {
        [founder._id.toString()]: 1,
        [intern._id.toString()]: 0
      }
    });

    await MessageModel.create([
      {
        conversationId: groupConv._id,
        senderId: founder._id,
        content: 'Welcome team. Let us coordinate the Diwali product launch here.',
        messageType: 'TEXT',
        readBy: [founder._id, manager._id, employee._id, intern._id],
        createdAt: new Date(now.getTime() - 20 * 60 * 1000)
      },
      {
        conversationId: groupConv._id,
        senderId: manager._id,
        content: 'Logistics dispatch is aligned with the promotional schedule.',
        messageType: 'TEXT',
        readBy: [manager._id, intern._id],
        createdAt: new Date(now.getTime() - 10 * 60 * 1000)
      },
      {
        conversationId: groupConv._id,
        senderId: employee._id,
        content: 'Samples ready for the beauty influencers cohort.',
        messageType: 'TEXT',
        readBy: [employee._id, intern._id],
        createdAt: new Date(now.getTime() - 6 * 60 * 1000)
      },
      {
        conversationId: groupConv._id,
        senderId: intern._id,
        content: 'I have uploaded the social preview mockups to the shared workspace.',
        messageType: 'TEXT',
        readBy: [intern._id],
        createdAt: new Date(now.getTime() - 2 * 60 * 1000)
      }
    ]);

    // 2. Create Direct Chat: Founder <-> Rahul (Manager)
    const direct1 = await ConversationModel.create({
      type: 'DIRECT',
      participants: [founder._id, manager._id],
      createdBy: founder._id,
      lastMessage: {
        text: 'All sensors calibrated and stable at 4°C. Reports logged.',
        senderId: manager._id,
        senderName: manager.name,
        createdAt: new Date(now.getTime() - 25 * 60 * 1000)
      },
      lastMessageAt: new Date(now.getTime() - 25 * 60 * 1000),
      unreadCounts: {
        [founder._id.toString()]: 1,
        [manager._id.toString()]: 0
      }
    });

    await MessageModel.create([
      {
        conversationId: direct1._id,
        senderId: founder._id,
        content: 'Rahul, how are the cold room temperature logs for batch #LN-409?',
        messageType: 'TEXT',
        readBy: [founder._id, manager._id],
        createdAt: new Date(now.getTime() - 40 * 60 * 1000)
      },
      {
        conversationId: direct1._id,
        senderId: manager._id,
        content: 'All sensors calibrated and stable at 4°C. Reports logged.',
        messageType: 'TEXT',
        readBy: [manager._id],
        createdAt: new Date(now.getTime() - 25 * 60 * 1000)
      }
    ]);

    // 3. Create Direct Chat: Rahul (Manager) <-> Priya (HR)
    const direct2 = await ConversationModel.create({
      type: 'DIRECT',
      participants: [manager._id, hr._id],
      createdBy: manager._id,
      lastMessage: {
        text: 'Reviewing the intern workstation setup checklist.',
        senderId: hr._id,
        senderName: hr.name,
        createdAt: new Date(now.getTime() - 10 * 60 * 1000)
      },
      lastMessageAt: new Date(now.getTime() - 10 * 60 * 1000),
      unreadCounts: {
        [manager._id.toString()]: 1,
        [hr._id.toString()]: 0
      }
    });

    await MessageModel.create([
      {
        conversationId: direct2._id,
        senderId: manager._id,
        content: 'Priya, do we have safety lab badges ready for the new interns?',
        messageType: 'TEXT',
        readBy: [manager._id, hr._id],
        createdAt: new Date(now.getTime() - 20 * 60 * 1000)
      },
      {
        conversationId: direct2._id,
        senderId: hr._id,
        content: 'Reviewing the intern workstation setup checklist.',
        messageType: 'TEXT',
        readBy: [hr._id],
        createdAt: new Date(now.getTime() - 10 * 60 * 1000)
      }
    ]);

    console.log('✅ [SeedChat] Successfully seeded company conversation and direct conversations!');
  } catch (err) {
    console.error('❌ [SeedChat] Error seeding chat:', err);
  }
}

if (process.argv[1]?.endsWith('seedChat.ts')) {
  seedChat()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
