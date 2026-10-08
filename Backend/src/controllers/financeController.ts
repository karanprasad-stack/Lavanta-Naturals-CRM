import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OrderModel } from '../models/Order.js';
import { ExpenseModel } from '../models/Expense.js';

const VALID_SALES_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const COMMITTED_EXPENSE_STATUSES = ['APPROVED', 'PAID'];

/**
 * GET /api/finance/summary
 * High-level financial overview comparing revenue and operating expenses
 */
export const getFinanceSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      // Total Recognized Revenue
      totalRevenueAgg,
      monthRevenueAgg,
      pendingRevenueAgg,
      // Total Paid & Approved Expenses
      totalCommittedExpensesAgg,
      monthExpensesAgg,
      totalPaidExpensesAgg,
      pendingExpensesAgg
    ] = await Promise.all([
      // Total revenue from confirmed orders
      OrderModel.aggregate([
        { $match: { orderStatus: { $in: VALID_SALES_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Month revenue
      OrderModel.aggregate([
        { $match: { orderStatus: { $in: VALID_SALES_STATUSES }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Pending revenue (draft/pending orders)
      OrderModel.aggregate([
        { $match: { orderStatus: 'PENDING' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Total committed expenses (approved + paid)
      ExpenseModel.aggregate([
        { $match: { status: { $in: COMMITTED_EXPENSE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Month committed expenses
      ExpenseModel.aggregate([
        { $match: { status: { $in: COMMITTED_EXPENSE_STATUSES }, expenseDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Total cash outflow (paid only)
      ExpenseModel.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Pending review expenses (submitted)
      ExpenseModel.aggregate([
        { $match: { status: 'SUBMITTED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const monthRevenue = monthRevenueAgg[0]?.total || 0;
    const pendingRevenue = pendingRevenueAgg[0]?.total || 0;

    const totalExpenses = totalCommittedExpensesAgg[0]?.total || 0;
    const monthExpenses = monthExpensesAgg[0]?.total || 0;
    const cashOutflow = totalPaidExpensesAgg[0]?.total || 0;
    const pendingExpenses = pendingExpensesAgg[0]?.total || 0;

    const netOperatingDifference = totalRevenue - totalExpenses;
    const monthNetDifference = monthRevenue - monthExpenses;
    const operatingMargin = totalRevenue > 0 ? (netOperatingDifference / totalRevenue) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        monthRevenue: Number(monthRevenue.toFixed(2)),
        pendingRevenue: Number(pendingRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        monthExpenses: Number(monthExpenses.toFixed(2)),
        cashOutflow: Number(cashOutflow.toFixed(2)),
        pendingExpenses: Number(pendingExpenses.toFixed(2)),
        netOperatingDifference: Number(netOperatingDifference.toFixed(2)),
        monthNetDifference: Number(monthNetDifference.toFixed(2)),
        operatingMarginPercent: Number(operatingMargin.toFixed(1))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch financial summary'
    });
  }
};

/**
 * GET /api/finance/trends
 * Daily comparison of recognized revenue vs committed expenses
 */
export const getFinanceTrends = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const range = (req.query.range as string) || '30d';
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const [revenueDaily, expenseDaily] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            orderStatus: { $in: VALID_SALES_STATUSES },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' }
          }
        }
      ]),
      ExpenseModel.aggregate([
        {
          $match: {
            status: { $in: COMMITTED_EXPENSE_STATUSES },
            expenseDate: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } },
            expense: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const dateMap = new Map<string, { date: string; revenue: number; expense: number; net: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, {
        date: key,
        revenue: 0,
        expense: 0,
        net: 0
      });
    }

    for (const item of revenueDaily) {
      if (dateMap.has(item._id)) {
        const curr = dateMap.get(item._id)!;
        curr.revenue = Number(item.revenue.toFixed(2));
        curr.net = Number((curr.revenue - curr.expense).toFixed(2));
      }
    }

    for (const item of expenseDaily) {
      if (dateMap.has(item._id)) {
        const curr = dateMap.get(item._id)!;
        curr.expense = Number(item.expense.toFixed(2));
        curr.net = Number((curr.revenue - curr.expense).toFixed(2));
      }
    }

    const trends = Array.from(dateMap.values());

    res.status(200).json({
      success: true,
      data: {
        range,
        trends
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch financial trends'
    });
  }
};

/**
 * GET /api/finance/expense-breakdown
 * Expense distribution by category
 */
export const getExpenseBreakdown = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const aggregation = await ExpenseModel.aggregate([
      { $match: { status: { $in: COMMITTED_EXPENSE_STATUSES } } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const grandTotal = aggregation.reduce((sum, item) => sum + item.totalAmount, 0);

    const breakdown = aggregation.map((item) => ({
      category: item._id,
      totalAmount: Number(item.totalAmount.toFixed(2)),
      count: item.count,
      percentage: grandTotal > 0 ? Number(((item.totalAmount / grandTotal) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        grandTotal: Number(grandTotal.toFixed(2)),
        categories: breakdown
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch expense breakdown'
    });
  }
};

/**
 * GET /api/finance/channel-profitability
 * High-level channel financial contribution: Revenue vs Channel Fees vs Allocated Expenses
 */
export const getChannelProfitability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [channelRevenueAgg, channelExpenseAgg] = await Promise.all([
      // Orders revenue and marketplace fees per channel
      OrderModel.aggregate([
        { $match: { orderStatus: { $in: VALID_SALES_STATUSES } } },
        {
          $group: {
            _id: { $ifNull: ['$salesChannel', 'WEBSITE'] },
            revenue: { $sum: '$total' },
            orderCount: { $sum: 1 },
            orderFees: { $sum: { $ifNull: ['$marketplaceFee', 0] } }
          }
        }
      ]),
      // Committed expenses per channel
      ExpenseModel.aggregate([
        { $match: { status: { $in: COMMITTED_EXPENSE_STATUSES } } },
        {
          $group: {
            _id: { $ifNull: ['$salesChannel', 'GENERAL'] },
            totalExpense: { $sum: '$amount' },
            expenseCount: { $sum: 1 }
          }
        }
      ])
    ]);

    const channels = ['WEBSITE', 'AMAZON', 'FLIPKART'];
    const channelData = channels.map(channel => {
      const revMatch = channelRevenueAgg.find(r => r._id === channel);
      const expMatch = channelExpenseAgg.find(e => e._id === channel);

      const revenue = revMatch?.revenue || 0;
      const orderCount = revMatch?.orderCount || 0;
      const channelFees = revMatch?.orderFees || 0;
      const directExpenses = expMatch?.totalExpense || 0;
      const netContribution = revenue - channelFees - directExpenses;
      const contributionMargin = revenue > 0 ? (netContribution / revenue) * 100 : 0;

      return {
        channel,
        displayName: channel === 'WEBSITE' ? 'Lavanta Website' : channel === 'AMAZON' ? 'Amazon' : 'Flipkart',
        revenue: Number(revenue.toFixed(2)),
        orderCount,
        channelFees: Number(channelFees.toFixed(2)),
        allocatedExpenses: Number(directExpenses.toFixed(2)),
        netContribution: Number(netContribution.toFixed(2)),
        contributionMarginPercent: Number(contributionMargin.toFixed(1))
      };
    });

    const generalExpMatch = channelExpenseAgg.find(e => e._id === 'GENERAL');
    const generalOverhead = generalExpMatch?.totalExpense || 0;

    const totalRevenue = channelData.reduce((s, c) => s + c.revenue, 0);
    const totalAllocated = channelData.reduce((s, c) => s + c.channelFees + c.allocatedExpenses, 0);
    const totalContribution = channelData.reduce((s, c) => s + c.netContribution, 0);
    const netBusinessResult = totalContribution - generalOverhead;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalAllocatedCost: Number(totalAllocated.toFixed(2)),
        totalContribution: Number(totalContribution.toFixed(2)),
        generalOverhead: Number(generalOverhead.toFixed(2)),
        netBusinessResult: Number(netBusinessResult.toFixed(2)),
        channels: channelData
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch channel profitability'
    });
  }
};

