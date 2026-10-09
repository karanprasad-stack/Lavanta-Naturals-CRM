import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OrderModel } from '../models/Order.js';
import { SALES_CHANNELS, SALES_CHANNEL_CONFIGS, SalesChannelType } from '../config/salesChannels.js';

// Recognized revenue statuses (excludes DRAFT and CANCELLED)
const VALID_SALES_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/**
 * Helper to compute date range window
 */
function getDateRangeWindow(range: string = '30d', startDateQuery?: string, endDateQuery?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'week':
    case '7d':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case '90d':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      startDate = startDateQuery ? new Date(startDateQuery) : new Date(now.getFullYear(), now.getMonth(), 1);
      if (endDateQuery) {
        endDate = new Date(endDateQuery);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    case '30d':
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}

/**
 * GET /api/sales/summary
 * Operational and revenue summary metrics for sales (derived solely from Orders)
 */
export const getSalesSummary = async (
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

    const range = req.query.range as string;
    const startDateQuery = req.query.startDate as string;
    const endDateQuery = req.query.endDate as string;

    const validSalesFilter = { orderStatus: { $in: VALID_SALES_STATUSES } };

    let periodMatchFilter: Record<string, any> = { ...validSalesFilter };
    if (range && range !== 'all') {
      const { startDate, endDate } = getDateRangeWindow(range, startDateQuery, endDateQuery);
      periodMatchFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const [
      todayAgg,
      weekAgg,
      monthAgg,
      totalAgg,
      periodRevenueAgg,
      periodUnitsSoldAgg,
      totalOrdersCount,
      todayOrdersCount,
      weekOrdersCount,
      monthOrdersCount,
      periodOrdersCount,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      channelAgg
    ] = await Promise.all([
      // Today revenue
      OrderModel.aggregate([
        { $match: { ...validSalesFilter, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // This week revenue
      OrderModel.aggregate([
        { $match: { ...validSalesFilter, createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // This month revenue
      OrderModel.aggregate([
        { $match: { ...validSalesFilter, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Total recognized revenue (all time)
      OrderModel.aggregate([
        { $match: validSalesFilter },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Period recognized revenue
      OrderModel.aggregate([
        { $match: periodMatchFilter },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Units sold in selected period
      OrderModel.aggregate([
        { $match: periodMatchFilter },
        { $unwind: '$items' },
        { $group: { _id: null, units: { $sum: '$items.quantity' } } }
      ]),
      // Total count of orders (all time)
      OrderModel.countDocuments(),
      // Today orders count
      OrderModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      // Week orders count
      OrderModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      // Month orders count
      OrderModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      // Orders count in period
      OrderModel.countDocuments(periodMatchFilter),
      // Status breakdown
      OrderModel.countDocuments({ orderStatus: 'PENDING' }),
      OrderModel.countDocuments({ orderStatus: 'PROCESSING' }),
      OrderModel.countDocuments({ orderStatus: 'SHIPPED' }),
      OrderModel.countDocuments({ orderStatus: 'DELIVERED' }),
      OrderModel.countDocuments({ orderStatus: 'CANCELLED' }),
      // Channel Breakdown for selected period
      OrderModel.aggregate([
        { $match: periodMatchFilter },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              orderId: '$_id',
              channel: '$salesChannel',
              orderTotal: '$total'
            },
            orderUnits: { $sum: '$items.quantity' }
          }
        },
        {
          $group: {
            _id: '$_id.channel',
            orders: { $sum: 1 },
            revenue: { $sum: '$_id.orderTotal' },
            units: { $sum: '$orderUnits' }
          }
        }
      ])
    ]);

    const todayRevenue = todayAgg[0]?.total || 0;
    const weekRevenue = weekAgg[0]?.total || 0;
    const monthRevenue = monthAgg[0]?.total || 0;
    const allTimeRevenue = totalAgg[0]?.total || 0;
    const periodRevenue = periodRevenueAgg[0]?.total || 0;
    const periodUnitsSold = periodUnitsSoldAgg[0]?.units || 0;

    // When range filter is specified, display the period values for KPI cards
    const displayRevenue = (range && range !== 'all') ? periodRevenue : allTimeRevenue;
    const displayOrders = (range && range !== 'all') ? periodOrdersCount : (await OrderModel.countDocuments(validSalesFilter));
    const averageOrderValue = displayOrders > 0 ? displayRevenue / displayOrders : 0;

    // Format sales by channel
    const channelBreakdown = ['WEBSITE', 'AMAZON', 'FLIPKART'].map((channelCode) => {
      const match = channelAgg.find(c => c._id === channelCode);
      const rev = match ? match.revenue : 0;
      const ordersNum = match ? match.orders : 0;
      const unitsNum = match ? match.units : 0;
      const share = displayRevenue > 0 ? (rev / displayRevenue) * 100 : 0;
      const meta = SALES_CHANNEL_CONFIGS[channelCode as SalesChannelType];

      return {
        channel: channelCode,
        displayName: meta?.displayName || channelCode,
        shortName: meta?.shortName || channelCode,
        orders: ordersNum,
        units: unitsNum,
        revenue: Number(rev.toFixed(2)),
        sharePercent: Number(share.toFixed(1)),
        color: meta?.badgeColor || '#4B5563',
        bg: meta?.badgeBg || '#F3F4F6'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        revenue: {
          today: Number(todayRevenue.toFixed(2)),
          thisWeek: Number(weekRevenue.toFixed(2)),
          thisMonth: Number(monthRevenue.toFixed(2)),
          total: Number(displayRevenue.toFixed(2)),
          allTime: Number(allTimeRevenue.toFixed(2))
        },
        orders: {
          today: todayOrdersCount,
          thisWeek: weekOrdersCount,
          thisMonth: monthOrdersCount,
          total: totalOrdersCount,
          recognized: displayOrders
        },
        unitsSold: periodUnitsSold,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        channelBreakdown,
        statusBreakdown: {
          pending: pendingCount,
          processing: processingCount,
          shipped: shippedCount,
          delivered: deliveredCount,
          cancelled: cancelledCount
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sales summary'
    });
  }
};

/**
 * GET /api/sales/channels
 * Detailed sales breakdown by sales channel (Website, Amazon, Flipkart, etc.)
 */
export const getSalesByChannel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const range = (req.query.range as string) || 'all';
    const startDateQuery = req.query.startDate as string;
    const endDateQuery = req.query.endDate as string;

    const matchFilter: Record<string, any> = {
      orderStatus: { $in: VALID_SALES_STATUSES }
    };

    if (range !== 'all') {
      const { startDate, endDate } = getDateRangeWindow(range, startDateQuery, endDateQuery);
      matchFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Aggregate orders by salesChannel
    const aggregation = await OrderModel.aggregate([
      { $match: matchFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            orderId: '$_id',
            channel: { $ifNull: ['$salesChannel', 'WEBSITE'] },
            orderTotal: '$total'
          },
          orderUnits: { $sum: '$items.quantity' }
        }
      },
      {
        $group: {
          _id: '$_id.channel',
          ordersCount: { $sum: 1 },
          revenue: { $sum: '$_id.orderTotal' },
          unitsSold: { $sum: '$orderUnits' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = aggregation.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalOrders = aggregation.reduce((sum, item) => sum + (item.ordersCount || 0), 0);
    const totalUnits = aggregation.reduce((sum, item) => sum + (item.unitsSold || 0), 0);

    // Ensure all standard initial channels (Website, Amazon, Flipkart) are included
    const standardChannels: SalesChannelType[] = ['WEBSITE', 'AMAZON', 'FLIPKART'];
    const channelResults = standardChannels.map(channelCode => {
      const found = aggregation.find(a => a._id === channelCode);
      const rev = found ? found.revenue : 0;
      const orders = found ? found.ordersCount : 0;
      const units = found ? found.unitsSold : 0;
      const share = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0;
      const meta = SALES_CHANNEL_CONFIGS[channelCode];

      return {
        channel: channelCode,
        displayName: meta?.displayName || channelCode,
        shortName: meta?.shortName || channelCode,
        orders,
        units,
        revenue: Number(rev.toFixed(2)),
        sharePercent: Number(share.toFixed(1)),
        avgOrderValue: orders > 0 ? Number((rev / orders).toFixed(2)) : 0,
        badgeColor: meta?.badgeColor || '#4B5563',
        badgeBg: meta?.badgeBg || '#F3F4F6'
      };
    });

    // Also include any other channels that have sales
    aggregation.forEach(item => {
      if (!standardChannels.includes(item._id as SalesChannelType)) {
        const rev = item.revenue || 0;
        const orders = item.ordersCount || 0;
        const units = item.unitsSold || 0;
        const share = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0;
        const meta = SALES_CHANNEL_CONFIGS[item._id as SalesChannelType];

        channelResults.push({
          channel: item._id,
          displayName: meta?.displayName || item._id,
          shortName: meta?.shortName || item._id,
          orders,
          units,
          revenue: Number(rev.toFixed(2)),
          sharePercent: Number(share.toFixed(1)),
          avgOrderValue: orders > 0 ? Number((rev / orders).toFixed(2)) : 0,
          badgeColor: meta?.badgeColor || '#4B5563',
          badgeBg: meta?.badgeBg || '#F3F4F6'
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        totalUnits,
        channels: channelResults
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sales by channel'
    });
  }
};

/**
 * GET /api/sales/trends
 * Revenue and order count time series
 */
export const getSalesTrends = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const range = (req.query.range as string) || '30d';
    const channel = req.query.channel as string;
    const { startDate, endDate } = getDateRangeWindow(range);

    const matchFilter: Record<string, any> = {
      orderStatus: { $in: VALID_SALES_STATUSES },
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (channel && channel !== 'ALL') {
      matchFilter.salesChannel = channel.toUpperCase();
    }

    const aggregation = await OrderModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          ordersCount: { $sum: 1 },
          itemsSold: { $sum: { $sum: '$items.quantity' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate total days in range
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const dateMap = new Map<string, { date: string; revenue: number; ordersCount: number; itemsSold: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, {
        date: key,
        revenue: 0,
        ordersCount: 0,
        itemsSold: 0
      });
    }

    for (const item of aggregation) {
      if (dateMap.has(item._id)) {
        dateMap.set(item._id, {
          date: item._id,
          revenue: Number(item.revenue.toFixed(2)),
          ordersCount: item.ordersCount,
          itemsSold: item.itemsSold
        });
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
      message: error.message || 'Failed to fetch sales trends'
    });
  }
};

/**
 * GET /api/sales/top-products
 * Aggregated top performing products by units sold and revenue (catalog master only, NO stock fields)
 */
export const getTopProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 5, 1), 50);
    const channel = req.query.channel as string;
    const range = req.query.range as string;
    const startDateQuery = req.query.startDate as string;
    const endDateQuery = req.query.endDate as string;

    const matchFilter: Record<string, any> = {
      orderStatus: { $in: VALID_SALES_STATUSES }
    };

    if (range && range !== 'all') {
      const { startDate, endDate } = getDateRangeWindow(range, startDateQuery, endDateQuery);
      matchFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (channel && channel !== 'ALL') {
      matchFilter.salesChannel = channel.toUpperCase();
    }

    const aggregation = await OrderModel.aggregate([
      { $match: matchFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productNameSnapshot' },
          sku: { $first: '$items.skuSnapshot' },
          unitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      data: aggregation.map((item) => ({
        productId: item._id,
        name: item.name,
        sku: item.sku,
        unitsSold: item.unitsSold,
        totalRevenue: Number(item.totalRevenue.toFixed(2)),
        ordersCount: item.ordersCount
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top products'
    });
  }
};
