export type ExpenseCategory =
  | 'MARKETPLACE_FEES'
  | 'PAYMENT_FEES'
  | 'SHIPPING'
  | 'PACKAGING'
  | 'MARKETING'
  | 'ADVERTISING'
  | 'OPERATIONS'
  | 'SALARY'
  | 'RENT'
  | 'UTILITIES'
  | 'SOFTWARE'
  | 'OFFICE'
  | 'TRAVEL'
  | 'SUPPLIES'
  | 'MAINTENANCE'
  | 'INVENTORY'
  | 'OTHER';

export type ExpenseSalesChannel = 'GENERAL' | 'WEBSITE' | 'AMAZON' | 'FLIPKART' | 'OTHER';

export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PAID';

export interface ExpenseReceipt {
  fileName: string;
  fileUrl: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
}

export interface ExpenseActivity {
  _id: string;
  expenseId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  type: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Expense {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  salesChannel?: ExpenseSalesChannel;
  submittedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  submittedAt?: string;
  department: string;
  expenseDate: string;
  status: ExpenseStatus;
  receipt?: ExpenseReceipt;
  paymentMethod?: string;
  paymentReference?: string;
  taxDeductible?: boolean;
  notes?: string;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  approvedAt?: string | null;
  rejectedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  rejectedAt?: string | null;
  rejectionReason?: string;
  paidBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  paidAt?: string | null;
  activities?: ExpenseActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  counts: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    paid: number;
    rejected: number;
  };
  amounts: {
    paid: number;
    approved: number;
    submitted: number;
    committed: number;
  };
}

export interface CreateExpenseInput {
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  salesChannel?: ExpenseSalesChannel;
  expenseDate?: string;
  paymentMethod?: string;
  department?: string;
  taxDeductible?: boolean;
  notes?: string;
  status?: 'DRAFT' | 'SUBMITTED';
  receipt?: File;
}
