import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { TaskActivityModel } from '../models/TaskActivity.js';

export async function seedActivityData(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodbUri);
    console.log('[SeedActivity] Connected to MongoDB');
  }

  const [founder, hr, manager, employee, intern] = await Promise.all([
    UserModel.findOne({ email: 'founder@lavantanaturals.com' }),
    UserModel.findOne({ email: 'hr@lavantanaturals.com' }),
    UserModel.findOne({ email: 'manager@lavantanaturals.com' }),
    UserModel.findOne({ email: 'employee@lavantanaturals.com' }),
    UserModel.findOne({ email: 'intern@lavantanaturals.com' })
  ]);

  if (!founder || !hr || !manager || !employee || !intern) {
    console.warn('[SeedActivity] Warning: Demo accounts not found. Run seed.ts first.');
    return;
  }

  const now = new Date();

  // Find or update in-progress tasks to have startedAt
  const inProgressTasks = await TaskModel.find({ status: 'IN_PROGRESS' });
  if (inProgressTasks.length > 0) {
    for (let i = 0; i < inProgressTasks.length; i++) {
      const task = inProgressTasks[i];
      if (!task.startedAt) {
        // Stagger started times: 1.5 hours ago, 3 hours ago, 45 mins ago
        const hoursAgo = 1 + (i * 1.25);
        task.startedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        await task.save();

        // Ensure a TASK_STARTED activity exists
        const exists = await TaskActivityModel.findOne({ taskId: task._id, type: 'TASK_STARTED' });
        if (!exists) {
          await TaskActivityModel.create({
            taskId: task._id,
            actorId: task.assignedTo,
            type: 'TASK_STARTED',
            message: `Started work on "${task.title}".`,
            createdAt: task.startedAt
          });
        }
      }
    }
  } else {
    // Create an in-progress task for employee
    const taskEmp = await TaskModel.create({
      title: 'Formulation Batch #48 Stability Analysis',
      description: 'Run pH and viscosity tests on newly compounded lavender face serum.',
      assignedTo: employee._id,
      assignedBy: manager._id,
      department: employee.department || 'Operations',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000), // Today 6h from now
      assignedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2h ago
    });

    await TaskActivityModel.create([
      {
        taskId: taskEmp._id,
        actorId: manager._id,
        type: 'TASK_ASSIGNED',
        message: `${manager.name} assigned task to ${employee.name}.`,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        taskId: taskEmp._id,
        actorId: employee._id,
        type: 'TASK_STARTED',
        message: `${employee.name} started working on this task.`,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        taskId: taskEmp._id,
        actorId: employee._id,
        type: 'COMMENT_ADDED',
        message: 'Initial viscosity measurements recorded: 3,450 cPs at 25°C.',
        createdAt: new Date(now.getTime() - 45 * 60 * 1000)
      }
    ]);

    // Create an in-progress task for intern
    const taskInt = await TaskModel.create({
      title: 'Eco-Packaging Spec Verification',
      description: 'Audit recycled amber glass bottles for micro-scratches and label dimensions.',
      assignedTo: intern._id,
      assignedBy: manager._id,
      department: intern.department || 'Operations',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      assignedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 48 * 60 * 1000) // 48 mins ago
    });

    await TaskActivityModel.create([
      {
        taskId: taskInt._id,
        actorId: intern._id,
        type: 'TASK_STARTED',
        message: `${intern.name} started working on this task.`,
        createdAt: new Date(now.getTime() - 48 * 60 * 1000)
      }
    ]);
  }

  // Ensure at least one task completed today with proof of work
  const completedToday = await TaskModel.findOne({
    status: 'COMPLETED',
    completedAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
  });

  if (!completedToday) {
    const taskComp = await TaskModel.create({
      title: 'Cold-Pressed Lavender Oil GC-MS Quality Check',
      description: 'Verify linalool and linalyl acetate purity percentages for Bulgaria shipment.',
      assignedTo: employee._id,
      assignedBy: founder._id,
      department: employee.department || 'Operations',
      priority: 'HIGH',
      status: 'COMPLETED',
      deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      assignedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      proofOfWork: [{
        filename: 'GCMS_Certificate_Batch_88.pdf',
        fileType: 'application/pdf',
        size: 142050,
        url: '/uploads/proof/gcms_batch_88.pdf',
        comment: 'Purity confirmed at 99.4% organic grade.',
        uploadedBy: employee._id,
        uploadedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      }]
    });

    await TaskActivityModel.create([
      {
        taskId: taskComp._id,
        actorId: employee._id,
        type: 'TASK_STARTED',
        message: `${employee.name} started working on this task.`,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
      },
      {
        taskId: taskComp._id,
        actorId: employee._id,
        type: 'PROOF_UPLOADED',
        message: `${employee.name} attached proof of work: GCMS_Certificate_Batch_88.pdf`,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      },
      {
        taskId: taskComp._id,
        actorId: employee._id,
        type: 'TASK_COMPLETED',
        message: `${employee.name} completed this task.`,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      }
    ]);
  }

  console.log('[SeedActivity] Seeded activity records and verified in-progress tasks with durations.');
}

// Direct execution when run via CLI
if (process.argv[1]?.endsWith('seedActivity.ts')) {
  seedActivityData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[SeedActivity] Error:', err);
      process.exit(1);
    });
}
