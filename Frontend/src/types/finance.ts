export interface FinanceSummary {
  totalRevenue: number;
  monthRevenue: number;
  pendingRevenue: number;
  totalExpenses: number;
  monthExpenses: number;
  cashOutflow: number;
  pendingExpenses: number;
  netOperatingDifference: number;
  monthNetDifference: number;
  operatingMarginPercent: number;
}

export interface FinanceTrendPoint {
  date: string;
  revenue: number;
  expense: number;
  net: number;
}

export interface ExpenseBreakdownCategory {
  category: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface ExpenseBreakdownResponse {
  grandTotal: number;
  categories: ExpenseBreakdownCategory[];
}

export interface ChannelProfitabilityItem {
  channel: string;
  displayName: string;
  revenue: number;
  orderCount: number;
  channelFees: number;
  allocatedExpenses: number;
  netContribution: number;
  contributionMarginPercent: number;
}

export interface ChannelProfitabilityResponse {
  totalRevenue: number;
  totalAllocatedCost: number;
  totalContribution: number;
  generalOverhead: number;
  netBusinessResult: number;
  channels: ChannelProfitabilityItem[];
}
