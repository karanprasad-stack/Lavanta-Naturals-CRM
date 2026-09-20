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
