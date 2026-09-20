import mongoose, { Types } from 'mongoose';
import { config } from '../config/env.js';
import { UserModel, IUser } from '../models/User.js';
import { GoalModel, IGoal } from '../models/Goal.js';
import { ObjectiveModel } from '../models/Objective.js';
import { KeyResultModel } from '../models/KeyResult.js';
import { GoalActivityModel } from '../models/GoalActivity.js';
import { TaskModel } from '../models/Task.js';
import { goalController } from '../controllers/goalController.js';
import { calendarController } from '../controllers/calendarController.js';

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

export async function runPhase9Verification(): Promise<void> {
  console.log('\n🌿 ===================================================');
  console.log('🌿 RUNNING PHASE 9 AUTOMATED VERIFICATION SUITE');
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

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Clean old verify goals
  await GoalModel.deleteMany({ title: /\[VERIFY_P9\]/ });

  // -------------------------------------------------------------
  // TEST 1: Goal Creation & Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Goal Creation & Validation ---');
  let testGoalId: string;
  {
    // 1a. Invalid dates (end < start) -> 400
    const mockInvalidDatesReq: any = {
      user: founder,
      body: {
        title: '[VERIFY_P9] Invalid Dates Goal',
        type: 'COMPANY',
        startDate: new Date(now.getTime() + 10 * dayMs).toISOString(),
        endDate: new Date(now.getTime() + 2 * dayMs).toISOString()
      }
    };
    const mockInvalidDatesRes = createMockResponse();
    await goalController.createGoal(mockInvalidDatesReq, mockInvalidDatesRes);
    assert(mockInvalidDatesRes.statusCode === 400, 'End date earlier than start date rejected (HTTP 400)');

    // 1b. Employee attempting to create COMPANY goal -> 403
    const mockEmpCompanyReq: any = {
      user: employee,
      body: {
        title: '[VERIFY_P9] Unauthorized Company Goal',
        type: 'COMPANY',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 30 * dayMs).toISOString()
      }
    };
    const mockEmpCompanyRes = createMockResponse();
    await goalController.createGoal(mockEmpCompanyReq, mockEmpCompanyRes);
    assert(mockEmpCompanyRes.statusCode === 403, 'Employee forbidden from creating COMPANY goal (HTTP 403)');

    // 1c. Founder creates valid COMPANY goal -> 201
    const mockValidReq: any = {
      user: founder,
      body: {
        title: '[VERIFY_P9] Omnichannel Revenue Expansion',
        description: 'Scale direct-to-consumer organic retail distribution.',
        type: 'COMPANY',
        owner: founder._id.toString(),
        startDate: new Date(now.getTime() - 10 * dayMs).toISOString(),
        endDate: new Date(now.getTime() + 50 * dayMs).toISOString(),
        priority: 'HIGH'
      }
    };
    const mockValidRes = createMockResponse();
    await goalController.createGoal(mockValidReq, mockValidRes);
    assert(mockValidRes.statusCode === 201, 'Founder creates COMPANY goal (HTTP 201)');
    testGoalId = mockValidRes.data?.goal?._id?.toString();
    assert(!!testGoalId, 'Goal ID generated');

    const activity = await GoalActivityModel.findOne({ goalId: testGoalId, type: 'GOAL_CREATED' });
    assert(!!activity, 'GOAL_CREATED activity logged in database');
  }

  // -------------------------------------------------------------
  // TEST 2: Objectives & Key Results Hierarchy
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Objectives & Key Results Creation ---');
  let testObjId: string;
  let testKRId: string;
  {
    // 2a. Add Objective
    const mockObjReq: any = {
      user: founder,
      params: { goalId: testGoalId },
      body: {
        title: 'Launch Subscription Beauty Box Experience',
        description: 'Auto-replenishment Lavender Glow membership program.',
        owner: manager._id.toString(),
        weight: 100
      }
    };
    const mockObjRes = createMockResponse();
    await goalController.addObjective(mockObjReq, mockObjRes);
    assert(mockObjRes.statusCode === 201, 'Objective created under Goal (HTTP 201)');
    testObjId = mockObjRes.data?.objective?._id?.toString();
    assert(!!testObjId, 'Objective ID generated');

    // 2b. Add Key Result under Objective
    const mockKRReq: any = {
      user: founder,
      params: { objectiveId: testObjId },
      body: {
        title: 'Acquire 2,000 Active Monthly Subscribers',
        metricType: 'COUNT',
        startValue: 0,
        targetValue: 2000,
        currentValue: 0,
        unit: 'Members',
        deadline: new Date(now.getTime() + 45 * dayMs).toISOString()
      }
    };
    const mockKRRes = createMockResponse();
    await goalController.addKeyResult(mockKRReq, mockKRRes);
    assert(mockKRRes.statusCode === 201, 'Key Result created under Objective (HTTP 201)');
    testKRId = mockKRRes.data?.keyResult?._id?.toString();
    assert(!!testKRId, 'Key Result ID generated');
  }

  // -------------------------------------------------------------
  // TEST 3: Progress Calculation & Hierarchy Rollup
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Progress Calculation & Automatic Rollup ---');
  {
    // Update KR progress: 1,500 / 2,000 -> 75%
    const mockProgressReq: any = {
      user: manager,
      params: { id: testKRId },
      body: {
        currentValue: 1500,
        note: 'Sprint 3 campaign reached 1,500 active subscribers.'
      }
    };
    const mockProgressRes = createMockResponse();
    await goalController.updateKeyResultProgress(mockProgressReq, mockProgressRes);
    assert(mockProgressRes.statusCode === 200, 'Key Result progress updated (HTTP 200)');
    assert(mockProgressRes.data?.keyResult?.progress === 75, 'Key Result progress calculated accurately: 75%');

    // Verify Objective rolled up to 75%
    const objective = await ObjectiveModel.findById(testObjId);
    assert(objective?.progress === 75, 'Objective progress automatically rolled up to 75%');

    // Verify Goal rolled up to 75%
    const goal = await GoalModel.findById(testGoalId);
    assert(goal?.progress === 75, 'Goal progress automatically rolled up to 75%');

    // Verify PROGRESS_UPDATED activity was logged
    const progressAct = await GoalActivityModel.findOne({ keyResultId: testKRId, type: 'PROGRESS_UPDATED' });
    assert(!!progressAct, 'PROGRESS_UPDATED activity logged with details');
  }

  // -------------------------------------------------------------
  // TEST 4: Mathematical At-Risk Detection
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Mathematical At-Risk Detection ---');
  {
    // Create an At-Risk Goal: 80% elapsed time, but only 20% progress
    const atRiskGoal = await GoalModel.create({
      title: '[VERIFY_P9] Delayed Packaging Audit',
      type: 'DEPARTMENT',
      department: 'Operations',
      owner: manager._id,
      startDate: new Date(now.getTime() - 80 * dayMs),
      endDate: new Date(now.getTime() + 20 * dayMs), // Total 100 days, 80 days elapsed (80% expected)
      priority: 'MEDIUM',
      status: 'ACTIVE',
      progress: 0,
      createdBy: manager._id
    });

    const atRiskObj = await ObjectiveModel.create({
      goalId: atRiskGoal._id,
      title: 'Audit Suppliers',
      owner: intern._id,
      startDate: atRiskGoal.startDate,
      endDate: atRiskGoal.endDate,
      progress: 0,
      createdBy: manager._id
    });

    const atRiskKR = await KeyResultModel.create({
      objectiveId: atRiskObj._id,
      goalId: atRiskGoal._id,
      title: 'Complete 10 Factory Audits',
      metricType: 'COUNT',
      startValue: 0,
      targetValue: 10,
      currentValue: 2, // 2/10 = 20% progress vs 80% expected progress (variance = 60% > 20% threshold)
      deadline: atRiskGoal.endDate,
      owner: intern._id
    });

    // Recalculate hierarchy
    const mockProgressReq: any = {
      user: manager,
      params: { id: atRiskKR._id.toString() },
      body: { currentValue: 2 }
    };
    const mockProgressRes = createMockResponse();
    await goalController.updateKeyResultProgress(mockProgressReq, mockProgressRes);

    const refreshedAtRiskGoal = await GoalModel.findById(atRiskGoal._id);
    assert(refreshedAtRiskGoal?.status === 'AT_RISK', 'Goal automatically flagged as AT_RISK when variance > 20%');
  }

  // -------------------------------------------------------------
  // TEST 5: Task -> Goal Connection & Execution Support
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Task -> Goal Connection ---');
  {
    // Create 2 tasks linked to testKRId: 1 completed, 1 in progress
    const task1 = await TaskModel.create({
      title: '[VERIFY_P9] Design Subscription Landing Page',
      assignedTo: employee._id,
      assignedBy: manager._id,
      priority: 'HIGH',
      status: 'COMPLETED',
      completedAt: new Date(),
      deadline: new Date(now.getTime() + 10 * dayMs),
      goalId: new Types.ObjectId(testGoalId),
      objectiveId: new Types.ObjectId(testObjId),
      keyResultId: new Types.ObjectId(testKRId)
    });

    const task2 = await TaskModel.create({
      title: '[VERIFY_P9] Setup Recurring Payment Webhook',
      assignedTo: employee._id,
      assignedBy: manager._id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      deadline: new Date(now.getTime() + 12 * dayMs),
      goalId: new Types.ObjectId(testGoalId),
      objectiveId: new Types.ObjectId(testObjId),
      keyResultId: new Types.ObjectId(testKRId)
    });

    // Fetch single goal hierarchy by ID
    const mockGetReq: any = {
      user: founder,
      params: { id: testGoalId }
    };
    const mockGetRes = createMockResponse();
    await goalController.getGoalById(mockGetReq, mockGetRes);
    assert(mockGetRes.statusCode === 200, 'GET /api/goals/:id returns HTTP 200');

    const returnedGoal = mockGetRes.data?.goal;
    assert(returnedGoal?.relatedTasksCount >= 2, 'Goal hierarchy tracks connected tasks');

    const returnedObj = returnedGoal?.objectives?.find((o: any) => o._id.toString() === testObjId);
    const returnedKR = returnedObj?.keyResults?.find((k: any) => k._id.toString() === testKRId);
    assert(returnedKR?.taskStats?.total >= 2, 'Key Result tracks related tasks total');
    assert(returnedKR?.taskStats?.completed >= 1, 'Key Result tracks completed tasks');
    assert(returnedKR?.taskStats?.percentage === 50, 'Key Result task execution percentage calculated: 50%');
  }

  // -------------------------------------------------------------
  // TEST 6: Discussion Comments on Goals
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Goal Discussion Comments ---');
  {
    const mockCommentReq: any = {
      user: manager,
      params: { id: testGoalId },
      body: { content: '[VERIFY_P9] Marketing campaign live on Google & Meta Ads.' }
    };
    const mockCommentRes = createMockResponse();
    await goalController.addComment(mockCommentReq, mockCommentRes);
    assert(mockCommentRes.statusCode === 201, 'Comment added to goal discussion (HTTP 201)');

    const refreshedGoal = await GoalModel.findById(testGoalId);
    const foundComment = refreshedGoal?.comments.find(c => c.content.includes('[VERIFY_P9]'));
    assert(!!foundComment, 'Comment persisted in Goal.comments array');
  }

  // -------------------------------------------------------------
  // TEST 7: Calendar Integration for Goal Deadlines
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Calendar Goal Deadlines Integration ---');
  {
    const mockCalReq: any = {
      user: founder,
      query: {}
    };
    const mockCalRes = createMockResponse();
    await calendarController.getEvents(mockCalReq, mockCalRes);
    assert(mockCalRes.statusCode === 200, 'GET /api/calendar/events returns HTTP 200');

    const virtualEntries = mockCalRes.data?.taskEntries || [];
    const goalDeadlineEntry = virtualEntries.find((e: any) => e.isGoalDeadline === true);
    assert(!!goalDeadlineEntry, 'Goal deadline injected as virtual calendar entry');
    assert(goalDeadlineEntry?.title.includes('🎯 Goal:'), 'Virtual entry has Goal prefix');
  }

  // -------------------------------------------------------------
  // TEST 8: Goal Summary & Dashboard Metrics
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Goal Summary Metrics ---');
  {
    const mockSumReq: any = {
      user: founder,
      query: {}
    };
    const mockSumRes = createMockResponse();
    await goalController.getGoalSummary(mockSumReq, mockSumRes);
    assert(mockSumRes.statusCode === 200, 'GET /api/goals/summary returns HTTP 200');
    assert(typeof mockSumRes.data?.summary?.activeGoals === 'number', 'Summary returns activeGoals count');
    assert(typeof mockSumRes.data?.summary?.atRiskGoals === 'number', 'Summary returns atRiskGoals count');
    assert(typeof mockSumRes.data?.summary?.averageProgress === 'number', 'Summary returns averageProgress');
    assert(Array.isArray(mockSumRes.data?.summary?.upcomingDeadlines), 'Summary returns upcomingDeadlines array');
  }

  // Clean up verification data
  await Promise.all([
    GoalModel.deleteMany({ title: /\[VERIFY_P9\]/ }),
    ObjectiveModel.deleteMany({ goalId: testGoalId }),
    KeyResultModel.deleteMany({ goalId: testGoalId }),
    TaskModel.deleteMany({ title: /\[VERIFY_P9\]/ }),
    GoalActivityModel.deleteMany({ goalId: testGoalId })
  ]);

  console.log('\n====================================================');
  console.log(`🌿 PHASE 9 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 9 GOALS, OKRS & PERFORMANCE PLANNING TESTS COMPLETED SUCCESSFULLY!\n');
  } else {
    throw new Error(`Phase 9 verification failed: ${totalTests - passedTests} test(s) failed.`);
  }
}

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('verifyPhase9.ts')) {
  runPhase9Verification()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
