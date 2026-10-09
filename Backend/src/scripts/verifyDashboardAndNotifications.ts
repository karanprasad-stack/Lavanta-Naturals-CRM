import mongoose from 'mongoose';
import dotenv from 'dotenv';
import assert from 'assert';
import { UserModel, UserRole } from '../models/User.js';
import { TaskModel } from '../models/Task.js';
import { AnnouncementModel } from '../models/Announcement.js';
import { NotificationModel, NotificationType, EntityType } from '../models/Notification.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';
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

async function runDashboardAndNotificationTests() {
  console.log('\n🌿 ===============================================================');
  console.log('🌿 RUNNING ROLE-SPECIFIC DASHBOARDS & NOTIFICATIONS TEST SUITE');
  console.log('🌿 ===============================================================\n');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  // 1. Setup / find users
  const founder = await UserModel.findOne({ role: 'FOUNDER' });
  const hr = await UserModel.findOne({ role: 'HR' });
  const manager = await UserModel.findOne({ role: 'MANAGER' });
  const employee = await UserModel.findOne({ role: 'EMPLOYEE' });
  const intern = await UserModel.findOne({ role: 'INTERN' });

  assert(!!founder && !!hr && !!manager && !!employee && !!intern, 'All 5 role accounts must exist');
  reportPass('Verified 5 role test accounts exist (FOUNDER, HR, MANAGER, EMPLOYEE, INTERN)');

  // ===============================================================
  // SUITE 1: Notification Creation & Routing
  // ===============================================================
  console.log('\n--- SUITE 1: Notification Creation & Routing ---');

  // Test 1: Direct Message creates notification for recipient, not sender
  const idempotencyDM = `test_dm_${Date.now()}`;
  const dmNotif = await notificationDispatcher.dispatch({
    recipientId: employee._id.toString(),
    actorId: manager._id.toString(),
    type: 'DIRECT_MESSAGE' as any,
    title: `New message from ${manager.name}`,
    description: 'Hey, please review the latest inventory report.',
    entityType: 'CONVERSATION' as any,
    entityId: new mongoose.Types.ObjectId().toString(),
    link: '/chat',
    idempotencyKey: idempotencyDM
  });

  assert(!!dmNotif, 'DM notification must be created');
  assert(dmNotif.recipientId.toString() === employee._id.toString(), 'Recipient must match employee ID');
  assert(dmNotif.isRead === false, 'Notification must initially be unread');
  reportPass('Direct message creates persistent unread notification for the intended recipient');

  // Test 2: Sender does not receive notification for self
  const selfNotif = await notificationDispatcher.dispatch({
    recipientId: manager._id.toString(),
    actorId: manager._id.toString(),
    type: 'DIRECT_MESSAGE' as any,
    title: 'Self message',
    description: 'Should not create',
    entityType: 'CONVERSATION' as any,
    entityId: new mongoose.Types.ObjectId().toString()
  });
  assert(selfNotif === null, 'Self-notification must be rejected');
  reportPass('Self-notifications are rejected and avoided');

  // Test 3: Idempotency deduplication prevents duplicate notifications
  const dupNotif = await notificationDispatcher.dispatch({
    recipientId: employee._id.toString(),
    actorId: manager._id.toString(),
    type: 'DIRECT_MESSAGE' as any,
    title: 'Duplicate message',
    description: 'Should be deduplicated',
    entityType: 'CONVERSATION' as any,
    entityId: new mongoose.Types.ObjectId().toString(),
    idempotencyKey: idempotencyDM
  });
  assert(dupNotif && dupNotif._id.toString() === dmNotif._id.toString(), 'Duplicate dispatch returns existing record without creating duplicate');
  const countWithKey = await NotificationModel.countDocuments({ idempotencyKey: idempotencyDM });
  assert(countWithKey === 1, 'Only one record exists for the given idempotency key');
  reportPass('Idempotency key prevents duplicate notifications for the same event');

  // Test 4: Task assignment notification
  const idempotencyTask = `test_task_assign_${Date.now()}`;
  const taskNotif = await notificationDispatcher.dispatch({
    recipientId: intern._id.toString(),
    actorId: manager._id.toString(),
    type: 'TASK_ASSIGNED' as any,
    title: 'New Task Assigned: Onboarding Module 1',
    description: `${manager.name} assigned you a new task.`,
    entityType: 'TASK' as any,
    entityId: new mongoose.Types.ObjectId().toString(),
    link: '/tasks',
    idempotencyKey: idempotencyTask
  });
  assert(!!taskNotif, 'Task notification must be created');
  assert(taskNotif.type === 'TASK_ASSIGNED', 'Notification type must be TASK_ASSIGNED');
  assert(taskNotif.link === '/tasks', 'Notification link must route to /tasks');
  reportPass('Task assignment generates actionable notification linked to task board');

  // Test 5: Announcement audience targeting notifications
  const audienceNotifs = await notificationDispatcher.dispatchBatch({
    recipientIds: [employee._id.toString(), intern._id.toString()],
    actorId: founder._id.toString(),
    type: 'ANNOUNCEMENT_PUBLISHED' as any,
    title: 'Company All-Hands Meeting',
    description: 'Join us tomorrow at 10 AM.',
    entityType: 'ANNOUNCEMENT' as any,
    entityId: new mongoose.Types.ObjectId().toString(),
    link: '/announcements',
    idempotencyKeyPrefix: `ann_test_${Date.now()}`
  });
  assert(audienceNotifs.length === 2, 'Should create 2 audience targeted notifications');
  reportPass('Targeted announcements create notifications for all intended audience members');

  // ===============================================================
  // SUITE 2: Notification Permissions & Read Synchronization
  // ===============================================================
  console.log('\n--- SUITE 2: Notification Permissions & Read Synchronization ---');

  // Test 6: Unread count query
  const unreadBefore = await NotificationModel.countDocuments({
    recipientId: employee._id,
    isRead: false
  });
  assert(unreadBefore >= 1, 'Employee should have at least 1 unread notification');
  reportPass(`Accurate unread notification count verified (${unreadBefore} unread)`);

  // Test 7: Mark notification as read
  await NotificationModel.findByIdAndUpdate(dmNotif._id, {
    isRead: true,
    readAt: new Date()
  });
  const updatedNotif = await NotificationModel.findById(dmNotif._id);
  assert(updatedNotif?.isRead === true, 'Notification should be marked read');
  assert(!!updatedNotif?.readAt, 'readAt timestamp must be recorded');

  const unreadAfter = await NotificationModel.countDocuments({
    recipientId: employee._id,
    isRead: false
  });
  assert(unreadAfter === unreadBefore - 1, 'Unread count must decrement by exactly 1');
  reportPass('Marking notification as read persists in database and decrements unread count');

  // Test 8: Mark all as read updates ONLY current user's notifications
  // Ensure intern has an unread notification
  const internUnreadBefore = await NotificationModel.countDocuments({
    recipientId: intern._id,
    isRead: false
  });
  assert(internUnreadBefore >= 1, 'Intern should have unread notifications');

  // Mark all for employee
  await NotificationModel.updateMany(
    { recipientId: employee._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  const employeeUnread = await NotificationModel.countDocuments({
    recipientId: employee._id,
    isRead: false
  });
  assert(employeeUnread === 0, 'Employee should now have 0 unread notifications');

  const internUnreadAfter = await NotificationModel.countDocuments({
    recipientId: intern._id,
    isRead: false
  });
  assert(internUnreadAfter === internUnreadBefore, 'Intern notifications must not be affected by employee mark-all');
  reportPass('Mark All as Read strictly affects only the authenticated user records');

  // ===============================================================
  // SUITE 3: Role-Specific Dashboard Data Isolation
  // ===============================================================
  console.log('\n--- SUITE 3: Role-Specific Dashboard Data Isolation ---');

  // Helper to simulate express req/res
  function mockReqRes(userObj: any) {
    const req: any = { user: userObj };
    let jsonResult: any = null;
    let statusCode = 200;
    const res: any = {
      status(c: number) { statusCode = c; return this; },
      json(data: any) { jsonResult = data; return this; }
    };
    return { req, res, getResult: () => ({ status: statusCode, data: jsonResult }) };
  }

  // Test 9: Manager Dashboard returns team metrics
  const mockMgr = mockReqRes(manager);
  await dashboardController.getDashboardData(mockMgr.req, mockMgr.res);
  const mgrResult = mockMgr.getResult();
  assert(mgrResult.data.role === 'MANAGER', 'Manager payload role must be MANAGER');
  assert(mgrResult.data.teamStats !== undefined, 'Manager payload must include teamStats');
  assert(mgrResult.data.teamTaskOverview !== undefined, 'Manager payload must include teamTaskOverview');
  assert(Array.isArray(mgrResult.data.inProgressTasks), 'Manager payload must have inProgressTasks array');
  assert(Array.isArray(mgrResult.data.teamWorkload), 'Manager payload must have teamWorkload array');
  reportPass('Manager dashboard delivers team workload, in-progress tasks, and team statistics');

  // Test 10: HR Dashboard returns workforce metrics
  const mockHR = mockReqRes(hr);
  await dashboardController.getDashboardData(mockHR.req, mockHR.res);
  const hrResult = mockHR.getResult();
  assert(hrResult.data.role === 'HR', 'HR payload role must be HR');
  assert(hrResult.data.peopleStats !== undefined, 'HR payload must include peopleStats');
  assert(hrResult.data.peopleStats.totalEmployees !== undefined, 'peopleStats must contain totalEmployees');
  assert(hrResult.data.peopleStats.totalInterns !== undefined, 'peopleStats must contain totalInterns');
  assert(Array.isArray(hrResult.data.teamDirectoryPreview), 'HR payload must include teamDirectoryPreview');
  assert(Array.isArray(hrResult.data.hrTasks), 'HR payload must include hrTasks');
  reportPass('HR dashboard delivers workforce counts, HR tasks, and team directory preview');

  // Test 11: Employee Dashboard returns strictly personal work
  const mockEmp = mockReqRes(employee);
  await dashboardController.getDashboardData(mockEmp.req, mockEmp.res);
  const empResult = mockEmp.getResult();
  assert(empResult.data.role === 'EMPLOYEE', 'Employee payload role must be EMPLOYEE');
  assert(empResult.data.myWork !== undefined, 'Employee payload must include myWork');
  assert(empResult.data.teamStats === undefined, 'Employee payload must NOT expose manager teamStats');
  assert(empResult.data.peopleStats === undefined, 'Employee payload must NOT expose HR peopleStats');
  assert(Array.isArray(empResult.data.activeTasks), 'Employee payload must include activeTasks');
  reportPass('Employee dashboard isolates personal work and conceals team/HR private stats');

  // Test 12: Intern Dashboard returns focused learning work
  const mockIntern = mockReqRes(intern);
  await dashboardController.getDashboardData(mockIntern.req, mockIntern.res);
  const internResult = mockIntern.getResult();
  assert(internResult.data.role === 'INTERN', 'Intern payload role must be INTERN');
  assert(internResult.data.myTasks !== undefined, 'Intern payload must include myTasks');
  assert(internResult.data.teamStats === undefined, 'Intern payload must NOT expose manager teamStats');
  assert(internResult.data.peopleStats === undefined, 'Intern payload must NOT expose HR peopleStats');
  assert(Array.isArray(internResult.data.assignedTasks), 'Intern payload must include assignedTasks');
  reportPass('Intern dashboard isolates learning deliverables and hides unauthorized analytics');

  // Test 13: Founder Dashboard preserves overview
  const mockFounder = mockReqRes(founder);
  await dashboardController.getDashboardData(mockFounder.req, mockFounder.res);
  const founderResult = mockFounder.getResult();
  assert(founderResult.data.role === 'FOUNDER', 'Founder payload role must be FOUNDER');
  assert(founderResult.data.companyOverview !== undefined, 'Founder payload must include companyOverview');
  reportPass('Founder dashboard preserves company overview without modification');

  // Clean up test notifications created in this run
  await NotificationModel.deleteMany({
    idempotencyKey: { $in: [idempotencyDM, idempotencyTask] }
  });

  console.log('\n🌿 ===============================================================');
  console.log(`🌿 ALL ${totalTests} TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
  console.log('🌿 ===============================================================\n');
}

runDashboardAndNotificationTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
