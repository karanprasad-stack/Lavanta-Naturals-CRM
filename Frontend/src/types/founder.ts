export interface FounderOverviewResponse {
  timestamp: string;
  companyOverview: {
    teamMembers: number;
    activeTasks: number;
    overdueTasks: number;
    activeGoals: number;
    totalOrders?: number;
    pendingOrders: number;
    pendingExpenses: number;
  };
  workOverview: {
    activeTasks: number;
    pendingTasks: number;
    completedToday: number;
    overdue: number;
    statusDistribution: {
      TODO: number;
      IN_PROGRESS: number;
      COMPLETED: number;
      OVERDUE: number;
    };
  };
  teamOverview: {
    totalMembers: number;
    employees: number;
    interns: number;
    managers: number;
    hr: number;
    recentJoiners: Array<{
      _id: string;
      name: string;
      role: string;
      department: string;
      designation: string;
      profilePhoto?: string;
      joiningDate: string;
    }>;
  };
  activeWork: Array<{
    id: string;
    title: string;
    priority: string;
    assignedTo?: {
      _id: string;
      name: string;
      profilePhoto?: string;
      department?: string;
      role?: string;
    };
    startedAt: string;
    dueDate?: string;
  }>;
  goalsOverview: {
    active: number;
    completed: number;
    atRisk: number;
    averageProgress: number;
    topActiveGoals: Array<{
      id: string;
      title: string;
      category: string;
      progress: number;
      status: string;
      targetDate?: string;
    }>;
  };
  salesOverview: {
    todayRevenue: number;
    monthRevenue: number;
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    salesTrend: Array<{
      date: string;
      revenue: number;
    }>;
    salesByChannel: Array<{
      channel: string;
      displayName: string;
      orders: number;
      revenue: number;
      sharePercent: number;
    }>;
  };
  expenseOverview: {
    pendingApproval: number;
    approvedThisMonth: number;
    paidThisMonth: number;
    totalThisMonth: number;
    pendingApprovalsList: Array<{
      id: string;
      title: string;
      amount: number;
      category: string;
      department: string;
      submittedBy: {
        _id: string;
        name: string;
        profilePhoto?: string;
        department?: string;
      };
      date: string;
    }>;
  };
  financialSummary: {
    recognizedRevenue: number;
    recognizedExpenses: number;
    netOperatingDifference: number;
    isOperationalSummary: boolean;
  };
  salesByChannel?: Array<{
    channel: string;
    displayName: string;
    orders: number;
    revenue: number;
    sharePercent: number;
  }>;
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    externalOrderId?: string | null;
    salesChannel: string;
    customerName: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  recentExpenses?: Array<{
    id: string;
    title: string;
    amount: number;
    category: string;
    salesChannel: string;
    status: string;
    submittedByName: string;
    createdAt: string;
  }>;
  announcements: Array<{
    _id: string;
    title: string;
    type: string;
    priority: string;
    targetAudience?: string;
    createdAt: string;
    authorId?: {
      name: string;
    };
    createdBy?: {
      name: string;
    };
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title?: string;
    description?: string;
    time?: string;
    message?: string;
    entityType?: string;
    timestamp?: string;
    link?: string;
    user: {
      name: string;
      profilePhoto?: string;
      role?: string;
    };
  }>;
}
