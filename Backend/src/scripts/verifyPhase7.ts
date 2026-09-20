import mongoose, { Types } from 'mongoose';
import { config } from '../config/env.js';
import { UserModel, IUser } from '../models/User.js';
import { CalendarEventModel, ICalendarEvent } from '../models/CalendarEvent.js';
import { TaskModel } from '../models/Task.js';
import { NotificationModel } from '../models/Notification.js';
import { AnnouncementModel } from '../models/Announcement.js';
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

export async function runPhase7Verification(): Promise<void> {
  console.log('\n🌿 ===================================================');
  console.log('🌿 RUNNING PHASE 7 AUTOMATED VERIFICATION SUITE');
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
  const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const futureEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Clean old verification events
  await CalendarEventModel.deleteMany({ title: /\[VERIFY_P7\]/ });

  // -------------------------------------------------------------
  // TEST 1: Founder Company Event & Team Invitations
  // -------------------------------------------------------------
  console.log('--- TEST 1: Founder Company Event & Invitations ---');
  {
    const mockReq: any = {
      user: founder,
      body: {
        title: '[VERIFY_P7] Lavanta Annual Strategy Meeting',
        description: 'Company-wide strategy alignment session.',
        type: 'COMPANY_EVENT',
        startDateTime: futureStart.toISOString(),
        endDateTime: futureEnd.toISOString(),
        allDay: false,
        visibility: 'COMPANY',
        participants: [manager._id.toString(), employee._id.toString(), intern._id.toString()],
        location: 'Main Auditorium',
        meetingLink: 'https://meet.google.com/lavanta-strategy'
      }
    };
    const mockRes = createMockResponse();
    await calendarController.createEvent(mockReq, mockRes);

    assert(mockRes.statusCode === 201, 'Founder successfully creates company event (HTTP 201)');
    const createdEvent = mockRes.data?.event;
    assert(createdEvent?.visibility === 'COMPANY', 'Event visibility is COMPANY');
    assert(createdEvent?.type === 'COMPANY_EVENT', 'Event type is COMPANY_EVENT');
    assert(createdEvent?.participants?.length === 3, 'All 3 participants added to invitation list');

    // Verify notifications generated for participants
    const notifications = await NotificationModel.find({
      relatedEntityId: createdEvent._id,
      type: 'EVENT_INVITATION'
    });
    assert(notifications.length === 3, 'Invitation notifications delivered to all invited participants');
  }

  // -------------------------------------------------------------
  // TEST 2: HR Team Event Creation & Visibility
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: HR Team Event Creation & Visibility ---');
  let hrEventId: string;
  {
    const mockReq: any = {
      user: hr,
      body: {
        title: '[VERIFY_P7] Q4 HR Review & People Ops Sync',
        description: 'Quarterly review session.',
        type: 'MEETING',
        startDateTime: futureStart.toISOString(),
        endDateTime: futureEnd.toISOString(),
        allDay: false,
        visibility: 'TEAM',
        department: 'People & Culture',
        participants: [employee._id.toString()]
      }
    };
    const mockRes = createMockResponse();
    await calendarController.createEvent(mockReq, mockRes);

    assert(mockRes.statusCode === 201, 'HR creates team event (HTTP 201)');
    hrEventId = mockRes.data?.event?._id?.toString();
    assert(!!hrEventId, 'HR event ID generated');
  }

  // -------------------------------------------------------------
  // TEST 3: Manager Team Meeting & Company Creation Restriction
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Manager Team Meeting & Scope Restriction ---');
  let managerMeetingId: string;
  {
    // 3a. Manager cannot create COMPANY event
    const mockInvalidReq: any = {
      user: manager,
      body: {
        title: '[VERIFY_P7] Unauthorized Company Event',
        startDateTime: futureStart.toISOString(),
        endDateTime: futureEnd.toISOString(),
        visibility: 'COMPANY'
      }
    };
    const mockInvalidRes = createMockResponse();
    await calendarController.createEvent(mockInvalidReq, mockInvalidRes);
    assert(mockInvalidRes.statusCode === 403, 'Manager rejected from creating COMPANY event (HTTP 403)');

    // 3b. Manager can create TEAM event for department
    const mockTeamReq: any = {
      user: manager,
      body: {
        title: '[VERIFY_P7] Operations Weekly Standup',
        type: 'MEETING',
        startDateTime: futureStart.toISOString(),
        endDateTime: futureEnd.toISOString(),
        visibility: 'TEAM',
        department: manager.department,
        participants: [founder._id.toString()]
      }
    };
    const mockTeamRes = createMockResponse();
    await calendarController.createEvent(mockTeamReq, mockTeamRes);
    assert(mockTeamRes.statusCode === 201, 'Manager creates department TEAM meeting (HTTP 201)');
    managerMeetingId = mockTeamRes.data?.event?._id?.toString();
  }

  // -------------------------------------------------------------
  // TEST 4: Employee Personal Event & Privacy Enforcement
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Employee Personal Event Privacy Enforcement ---');
  let personalEventId: string;
  {
    // 4a. Employee creates personal reminder
    const mockPersonalReq: any = {
      user: employee,
      body: {
        title: '[VERIFY_P7] Private Doctor Appointment',
        type: 'PERSONAL',
        startDateTime: futureStart.toISOString(),
        endDateTime: futureEnd.toISOString(),
        visibility: 'PRIVATE',
        reminder: '15_MIN'
      }
    };
    const mockPersonalRes = createMockResponse();
    await calendarController.createEvent(mockPersonalReq, mockPersonalRes);
    assert(mockPersonalRes.statusCode === 201, 'Employee creates PRIVATE personal event (HTTP 201)');
    personalEventId = mockPersonalRes.data?.event?._id?.toString();

    // 4b. Another user (Intern) fetches events -> Personal event must NOT be in results
    const mockInternReq: any = {
      user: intern,
      query: {}
    };
    const mockInternRes = createMockResponse();
    await calendarController.getEvents(mockInternReq, mockInternRes);
    const internVisibleEvents = mockInternRes.data?.events || [];
    const hasPrivateEvent = internVisibleEvents.some((e: any) => e._id.toString() === personalEventId);
    assert(!hasPrivateEvent, 'Private event is hidden from other users in calendar list');

    // 4c. Another user (Intern) directly requests private event by ID -> 403 Forbidden
    const mockDirectAccessReq: any = {
      user: intern,
      params: { id: personalEventId }
    };
    const mockDirectAccessRes = createMockResponse();
    await calendarController.getEventById(mockDirectAccessReq, mockDirectAccessRes);
    assert(mockDirectAccessRes.statusCode === 403, 'Unauthorized access to private event by ID rejected (HTTP 403)');
  }

  // -------------------------------------------------------------
  // TEST 5: Task Deadline Derivation (No Duplication)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Task Deadline Derivation ---');
  {
    // Clean old verify tasks
    await TaskModel.deleteMany({ title: /\[VERIFY_P7\]/ });

    const taskDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const task = await TaskModel.create({
      title: '[VERIFY_P7] Lavender Serum Stability Testing',
      description: 'Log 24h stability data.',
      assignedTo: intern._id,
      assignedBy: manager._id,
      department: intern.department || 'Operations',
      priority: 'HIGH',
      status: 'TODO',
      deadline: taskDeadline,
      assignedAt: new Date()
    });

    // Fetch calendar events for the assigned intern
    const mockReq: any = {
      user: intern,
      query: {}
    };
    const mockRes = createMockResponse();
    await calendarController.getEvents(mockReq, mockRes);

    const taskEntries = mockRes.data?.taskEntries || [];
    const matchedEntry = taskEntries.find((t: any) => t.taskId?.toString() === task._id.toString());
    assert(!!matchedEntry, 'Task deadline derived as virtual calendar entry for assignee');
    assert(matchedEntry?.isTaskDeadline === true, 'Entry is flagged as isTaskDeadline: true');
    assert(matchedEntry?.type === 'TASK_DEADLINE', 'Entry type is TASK_DEADLINE');

    // Verify task is NOT duplicated as a physical document in CalendarEventModel
    const dbCalendarDoc = await CalendarEventModel.findOne({ title: task.title });
    assert(!dbCalendarDoc, 'Task deadline is derived virtually and NOT duplicated in CalendarEventModel');

    // Update task to COMPLETED -> should no longer appear in active deadlines
    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();

    const mockRes2 = createMockResponse();
    await calendarController.getEvents(mockReq, mockRes2);
    const taskEntriesAfter = mockRes2.data?.taskEntries || [];
    const matchedAfter = taskEntriesAfter.find((t: any) => t.taskId?.toString() === task._id.toString());
    assert(!matchedAfter, 'Completed task deadline no longer appears in active calendar entries');
  }

  // -------------------------------------------------------------
  // TEST 6: Participant Response (RSVP)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Participant Response (RSVP) ---');
  {
    // Employee responds ACCEPTED to Manager's meeting
    const mockRespondReq: any = {
      user: founder,
      params: { id: managerMeetingId },
      body: { response: 'ACCEPTED' }
    };
    const mockRespondRes = createMockResponse();
    await calendarController.respondToEvent(mockRespondReq, mockRespondRes);
    assert(mockRespondRes.statusCode === 200, 'Participant responds ACCEPTED (HTTP 200)');

    const updatedEvent = await CalendarEventModel.findById(managerMeetingId);
    const participantRecord = updatedEvent?.participants.find(p => p.userId.toString() === founder._id.toString());
    assert(participantRecord?.response === 'ACCEPTED', 'Participant response updated to ACCEPTED');
    assert(!!participantRecord?.respondedAt, 'RSVP timestamp recorded');

    // Test invalid response rejection
    const mockInvalidReq: any = {
      user: founder,
      params: { id: managerMeetingId },
      body: { response: 'INVALID_STATUS' }
    };
    const mockInvalidRes = createMockResponse();
    await calendarController.respondToEvent(mockInvalidReq, mockInvalidRes);
    assert(mockInvalidRes.statusCode === 400, 'Invalid RSVP status rejected with HTTP 400');
  }

  // -------------------------------------------------------------
  // TEST 7: Security & Authorization Enforcements
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Security & Authorization Enforcements ---');
  {
    // 7a. Non-creator cannot edit another user's event
    const mockUnauthorizedEditReq: any = {
      user: intern,
      params: { id: hrEventId },
      body: { title: 'Unauthorized Modification' }
    };
    const mockUnauthorizedEditRes = createMockResponse();
    await calendarController.updateEvent(mockUnauthorizedEditReq, mockUnauthorizedEditRes);
    assert(mockUnauthorizedEditRes.statusCode === 403, 'Non-author rejected from editing event (HTTP 403)');

    // 7b. Non-creator cannot delete another user's event
    const mockUnauthorizedDeleteReq: any = {
      user: intern,
      params: { id: hrEventId }
    };
    const mockUnauthorizedDeleteRes = createMockResponse();
    await calendarController.deleteEvent(mockUnauthorizedDeleteReq, mockUnauthorizedDeleteRes);
    assert(mockUnauthorizedDeleteRes.statusCode === 403, 'Non-author rejected from deleting event (HTTP 403)');

    // 7c. Author can delete own event
    const mockAuthorDeleteReq: any = {
      user: hr,
      params: { id: hrEventId }
    };
    const mockAuthorDeleteRes = createMockResponse();
    await calendarController.deleteEvent(mockAuthorDeleteReq, mockAuthorDeleteRes);
    assert(mockAuthorDeleteRes.statusCode === 200, 'Author successfully soft-deletes event (HTTP 200)');

    const deletedDoc = await CalendarEventModel.findById(hrEventId);
    assert(deletedDoc?.isDeleted === true, 'Event marked isDeleted: true in database');
  }

  // -------------------------------------------------------------
  // TEST 8: Today & Upcoming Endpoints
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Today & Upcoming Endpoints ---');
  {
    // 8a. Test Today endpoint
    const mockTodayReq: any = { user: founder };
    const mockTodayRes = createMockResponse();
    await calendarController.getToday(mockTodayReq, mockTodayRes);
    assert(mockTodayRes.statusCode === 200, 'GET /api/calendar/today returns successfully');
    assert(Array.isArray(mockTodayRes.data?.events), 'Today endpoint returns an array of events');

    // 8b. Test Upcoming endpoint
    const mockUpcomingReq: any = { user: founder, query: { limit: '5' } };
    const mockUpcomingRes = createMockResponse();
    await calendarController.getUpcoming(mockUpcomingReq, mockUpcomingRes);
    assert(mockUpcomingRes.statusCode === 200, 'GET /api/calendar/upcoming returns successfully');
    assert(Array.isArray(mockUpcomingRes.data?.upcoming), 'Upcoming endpoint returns an array of entries');
  }

  // Summary
  console.log('\n====================================================');
  console.log(`🌿 PHASE 7 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 7 CALENDAR & SCHEDULING TESTS COMPLETED SUCCESSFULLY!\n');
  } else {
    throw new Error(`Verification failed: ${totalTests - passedTests} tests did not pass.`);
  }
}

if (process.argv[1]?.endsWith('verifyPhase7.ts')) {
  runPhase7Verification()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
