import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { GoalModel } from '../models/Goal.js';
import { ObjectiveModel } from '../models/Objective.js';
import { KeyResultModel } from '../models/KeyResult.js';
import { GoalActivityModel } from '../models/GoalActivity.js';
import { TaskModel } from '../models/Task.js';
import { recalculateGoalHierarchyProgress } from '../controllers/goalController.js';

export async function seedGoals(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodbUri);
    console.log('[SeedGoals] Connected to MongoDB');
  }

  const [founder, hr, manager, employee, intern] = await Promise.all([
    UserModel.findOne({ email: 'founder@lavantanaturals.com' }),
    UserModel.findOne({ email: 'hr@lavantanaturals.com' }),
    UserModel.findOne({ email: 'manager@lavantanaturals.com' }),
    UserModel.findOne({ email: 'employee@lavantanaturals.com' }),
    UserModel.findOne({ email: 'intern@lavantanaturals.com' })
  ]);

  if (!founder || !hr || !manager || !employee || !intern) {
    console.warn('[SeedGoals] Required demo accounts not found. Run seed.ts first.');
    return;
  }

  // Clear existing goals, objectives, key results, and goal activities
  await Promise.all([
    GoalModel.deleteMany({}),
    ObjectiveModel.deleteMany({}),
    KeyResultModel.deleteMany({}),
    GoalActivityModel.deleteMany({})
  ]);

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // -------------------------------------------------------------
  // GOAL 1: Company E-commerce & Direct-to-Consumer Growth
  // -------------------------------------------------------------
  const goal1 = await GoalModel.create({
    title: 'Scale Lavanta Naturals Direct-to-Consumer Revenue',
    description: 'Grow national online reach through improved conversion funnels, subscription models, and premium customer experience.',
    type: 'COMPANY',
    owner: founder._id,
    department: 'Executive',
    team: 'Growth',
    startDate: new Date(now.getTime() - 40 * dayMs),
    endDate: new Date(now.getTime() + 50 * dayMs),
    priority: 'HIGH',
    status: 'ACTIVE',
    progress: 0,
    createdBy: founder._id,
    comments: [
      {
        author: founder._id,
        content: 'Focusing on high-converting organic face serum bundles for Q3.',
        createdAt: new Date(now.getTime() - 20 * dayMs)
      },
      {
        author: manager._id,
        content: 'Packaging lines have been optimized for express 2-day delivery.',
        createdAt: new Date(now.getTime() - 10 * dayMs)
      }
    ]
  });

  // Objective 1.1
  const obj1_1 = await ObjectiveModel.create({
    goalId: goal1._id,
    title: 'Improve Online Store Checkout & Conversion Efficiency',
    description: 'Eliminate friction in cart checkout and enhance trust badges on natural skincare formulations.',
    owner: founder._id,
    contributors: [manager._id, employee._id],
    startDate: new Date(now.getTime() - 40 * dayMs),
    endDate: new Date(now.getTime() + 20 * dayMs),
    status: 'ACTIVE',
    progress: 0,
    weight: 60,
    createdBy: founder._id
  });

  const kr1_1_1 = await KeyResultModel.create({
    objectiveId: obj1_1._id,
    goalId: goal1._id,
    title: 'Increase Mobile Checkout Conversion Rate',
    description: 'Lift mobile organic conversion from baseline 2.1% to 3.8%.',
    metricType: 'PERCENTAGE',
    startValue: 2.1,
    targetValue: 3.8,
    currentValue: 3.3,
    unit: '%',
    deadline: new Date(now.getTime() + 20 * dayMs),
    owner: employee._id,
    progress: 0,
    status: 'ON_TRACK'
  });

  const kr1_1_2 = await KeyResultModel.create({
    objectiveId: obj1_1._id,
    goalId: goal1._id,
    title: 'Grow Monthly Online Subscription Recurring Revenue',
    description: 'Target ₹15 Lakhs in auto-replenish lavender beauty boxes.',
    metricType: 'CURRENCY',
    startValue: 400000,
    targetValue: 1500000,
    currentValue: 1200000,
    unit: '₹',
    deadline: new Date(now.getTime() + 30 * dayMs),
    owner: founder._id,
    progress: 0,
    status: 'ON_TRACK'
  });

  // Objective 1.2
  const obj1_2 = await ObjectiveModel.create({
    goalId: goal1._id,
    title: 'Deliver High-Speed Headless Storefront Experience',
    description: 'Launch optimized progressive web app storefront with sub-second page transitions.',
    owner: manager._id,
    contributors: [employee._id],
    startDate: new Date(now.getTime() - 30 * dayMs),
    endDate: new Date(now.getTime() + 45 * dayMs),
    status: 'ACTIVE',
    progress: 0,
    weight: 40,
    createdBy: founder._id
  });

  const kr1_2_1 = await KeyResultModel.create({
    objectiveId: obj1_2._id,
    goalId: goal1._id,
    title: 'Production Storefront Go-Live with Lighthouse Score > 95',
    description: 'Deploy next-gen ecommerce frontend to production cluster.',
    metricType: 'BOOLEAN',
    startValue: 0,
    targetValue: 1,
    currentValue: 1,
    unit: 'Deployed',
    deadline: new Date(now.getTime() + 15 * dayMs),
    owner: employee._id,
    progress: 100,
    status: 'COMPLETED'
  });

  // -------------------------------------------------------------
  // GOAL 2: Operations & Product Quality Assurance
  // -------------------------------------------------------------
  const goal2 = await GoalModel.create({
    title: 'Achieve Zero-Defect Quality in Cold-Pressed Lavender Formulations',
    description: 'Enforce clinical grade purity standards, standard operating procedures, and rigorous batch stability test cycles.',
    type: 'DEPARTMENT',
    owner: manager._id,
    department: 'Operations',
    team: 'Formulations',
    startDate: new Date(now.getTime() - 25 * dayMs),
    endDate: new Date(now.getTime() + 35 * dayMs),
    priority: 'HIGH',
    status: 'ACTIVE',
    progress: 0,
    createdBy: manager._id
  });

  const obj2_1 = await ObjectiveModel.create({
    goalId: goal2._id,
    title: 'Standardize 90-Day Physicochemical Stability Audits',
    description: 'Conduct HPLC and GC-MS testing across all active formulation batches.',
    owner: manager._id,
    contributors: [employee._id, intern._id],
    startDate: new Date(now.getTime() - 25 * dayMs),
    endDate: new Date(now.getTime() + 25 * dayMs),
    status: 'ACTIVE',
    progress: 0,
    weight: 100,
    createdBy: manager._id
  });

  const kr2_1_1 = await KeyResultModel.create({
    objectiveId: obj2_1._id,
    goalId: goal2._id,
    title: 'Complete Analytical Quality Sign-Offs for Batches #40–#55',
    description: 'Sign off 16 formulation batches for retail distribution.',
    metricType: 'COUNT',
    startValue: 0,
    targetValue: 16,
    currentValue: 12,
    unit: 'Batches',
    deadline: new Date(now.getTime() + 18 * dayMs),
    owner: employee._id,
    progress: 0,
    status: 'ON_TRACK'
  });

  // -------------------------------------------------------------
  // GOAL 3: Team / Eco-Sustainability (At Risk Demo)
  // -------------------------------------------------------------
  const goal3 = await GoalModel.create({
    title: '100% Recycled & Compostable Packaging Transition',
    description: 'Replace virgin plastic components with post-consumer recycled amber glass and biodegradable shipping buffers.',
    type: 'TEAM',
    owner: manager._id,
    department: 'Operations',
    team: 'Packaging',
    startDate: new Date(now.getTime() - 60 * dayMs),
    endDate: new Date(now.getTime() + 15 * dayMs), // Elapsed 60 of 75 days (80% time elapsed)
    priority: 'MEDIUM',
    status: 'ACTIVE',
    progress: 0,
    createdBy: manager._id
  });

  const obj3_1 = await ObjectiveModel.create({
    goalId: goal3._id,
    title: 'Source Certified Sustainable Packaging Vendors',
    description: 'Vet suppliers meeting ISO 14001 environmental management protocols.',
    owner: intern._id,
    contributors: [manager._id],
    startDate: new Date(now.getTime() - 60 * dayMs),
    endDate: new Date(now.getTime() + 15 * dayMs),
    status: 'ACTIVE',
    progress: 0,
    weight: 100,
    createdBy: manager._id
  });

  const kr3_1_1 = await KeyResultModel.create({
    objectiveId: obj3_1._id,
    goalId: goal3._id,
    title: 'Onboard Certified Amber Glass Bottle Suppliers',
    description: 'Audit and onboard 5 verified domestic glass manufacturing partners.',
    metricType: 'COUNT',
    startValue: 0,
    targetValue: 5,
    currentValue: 1, // Only 20% progress when 80% time has elapsed -> will be flagged AT_RISK!
    unit: 'Suppliers',
    deadline: new Date(now.getTime() + 15 * dayMs),
    owner: intern._id,
    progress: 0,
    status: 'AT_RISK'
  });

  // -------------------------------------------------------------
  // Connect existing tasks to Key Results
  // -------------------------------------------------------------
  const tasks = await TaskModel.find({ isDeleted: false }).limit(6);
  if (tasks.length > 0) {
    if (tasks[0]) {
      tasks[0].goalId = goal1._id;
      tasks[0].objectiveId = obj1_1._id;
      tasks[0].keyResultId = kr1_1_1._id;
      await tasks[0].save();
    }
    if (tasks[1]) {
      tasks[1].goalId = goal1._id;
      tasks[1].objectiveId = obj1_2._id;
      tasks[1].keyResultId = kr1_2_1._id;
      await tasks[1].save();
    }
    if (tasks[2]) {
      tasks[2].goalId = goal2._id;
      tasks[2].objectiveId = obj2_1._id;
      tasks[2].keyResultId = kr2_1_1._id;
      await tasks[2].save();
    }
    if (tasks[3]) {
      tasks[3].goalId = goal3._id;
      tasks[3].objectiveId = obj3_1._id;
      tasks[3].keyResultId = kr3_1_1._id;
      await tasks[3].save();
    }
  }

  // Recalculate progress across all goals
  await Promise.all([
    recalculateGoalHierarchyProgress(goal1._id),
    recalculateGoalHierarchyProgress(goal2._id),
    recalculateGoalHierarchyProgress(goal3._id)
  ]);

  // Seed initial activities
  await GoalActivityModel.create([
    {
      goalId: goal1._id,
      actorId: founder._id,
      type: 'GOAL_CREATED',
      message: `${founder.name} established company goal "Scale Lavanta Naturals Direct-to-Consumer Revenue".`,
      createdAt: new Date(now.getTime() - 40 * dayMs)
    },
    {
      goalId: goal1._id,
      objectiveId: obj1_1._id,
      keyResultId: kr1_1_1._id,
      actorId: employee._id,
      type: 'PROGRESS_UPDATED',
      message: `${employee.name} updated Key Result "Increase Mobile Checkout Conversion Rate" to 3.3% (71% progress).`,
      createdAt: new Date(now.getTime() - 5 * dayMs)
    },
    {
      goalId: goal2._id,
      actorId: manager._id,
      type: 'GOAL_CREATED',
      message: `${manager.name} established department goal "Achieve Zero-Defect Quality in Cold-Pressed Lavender Formulations".`,
      createdAt: new Date(now.getTime() - 25 * dayMs)
    },
    {
      goalId: goal3._id,
      actorId: manager._id,
      type: 'GOAL_CREATED',
      message: `${manager.name} established team goal "100% Recycled & Compostable Packaging Transition".`,
      createdAt: new Date(now.getTime() - 60 * dayMs)
    }
  ]);

  console.log('[SeedGoals] Successfully seeded 3 goals with objectives, key results, activities, and task links.');
}

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('seedGoals.ts')) {
  seedGoals()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[SeedGoals] Error:', err);
      process.exit(1);
    });
}
