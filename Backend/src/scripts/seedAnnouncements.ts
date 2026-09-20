import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { AnnouncementModel } from '../models/Announcement.js';
import { AnnouncementReadModel } from '../models/AnnouncementRead.js';
import { NotificationModel } from '../models/Notification.js';

export async function seedAnnouncements(): Promise<void> {
  try {
    console.log('[SeedAnnouncements] Connecting to MongoDB:', config.mongodbUri);
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
      console.error('[SeedAnnouncements] Required users missing. Run seed.ts first.');
      return;
    }

    const allUsers = await UserModel.find({ status: 'ACTIVE' });

    console.log('[SeedAnnouncements] Clearing old announcements and read records...');
    await AnnouncementModel.deleteMany({});
    await AnnouncementReadModel.deleteMany({});

    const now = new Date();

    // 1. Product Development Meeting (HR targeting Marketing & Product)
    const ann1 = await AnnouncementModel.create({
      title: 'NEW PRODUCT DEVELOPMENT MEETING',
      description: 'Tomorrow • 11:00 AM • Marketing + Product Team. Evaluating botanical stability data for upcoming Lavender Calm Serum batch.',
      content: `### Agenda & Discussion Points

1. **Botanical Formulation Stability**: Review 90-day cold-pressed lavender essential oil and squalane emulsion results.
2. **Packaging Sustainability**: Finalize biodegradable frosted glass dropper specifications from our European supplier.
3. **Clinical Dermatological Testing**: Overview of third-party hypoallergenic and non-comedogenic panel tests.
4. **Q4 Production Rollout**: Timeline alignment between R&D, Procurement, and Marketing campaign assets.

*Please review the attached safety dossier prior to the meeting.*`,
      type: 'MEETING',
      priority: 'IMPORTANT',
      createdBy: hr._id,
      targetType: 'DEPARTMENT',
      targetDepartments: ['Marketing', 'Product', 'R&D'],
      targetRoles: [],
      targetUsers: [],
      posterImage: 'https://images.unsplash.com/photo-1608248597359-56cb2f205307?w=1200&auto=format&fit=crop&q=80',
      attachments: [
        {
          filename: 'Lavender_Calm_Serum_Formulation_v2.pdf',
          fileType: 'application/pdf',
          size: 2450000,
          url: 'https://lavantanaturals.com/docs/formulation-v2.pdf'
        }
      ],
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED'
    });

    // 2. Company-Wide Town Hall (Founder targeting EVERYONE)
    const ann2 = await AnnouncementModel.create({
      title: 'ALL-HANDS TOWN HALL: BOTANICAL PURITY & GLOBAL EXPANSION',
      description: 'Friday • 4:00 PM • Entire Lavanta Team. Celebrating cruelty-free certification and our new organic farming cooperative in Provence.',
      content: `Dear Lavanta Family,

As we conclude our most successful quarter to date, we invite every team member to gather for our quarterly All-Hands Town Hall.

### Key Highlights:
- **Zero-Chemical Certification**: Formal award ceremony for our 100% natural, cruelty-free cosmetic safety badge.
- **Sustainable Sourcing**: Direct partnership with 12 organic lavender family farms in Provence and Kashmir.
- **Team Recognition**: Celebrating outstanding cross-functional efforts between R&D, Marketing, and Operations.

Refreshments and botanical cold brews will be served in the HQ Atrium. Remote members can join via the video link.`,
      type: 'EVENT',
      priority: 'IMPORTANT',
      createdBy: founder._id,
      targetType: 'EVERYONE',
      targetDepartments: [],
      targetRoles: [],
      targetUsers: [],
      posterImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
      attachments: [],
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED'
    });

    // 3. Urgent Safety Protocol (Founder targeting EVERYONE)
    const ann3 = await AnnouncementModel.create({
      title: 'URGENT: BATCH #LN-409 COLD ROOM INCUBATION PROTOCOL',
      description: 'Immediate action required for all laboratory and quality control personnel regarding temperature logging.',
      content: `Attention all formulation, operations, and quality control specialists:

Please verify that cold room storage unit #3 remains calibrated at precisely 4°C (±0.5°C) during the active 72-hour maceration phase of Botanical Batch #LN-409. 

Any temperature variances must be logged immediately and reported to Dr. Ananya Sen.`,
      type: 'IMPORTANT',
      priority: 'URGENT',
      createdBy: founder._id,
      targetType: 'EVERYONE',
      targetDepartments: [],
      targetRoles: [],
      targetUsers: [],
      posterImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop&q=80',
      attachments: [],
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED'
    });

    // 4. Intern Learning Cohort (HR targeting INTERNS)
    const ann4 = await AnnouncementModel.create({
      title: 'INTERN ONBOARDING: CLEAN BEAUTY STANDARDS & EXTRACTION 101',
      description: 'Thursday • 2:00 PM • Intern Cohort. Hands-on orientation on steam distillation and formulation documentation.',
      content: `Welcome to the Lavanta Naturals Intern Onboarding series!

In this 90-minute workshop, our formulation scientists will walk you through:
1. Sourcing ethics and botanical traceability.
2. Good Laboratory Practices (GLP) for clean skincare formulations.
3. How to use our internal Task Management and Documentation systems.

Attendance is mandatory for all active interns. Mentors will be present for 1-on-1 Q&A.`,
      type: 'NOTICE',
      priority: 'NORMAL',
      createdBy: hr._id,
      targetType: 'ROLE',
      targetRoles: ['INTERN'],
      targetDepartments: [],
      targetUsers: [],
      posterImage: 'https://images.unsplash.com/photo-1512290900672-1f55b9959060?w=1200&auto=format&fit=crop&q=80',
      attachments: [],
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED'
    });

    // 5. Marketing Sprint Briefing (Manager targeting Marketing Department)
    const ann5 = await AnnouncementModel.create({
      title: 'Q4 DIGITAL CAMPAIGN ASSET SUBMISSION DEADLINES',
      description: 'Marketing Department briefing on Instagram reels, influencer PR kits, and Sephora retail endcap banners.',
      content: `Marketing Team:

All creative assets for the holiday botanical gift boxes must be uploaded to the shared repository by Wednesday 5:00 PM.

Key asset deliverables:
- 15-second unboxing video reels.
- High-resolution product macro photography.
- Influencer gift card insert copy.`,
      type: 'GENERAL',
      priority: 'NORMAL',
      createdBy: manager._id,
      targetType: 'DEPARTMENT',
      targetDepartments: ['Marketing'],
      targetRoles: [],
      targetUsers: [],
      posterImage: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=1200&auto=format&fit=crop&q=80',
      attachments: [],
      publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED'
    });

    console.log('[SeedAnnouncements] Creating realistic read records...');
    // Mark several users as having read ann1, ann2, ann3
    const readPromises = [];

    // Ann1 read by employee, hr, manager
    readPromises.push(
      AnnouncementReadModel.create({
        announcementId: ann1._id,
        userId: employee._id,
        readAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      }),
      AnnouncementReadModel.create({
        announcementId: ann1._id,
        userId: manager._id,
        readAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
      })
    );

    // Ann2 read by founder, hr, employee
    readPromises.push(
      AnnouncementReadModel.create({
        announcementId: ann2._id,
        userId: founder._id,
        readAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
      }),
      AnnouncementReadModel.create({
        announcementId: ann2._id,
        userId: hr._id,
        readAt: new Date(now.getTime() - 18 * 60 * 60 * 1000)
      }),
      AnnouncementReadModel.create({
        announcementId: ann2._id,
        userId: employee._id,
        readAt: new Date(now.getTime() - 15 * 60 * 60 * 1000)
      })
    );

    // Ann4 read by intern
    readPromises.push(
      AnnouncementReadModel.create({
        announcementId: ann4._id,
        userId: intern._id,
        readAt: new Date(now.getTime() - 8 * 60 * 60 * 1000)
      })
    );

    await Promise.all(readPromises);

    console.log('[SeedAnnouncements] Seeding initial notifications for recipients...');
    // Create notifications for the announcements
    const notifsToInsert = [
      {
        recipientId: employee._id,
        senderId: hr._id,
        type: 'ANNOUNCEMENT_IMPORTANT',
        title: 'NEW ANNOUNCEMENT',
        message: 'Priya Sharma published: "NEW PRODUCT DEVELOPMENT MEETING"',
        relatedEntityType: 'ANNOUNCEMENT',
        relatedEntityId: ann1._id,
        isRead: true,
        readAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        recipientId: employee._id,
        senderId: founder._id,
        type: 'ANNOUNCEMENT_IMPORTANT',
        title: 'IMPORTANT ANNOUNCEMENT',
        message: 'Karan Prasad published: "URGENT: BATCH #LN-409 COLD ROOM INCUBATION PROTOCOL"',
        relatedEntityType: 'ANNOUNCEMENT',
        relatedEntityId: ann3._id,
        isRead: false,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
      },
      {
        recipientId: intern._id,
        senderId: hr._id,
        type: 'ANNOUNCEMENT_PUBLISHED',
        title: 'NEW ANNOUNCEMENT',
        message: 'Priya Sharma published: "INTERN ONBOARDING: CLEAN BEAUTY STANDARDS & EXTRACTION 101"',
        relatedEntityType: 'ANNOUNCEMENT',
        relatedEntityId: ann4._id,
        isRead: true,
        readAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
      },
      {
        recipientId: founder._id,
        senderId: employee._id,
        type: 'TASK_COMPLETED',
        title: 'TASK COMPLETED',
        message: 'Rahul Kumar completed: "Formulation stability check for batch #LN-202"',
        relatedEntityType: 'TASK',
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      },
      {
        recipientId: manager._id,
        senderId: hr._id,
        type: 'ANNOUNCEMENT_IMPORTANT',
        title: 'NEW ANNOUNCEMENT',
        message: 'Priya Sharma published: "NEW PRODUCT DEVELOPMENT MEETING"',
        relatedEntityType: 'ANNOUNCEMENT',
        relatedEntityId: ann1._id,
        isRead: true,
        readAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      }
    ];

    await NotificationModel.insertMany(notifsToInsert);

    console.log('✅ [SeedAnnouncements] Successfully seeded 5 announcements, read records, and notifications!');
  } catch (error) {
    console.error('❌ [SeedAnnouncements] Error seeding announcements:', error);
  }
}

// Run directly if invoked
if (process.argv[1]?.endsWith('seedAnnouncements.ts')) {
  seedAnnouncements()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
