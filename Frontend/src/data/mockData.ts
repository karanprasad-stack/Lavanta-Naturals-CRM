import {
  User,
  Task,
  Product,
  InventoryItem,
  Order,
  Expense,
  Meeting,
  Notice,
  Idea,
  Goal,
  DocumentItem,
  NotificationItem,
  ChatChannel,
  ChatMessage
} from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-karan',
    name: 'Karan Prasad',
    email: 'karan@lavantanaturals.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'founder',
    designation: 'Founder & CEO',
    department: 'Executive',
    phone: '+91 98201 44521',
    joinDate: '2023-01-15',
    status: 'active',
    responsibilities: ['Brand Vision & Strategy', 'Executive Capital Allocation', 'Formulation Approvals', 'Strategic Partnerships'],
    bio: 'Pioneering clean, botanical Indian skincare rituals formulated with sustainable cold-pressed botanicals and clinically proven actives.'
  },
  {
    id: 'user-priya',
    name: 'Priya Sharma',
    email: 'priya@lavantanaturals.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'employee',
    designation: 'Lead Brand & Growth Marketer',
    department: 'Marketing',
    phone: '+91 97112 88401',
    joinDate: '2023-06-01',
    status: 'active',
    responsibilities: ['Social Media & D2C Growth', 'Influencer Partnerships', 'Campaign Creative Direction', 'Email Newsletters'],
    bio: 'Storyteller blending botanical skincare heritage with high-converting digital storytelling.'
  },
  {
    id: 'user-rahul',
    name: 'Rahul Kumar',
    email: 'rahul@lavantanaturals.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'manager',
    designation: 'Head of Operations & Supply Chain',
    department: 'Operations',
    phone: '+91 99304 11290',
    joinDate: '2023-04-10',
    status: 'active',
    responsibilities: ['Supplier Procurement', 'Packaging Quality Control', 'Batch Manufacturing Logistics', 'Warehouse Fulfillment'],
    bio: 'Operations veteran ensuring ethical cold-chain raw material sourcing and GMP certified batch runs.'
  },
  {
    id: 'user-anjali',
    name: 'Anjali Verma',
    email: 'anjali@lavantanaturals.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'employee',
    designation: 'Omnichannel Sales Specialist',
    department: 'Sales',
    phone: '+91 98110 54320',
    joinDate: '2023-09-15',
    status: 'active',
    responsibilities: ['Luxury Salon & Spa Accounts', 'WhatsApp VIP Sales', 'Offline Boutique Retail Partnerships', 'Corporate Gifting'],
    bio: 'Specialist in luxury B2B beauty distribution and personalised VIP client rituals.'
  },
  {
    id: 'user-neha',
    name: 'Neha Singh',
    email: 'neha@lavantanaturals.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'manager',
    designation: 'Lead Cosmetic Formulator & R&D',
    department: 'Product',
    phone: '+91 98711 33499',
    joinDate: '2023-03-20',
    status: 'active',
    responsibilities: ['Clean Chemistry Formulation', 'Stability Testing & Micro-Testing', 'Efficacy Trials', 'Ayurvedic Botanical Synergy'],
    bio: 'Chemist dedicated to green beauty formulations free of synthetic fragrances and microplastics.'
  },
  {
    id: 'user-arjun',
    name: 'Arjun Mehta',
    email: 'arjun@lavantanaturals.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'intern',
    designation: 'Digital Marketing & Community Intern',
    department: 'Marketing',
    phone: '+91 96540 12098',
    joinDate: '2024-06-01',
    status: 'active',
    responsibilities: ['Reels Production & Editing', 'Customer Review Moderation', 'Sample Kit Dispatch Logistics'],
    bio: 'Passionate about sustainable lifestyle trends, UGC creation and modern skincare culture.'
  },
  {
    id: 'user-kavita',
    name: 'Kavita Patel',
    email: 'kavita@lavantanaturals.com',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    role: 'employee',
    designation: 'Finance & Compliance Associate',
    department: 'Accounts',
    phone: '+91 99201 88712',
    joinDate: '2023-08-01',
    status: 'away',
    responsibilities: ['Vendor Invoicing', 'GST Compliance', 'Expense Reimbursement Auditing', 'COGS Tracking'],
    bio: 'Ensuring fiscal discipline and high-efficiency margin tracking for premium D2C beauty.'
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-face-serum',
    name: 'Lavanta Restorative Face Serum',
    sku: 'LV-SRM-001',
    category: 'Serums & Elixirs',
    mrp: 1850,
    cost: 420,
    sellingPrice: 1650,
    stock: 142,
    threshold: 30,
    batchNumber: 'BATCH-2026-08',
    mfgDate: '2026-08-10',
    expDate: '2028-08-09',
    ingredients: ['Bakuchiol 2%', 'Botanical Peptides', 'Cold-Pressed Rosehip Seed Oil', 'Centella Asiatica (Gotu Kola)', 'Squalane'],
    supplier: 'Himalayan Flora Botanicals',
    status: 'in-stock',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
    description: 'An elixir formulated with plant-derived bakuchiol to refine fine lines, improve dermal elasticity, and impart a glass-skin glow without irritation.'
  },
  {
    id: 'prod-vit-c',
    name: 'Lavanta Vitamin C Glow Serum',
    sku: 'LV-VTC-002',
    category: 'Serums & Elixirs',
    mrp: 1950,
    cost: 460,
    sellingPrice: 1750,
    stock: 18,
    threshold: 25,
    batchNumber: 'BATCH-2026-07',
    mfgDate: '2026-07-22',
    expDate: '2028-07-21',
    ingredients: ['15% Kakadu Plum Vitamin C', 'Hyaluronic Acid Multi-Molecular', 'Ferulic Acid', 'Organic Orange Blossom Hydrosol'],
    supplier: 'Western Ghats Extracts Ltd',
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1608248597359-25f0a8ea74f7?w=500&auto=format&fit=crop&q=80',
    description: 'Potent antioxidant brightening booster targeting stubborn pigmentation, sun spots, and environmental pollution stress.'
  },
  {
    id: 'prod-moisturizer',
    name: 'Lavanta Ceramide Barrier Crème',
    sku: 'LV-CRM-003',
    category: 'Moisturizers & Balms',
    mrp: 1450,
    cost: 380,
    sellingPrice: 1290,
    stock: 84,
    threshold: 20,
    batchNumber: 'BATCH-2026-08B',
    mfgDate: '2026-08-18',
    expDate: '2028-08-17',
    ingredients: ['Ceramide Complex (NP, AP, EOP)', 'Phytosphingosine', 'Oat Beta Glucan', 'Nilotica Shea Butter', 'Lavender Flower Water'],
    supplier: 'Sikkim Organic Cooperatives',
    status: 'in-stock',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
    description: 'Velvety restorative moisturizer that mimics natural skin lipid barrier, locking in hydration for 48 hours.'
  },
  {
    id: 'prod-face-wash',
    name: 'Lavanta Gentle Purifying Face Wash',
    sku: 'LV-CLF-004',
    category: 'Cleansers & Toners',
    mrp: 850,
    cost: 210,
    sellingPrice: 750,
    stock: 6,
    threshold: 20,
    batchNumber: 'BATCH-2026-06',
    mfgDate: '2026-06-12',
    expDate: '2028-06-11',
    ingredients: ['Green Tea Extract', 'Gotu Kola', 'Soapberry Ferment', 'Aloe Barbadensis Leaf Juice', 'Vegetable Glycerin'],
    supplier: 'Nilgiri Plantations',
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1556228722-d0b5ed7f9b08?w=500&auto=format&fit=crop&q=80',
    description: 'Sulfate-free pH 5.5 micro-cleanser that gently dissolves sebum and urban impurities without stripping moisture.'
  },
  {
    id: 'prod-rose-mist',
    name: 'Lavanta Damascena Rose Mist',
    sku: 'LV-MST-005',
    category: 'Cleansers & Toners',
    mrp: 950,
    cost: 240,
    sellingPrice: 850,
    stock: 160,
    threshold: 30,
    batchNumber: 'BATCH-2026-08C',
    mfgDate: '2026-08-25',
    expDate: '2028-08-24',
    ingredients: ['100% Steam-Distilled Rosa Damascena Hydrosol', 'Niacinamide 3%', 'Propanediol'],
    supplier: 'Kannauj Heritage Distillers',
    status: 'in-stock',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=500&auto=format&fit=crop&q=80',
    description: 'Pure Kannauj rose hydrosol hydro-infusion designed to balance pores, soothe redness, and set mineral makeup.'
  }
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Instagram Festive Launch Campaign',
    description: 'Finalize creative assets, reels schedule, and influencer seed packages for our Diwali Glow Gift Box.',
    assignedById: 'user-karan',
    assignedByName: 'Karan Prasad',
    assignedByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'founder',
    assigneeId: 'user-priya',
    assigneeName: 'Priya Sharma',
    assigneeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'employee',
    department: 'Marketing',
    priority: 'urgent',
    urgency: 'urgent',
    status: 'in-progress',
    deadline: '2026-09-24',
    progress: 65,
    trackedSeconds: 14200,
    isTimerRunning: false,
    comments: [
      {
        id: 'c-1',
        authorId: 'user-karan',
        authorName: 'Karan Prasad',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'Ensure the unboxing reels emphasize our 100% compostable outer casing.',
        timestamp: '2 hours ago'
      },
      {
        id: 'c-2',
        authorId: 'user-priya',
        authorName: 'Priya Sharma',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        text: 'Noted! Sample creator kits dispatched today to 12 aesthetic skincare influencers.',
        timestamp: '1 hour ago'
      }
    ],
    attachments: [
      { id: 'att-1', name: 'Festive_Campaign_Moodboard.pdf', size: '4.2 MB', type: 'pdf', url: '#' },
      { id: 'att-2', name: 'Reels_Script_Draft_v2.docx', size: '640 KB', type: 'docx', url: '#' }
    ],
    proofOfWork: 'Storyboards confirmed and 8 out of 12 reels delivered in 4K ProRes.',
    createdAt: '2026-09-15'
  },
  {
    id: 'task-8',
    title: 'Q3 Influencer ROI & Creator Deliverable Audit',
    description: 'Compile engagement metrics, affiliate promo code sales, and sample kit conversion rates from August campaigns.',
    assignedById: 'user-karan',
    assignedByName: 'Karan Prasad',
    assignedByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'founder',
    assigneeId: 'user-priya',
    assigneeName: 'Priya Sharma',
    assigneeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'employee',
    department: 'Marketing',
    priority: 'high',
    urgency: 'high',
    status: 'todo',
    deadline: '2026-09-17',
    progress: 20,
    trackedSeconds: 2400,
    isTimerRunning: false,
    comments: [
      {
        id: 'c-8',
        authorId: 'user-karan',
        authorName: 'Karan Prasad',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'Please prioritize this before the Friday board review!',
        timestamp: 'Yesterday'
      }
    ],
    attachments: [],
    createdAt: '2026-09-10'
  },
  {
    id: 'task-2',
    title: 'Raw Material Supplier Quality Audit',
    description: 'Conduct thorough COA and heavy metal verification on the newly arrived 200L cold-pressed Jojoba oil lot.',
    assignedById: 'user-karan',
    assignedByName: 'Karan Prasad',
    assignedByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'founder',
    assigneeId: 'user-rahul',
    assigneeName: 'Rahul Kumar',
    assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'manager',
    department: 'Operations',
    priority: 'high',
    urgency: 'high',
    status: 'todo',
    deadline: '2026-09-22',
    progress: 20,
    trackedSeconds: 3600,
    isTimerRunning: false,
    comments: [],
    attachments: [
      { id: 'att-3', name: 'COA_Jojoba_Lot_49B.pdf', size: '1.8 MB', type: 'pdf', url: '#' }
    ],
    createdAt: '2026-09-17'
  },
  {
    id: 'task-3',
    title: 'Kakadu Plum Vitamin C Stability Tests',
    description: 'Monitor 45°C accelerated incubator stability tests for oxidation index on batch #LV-VTC-002.',
    assignedById: 'user-rahul',
    assignedByName: 'Rahul Kumar',
    assignedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'manager',
    assigneeId: 'user-neha',
    assigneeName: 'Neha Singh',
    assigneeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'manager',
    department: 'Product',
    priority: 'urgent',
    urgency: 'urgent',
    status: 'in-progress',
    deadline: '2026-09-20',
    progress: 80,
    trackedSeconds: 28400,
    isTimerRunning: true,
    comments: [
      {
        id: 'c-3',
        authorId: 'user-neha',
        authorName: 'Neha Singh',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        text: 'Day 30 results show zero discoloration and 98.4% active ascorbic retention with ferulic acid synergy.',
        timestamp: '3 hours ago'
      }
    ],
    attachments: [
      { id: 'att-4', name: 'Spectrometry_Report_Sep18.pdf', size: '3.1 MB', type: 'pdf', url: '#' }
    ],
    createdAt: '2026-09-01'
  },
  {
    id: 'task-4',
    title: 'Luxury Salon Partnership Onboarding',
    description: 'Close retail display terms with Blossom & Glow Spa chain (5 outlets across Mumbai and Bengaluru).',
    assignedById: 'user-karan',
    assignedByName: 'Karan Prasad',
    assignedByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'founder',
    assigneeId: 'user-anjali',
    assigneeName: 'Anjali Verma',
    assigneeAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'employee',
    department: 'Sales',
    priority: 'high',
    urgency: 'high',
    status: 'completed',
    deadline: '2026-09-18',
    progress: 100,
    trackedSeconds: 19800,
    isTimerRunning: false,
    comments: [
      {
        id: 'c-4',
        authorId: 'user-anjali',
        authorName: 'Anjali Verma',
        authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        text: 'Signed contract received! First bulk stocking order worth ₹1,20,000 scheduled for delivery next Monday.',
        timestamp: 'Yesterday'
      }
    ],
    attachments: [
      { id: 'att-5', name: 'Signed_B2B_MOU_BlossomGlow.pdf', size: '2.5 MB', type: 'pdf', url: '#' }
    ],
    proofOfWork: 'Counter-signed MOU and advance payment receipt of ₹50,000 deposited.',
    createdAt: '2026-09-10'
  },
  {
    id: 'task-5',
    title: 'Reorder Frosted Glass Dropper Bottles',
    description: 'Place urgent PO for 5,000 custom engraved 30ml amber-frosted bottles with gold caps.',
    assignedById: 'user-karan',
    assignedByName: 'Karan Prasad',
    assignedByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'founder',
    assigneeId: 'user-rahul',
    assigneeName: 'Rahul Kumar',
    assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'manager',
    department: 'Operations',
    priority: 'urgent',
    urgency: 'urgent',
    status: 'todo',
    deadline: '2026-09-16',
    progress: 40,
    trackedSeconds: 7200,
    isTimerRunning: false,
    comments: [
      {
        id: 'c-5',
        authorId: 'user-rahul',
        authorName: 'Rahul Kumar',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        text: 'Glass manufacturer experienced a furnace delay. Expected dispatch by Sept 22.',
        timestamp: '2 days ago'
      }
    ],
    attachments: [],
    createdAt: '2026-09-12'
  },
  {
    id: 'task-6',
    title: 'Reconcile August D2C Payment Gateways',
    description: 'Audit Razorpay and Cashfree transaction settlements against Shiprocket shipping manifests.',
    assignedById: 'user-rahul',
    assignedByName: 'Rahul Kumar',
    assignedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'manager',
    assigneeId: 'user-kavita',
    assigneeName: 'Kavita Patel',
    assigneeAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'employee',
    department: 'Accounts',
    priority: 'medium',
    urgency: 'medium',
    status: 'completed',
    deadline: '2026-09-15',
    progress: 100,
    trackedSeconds: 15400,
    isTimerRunning: false,
    comments: [],
    attachments: [],
    createdAt: '2026-09-08'
  },
  {
    id: 'task-7',
    title: 'UGC Unboxing Video Editing',
    description: 'Edit and colour grade 6 short-form reels showcasing the Restorative Face Serum texture & drop pipette.',
    assignedById: 'user-priya',
    assignedByName: 'Priya Sharma',
    assignedByAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'employee',
    assigneeId: 'user-arjun',
    assigneeName: 'Arjun Mehta',
    assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'intern',
    department: 'Marketing',
    priority: 'medium',
    urgency: 'medium',
    status: 'in-progress',
    deadline: '2026-09-22',
    progress: 45,
    trackedSeconds: 5400,
    isTimerRunning: false,
    comments: [
      {
        id: 'c-7',
        authorId: 'user-priya',
        authorName: 'Priya Sharma',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        text: 'The first 2 cuts look great Arjun! Remember to overlay the botanical ingredient icons.',
        timestamp: '4 hours ago'
      }
    ],
    attachments: [],
    createdAt: '2026-09-18'
  },
  {
    id: 'task-9',
    title: 'Customer Review Moderation & UGC Archive',
    description: 'Tag incoming Instagram stories and organize 45 customer before/after video reviews in brand asset folder.',
    assignedById: 'user-rahul',
    assignedByName: 'Rahul Kumar',
    assignedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedByRole: 'manager',
    assigneeId: 'user-arjun',
    assigneeName: 'Arjun Mehta',
    assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    assigneeRole: 'intern',
    department: 'Marketing',
    priority: 'low',
    urgency: 'low',
    status: 'todo',
    deadline: '2026-09-25',
    progress: 0,
    trackedSeconds: 0,
    isTimerRunning: false,
    comments: [],
    attachments: [],
    createdAt: '2026-09-19'
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    itemName: 'Organic Cold-Pressed Jojoba Oil',
    sku: 'RAW-JOJ-01',
    category: 'Raw Materials',
    currentStock: 180,
    unit: 'Liters',
    threshold: 50,
    supplier: 'Rajasthan Desert Bio-Oils',
    status: 'Healthy',
    lastUpdated: '2026-09-18'
  },
  {
    id: 'inv-2',
    itemName: 'Kakadu Plum Extract Powder (25% Vit C)',
    sku: 'RAW-KAK-02',
    category: 'Raw Materials',
    currentStock: 4,
    unit: 'Kg',
    threshold: 10,
    supplier: 'Western Ghats Extracts Ltd',
    status: 'Low Stock',
    lastUpdated: '2026-09-17'
  },
  {
    id: 'inv-3',
    itemName: '30ml Frosted Amber Dropper Bottles',
    sku: 'PKG-BTL-30',
    category: 'Packaging',
    currentStock: 250,
    unit: 'Units',
    threshold: 1000,
    supplier: 'Apex Luxury Glassworks',
    status: 'Low Stock',
    lastUpdated: '2026-09-19'
  },
  {
    id: 'inv-4',
    itemName: '50ml Double-Walled Acrylic Cream Jars',
    sku: 'PKG-JAR-50',
    category: 'Packaging',
    currentStock: 2400,
    unit: 'Units',
    threshold: 500,
    supplier: 'Apex Luxury Glassworks',
    status: 'Healthy',
    lastUpdated: '2026-09-14'
  },
  {
    id: 'inv-5',
    itemName: 'Lavanta Restorative Face Serum (Packaged)',
    sku: 'FIN-SRM-01',
    category: 'Finished Products',
    currentStock: 142,
    unit: 'Units',
    threshold: 30,
    supplier: 'In-House Formulation Lab',
    status: 'Healthy',
    lastUpdated: '2026-09-19'
  },
  {
    id: 'inv-6',
    itemName: 'Lavanta Vitamin C Glow Serum (Packaged)',
    sku: 'FIN-VTC-02',
    category: 'Finished Products',
    currentStock: 18,
    unit: 'Units',
    threshold: 25,
    supplier: 'In-House Formulation Lab',
    status: 'Low Stock',
    lastUpdated: '2026-09-18'
  },
  {
    id: 'inv-7',
    itemName: 'Eco-Luxe Seed Paper Brand Cards & Boxes',
    sku: 'MKT-BOX-01',
    category: 'Marketing Materials',
    currentStock: 3500,
    unit: 'Units',
    threshold: 500,
    supplier: 'GreenCraft Sustainable Print',
    status: 'Healthy',
    lastUpdated: '2026-09-11'
  },
  {
    id: 'inv-8',
    itemName: 'Gold Stamped Velvet Travel Pouches',
    sku: 'MKT-PCH-02',
    category: 'Marketing Materials',
    currentStock: 0,
    unit: 'Units',
    threshold: 200,
    supplier: 'Artisan Textiles Jaipur',
    status: 'Out of Stock',
    lastUpdated: '2026-09-12'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'LV-2026-9812',
    customerName: 'Meera Deshmukh',
    customerEmail: 'meera.d@gmail.com',
    customerPhone: '+91 98201 11223',
    items: [
      { productId: 'prod-face-serum', productName: 'Lavanta Restorative Face Serum', quantity: 2, price: 1650 },
      { productId: 'prod-rose-mist', productName: 'Lavanta Damascena Rose Mist', quantity: 1, price: 850 }
    ],
    totalAmount: 4150,
    paymentStatus: 'Paid',
    shippingStatus: 'In Transit',
    source: 'Website',
    orderDate: '2026-09-19 14:22',
    shippingAddress: '402, Sea Breeze Apts, Bandra West, Mumbai 400050'
  },
  {
    id: 'ord-102',
    orderNumber: 'LV-2026-9811',
    customerName: 'Rohit Singhania',
    customerEmail: 'rohit.s@outlook.com',
    customerPhone: '+91 99342 55431',
    items: [
      { productId: 'prod-vit-c', productName: 'Lavanta Vitamin C Glow Serum', quantity: 1, price: 1750 },
      { productId: 'prod-moisturizer', productName: 'Lavanta Ceramide Barrier Crème', quantity: 1, price: 1290 }
    ],
    totalAmount: 3040,
    paymentStatus: 'Paid',
    shippingStatus: 'Processing',
    source: 'Instagram',
    orderDate: '2026-09-19 11:05',
    shippingAddress: 'Villa 14, Prestige Ozone, Whitefield, Bengaluru 560066'
  },
  {
    id: 'ord-103',
    orderNumber: 'LV-2026-9810',
    customerName: 'Sanctuary Spa & Wellness',
    customerEmail: 'orders@sanctuaryspa.in',
    customerPhone: '+91 98450 78654',
    items: [
      { productId: 'prod-face-serum', productName: 'Lavanta Restorative Face Serum', quantity: 15, price: 1350 },
      { productId: 'prod-moisturizer', productName: 'Lavanta Ceramide Barrier Crème', quantity: 10, price: 1100 }
    ],
    totalAmount: 31250,
    paymentStatus: 'Paid',
    shippingStatus: 'Delivered',
    source: 'Salon',
    orderDate: '2026-09-18 16:30',
    shippingAddress: 'Plot 78, Indiranagar 100ft Road, Bengaluru 560038'
  },
  {
    id: 'ord-104',
    orderNumber: 'LV-2026-9809',
    customerName: 'Tanya Kapoor',
    customerEmail: 'tanya.k@yahoo.com',
    customerPhone: '+91 97110 44321',
    items: [
      { productId: 'prod-face-wash', productName: 'Lavanta Gentle Purifying Face Wash', quantity: 2, price: 750 }
    ],
    totalAmount: 1500,
    paymentStatus: 'Paid',
    shippingStatus: 'Delivered',
    source: 'WhatsApp',
    orderDate: '2026-09-18 10:15',
    shippingAddress: 'B-12, Greater Kailash 1, New Delhi 110048'
  },
  {
    id: 'ord-105',
    orderNumber: 'LV-2026-9808',
    customerName: 'Aditi Nair',
    customerEmail: 'aditi.nair@gmail.com',
    customerPhone: '+91 94471 23456',
    items: [
      { productId: 'prod-face-serum', productName: 'Lavanta Restorative Face Serum', quantity: 1, price: 1650 }
    ],
    totalAmount: 1650,
    paymentStatus: 'Pending',
    shippingStatus: 'Processing',
    source: 'Marketplace',
    orderDate: '2026-09-17 19:40',
    shippingAddress: 'Panampilly Nagar, Kochi, Kerala 682036'
  }
];

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    title: 'ISO 22716 GMP Cosmetic Stability Lab Testing',
    amount: 12450,
    category: 'Formulation',
    submittedById: 'user-neha',
    submittedByName: 'Neha Singh',
    submittedByAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    date: '2026-09-19',
    receiptUrl: '#',
    status: 'Pending',
    notes: 'Payment to Analytical Toxicology & Microbial Testing Labs for Q3 batch release certificate.'
  },
  {
    id: 'exp-2',
    title: 'Meta Festive Ads Spend (Sept 10 - Sept 18)',
    amount: 38200,
    category: 'Marketing & Ads',
    submittedById: 'user-priya',
    submittedByName: 'Priya Sharma',
    submittedByAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    date: '2026-09-18',
    receiptUrl: '#',
    status: 'Approved',
    notes: 'Generated ₹1,42,000 in D2C revenue at 3.7x ROAS targeting urban beauty seekers.'
  },
  {
    id: 'exp-3',
    title: 'Batch Freight Logistics & Cold Sourcing Transit',
    amount: 8750,
    category: 'Logistics',
    submittedById: 'user-rahul',
    submittedByName: 'Rahul Kumar',
    submittedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    date: '2026-09-16',
    receiptUrl: '#',
    status: 'Approved',
    notes: 'Refrigerated van transit for Nilgiri plant hydrosols to our Mumbai central warehouse.'
  },
  {
    id: 'exp-4',
    title: 'Seed Paper Custom Display Boxes Sample Run',
    amount: 4500,
    category: 'Packaging',
    submittedById: 'user-priya',
    submittedByName: 'Priya Sharma',
    submittedByAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    date: '2026-09-14',
    receiptUrl: '#',
    status: 'Pending',
    notes: 'Pilot production sample run of plantable wild marigold seed paper boxes.'
  }
];

export const mockMeetings: Meeting[] = [
  {
    id: 'meet-1',
    title: 'Morning Executive Pulse & KPI Sync',
    date: '2026-09-19',
    time: '10:00 AM',
    duration: '30 mins',
    locationOrUrl: 'Lavanta Boardroom (Studio A)',
    participants: ['Karan Prasad', 'Rahul Kumar', 'Priya Sharma'],
    agenda: [
      'Review low stock alerts on Vitamin C dropper bottles',
      'Diwali influencer PR parcel distribution update',
      'Review pending expense approvals'
    ],
    notes: 'Agreed to prioritize Apex Glassworks PO release immediately and expedite salon dispatch.',
    decisions: [
      { id: 'dec-1', text: 'Approve Apex Glassworks advance PO for 5,000 dropper bottles today.' },
      { id: 'dec-2', text: 'Launch Diwali early-bird VIP sale for WhatsApp community on Sept 25.' }
    ],
    status: 'completed'
  },
  {
    id: 'meet-2',
    title: 'Organic Botanical Supplier Call',
    date: '2026-09-19',
    time: '12:00 PM',
    duration: '45 mins',
    locationOrUrl: 'Google Meet (meet.google.com/lv-supp-bot)',
    participants: ['Rahul Kumar', 'Neha Singh', 'Himalayan Flora Botanicals'],
    agenda: [
      'Winter crop harvest schedule for wild Lavender and Rosehip seed',
      'Purity certifications and cold-press extraction parameters'
    ],
    notes: 'Supplier confirmed harvest availability of 500kg certified wild lavender tops for October extraction.',
    decisions: [
      { id: 'dec-3', text: 'Lock in 500kg harvest reservation contract before Sept 30.' }
    ],
    status: 'completed'
  },
  {
    id: 'meet-3',
    title: 'Festive Growth & Campaign Creative Review',
    date: '2026-09-19',
    time: '03:00 PM',
    duration: '60 mins',
    locationOrUrl: 'Lavanta Creative Lounge',
    participants: ['Karan Prasad', 'Priya Sharma', 'Arjun Mehta'],
    agenda: [
      'Review short-form video hooks for Bakuchiol Serum',
      'Meta Ad creative variations test matrix',
      'UGC creator seeding deadlines'
    ],
    notes: 'Priya presented 4 video hooks. Hook 3 ("Why dermatologists are calling Bakuchiol the gentle retinol") showed 4.2x view-through.',
    decisions: [
      { id: 'dec-4', text: 'Allocate ₹25,000 ad test budget specifically to Bakuchiol Hook 3.' }
    ],
    status: 'in-progress'
  },
  {
    id: 'meet-4',
    title: 'End of Day Operations & Fulfillment Wrap-up',
    date: '2026-09-19',
    time: '06:00 PM',
    duration: '20 mins',
    locationOrUrl: 'Warehouse Control Desk',
    participants: ['Rahul Kumar', 'Anjali Verma'],
    agenda: [
      'Daily dispatch manifest verification',
      'Salon consignment stock reconciliation'
    ],
    notes: '',
    decisions: [],
    status: 'scheduled'
  }
];

export const mockNotices: Notice[] = [
  {
    id: 'not-1',
    title: '🌿 Diwali 2026 Festive Dispatch Protocol & Cutoff Dates',
    description: 'All teams please note: Due to national courier holidays, express orders booked before October 24 will be guaranteed pre-festive delivery. Packaging shifts will run an additional evening batch from October 15.',
    posterUrl: 'https://images.unsplash.com/photo-1608248597359-56cb2f205307?w=1200&auto=format&fit=crop&q=80',
    type: 'urgent',
    priority: 'urgent',
    targetDepartment: 'All Departments',
    targetAudience: 'Company-Wide',
    expiryDate: '2026-10-31',
    attachments: ['Diwali_Shipping_SOP_2026.pdf'],
    readBy: ['user-karan', 'user-priya', 'user-rahul', 'user-anjali', 'user-neha', 'user-arjun', 'user-kavita'],
    totalTargetCount: 7,
    createdAt: '2026-09-18',
    authorName: 'Karan Prasad',
    authorRole: 'founder',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'not-2',
    title: 'Quality Protocol: Batch #LV-2026-08 Sterilization Update',
    description: 'Standard Operating Procedure revision for Cleanroom Suite 2: All equipment contact surfaces must undergo 45-minute dry-heat sterilization prior to filling the Ceramide Barrier Crème.',
    posterUrl: 'https://images.unsplash.com/photo-1556228722-d0b5ed7f9b08?w=1200&auto=format&fit=crop&q=80',
    type: 'important',
    priority: 'important',
    targetDepartment: 'Product & Operations',
    targetAudience: 'Operations & R&D',
    expiryDate: '2026-11-15',
    attachments: ['SOP_Cleanroom_Sterilization_v4.pdf'],
    readBy: ['user-karan', 'user-rahul', 'user-neha'],
    totalTargetCount: 4,
    createdAt: '2026-09-16',
    authorName: 'Rahul Kumar',
    authorRole: 'manager',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'not-3',
    title: 'New Eco-Packaging Partnership with GreenCraft',
    description: 'We have officially onboarded GreenCraft as our primary supplier for seed-infused plantable carton boxes. Every unboxing can now grow wild chamomile!',
    posterUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80',
    type: 'normal',
    priority: 'normal',
    targetDepartment: 'All Departments',
    targetAudience: 'All Teams',
    expiryDate: '2026-12-31',
    readBy: ['user-karan', 'user-priya', 'user-arjun'],
    totalTargetCount: 7,
    createdAt: '2026-09-12',
    authorName: 'Priya Sharma',
    authorRole: 'employee',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'not-4',
    title: 'Q3 Team Strategy & Wellness Gathering',
    description: 'Join us next Friday at 4:30 PM at the Lavanta Garden Lounge for our quarterly tea tasting ritual, product roadmaps, and celebrating our festive campaign milestones.',
    posterUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    type: 'normal',
    priority: 'normal',
    targetDepartment: 'All Departments',
    targetAudience: 'All Staff & Interns',
    expiryDate: '2026-10-05',
    readBy: ['user-karan', 'user-rahul'],
    totalTargetCount: 7,
    createdAt: '2026-09-19',
    authorName: 'Karan Prasad',
    authorRole: 'founder',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

export const mockAnnouncements = mockNotices;

export const mockChatChannels: ChatChannel[] = [
  {
    id: 'ch-all-hands',
    name: 'all-hands',
    description: 'Company-wide updates, team shoutouts, and workspace discussions',
    isDirect: false,
    memberIds: ['user-karan', 'user-priya', 'user-rahul', 'user-anjali', 'user-neha', 'user-arjun', 'user-kavita'],
    unreadCount: 2,
    lastMessage: {
      content: 'Festival gift boxes packaging approved! Samples arrive tomorrow.',
      timestamp: '15m ago',
      senderName: 'Karan Prasad'
    }
  },
  {
    id: 'ch-announcements',
    name: 'announcements',
    description: 'Official company broadcasts, policy releases & poster reveals',
    isDirect: false,
    memberIds: ['user-karan', 'user-priya', 'user-rahul', 'user-anjali', 'user-neha', 'user-arjun', 'user-kavita'],
    unreadCount: 0,
    lastMessage: {
      content: 'Please review the new shipping cutoff schedule for courier dispatches.',
      timestamp: '2h ago',
      senderName: 'Rahul Kumar'
    }
  },
  {
    id: 'ch-marketing-ops',
    name: 'marketing-ops',
    description: 'Campaign creatives, creator seeding, and UGC content schedule',
    isDirect: false,
    memberIds: ['user-karan', 'user-priya', 'user-arjun'],
    unreadCount: 1,
    lastMessage: {
      content: 'Arjun, could you export the high-res cuts for the Bakuchiol unboxing?',
      timestamp: '45m ago',
      senderName: 'Priya Sharma'
    }
  },
  {
    id: 'ch-operations',
    name: 'operations-fulfillment',
    description: 'Packaging stock, inventory logistics, and batch release checks',
    isDirect: false,
    memberIds: ['user-karan', 'user-rahul', 'user-neha'],
    unreadCount: 0,
    lastMessage: {
      content: 'Apex Glassworks PO released. Furnace batch scheduled for Monday.',
      timestamp: '3h ago',
      senderName: 'Rahul Kumar'
    }
  }
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'ch-all-hands',
    senderId: 'user-karan',
    senderName: 'Karan Prasad',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    senderRole: 'founder',
    content: 'Good morning team! We crossed ₹14L in gross orders for the pre-festive run this week. Huge thanks to everyone for the hustle! 🌿✨',
    timestamp: '09:30 AM',
    read: true
  },
  {
    id: 'msg-2',
    channelId: 'ch-all-hands',
    senderId: 'user-priya',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    senderRole: 'employee',
    content: 'Incredible milestone! The Bakuchiol reels are performing at 4.2x view rate on Instagram right now.',
    timestamp: '09:35 AM',
    read: true
  },
  {
    id: 'msg-3',
    channelId: 'ch-all-hands',
    senderId: 'user-rahul',
    senderName: 'Rahul Kumar',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    senderRole: 'manager',
    content: 'Warehouse dispatch team has pre-packed 350 gift cartons to keep shipping turnaround under 24 hours.',
    timestamp: '09:42 AM',
    read: true
  },
  {
    id: 'msg-4',
    channelId: 'ch-marketing-ops',
    senderId: 'user-priya',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    senderRole: 'employee',
    content: 'Hey Arjun! How are the first cuts coming along for the unboxing UGC?',
    timestamp: '11:15 AM',
    read: true
  },
  {
    id: 'msg-5',
    channelId: 'ch-marketing-ops',
    senderId: 'user-arjun',
    senderName: 'Arjun Mehta',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    senderRole: 'intern',
    content: 'Hey Priya! Done with the first 2 cuts with color grading. Exporting ProRes drafts right now! 🎬',
    timestamp: '11:22 AM',
    read: true
  },
  {
    id: 'msg-6',
    channelId: 'ch-all-hands',
    senderId: 'user-karan',
    senderName: 'Karan Prasad',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    senderRole: 'founder',
    content: 'Festival gift boxes packaging approved! Samples arrive tomorrow.',
    timestamp: '15m ago',
    read: false
  },
  // Direct Messages between Founder (Karan) and Priya
  {
    id: 'msg-dm-1',
    senderId: 'user-karan',
    recipientId: 'user-priya',
    senderName: 'Karan Prasad',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    senderRole: 'founder',
    content: 'Hey Priya, please ensure the Festive Gift Box moodboard highlights the 100% compostable outer casing.',
    timestamp: 'Yesterday 04:30 PM',
    read: true
  },
  {
    id: 'msg-dm-2',
    senderId: 'user-priya',
    recipientId: 'user-karan',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    senderRole: 'employee',
    content: 'On it Karan! Already incorporated the seed-paper tags into the creator unboxing guide.',
    timestamp: 'Yesterday 05:02 PM',
    read: true
  },
  {
    id: 'msg-dm-3',
    senderId: 'user-karan',
    recipientId: 'user-rahul',
    senderName: 'Karan Prasad',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    senderRole: 'founder',
    content: 'Rahul, did the Jojoba COA test results come back clear?',
    timestamp: '10:00 AM',
    read: true
  },
  {
    id: 'msg-dm-4',
    senderId: 'user-rahul',
    recipientId: 'user-karan',
    senderName: 'Rahul Kumar',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    senderRole: 'manager',
    content: 'Yes Karan, zero heavy metals and 99.8% pure cold-press fraction. Batch approved for blending.',
    timestamp: '10:14 AM',
    read: true
  }
];

export const mockIdeas: Idea[] = [
  {
    id: 'idea-1',
    title: 'Refillable Aluminium Pouch Subscription Program',
    description: 'Introduce 100ml lightweight recyclable aluminum spouted pouches so customers can refill their luxury amber glass bottles at 25% savings. Reduces packaging carbon footprint by 62%.',
    category: 'Product',
    submittedById: 'user-priya',
    submittedByName: 'Priya Sharma',
    submittedByAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'Under Review',
    votes: 14,
    createdAt: '2026-09-12'
  },
  {
    id: 'idea-2',
    title: 'Lavender & Blue Tansy Calming Pillow Mist',
    description: 'Night-time aromatherapy botanical mist using our steam-distilled lavender hydrosol and blue tansy oil. Perfect complementary SKU for beauty sleep regimens.',
    category: 'Product',
    submittedById: 'user-neha',
    submittedByName: 'Neha Singh',
    submittedByAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'Approved',
    votes: 19,
    createdAt: '2026-09-08'
  },
  {
    id: 'idea-3',
    title: 'WhatsApp VIP Skincare Concierge Service',
    description: 'Provide 1-on-1 skin consultations on WhatsApp for orders above ₹3,000. Recommend custom routines and automate replenishment reminders after 45 days.',
    category: 'Sales',
    submittedById: 'user-anjali',
    submittedByName: 'Anjali Verma',
    submittedByAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'New',
    votes: 8,
    createdAt: '2026-09-17'
  },
  {
    id: 'idea-4',
    title: 'Interactive Skin Diagnostic Quiz on D2C Website',
    description: 'A 60-second editorial skin assessment asking about skin goals, climate, and barrier stress, generating a personalized 3-step Lavanta ritual.',
    category: 'Website',
    submittedById: 'user-arjun',
    submittedByName: 'Arjun Mehta',
    submittedByAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'Under Review',
    votes: 11,
    createdAt: '2026-09-15'
  }
];

export const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Sell 500 Restorative Face Serum Units in Q3',
    category: 'Company',
    ownerId: 'user-karan',
    ownerName: 'Karan Prasad',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Executive',
    deadline: '2026-09-30',
    progress: 72,
    status: 'on-track',
    keyResults: [
      { id: 'kr-1', title: 'Website D2C Direct Orders', current: 284, target: 350, unit: 'Units', completed: false },
      { id: 'kr-2', title: 'Luxury Salon B2B Placement', current: 75, target: 100, unit: 'Units', completed: false },
      { id: 'kr-3', title: 'Influencer Seeding Reels Produced', current: 22, target: 20, unit: 'Reels', completed: true },
      { id: 'kr-4', title: 'Top-Tier Aesthetician Collaborations', current: 10, target: 10, unit: 'Partnerships', completed: true }
    ]
  },
  {
    id: 'goal-2',
    title: 'Achieve 99.2% On-Time Batch Dispatch Rate',
    category: 'Department',
    ownerId: 'user-rahul',
    ownerName: 'Rahul Kumar',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Operations',
    deadline: '2026-10-15',
    progress: 88,
    status: 'on-track',
    keyResults: [
      { id: 'kr-5', title: 'Warehouse same-day dispatch rate', current: 97, target: 99, unit: '%', completed: false },
      { id: 'kr-6', title: 'Raw material inventory stockout events', current: 1, target: 0, unit: 'Events', completed: false },
      { id: 'kr-7', title: 'Packaging supplier SLA compliance', current: 95, target: 95, unit: '%', completed: true }
    ]
  },
  {
    id: 'goal-3',
    title: 'Complete Ayurvedic Synergy Clinical Safety Dossier',
    category: 'Department',
    ownerId: 'user-neha',
    ownerName: 'Neha Singh',
    ownerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    department: 'Product',
    deadline: '2026-11-01',
    progress: 55,
    status: 'at-risk',
    keyResults: [
      { id: 'kr-8', title: '48-hour Patch Testing on 50 human subjects', current: 50, target: 50, unit: 'Subjects', completed: true },
      { id: 'kr-9', title: 'Heavy metal & pesticide third-party lab screening', current: 4, target: 4, unit: 'Reports', completed: true },
      { id: 'kr-10', title: 'Accelerated 90-day stability completion', current: 45, target: 90, unit: 'Days', completed: false }
    ]
  }
];

export const mockDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Lavanta Naturals Brand Identity & Editorial Guidelines 2026',
    category: 'Brand Guidelines',
    fileType: 'PDF',
    fileSize: '18.4 MB',
    updatedDate: '2026-08-15',
    uploadedByName: 'Priya Sharma',
    fileUrl: '#'
  },
  {
    id: 'doc-2',
    title: 'Cleanroom ISO 22716 Formulation SOP & Disinfection Protocols',
    category: 'SOP',
    fileType: 'PDF',
    fileSize: '3.2 MB',
    updatedDate: '2026-09-02',
    uploadedByName: 'Neha Singh',
    fileUrl: '#'
  },
  {
    id: 'doc-3',
    title: 'Master Botanical Ingredient Specification & Extraction Registry',
    category: 'Product',
    fileType: 'XLSX',
    fileSize: '1.4 MB',
    updatedDate: '2026-09-10',
    uploadedByName: 'Neha Singh',
    fileUrl: '#'
  },
  {
    id: 'doc-4',
    title: 'Luxury Spa Consignment Agreement & Terms of Supply (Template)',
    category: 'Contracts',
    fileType: 'DOCX',
    fileSize: '780 KB',
    updatedDate: '2026-08-28',
    uploadedByName: 'Anjali Verma',
    fileUrl: '#'
  },
  {
    id: 'doc-5',
    title: 'High-Res Studio Bottle Asset Pack (Droppers & Crèmes)',
    category: 'Product Photos',
    fileType: 'ZIP',
    fileSize: '142 MB',
    updatedDate: '2026-09-05',
    uploadedByName: 'Priya Sharma',
    fileUrl: '#'
  },
  {
    id: 'doc-6',
    title: 'Company Constitution, Incorporation & GMP Compliance Certificate',
    category: 'Company',
    fileType: 'PDF',
    fileSize: '5.1 MB',
    updatedDate: '2026-01-20',
    uploadedByName: 'Karan Prasad',
    fileUrl: '#'
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Task Assigned',
    message: 'Karan assigned you to "Instagram Festive Launch Campaign"',
    type: 'task',
    timestamp: '10m ago',
    read: false,
    link: '/tasks/task-1'
  },
  {
    id: 'notif-2',
    title: 'Low Stock Alert',
    message: '30ml Frosted Amber Dropper Bottles dipped below 1,000 units (250 remaining)',
    type: 'stock',
    timestamp: '45m ago',
    read: false,
    link: '/inventory'
  },
  {
    id: 'notif-3',
    title: 'Expense Approval Needed',
    message: 'Neha submitted ₹12,450 for ISO 22716 Stability Testing',
    type: 'expense',
    timestamp: '2h ago',
    read: false,
    link: '/expenses'
  },
  {
    id: 'notif-4',
    title: 'New Idea Submitted',
    message: 'Priya proposed "Refillable Aluminium Pouch Subscription Program"',
    type: 'idea',
    timestamp: '5h ago',
    read: true,
    link: '/ideas'
  },
  {
    id: 'notif-5',
    title: 'Meeting in 15 Minutes',
    message: 'Festive Growth & Campaign Creative Review at 03:00 PM',
    type: 'meeting',
    timestamp: '15m ago',
    read: true,
    link: '/calendar'
  }
];
