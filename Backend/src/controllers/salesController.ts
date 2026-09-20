import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OrderModel } from '../models/Order.js';

const VALID_SALES_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/**
 * GET /api/sales/summary
 * Operational and revenue summary metrics for sales
 */
export const getSalesSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter to valid sales statuses (excluding DRAFT and CANCELLED for recognized revenue)
    const validSalesFilter = { orderStatus: { $in: VALID_SALES_STATUSES } };

    const [
      todayRevenueAgg,
      weekRevenueAgg,
      monthRevenueAgg,
      totalRevenueAgg,
      totalOrdersCount,
      todayOrdersCount,
      weekOrdersCount,
      monthOrdersCount,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount
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
      // Total recognized revenue
      OrderModel.aggregate([
        { $match: validSalesFilter },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Total count of orders
      OrderModel.countDocuments(),
      // Today orders count
      OrderModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      // Week orders count
      OrderModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      // Month orders count
      OrderModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      // Pending
      OrderModel.countDocuments({ orderStatus: 'PENDING' }),
      // Processing
      OrderModel.countDocuments({ orderStatus: 'PROCESSING' }),
      // Shipped
      OrderModel.countDocuments({ orderStatus: 'SHIPPED' }),
      // Delivered
      OrderModel.countDocuments({ orderStatus: 'DELIVERED' }),
      // Cancelled
      OrderModel.countDocuments({ orderStatus: 'CANCELLED' })
    ]);

    const todayRevenue = todayRevenueAgg[0]?.total || 0;
    const weekRevenue = weekRevenueAgg[0]?.total || 0;
    const monthRevenue = monthRevenueAgg[0]?.total || 0;
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // Calculate Average Order Value (AOV) based on recognized orders
    const recognizedOrdersCount = await OrderModel.countDocuments(validSalesFilter);
    const averageOrderValue = recognizedOrdersCount > 0 ? totalRevenue / recognizedOrdersCount : 0;

    res.status(200).json({
      success: true,
      data: {
        revenue: {
          today: Number(todayRevenue.toFixed(2)),
          thisWeek: Number(weekRevenue.toFixed(2)),
          thisMonth: Number(monthRevenue.toFixed(2)),
          total: Number(totalRevenue.toFixed(2))
        },
        orders: {
          today: todayOrdersCount,
          thisWeek: weekOrdersCount,
          thisMonth: monthOrdersCount,
          total: totalOrdersCount,
          recognized: recognizedOrdersCount
        },
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
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
 * GET /api/sales/trends
 * Revenue and order count time series for Recharts
 */
export const getSalesTrends = async (
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

    const aggregation = await OrderModel.aggregate([
      {
        $match: {
          orderStatus: { $in: VALID_SALES_STATUSES },
          createdAt: { $gte: startDate }
        }
      },
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

    // Build complete date map so there are no empty gaps in chart
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
 * Aggregated top performing products by units sold and revenue
 */
export const getTopProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 5, 1), 20);

    const aggregation = await OrderModel.aggregate([
      { $match: { orderStatus: { $in: VALID_SALES_STATUSES } } },
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
