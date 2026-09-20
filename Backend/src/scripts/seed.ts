import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel, UserRole, UserStatus } from '../models/User.js';
import { hashPassword } from '../utils/password.js';

interface SeedUserData {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  joiningDate: string;
  phone: string;
  profilePhoto: string;
  status: UserStatus;
}

const DEMO_PASSWORD = 'Lavanta@2026';

const seedUsers: SeedUserData[] = [
  {
    name: 'Karan Prasad',
    email: 'founder@lavantanaturals.com',
    role: 'FOUNDER',
    department: 'Executive',
    designation: 'Founder & CEO',
    joiningDate: '2023-01-15',
    phone: '+91 98201 44521',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Karan Prasad',
    email: 'karan@lavantanaturals.com',
    role: 'FOUNDER',
    department: 'Executive',
    designation: 'Founder & CEO',
    joiningDate: '2023-01-15',
    phone: '+91 98201 44521',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Priya Sharma',
    email: 'hr@lavantanaturals.com',
    role: 'HR',
    department: 'People & Culture',
    designation: 'HR & People Operations Lead',
    joiningDate: '2023-06-01',
    phone: '+91 97112 88401',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Priya Sharma',
    email: 'priya@lavantanaturals.com',
    role: 'HR',
    department: 'People & Culture',
    designation: 'HR & People Operations Lead',
    joiningDate: '2023-06-01',
    phone: '+91 97112 88401',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Rahul Kumar',
    email: 'manager@lavantanaturals.com',
    role: 'MANAGER',
    department: 'Operations',
    designation: 'Operations & Supply Chain Manager',
    joiningDate: '2023-04-10',
    phone: '+91 99304 11290',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Rahul Kumar',
    email: 'rahul@lavantanaturals.com',
    role: 'MANAGER',
    department: 'Operations',
    designation: 'Operations & Supply Chain Manager',
    joiningDate: '2023-04-10',
    phone: '+91 99304 11290',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Anjali Verma',
    email: 'employee@lavantanaturals.com',
    role: 'EMPLOYEE',
    department: 'Sales',
    designation: 'Omnichannel Sales Specialist',
    joiningDate: '2023-09-15',
    phone: '+91 98110 54320',
    profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Anjali Verma',
    email: 'anjali@lavantanaturals.com',
    role: 'EMPLOYEE',
    department: 'Sales',
    designation: 'Omnichannel Sales Specialist',
    joiningDate: '2023-09-15',
    phone: '+91 98110 54320',
    profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Arjun Mehta',
    email: 'intern@lavantanaturals.com',
    role: 'INTERN',
    department: 'Marketing',
    designation: 'Digital Media & UGC Intern',
    joiningDate: '2024-06-01',
    phone: '+91 96540 12098',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun@lavantanaturals.com',
    role: 'INTERN',
    department: 'Marketing',
    designation: 'Digital Media & UGC Intern',
    joiningDate: '2024-06-01',
    phone: '+91 96540 12098',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Neha Singh',
    email: 'neha@lavantanaturals.com',
    role: 'INTERN',
    department: 'Product & R&D',
    designation: 'Cosmetic Chemistry Research Intern',
    joiningDate: '2024-07-15',
    phone: '+91 98711 33499',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Vikas Rao',
    email: 'vikas@lavantanaturals.com',
    role: 'MANAGER',
    department: 'Marketing',
    designation: 'Head of Growth Marketing',
    joiningDate: '2023-03-01',
    phone: '+91 98334 22100',
    profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Sneha Patel',
    email: 'sneha@lavantanaturals.com',
    role: 'EMPLOYEE',
    department: 'Marketing',
    designation: 'Senior Brand & Packaging Designer',
    joiningDate: '2023-08-20',
    phone: '+91 98765 43210',
    profilePhoto: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Rohan Deshmukh',
    email: 'rohan@lavantanaturals.com',
    role: 'EMPLOYEE',
    department: 'Operations',
    designation: 'Quality Control Specialist',
    joiningDate: '2023-11-05',
    phone: '+91 99201 55677',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Meera Iyer',
    email: 'meera@lavantanaturals.com',
    role: 'EMPLOYEE',
    department: 'Sales',
    designation: 'Client Relations Lead',
    joiningDate: '2024-01-10',
    phone: '+91 97123 45678',
    profilePhoto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
    status: 'ON_LEAVE'
  },
  {
    name: 'Tanvi Shah',
    email: 'tanvi@lavantanaturals.com',
    role: 'INTERN',
    department: 'Operations',
    designation: 'Inventory & Logistics Intern',
    joiningDate: '2024-08-01',
    phone: '+91 96199 88231',
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    name: 'Kabir Sen',
    email: 'kabir@lavantanaturals.com',
    role: 'INTERN',
    department: 'Sales',
    designation: 'Retail Merchandising Intern',
    joiningDate: '2024-08-15',
    phone: '+91 98200 11998',
    profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  }
];

export async function seedDatabase(): Promise<void> {
  try {
    console.log('[Seed] Connecting to MongoDB:', config.mongodbUri);
    await mongoose.connect(config.mongodbUri);

    console.log('[Seed] Generating hashed password for demo accounts...');
    const passwordHash = await hashPassword(DEMO_PASSWORD);

    for (const u of seedUsers) {
      await UserModel.findOneAndUpdate(
        { email: u.email },
        {
          $set: {
            name: u.name,
            email: u.email,
            passwordHash,
            role: u.role,
            department: u.department,
            designation: u.designation,
            joiningDate: u.joiningDate,
            phone: u.phone,
            profilePhoto: u.profilePhoto,
            status: u.status
          }
        },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`[Seed] Upserted user: ${u.name} (${u.role}) - ${u.email}`);
    }

    console.log('[Seed] Database successfully populated with 6 demo users.');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
}

// Run directly if called from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
