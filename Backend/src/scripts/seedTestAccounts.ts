import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel, UserRole } from '../models/User.js';
import { hashPassword } from '../utils/password.js';

interface TestAccountConfig {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: UserRole;
  department: string;
  designation: string;
  status: 'ACTIVE';
}

export const TEST_ACCOUNTS: TestAccountConfig[] = [
  {
    name: 'Lavanta Founder',
    email: 'founder@lavantanaturals.com',
    mobile: '9000000001',
    password: 'Lavanta@Founder123',
    role: 'FOUNDER',
    department: 'Executive',
    designation: 'Founder & CEO',
    status: 'ACTIVE'
  },
  {
    name: 'Lavanta HR',
    email: 'hr@lavantanaturals.com',
    mobile: '9000000002',
    password: 'Lavanta@HR123',
    role: 'HR',
    department: 'People & Culture',
    designation: 'HR Lead',
    status: 'ACTIVE'
  },
  {
    name: 'Lavanta Manager',
    email: 'manager@lavantanaturals.com',
    mobile: '9000000003',
    password: 'Lavanta@Manager123',
    role: 'MANAGER',
    department: 'Operations',
    designation: 'Operations Manager',
    status: 'ACTIVE'
  },
  {
    name: 'Lavanta Employee',
    email: 'employee@lavantanaturals.com',
    mobile: '9000000004',
    password: 'Lavanta@Employee123',
    role: 'EMPLOYEE',
    department: 'Sales & Inventory',
    designation: 'Workspace Associate',
    status: 'ACTIVE'
  },
  {
    name: 'Lavanta Intern',
    email: 'intern@lavantanaturals.com',
    mobile: '9000000005',
    password: 'Lavanta@Intern123',
    role: 'INTERN',
    department: 'Marketing & UGC',
    designation: 'Marketing Intern',
    status: 'ACTIVE'
  }
];

export async function seedTestAccounts(): Promise<void> {
  console.log('[SeedTestAccounts] Connecting to MongoDB:', config.mongodbUri);
  await mongoose.connect(config.mongodbUri);

  try {
    console.log('[SeedTestAccounts] Seeding official role development test accounts...');

    for (const acc of TEST_ACCOUNTS) {
      const passwordHash = await hashPassword(acc.password);

      // Remove any conflicting old documents with the same phone or email to ensure uniqueness
      await UserModel.deleteMany({
        $or: [
          { email: acc.email },
          { phone: acc.mobile }
        ]
      });

      const user = await UserModel.create({
        name: acc.name,
        email: acc.email,
        phone: acc.mobile,
        passwordHash,
        role: acc.role,
        department: acc.department,
        designation: acc.designation,
        joiningDate: '2023-01-15',
        status: acc.status
      });

      console.log(`✓ Seeded ${acc.role}: ${user.name} | Email: ${acc.email} | Mobile: ${user.phone}`);
    }

    console.log('[SeedTestAccounts] All 5 development test accounts successfully seeded.');
  } catch (error) {
    console.error('[SeedTestAccounts] Error seeding test accounts:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('[SeedTestAccounts] Disconnected from MongoDB.');
  }
}

// Run directly if invoked via CLI
if (process.argv[1]?.includes('seedTestAccounts')) {
  seedTestAccounts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
