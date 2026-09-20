import mongoose, { Types } from 'mongoose';
import { config } from '../config/env.js';
import { UserModel, IUser } from '../models/User.js';
import { TaskModel, ITask } from '../models/Task.js';
import { TaskActivityModel } from '../models/TaskActivity.js';
import { activityController } from '../controllers/activityController.js';
import { taskController } from '../controllers/taskController.js';

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

export async function runPhase8Verification(): Promise<void> {
  console.log('\n🌿 ===================================================');
  console.log('🌿 RUNNING PHASE 8 AUTOMATED VERIFICATION SUITE');
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

  // Clean old verify tasks
  await TaskModel.deleteMany({ title: /\[VERIFY_P8\]/ });

  // -------------------------------------------------------------
  // TEST 1: Task Start -> Duration Begins & TASK_STARTED Activity
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Task Start & Duration Initialization ---');
  let testTask: any;
  {
    // 1a. Create task
    testTask = await TaskModel.create({
      title: '[VERIFY_P8] Essential Oil Steam Distillation Check',
      description: 'Monitor steam temperature curves during lavender extraction.',
      assignedTo: employee._id,
      assignedBy: manager._id,
      department: employee.department || 'Operations',
      priority: 'HIGH',
      status: 'TODO',
      deadline: new Date(now.getTime() + 8 * 60 * 60 * 1000)
    });
    assert(!!testTask._id, 'Test task created with TODO status');

    // 1b. Employee starts task
    const mockStartReq: any = {
      user: employee,
      params: { id: testTask._id.toString() }
    };
    const mockStartRes = createMockResponse();
    await taskController.startTask(mockStartReq, mockStartRes);
    assert(mockStartRes.statusCode === 200, 'Employee starts task (HTTP 200)');

    // 1c. Verify startedAt recorded and TASK_STARTED activity created
    const refreshed = await TaskModel.findById(testTask._id);
    assert(refreshed?.status === 'IN_PROGRESS', 'Task status transitioned to IN_PROGRESS');
    assert(!!refreshed?.startedAt, 'Task startedAt timestamp recorded in database');

    const activity = await TaskActivityModel.findOne({ taskId: testTask._id, type: 'TASK_STARTED' });
    assert(!!activity, 'TASK_STARTED activity record persisted to TaskActivity collection');
    assert(activity?.actorId.toString() === employee._id.toString(), 'Activity actor matches the employee');
  }

  // -------------------------------------------------------------
  // TEST 2: In-Progress Active Work & Duration Calculation
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Active Work & Duration Calculation ---');
  {
    const mockActiveReq: any = {
      user: founder,
      query: {}
    };
    const mockActiveRes = createMockResponse();
    await activityController.getActiveWork(mockActiveReq, mockActiveRes);
    assert(mockActiveRes.statusCode === 200, 'GET /api/activity/active returns HTTP 200');
    assert(Array.isArray(mockActiveRes.data?.activeTasks), 'Active tasks returned as an array');

    const found = mockActiveRes.data.activeTasks.find((t: any) => t._id.toString() === testTask._id.toString());
    assert(!!found, 'Currently working task appears in active work list');
    assert(typeof found?.durationMs === 'number' && found.durationMs >= 0, 'Active duration dynamically calculated in milliseconds');
    assert(found?.status === 'IN_PROGRESS', 'Task has IN_PROGRESS status');
  }

  // -------------------------------------------------------------
  // TEST 3: Comment & Proof of Work Activity Generation
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Comment & Proof of Work Activities ---');
  {
    // 3a. Add comment
    const mockCommentReq: any = {
      user: employee,
      params: { id: testTask._id.toString() },
      body: { message: '[VERIFY_P8] Condenser temperature stabilized at 82°C.' }
    };
    const mockCommentRes = createMockResponse();
    await taskController.addComment(mockCommentReq, mockCommentRes);
    assert(mockCommentRes.statusCode === 200 || mockCommentRes.statusCode === 201, 'Employee adds progress comment (HTTP 200/201)');

    const commentActivity = await TaskActivityModel.findOne({ taskId: testTask._id, type: 'COMMENT_ADDED' });
    assert(!!commentActivity, 'COMMENT_ADDED activity generated in database');

    // 3b. Complete task with proof of work
    const mockCompleteReq: any = {
      user: employee,
      params: { id: testTask._id.toString() },
      body: {
        completionComment: 'Batch extraction finalized with 98.7% yield.',
        proofOfWork: {
          filename: 'distillation_log_run14.pdf',
          fileType: 'application/pdf',
          size: 89400,
          url: '/uploads/proof/distillation_log_run14.pdf'
        }
      }
    };
    const mockCompleteRes = createMockResponse();
    await taskController.completeTask(mockCompleteReq, mockCompleteRes);
    assert(mockCompleteRes.statusCode === 200, 'Employee completes task with proof of work (HTTP 200)');

    const proofActivity = await TaskActivityModel.findOne({ taskId: testTask._id, type: 'PROOF_UPLOADED' });
    assert(!!proofActivity, 'PROOF_UPLOADED activity recorded in database');

    const completeActivity = await TaskActivityModel.findOne({ taskId: testTask._id, type: 'TASK_COMPLETED' });
    assert(!!completeActivity, 'TASK_COMPLETED activity recorded in database');

    // Verify task completion duration calculation
    const completedTask = await TaskModel.findById(testTask._id);
    assert(completedTask?.status === 'COMPLETED', 'Task status is COMPLETED');
    assert(!!completedTask?.completedAt, 'completedAt timestamp recorded');
    const computedDuration = new Date(completedTask!.completedAt!).getTime() - new Date(completedTask!.startedAt!).getTime();
    assert(computedDuration >= 0, 'Completed task duration calculated: completedAt - startedAt');
  }

  // -------------------------------------------------------------
  // TEST 4: Team Workload Aggregation (Real MongoDB Data)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Team Workload Aggregation ---');
  {
    const mockWorkloadReq: any = {
      user: founder,
      query: {}
    };
    const mockWorkloadRes = createMockResponse();
    await activityController.getTeamWorkload(mockWorkloadReq, mockWorkloadRes);
    assert(mockWorkloadRes.statusCode === 200, 'GET /api/activity/workload returns HTTP 200');
    assert(Array.isArray(mockWorkloadRes.data?.workload), 'Team workload returned as an array');

    const employeeWorkload = mockWorkloadRes.data.workload.find((w: any) => w.user._id.toString() === employee._id.toString());
    assert(!!employeeWorkload, 'Employee workload entry found in aggregation');
    assert(typeof employeeWorkload?.assigned === 'number', 'Assigned tasks count is numeric');
    assert(typeof employeeWorkload?.active === 'number', 'Active tasks count is numeric');
    assert(typeof employeeWorkload?.completed === 'number', 'Completed tasks count is numeric');
    assert(typeof employeeWorkload?.overdue === 'number', 'Overdue tasks count is numeric');
  }

  // -------------------------------------------------------------
  // TEST 5: Work Summary & Overdue Calculation
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Work Summary & Overdue Detection ---');
  {
    // Create an overdue test task
    const overdueTask = await TaskModel.create({
      title: '[VERIFY_P8] Overdue Batch Inspection',
      description: 'Inspection from yesterday.',
      assignedTo: employee._id,
      assignedBy: manager._id,
      department: employee.department || 'Operations',
      priority: 'HIGH',
      status: 'TODO',
      deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
    });

    const mockSummaryReq: any = {
      user: founder,
      query: {}
    };
    const mockSummaryRes = createMockResponse();
    await activityController.getWorkSummary(mockSummaryReq, mockSummaryRes);
    assert(mockSummaryRes.statusCode === 200, 'GET /api/activity/summary returns HTTP 200');
    assert(typeof mockSummaryRes.data?.summary?.activeTasks === 'number', 'Summary contains activeTasks');
    assert(typeof mockSummaryRes.data?.summary?.pendingTasks === 'number', 'Summary contains pendingTasks');
    assert(typeof mockSummaryRes.data?.summary?.completedToday === 'number', 'Summary contains completedToday');
    assert(mockSummaryRes.data?.summary?.overdueTasks >= 1, 'Overdue task accurately detected in summary');
    assert(typeof mockSummaryRes.data?.todaySummary?.completedToday === 'number', 'Today summary present');
    assert(typeof mockSummaryRes.data?.weeklySummary?.completionRate === 'number', 'Weekly summary completion rate calculated');
  }

  // -------------------------------------------------------------
  // TEST 6: RBAC Permission Enforcement
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: RBAC Permission Enforcement ---');
  {
    // 6a. Employee requesting another employee's activity detail -> 403 Forbidden
    const mockForbiddenReq: any = {
      user: employee,
      params: { userId: intern._id.toString() }
    };
    const mockForbiddenRes = createMockResponse();
    await activityController.getUserActivity(mockForbiddenReq, mockForbiddenRes);
    assert(mockForbiddenRes.statusCode === 403, 'Employee rejected when accessing another user activity (HTTP 403)');

    // 6b. Intern requesting manager's activity detail -> 403 Forbidden
    const mockInternForbiddenReq: any = {
      user: intern,
      params: { userId: manager._id.toString() }
    };
    const mockInternForbiddenRes = createMockResponse();
    await activityController.getUserActivity(mockInternForbiddenReq, mockInternForbiddenRes);
    assert(mockInternForbiddenRes.statusCode === 403, 'Intern rejected when accessing manager activity (HTTP 403)');

    // 6c. Founder requesting any user's activity detail -> 200 OK
    const mockFounderReq: any = {
      user: founder,
      params: { userId: employee._id.toString() }
    };
    const mockFounderRes = createMockResponse();
    await activityController.getUserActivity(mockFounderReq, mockFounderRes);
    assert(mockFounderRes.statusCode === 200, 'Founder successfully accesses user activity (HTTP 200)');
    assert(mockFounderRes.data?.user?.email === employee.email, 'Target user profile returned in response');
    assert(Array.isArray(mockFounderRes.data?.activities), 'User activities returned as an array');

    // 6d. Employee requesting own activity via /api/activity/my -> 200 OK
    const mockMyReq: any = {
      user: employee
    };
    const mockMyRes = createMockResponse();
    await activityController.getMyActivity(mockMyReq, mockMyRes);
    assert(mockMyRes.statusCode === 200, 'Employee accesses own activity via /api/activity/my (HTTP 200)');
    assert(Array.isArray(mockMyRes.data?.activeTasks), 'Personal active tasks returned');
    assert(Array.isArray(mockMyRes.data?.recentActivities), 'Personal recent activities returned');
  }

  // -------------------------------------------------------------
  // TEST 7: Completion Trends & Status Distribution
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Completion Trends & Status Distribution ---');
  {
    const mockTrendsReq: any = {
      user: founder,
      query: { range: 'week' }
    };
    const mockTrendsRes = createMockResponse();
    await activityController.getCompletionTrends(mockTrendsReq, mockTrendsRes);
    assert(mockTrendsRes.statusCode === 200, 'GET /api/activity/trends returns HTTP 200');
    assert(Array.isArray(mockTrendsRes.data?.trends), 'Trends returned as an array');
    assert(typeof mockTrendsRes.data?.statusDistribution?.COMPLETED === 'number', 'Status distribution includes COMPLETED count');
    assert(typeof mockTrendsRes.data?.statusDistribution?.TODO === 'number', 'Status distribution includes TODO count');
    assert(typeof mockTrendsRes.data?.statusDistribution?.IN_PROGRESS === 'number', 'Status distribution includes IN_PROGRESS count');
    assert(typeof mockTrendsRes.data?.statusDistribution?.OVERDUE === 'number', 'Status distribution includes OVERDUE count');
  }

  // -------------------------------------------------------------
  // TEST 8: Activity Feed Search & Filters
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Activity Feed Search & Filters ---');
  {
    const mockFeedReq: any = {
      user: founder,
      query: { search: '[VERIFY_P8]' }
    };
    const mockFeedRes = createMockResponse();
    await activityController.getActivityFeed(mockFeedReq, mockFeedRes);
    assert(mockFeedRes.statusCode === 200, 'GET /api/activity search returns HTTP 200');
    assert(Array.isArray(mockFeedRes.data?.activities), 'Activities returned as an array');
    assert(mockFeedRes.data?.activities.length > 0, 'Found matching activities for search keyword');
  }

  // Clean up verify tasks
  await TaskModel.deleteMany({ title: /\[VERIFY_P8\]/ });

  console.log('\n====================================================');
  console.log(`🌿 PHASE 8 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 8 ACTIVITY & WORK MONITORING TESTS COMPLETED SUCCESSFULLY!\n');
  } else {
    throw new Error(`Phase 8 verification failed: ${totalTests - passedTests} test(s) failed.`);
  }
}

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('verifyPhase8.ts')) {
  runPhase8Verification()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
