import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import assert from 'assert';
import { UserModel, IUser } from '../models/User.js';
import { TaskModel, ITask } from '../models/Task.js';
import { NotificationModel } from '../models/Notification.js';
import { taskController } from '../controllers/taskController.js';
import { dashboardController } from '../controllers/dashboardController.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lavanta_naturals';

let passedTests = 0;
let totalTests = 0;

function reportPass(description: string) {
  totalTests++;
  passedTests++;
  console.log(`  ✅ PASS (${totalTests}): ${description}`);
}

function mockResponse() {
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

async function runSuite() {
  console.log('\n🌿 ================================================================');
  console.log('🌿 LAVANTA NATURALS CRM: TASK ASSIGNMENT & NOTIFICATION SUITE');
  console.log('🌿 Verifying multi-member assignment, notifications, RBAC & queries');
  console.log('🌿 ================================================================\n');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  // 1. Fetch platform test users
  const founder = await UserModel.findOne({ role: 'FOUNDER' });
  const hr = await UserModel.findOne({ role: 'HR' });
  const manager = await UserModel.findOne({ role: 'MANAGER' });
  const employees = await UserModel.find({ role: 'EMPLOYEE', status: 'ACTIVE' });
  const interns = await UserModel.find({ role: 'INTERN', status: 'ACTIVE' });

  assert(founder, 'Founder user required');
  assert(hr, 'HR user required');
  assert(manager, 'Manager user required');
  assert(employees.length >= 2, 'At least 2 active employees required for multi-assignee testing');
  assert(interns.length >= 2, 'At least 2 active interns required for multi-assignee testing');

  const emp1 = employees[0];
  const emp2 = employees[1];
  const intern1 = interns[0];
  const intern2 = interns[1];

  console.log(`Users loaded: Founder (${founder.email}), HR (${hr.email}), Manager (${manager.email}), Employees (${emp1.email}, ${emp2.email}), Interns (${intern1.email}, ${intern2.email})`);

  // Clean up any previous test tasks created by this suite
  await TaskModel.deleteMany({ title: { $regex: /^\[TEST SUITE\]/ } });
  await NotificationModel.deleteMany({ title: { $regex: /^\[TEST SUITE\]/ } });

  // -------------------------------------------------------------
  // TEST 1: Founder assigns a task to one Employee
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Founder assigns a task to one Employee ---');
  {
    const req: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Founder to Single Employee Task',
        description: 'Verify single employee assignment persists in assignees array and assignedTo',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: emp1.department || 'Operations',
        targetType: 'MEMBERS',
        assigneeIds: [emp1._id.toString()]
      }
    };
    const res = mockResponse();
    await taskController.createTask(req, res);
    assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
    const createdTask = res.data.task;
    assert.strictEqual(createdTask.assignees.length, 1);
    assert.strictEqual(createdTask.assignees[0]._id.toString(), emp1._id.toString());
    assert.strictEqual(createdTask.assignedTo._id.toString(), emp1._id.toString());
    reportPass('Founder assigned task to Employee successfully; assignees and assignedTo synchronized.');
  }

  // -------------------------------------------------------------
  // TEST 2: Founder assigns a task to one Intern
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Founder assigns a task to one Intern ---');
  {
    const req: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Founder to Single Intern Task',
        description: 'Verify single intern assignment',
        priority: 'MEDIUM',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: intern1.department || 'Marketing',
        targetType: 'MEMBERS',
        assigneeIds: [intern1._id.toString()]
      }
    };
    const res = mockResponse();
    await taskController.createTask(req, res);
    assert.strictEqual(res.statusCode, 201);
    const createdTask = res.data.task;
    assert.strictEqual(createdTask.assignees[0]._id.toString(), intern1._id.toString());
    reportPass('Founder assigned task to Intern successfully.');
  }

  // -------------------------------------------------------------
  // TEST 3: Authorized user assigns a task to HR
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Founder assigns a task to HR ---');
  {
    const req: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Founder to HR Task',
        description: 'Verify HR member assignment',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Human Resources',
        targetType: 'HR',
        assigneeIds: [hr._id.toString()]
      }
    };
    const res = mockResponse();
    await taskController.createTask(req, res);
    assert.strictEqual(res.statusCode, 201);
    const createdTask = res.data.task;
    assert.strictEqual(createdTask.assignees[0]._id.toString(), hr._id.toString());
    reportPass('Founder assigned task to HR member successfully.');
  }

  // -------------------------------------------------------------
  // TEST 4: One task is assigned to multiple Interns
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: One task assigned to multiple Interns ---');
  let multiInternTaskId: string = '';
  {
    const req: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Multi-Intern Shared Task',
        description: 'Canonical task shared between Intern 1 and Intern 2',
        priority: 'MEDIUM',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Marketing',
        targetType: 'INTERNS',
        assigneeIds: [intern1._id.toString(), intern2._id.toString()]
      }
    };
    const res = mockResponse();
    await taskController.createTask(req, res);
    assert.strictEqual(res.statusCode, 201);
    const createdTask = res.data.task;
    multiInternTaskId = createdTask._id.toString();
    assert.strictEqual(createdTask.assignees.length, 2);
    const assigneeIds = createdTask.assignees.map((a: any) => a._id.toString());
    assert(assigneeIds.includes(intern1._id.toString()));
    assert(assigneeIds.includes(intern2._id.toString()));
    reportPass('Single canonical task assigned to multiple interns with 2 assignees stored.');
  }

  // -------------------------------------------------------------
  // TEST 5: One task is assigned to multiple Employees
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: One task assigned to multiple Employees ---');
  let multiEmpTaskId: string = '';
  {
    const req: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Multi-Employee Shared Task',
        description: 'Canonical task shared between Employee 1 and Employee 2',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Operations',
        targetType: 'EMPLOYEES',
        assigneeIds: [emp1._id.toString(), emp2._id.toString()]
      }
    };
    const res = mockResponse();
    await taskController.createTask(req, res);
    assert.strictEqual(res.statusCode, 201);
    const createdTask = res.data.task;
    multiEmpTaskId = createdTask._id.toString();
    assert.strictEqual(createdTask.assignees.length, 2);
    const assigneeIds = createdTask.assignees.map((a: any) => a._id.toString());
    assert(assigneeIds.includes(emp1._id.toString()));
    assert(assigneeIds.includes(emp2._id.toString()));
    reportPass('Single canonical task assigned to multiple employees.');
  }

  // -------------------------------------------------------------
  // TEST 6: One task assigned across different roles
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Cross-role assignment (Employee + Intern + HR) ---');
  let crossRoleTaskId: string = '';
  {
    const req: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Cross-Role Strategic Task',
        description: 'Shared across HR, Employee, and Intern',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Management',
        targetType: 'MEMBERS',
        assigneeIds: [hr._id.toString(), emp1._id.toString(), intern1._id.toString()]
      }
    };
    const res = mockResponse();
    await taskController.createTask(req, res);
    assert.strictEqual(res.statusCode, 201);
    const createdTask = res.data.task;
    crossRoleTaskId = createdTask._id.toString();
    assert.strictEqual(createdTask.assignees.length, 3);
    reportPass('Cross-role task successfully created with 3 diverse assignees.');
  }

  // -------------------------------------------------------------
  // TEST 7: Every assignee sees task on their dashboard/query immediately
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Every assignee sees task on their own profile/dashboard ---');
  {
    // Intern 1 query
    const reqIntern1: any = { user: intern1, query: {} };
    const resIntern1 = mockResponse();
    await taskController.getTasks(reqIntern1, resIntern1);
    const intern1Tasks = resIntern1.data.tasks;
    const foundInIntern1 = intern1Tasks.some((t: any) => t._id.toString() === multiInternTaskId);
    assert(foundInIntern1, 'Intern 1 must see multi-intern task');

    // Intern 2 query
    const reqIntern2: any = { user: intern2, query: {} };
    const resIntern2 = mockResponse();
    await taskController.getTasks(reqIntern2, resIntern2);
    const intern2Tasks = resIntern2.data.tasks;
    const foundInIntern2 = intern2Tasks.some((t: any) => t._id.toString() === multiInternTaskId);
    assert(foundInIntern2, 'Intern 2 must see multi-intern task');

    // Employee 1 dashboard
    const reqEmp1Dash: any = { user: emp1 };
    const resEmp1Dash = mockResponse();
    await dashboardController.getDashboardData(reqEmp1Dash, resEmp1Dash);
    assert.strictEqual(resEmp1Dash.statusCode, 200);
    const activeTasksEmp1 = resEmp1Dash.data.activeTasks;
    const emp1HasTask = activeTasksEmp1.some((t: any) => t.id.toString() === multiEmpTaskId);
    assert(emp1HasTask, 'Employee 1 dashboard must include multi-employee task');

    // Employee 2 dashboard
    const reqEmp2Dash: any = { user: emp2 };
    const resEmp2Dash = mockResponse();
    await dashboardController.getDashboardData(reqEmp2Dash, resEmp2Dash);
    const activeTasksEmp2 = resEmp2Dash.data.activeTasks;
    const emp2HasTask = activeTasksEmp2.some((t: any) => t.id.toString() === multiEmpTaskId);
    assert(emp2HasTask, 'Employee 2 dashboard must include multi-employee task');

    reportPass('Both assignees on shared tasks immediately see tasks in their task list and dashboard.');
  }

  // -------------------------------------------------------------
  // TEST 8: Every newly assigned member receives exactly 1 notification
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Notification delivery and idempotency ---');
  {
    const emp1Notifs = await NotificationModel.find({
      recipientId: emp1._id,
      link: `/tasks/${multiEmpTaskId}`
    });
    const emp2Notifs = await NotificationModel.find({
      recipientId: emp2._id,
      link: `/tasks/${multiEmpTaskId}`
    });

    assert.strictEqual(emp1Notifs.length, 1, `Employee 1 should receive exactly 1 notification, found ${emp1Notifs.length}`);
    assert.strictEqual(emp2Notifs.length, 1, `Employee 2 should receive exactly 1 notification, found ${emp2Notifs.length}`);
    assert.strictEqual(emp1Notifs[0].idempotencyKey, `task_assigned_${multiEmpTaskId}_${emp1._id.toString()}`);
    reportPass('Every assignee received exactly one persistent notification with valid idempotency key.');
  }

  // -------------------------------------------------------------
  // TEST 9: Existing assignees do NOT receive duplicate notifications when new member is added
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Reassignment notification isolation ---');
  {
    const beforeCountEmp1 = await NotificationModel.countDocuments({
      recipientId: emp1._id,
      link: `/tasks/${multiEmpTaskId}`
    });
    const beforeCountEmp2 = await NotificationModel.countDocuments({
      recipientId: emp2._id,
      link: `/tasks/${multiEmpTaskId}`
    });

    // Add intern1 as a 3rd member to multiEmpTask
    const updateReq: any = {
      user: founder,
      params: { id: multiEmpTaskId },
      body: {
        assigneeIds: [emp1._id.toString(), emp2._id.toString(), intern1._id.toString()]
      }
    };
    const updateRes = mockResponse();
    await taskController.updateTask(updateReq, updateRes);
    assert.strictEqual(updateRes.statusCode, 200);

    const afterCountEmp1 = await NotificationModel.countDocuments({
      recipientId: emp1._id,
      link: `/tasks/${multiEmpTaskId}`
    });
    const afterCountEmp2 = await NotificationModel.countDocuments({
      recipientId: emp2._id,
      link: `/tasks/${multiEmpTaskId}`
    });
    const intern1Notifs = await NotificationModel.countDocuments({
      recipientId: intern1._id,
      link: `/tasks/${multiEmpTaskId}`
    });

    assert.strictEqual(afterCountEmp1, beforeCountEmp1, 'Existing assignee emp1 must not receive duplicate notification');
    assert.strictEqual(afterCountEmp2, beforeCountEmp2, 'Existing assignee emp2 must not receive duplicate notification');
    assert.strictEqual(intern1Notifs, 1, 'Newly added assignee intern1 must receive exactly 1 notification');
    reportPass('Adding a new member notified only the new member; existing assignees received zero duplicate notifications.');
  }

  // -------------------------------------------------------------
  // TEST 10: Tasks and notifications remain correct after refresh / reload
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: Persistence after reload / query ---');
  {
    const persisted = await TaskModel.findById(multiEmpTaskId).populate('assignees').populate('assignedBy');
    assert(persisted, 'Task must exist in DB');
    assert.strictEqual(persisted.assignees.length, 3);
    assert.strictEqual(persisted.status, 'TODO');
    assert.strictEqual(persisted.priority, 'HIGH');
    reportPass('Task record and assignees array are robustly persisted in MongoDB.');
  }

  // -------------------------------------------------------------
  // TEST 11: Removing an assignee does not affect other assignees or delete task
  // -------------------------------------------------------------
  console.log('\n--- TEST 11: Remove assignee preserves task and remaining assignees ---');
  {
    const updateReq: any = {
      user: founder,
      params: { id: multiEmpTaskId },
      body: {
        // Remove intern1, keep emp1 and emp2
        assigneeIds: [emp1._id.toString(), emp2._id.toString()]
      }
    };
    const updateRes = mockResponse();
    await taskController.updateTask(updateReq, updateRes);
    assert.strictEqual(updateRes.statusCode, 200);

    const updatedTask = await TaskModel.findById(multiEmpTaskId);
    assert(updatedTask, 'Task must not be deleted');
    assert.strictEqual(updatedTask.assignees.length, 2);
    const currentIds = updatedTask.assignees.map((id: any) => id.toString());
    assert(currentIds.includes(emp1._id.toString()));
    assert(currentIds.includes(emp2._id.toString()));
    assert(!currentIds.includes(intern1._id.toString()));

    // Verify intern1 can no longer access task
    const internReq: any = { user: intern1, params: { id: multiEmpTaskId } };
    const internRes = mockResponse();
    await taskController.getTaskById(internReq, internRes);
    assert.strictEqual(internRes.statusCode, 403, 'Removed member must no longer have access');
    reportPass('Removing an assignee safely revoked their access while preserving task and remaining members.');
  }

  // -------------------------------------------------------------
  // TEST 12: Unauthorized assignment attempts are rejected by backend
  // -------------------------------------------------------------
  console.log('\n--- TEST 12: Backend RBAC enforcement ---');
  {
    // Employee attempting to create task
    const empReq: any = {
      user: emp1,
      body: {
        title: '[TEST SUITE] Unauthorized Employee Task',
        priority: 'LOW',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Operations',
        targetType: 'MEMBERS',
        assigneeIds: [emp2._id.toString()]
      }
    };
    const empRes = mockResponse();
    await taskController.createTask(empReq, empRes);
    assert.strictEqual(empRes.statusCode, 403, 'Employee cannot create tasks');

    // Manager attempting to assign to HR
    const mgrReq: any = {
      user: manager,
      body: {
        title: '[TEST SUITE] Manager assigning to HR',
        priority: 'MEDIUM',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Human Resources',
        targetType: 'HR',
        assigneeIds: [hr._id.toString()]
      }
    };
    const mgrRes = mockResponse();
    await taskController.createTask(mgrReq, mgrRes);
    assert.strictEqual(mgrRes.statusCode, 403, 'Manager cannot assign tasks to HR');

    reportPass('RBAC properly rejected unauthorized creation and invalid target role delegations.');
  }

  // -------------------------------------------------------------
  // TEST 13: Existing legacy single-assignee tasks remain accessible
  // -------------------------------------------------------------
  console.log('\n--- TEST 13: Backward compatibility with legacy assignedTo ---');
  {
    // Create legacy task directly via MongoDB collection without assignees field
    const legacyDoc = await mongoose.connection.collection('tasks').insertOne({
      title: '[TEST SUITE] Legacy Single Assignee Task',
      description: 'Legacy task created before multi-assignee schema update',
      priority: 'MEDIUM',
      status: 'TODO',
      assignedTo: emp1._id,
      assignedBy: founder._id,
      department: emp1.department || 'Operations',
      deadline: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const legacyId = legacyDoc.insertedId.toString();

    // Query task via taskController.getTasks for emp1
    const req: any = { user: emp1, query: {} };
    const res = mockResponse();
    await taskController.getTasks(req, res);
    assert.strictEqual(res.statusCode, 200);
    const foundLegacy = res.data.tasks.some((t: any) => t._id.toString() === legacyId);
    assert(foundLegacy, 'Legacy task with assignedTo must appear in employee task list');

    // Fetch individual task
    const detailReq: any = { user: emp1, params: { id: legacyId } };
    const detailRes = mockResponse();
    await taskController.getTaskById(detailReq, detailRes);
    assert.strictEqual(detailRes.statusCode, 200);
    assert.strictEqual(detailRes.data.task.title, '[TEST SUITE] Legacy Single Assignee Task');

    reportPass('Legacy tasks with assignedTo field are 100% accessible and queryable.');
  }

  // -------------------------------------------------------------
  // TEST 14: Invalid user IDs and duplicate assignee IDs handled safely
  // -------------------------------------------------------------
  console.log('\n--- TEST 14: Invalid IDs and duplicate deduplication ---');
  {
    // Duplicates in assigneeIds
    const dupReq: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Duplicate Assignee Test',
        priority: 'LOW',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Operations',
        targetType: 'MEMBERS',
        assigneeIds: [emp1._id.toString(), emp1._id.toString(), emp1._id.toString()]
      }
    };
    const dupRes = mockResponse();
    await taskController.createTask(dupReq, dupRes);
    assert.strictEqual(dupRes.statusCode, 201);
    assert.strictEqual(dupRes.data.task.assignees.length, 1, 'Duplicate assignee IDs must be automatically deduplicated');

    // Invalid ObjectId format
    const invalidReq: any = {
      user: founder,
      body: {
        title: '[TEST SUITE] Invalid ID Test',
        priority: 'LOW',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        department: 'Operations',
        targetType: 'MEMBERS',
        assigneeIds: ['not-a-valid-object-id']
      }
    };
    const invalidRes = mockResponse();
    await taskController.createTask(invalidReq, invalidRes);
    assert.strictEqual(invalidRes.statusCode, 400, 'Invalid ObjectId must be rejected with 400');

    reportPass('Duplicates deduplicated into a single member; invalid ObjectIds rejected with 400.');
  }

  // -------------------------------------------------------------
  // TEST 15: Socket/API retries do not create duplicate notifications
  // -------------------------------------------------------------
  console.log('\n--- TEST 15: Retry idempotency for notifications ---');
  {
    const beforeCount = await NotificationModel.countDocuments({
      recipientId: emp1._id,
      link: `/tasks/${multiInternTaskId}`
    });

    // Manually trigger duplicate notification dispatcher with same idempotencyKey
    const { notificationDispatcher } = await import('../services/notificationDispatcher.js');
    await notificationDispatcher.dispatch({
      recipientId: emp1._id.toString(),
      senderId: founder._id.toString(),
      type: 'TASK_ASSIGNED',
      category: 'TASK',
      title: 'Idempotency Test',
      message: 'Testing that retries do not duplicate notifications',
      link: `/tasks/${multiInternTaskId}`,
      idempotencyKey: `task_assigned_${multiInternTaskId}_${emp1._id.toString()}`
    });

    const firstCount = await NotificationModel.countDocuments({
      recipientId: emp1._id,
      idempotencyKey: `task_assigned_${multiInternTaskId}_${emp1._id.toString()}`
    });
    assert.strictEqual(firstCount, 1);

    // Retry with identical key
    await notificationDispatcher.dispatch({
      recipientId: emp1._id.toString(),
      senderId: founder._id.toString(),
      type: 'TASK_ASSIGNED',
      category: 'TASK',
      title: 'Idempotency Test Retry',
      message: 'Retry attempt',
      link: `/tasks/${multiInternTaskId}`,
      idempotencyKey: `task_assigned_${multiInternTaskId}_${emp1._id.toString()}`
    });

    const secondCount = await NotificationModel.countDocuments({
      recipientId: emp1._id,
      idempotencyKey: `task_assigned_${multiInternTaskId}_${emp1._id.toString()}`
    });
    assert.strictEqual(secondCount, 1, 'Retry must not insert a second notification with the same idempotency key');

    reportPass('Notification dispatcher idempotency guarantees exactly-once notification delivery on retries.');
  }

  // Cleanup test artifacts
  await TaskModel.deleteMany({ title: { $regex: /^\[TEST SUITE\]/ } });
  await NotificationModel.deleteMany({ title: { $regex: /Idempotency Test/ } });

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');

  await mongoose.disconnect();
}

runSuite().catch(err => {
  console.error('\n❌ Test suite failed with error:\n', err);
  process.exit(1);
});
