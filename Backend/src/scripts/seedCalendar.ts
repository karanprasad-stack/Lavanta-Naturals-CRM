import mongoose from 'mongoose';
import { CalendarEventModel } from '../models/CalendarEvent.js';
import { UserModel } from '../models/User.js';
import { TaskModel } from '../models/Task.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lavanta_naturals';

async function seedCalendar() {
  await mongoose.connect(MONGO_URI);
  console.log('[SeedCalendar] Connected to MongoDB');

  // Get users
  const users = await UserModel.find({ status: 'ACTIVE' }).lean();
  if (users.length === 0) {
    console.error('[SeedCalendar] No active users found. Run the user seed first.');
    process.exit(1);
  }

  const founder = users.find(u => u.role === 'FOUNDER') || users[0];
  const hr = users.find(u => u.role === 'HR') || users[0];
  const manager = users.find(u => u.role === 'MANAGER') || users[0];
  const employees = users.filter(u => u.role === 'EMPLOYEE' || u.role === 'INTERN');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Helper: offset days from today
  const d = (offsetDays: number, hours: number = 0, minutes: number = 0) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  };

  // Remove existing calendar events so we don't duplicate
  await CalendarEventModel.deleteMany({});
  console.log('[SeedCalendar] Cleared existing calendar events');

  const events = [];

  // 1. Company-wide quarterly meeting (Founder)
  events.push({
    title: 'Lavanta Q4 All-Hands Meeting',
    description: 'Quarterly company review. All team members are expected to attend. Agenda: OKR review, product roadmap, team updates.',
    type: 'COMPANY_EVENT',
    startDateTime: d(1, 10, 0),
    endDateTime: d(1, 11, 30),
    allDay: false,
    createdBy: founder._id,
    participants: employees.slice(0, 5).map(u => ({ userId: u._id, response: 'PENDING' })),
    department: null,
    location: 'Main Conference Room, Lavanta HQ',
    meetingLink: 'https://meet.google.com/lavanta-allhands',
    reminder: '1_DAY',
    visibility: 'COMPANY'
  });

  // 2. HR-led onboarding session
  if (hr) {
    events.push({
      title: 'New Team Member Onboarding',
      description: 'Orientation for new team members. Covers company policies, tools, and introductions.',
      type: 'MEETING',
      startDateTime: d(0, 11, 0),
      endDateTime: d(0, 12, 0),
      allDay: false,
      createdBy: hr._id,
      participants: employees.slice(0, 3).map(u => ({ userId: u._id, response: 'ACCEPTED' })),
      department: 'People Operations',
      location: 'HR Conference Room',
      meetingLink: '',
      reminder: '30_MIN',
      visibility: 'TEAM'
    });
  }

  // 3. Manager's weekly team stand-up
  if (manager) {
    events.push({
      title: 'Marketing Weekly Stand-Up',
      description: 'Weekly sync for the marketing team. Discuss ongoing campaigns, blockers, and priorities.',
      type: 'MEETING',
      startDateTime: d(0, 9, 30),
      endDateTime: d(0, 10, 0),
      allDay: false,
      createdBy: manager._id,
      participants: employees.slice(0, 4).map(u => ({ userId: u._id, response: 'ACCEPTED' })),
      department: 'Marketing',
      location: '',
      meetingLink: 'https://meet.google.com/mktg-standup',
      reminder: '15_MIN',
      visibility: 'TEAM'
    });

    // Next week's stand-up
    events.push({
      title: 'Marketing Weekly Stand-Up',
      description: 'Weekly sync for the marketing team.',
      type: 'MEETING',
      startDateTime: d(7, 9, 30),
      endDateTime: d(7, 10, 0),
      allDay: false,
      createdBy: manager._id,
      participants: employees.slice(0, 4).map(u => ({ userId: u._id, response: 'PENDING' })),
      department: 'Marketing',
      location: '',
      meetingLink: 'https://meet.google.com/mktg-standup',
      reminder: '15_MIN',
      visibility: 'TEAM'
    });
  }

  // 4. Supplier call (Founder)
  events.push({
    title: 'Supplier Partnership Call',
    description: 'Call with Aromatic Botanicals Ltd to discuss Q4 raw material procurement and pricing.',
    type: 'CALL',
    startDateTime: d(0, 14, 30),
    endDateTime: d(0, 15, 0),
    allDay: false,
    createdBy: founder._id,
    participants: [],
    department: null,
    location: '',
    meetingLink: '',
    reminder: '10_MIN',
    visibility: 'PRIVATE'
  });

  // 5. Product launch planning (Founder + team)
  events.push({
    title: 'Lavanta Rose Serum Launch Planning',
    description: 'Planning session for the upcoming Rose Serum product launch. Team to bring campaign ideas.',
    type: 'MEETING',
    startDateTime: d(2, 14, 0),
    endDateTime: d(2, 15, 30),
    allDay: false,
    createdBy: founder._id,
    participants: [
      ...(hr ? [{ userId: hr._id, response: 'ACCEPTED' as const }] : []),
      ...(manager ? [{ userId: manager._id, response: 'ACCEPTED' as const }] : []),
      ...employees.slice(0, 2).map(u => ({ userId: u._id, response: 'PENDING' as const }))
    ],
    department: 'Marketing',
    location: 'Board Room',
    meetingLink: 'https://meet.google.com/rose-serum-launch',
    reminder: '30_MIN',
    visibility: 'TEAM'
  });

  // 6. Personal reminder for founder
  events.push({
    title: 'Review Q4 Budget Proposal',
    description: 'Personal reminder to review and approve the Q4 marketing budget.',
    type: 'REMINDER',
    startDateTime: d(0, 16, 0),
    endDateTime: d(0, 16, 30),
    allDay: false,
    createdBy: founder._id,
    participants: [],
    department: null,
    location: '',
    meetingLink: '',
    reminder: 'AT_TIME',
    visibility: 'PRIVATE'
  });

  // 7. Company holiday
  events.push({
    title: 'Diwali Holiday',
    description: 'Company holiday — offices closed. Wishing everyone a Happy Diwali from the Lavanta Naturals family!',
    type: 'COMPANY_EVENT',
    startDateTime: d(5, 0, 0),
    endDateTime: d(5, 23, 59),
    allDay: true,
    createdBy: founder._id,
    participants: [],
    department: null,
    location: '',
    meetingLink: '',
    reminder: '1_DAY',
    visibility: 'COMPANY'
  });

  // 8. Follow-up after supplier call
  events.push({
    title: 'Follow-Up: Aromatic Botanicals Proposal',
    description: 'Review and respond to the proposal sent after the supplier call.',
    type: 'FOLLOW_UP',
    startDateTime: d(3, 10, 0),
    endDateTime: d(3, 10, 30),
    allDay: false,
    createdBy: founder._id,
    participants: [],
    department: null,
    location: '',
    meetingLink: '',
    reminder: 'AT_TIME',
    visibility: 'PRIVATE'
  });

  // 9. Employee personal event
  if (employees.length > 0) {
    events.push({
      title: 'Design Review Prep',
      description: 'Personal prep time to get ready for the upcoming design review session.',
      type: 'PERSONAL',
      startDateTime: d(1, 8, 0),
      endDateTime: d(1, 9, 0),
      allDay: false,
      createdBy: employees[0]._id,
      participants: [],
      department: null,
      location: '',
      meetingLink: '',
      reminder: '15_MIN',
      visibility: 'PRIVATE'
    });
  }

  // 10. Investor presentation
  events.push({
    title: 'Angel Investor Presentation',
    description: 'Pitch to prospective investors. Slide deck and product demo prepared.',
    type: 'MEETING',
    startDateTime: d(4, 15, 0),
    endDateTime: d(4, 16, 30),
    allDay: false,
    createdBy: founder._id,
    participants: hr ? [{ userId: hr._id, response: 'ACCEPTED' as const }] : [],
    department: null,
    location: 'Zoom Meeting',
    meetingLink: 'https://zoom.us/j/lavanta-pitch',
    reminder: '1_HOUR',
    visibility: 'PRIVATE'
  });

  const created = await CalendarEventModel.insertMany(events);
  console.log(`[SeedCalendar] Created ${created.length} calendar events`);

  // Get task count for info
  const taskCount = await TaskModel.countDocuments({ status: { $nin: ['COMPLETED', 'CANCELLED'] } });
  console.log(`[SeedCalendar] ${taskCount} active task deadlines will appear in calendar automatically`);

  await mongoose.disconnect();
  console.log('[SeedCalendar] Done. ✓');
}

seedCalendar().catch(err => {
  console.error('[SeedCalendar] Fatal error:', err);
  process.exit(1);
});
