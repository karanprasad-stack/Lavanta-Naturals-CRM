export type UserRole = 'FOUNDER' | 'HR' | 'MANAGER' | 'EMPLOYEE' | 'INTERN' | 'founder' | 'hr' | 'manager' | 'employee' | 'intern';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'active' | 'away' | 'offline';

export type Department = string;

export interface User {
  id: string;
  _id?: string; // MongoDB ObjectId alias
  name: string;
  email: string;
  profilePhoto?: string;
  avatar?: string;
  role: UserRole;
  designation: string;
  department: string;
  phone?: string;
  joiningDate?: string;
  joinDate?: string;
  status: UserStatus;
  responsibilities?: string[];
  bio?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskUrgency = TaskPriority;
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'delayed' | 'overdue';

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedById?: string;
  assignedByName?: string;
  assignedByAvatar?: string;
  assignedByRole?: UserRole;
  assigneeId: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  assigneeRole?: UserRole;
  department: Department;
  priority: TaskPriority;
  urgency?: TaskPriority;
  status: TaskStatus;
  deadline: string;
  isOverdue?: boolean;
  progress: number;
  trackedSeconds: number;
  isTimerRunning: boolean;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  proofOfWork?: string;
  createdAt: string;
}

export type ProductStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  mrp: number;
  cost: number;
  sellingPrice: number;
  stock: number;
  threshold: number;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  ingredients: string[];
  supplier: string;
  status: ProductStatus;
  image: string;
  description: string;
}

export type InventoryCategory = 'Raw Materials' | 'Packaging' | 'Finished Products' | 'Marketing Materials';
export type InventoryStatus = 'Healthy' | 'Low Stock' | 'Out of Stock';

export interface InventoryItem {
  id: string;
  itemName: string;
  sku: string;
  category: InventoryCategory;
  currentStock: number;
  unit: string;
  threshold: number;
  supplier: string;
  status: InventoryStatus;
  lastUpdated: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export type SalesSource = 'Instagram' | 'Website' | 'WhatsApp' | 'Salon' | 'Offline' | 'Marketplace';
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';
export type ShippingStatus = 'Delivered' | 'In Transit' | 'Processing' | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  source: SalesSource;
  orderDate: string;
  shippingAddress: string;
}

export type ExpenseCategory = 'Formulation' | 'Packaging' | 'Marketing & Ads' | 'Logistics' | 'Office & Admin' | 'Equipment';
export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  submittedById: string;
  submittedByName: string;
  submittedByAvatar?: string;
  date: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  notes?: string;
}

export interface MeetingDecision {
  id: string;
  text: string;
  convertedToTaskId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  locationOrUrl: string;
  participants: string[];
  agenda: string[];
  notes: string;
  decisions: MeetingDecision[];
  status: 'scheduled' | 'in-progress' | 'completed';
}

export type NoticeType = 'important' | 'normal' | 'urgent';

export interface Notice {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  type: NoticeType;
  priority?: 'normal' | 'important' | 'urgent';
  targetDepartment: string;
  targetAudience?: string;
  targetUsers?: string[];
  expiryDate: string;
  attachments?: string[];
  readBy: string[];
  totalTargetCount: number;
  createdAt: string;
  authorName: string;
  authorRole?: UserRole;
  authorAvatar?: string;
}

export type Announcement = Notice;

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  channelId?: string;
  recipientId?: string;
  read: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isDirect: boolean;
  memberIds: string[];
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderName: string;
  };
}

export type IdeaCategory = 'Product' | 'Marketing' | 'Sales' | 'Operations' | 'Website' | 'Other';
export type IdeaStatus = 'New' | 'Under Review' | 'Approved' | 'Rejected' | 'Implemented';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  submittedById: string;
  submittedByName: string;
  submittedByAvatar?: string;
  status: IdeaStatus;
  votes: number;
  convertedToTaskId?: string;
  createdAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
}

export type GoalCategory = 'Company' | 'Department' | 'Team';
export type GoalStatus = 'on-track' | 'at-risk' | 'behind' | 'achieved';

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  department: Department;
  deadline: string;
  progress: number;
  status: GoalStatus;
  keyResults: KeyResult[];
}

export type DocCategory = 'Company' | 'SOP' | 'Product' | 'Brand Guidelines' | 'Marketing' | 'Contracts' | 'Product Photos' | 'PDFs';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocCategory;
  fileType: string;
  fileSize: string;
  updatedDate: string;
  uploadedByName: string;
  fileUrl: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'meeting' | 'stock' | 'expense' | 'notice' | 'announcement' | 'chat' | 'overdue' | 'idea';
  timestamp: string;
  read: boolean;
  link?: string;
  targetRole?: UserRole;
  targetUserId?: string;
}

export * from './customer';
export * from './sales';
export * from './expenses';
export * from './finance';
export * from './founder';
export * from './audit';
export * from './search';
