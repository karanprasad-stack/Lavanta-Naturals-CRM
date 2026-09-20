import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { TaskActivityModel } from '../models/TaskActivity.js';
import { NotificationModel } from '../models/Notification.js';

export async function seedTasks(): Promise<void> {
  try {
    console.log('[SeedTasks] Connecting to MongoDB:', config.mongodbUri);
    await mongoose.connect(config.mongodbUri);

    // Retrieve seed users
    const [founder, hr, manager, employee, internArjun, internNeha] = await Promise.all([
      UserModel.findOne({ email: 'founder@lavantanaturals.com' }),
      UserModel.findOne({ email: 'hr@lavantanaturals.com' }),
      UserModel.findOne({ email: 'manager@lavantanaturals.com' }),
      UserModel.findOne({ email: 'employee@lavantanaturals.com' }),
      UserModel.findOne({ email: 'intern@lavantanaturals.com' }),
      UserModel.findOne({ email: 'neha@lavantanaturals.com' })
    ]);

    if (!founder || !hr || !manager || !employee || !internArjun) {
      console.error('[SeedTasks] Required demo users missing. Run seed.ts first.');
      return;
    }

    console.log('[SeedTasks] Clearing existing tasks and activities...');
    await TaskModel.deleteMany({});
    await TaskActivityModel.deleteMany({});
    await NotificationModel.deleteMany({});

    const now = new Date();

    // 1. Task: Assigned to Employee (TODO, High Priority, Due in 2 days)
    const deadline1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const task1 = await TaskModel.create({
      title: 'Create Instagram content for Face Serum',
      description:
        'Develop visual assets, carousel copy, and product benefits highlight for the new Lavender Glow Face Serum launch. Ensure color palette matches Lavanta Naturals brand guidelines.',
      assignedTo: employee._id,
      assignedBy: hr._id,
      department: employee.department || 'Marketing',
      priority: 'HIGH',
      status: 'TODO',
      deadline: deadline1,
      assignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      comments: [
        {
          author: hr._id,
          message: 'Please focus on botanical purity and organic lavender sourcing credentials.',
          createdAt: new Date(now.getTime() - 90 * 60 * 1000)
        }
      ]
    });

    await TaskActivityModel.create([
      {
        taskId: task1._id,
        actorId: hr._id,
        type: 'TASK_CREATED',
        message: `${hr.name} created task "${task1.title}".`,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        taskId: task1._id,
        actorId: hr._id,
        type: 'TASK_ASSIGNED',
        message: `${hr.name} assigned this task to ${employee.name}.`,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        taskId: task1._id,
        actorId: hr._id,
        type: 'COMMENT_ADDED',
        message: `${hr.name} added a comment.`,
        createdAt: new Date(now.getTime() - 90 * 60 * 1000)
      }
    ]);

    await NotificationModel.create({
      recipient: employee._id,
      sender: hr._id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `"${task1.title}" was assigned to you by ${hr.name}.`,
      taskId: task1._id,
      read: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    });

    // 2. Task: Assigned to Employee (IN_PROGRESS, Medium Priority, Due tomorrow)
    const deadline2 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const task2 = await TaskModel.create({
      title: 'Packaging Quality Inspection for Serum Lot 402',
      description:
        'Inspect glass dropper tightness, seal tamper resistance, and silk-screen print clarity for 500 units of Lot 402 before shipment release.',
      assignedTo: employee._id,
      assignedBy: manager._id,
      department: employee.department || 'Operations',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      deadline: deadline2,
      assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
    });

    await TaskActivityModel.create([
      {
        taskId: task2._id,
        actorId: manager._id,
        type: 'TASK_CREATED',
        message: `${manager.name} created task "${task2.title}".`,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      },
      {
        taskId: task2._id,
        actorId: employee._id,
        type: 'TASK_STARTED',
        message: `${employee.name} started working on this task.`,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      }
    ]);

    // 3. Task: Assigned to Intern Arjun (IN_PROGRESS, High Priority, Due in 3 days)
    const deadline3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const task3 = await TaskModel.create({
      title: 'Review Organic Botanical Ingredient Sourcing Brief',
      description:
        'Audit third-party certified organic certificates of lavender and chamomile extracts. Summarize active botanical percentages for R&D review.',
      assignedTo: internArjun._id,
      assignedBy: founder._id,
      department: 'Marketing',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      deadline: deadline3,
      assignedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    });

    await TaskActivityModel.create([
      {
        taskId: task3._id,
        actorId: founder._id,
        type: 'TASK_CREATED',
        message: `${founder.name} created task "${task3.title}".`,
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
      },
      {
        taskId: task3._id,
        actorId: internArjun._id,
        type: 'TASK_STARTED',
        message: `${internArjun.name} started working on this task.`,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      }
    ]);

    // 4. Task: OVERDUE Task (Assigned to Intern, deadline passed yesterday, status TODO)
    const overdueDeadline = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const task4 = await TaskModel.create({
      title: 'Competitor Ingredient Analysis — Q3 Pricing Benchmark',
      description:
        'Compile comparison grid of retail pricing and organic claims for top 5 direct botanical skincare competitors.',
      assignedTo: internArjun._id,
      assignedBy: manager._id,
      department: 'Marketing',
      priority: 'MEDIUM',
      status: 'TODO',
      deadline: overdueDeadline,
      assignedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    });

    await TaskActivityModel.create([
      {
        taskId: task4._id,
        actorId: manager._id,
        type: 'TASK_CREATED',
        message: `${manager.name} created task "${task4.title}".`,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      }
    ]);

    // 5. Task: COMPLETED Task with Proof of Work
    const deadline5 = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const task5 = await TaskModel.create({
      title: 'Verify FDA Labeling Compliance for Nourishing Night Balm',
      description:
        'Check INCI name accuracy, net weight statement, and allergen declarations against FDA cosmetic regulations.',
      assignedTo: employee._id,
      assignedBy: founder._id,
      department: employee.department || 'Operations',
      priority: 'HIGH',
      status: 'COMPLETED',
      deadline: deadline5,
      assignedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      proofOfWork: [
        {
          filename: 'Compliance_Checklist_Lot301.pdf',
          fileType: 'application/pdf',
          size: 245000,
          url: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=600&auto=format&fit=crop&q=80',
          comment: 'All 12 compliance checks passed without discrepancies.',
          uploadedBy: employee._id,
          uploadedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
        }
      ]
    });

    await TaskActivityModel.create([
      {
        taskId: task5._id,
        actorId: founder._id,
        type: 'TASK_CREATED',
        message: `${founder.name} created task "${task5.title}".`,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        taskId: task5._id,
        actorId: employee._id,
        type: 'TASK_STARTED',
        message: `${employee.name} started working on this task.`,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      },
      {
        taskId: task5._id,
        actorId: employee._id,
        type: 'PROOF_UPLOADED',
        message: `${employee.name} attached proof of work: Compliance_Checklist_Lot301.pdf`,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        taskId: task5._id,
        actorId: employee._id,
        type: 'TASK_COMPLETED',
        message: `${employee.name} marked this task completed.`,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      }
    ]);

    // 6. Additional task for intern Neha
    if (internNeha) {
      await TaskModel.create({
        title: 'Calm Facial Mist Fragrance Free Formulation Batch Check',
        description: 'Verify pH levels and emulsion stability for new fragrance-free mist trial batch.',
        assignedTo: internNeha._id,
        assignedBy: manager._id,
        department: 'Product & R&D',
        priority: 'LOW',
        status: 'TODO',
        deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        assignedAt: new Date()
      });
    }

    console.log('[SeedTasks] Successfully seeded 6 realistic tasks with activity timeline & proof of work.');
  } catch (error) {
    console.error('[SeedTasks] Error seeding tasks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[SeedTasks] Disconnected from MongoDB.');
  }
}

if (process.argv[1]?.endsWith('seedTasks.ts') || process.argv[1]?.endsWith('seedTasks.js')) {
  seedTasks().then(() => process.exit(0));
}
