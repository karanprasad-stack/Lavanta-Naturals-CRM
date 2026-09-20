import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ProductModel, IProduct } from '../models/Product.js';
import { InventoryMovementModel, InventoryMovementType } from '../models/InventoryMovement.js';
import { handleStockAlertNotifications, logProductActivity } from '../utils/inventoryNotifications.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const POSITIVE_MOVEMENT_TYPES: InventoryMovementType[] = [
  'OPENING_STOCK',
  'STOCK_IN',
  'ADJUSTMENT_IN',
  'RETURNED',
  'TRANSFER_IN'
];

const NEGATIVE_MOVEMENT_TYPES: InventoryMovementType[] = [
  'STOCK_OUT',
  'ADJUSTMENT_OUT',
  'DAMAGED',
  'LOST',
  'TRANSFER_OUT'
];

/**
 * Execute atomic stock change with optimism & fallback transaction support
 */
async function applyStockMovement({
  productId,
  type,
  quantity,
  reason,
  reference,
  notes,
  userId
}: {
  productId: string | mongoose.Types.ObjectId;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  userId: mongoose.Types.ObjectId;
}): Promise<{ product: IProduct; movement: any }> {
  // 1. Fetch current product state
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  if (product.status === 'ARCHIVED') {
    throw new Error('Cannot modify inventory of an archived product');
  }

  const previousQuantity = product.stockQuantity;
  const isPositive = POSITIVE_MOVEMENT_TYPES.includes(type);
  const isNegative = NEGATIVE_MOVEMENT_TYPES.includes(type);

  if (!isPositive && !isNegative) {
    throw new Error(`Invalid movement type: ${type}`);
  }

  if (isNegative && previousQuantity < quantity) {
    throw new Error(`Insufficient stock. Current stock is ${previousQuantity}, requested reduction is ${quantity}`);
  }

  const newQuantity = isPositive
    ? previousQuantity + quantity
    : previousQuantity - quantity;

  // 2. Perform atomic optimistic concurrency update
  const updatedProduct = await ProductModel.findOneAndUpdate(
    {
      _id: product._id,
      stockQuantity: previousQuantity // Concurrency check to avoid race conditions
    },
    {
      $set: { stockQuantity: newQuantity }
    },
    {
      new: true
    }
  );

  if (!updatedProduct) {
    throw new Error('Concurrent inventory modification detected. Please try again.');
  }

  // 3. Record unbroken audit trail
  const movement = await InventoryMovementModel.create({
    productId: product._id,
    type,
    quantity,
    previousQuantity,
    newQuantity,
    reason: reason.trim(),
    reference: reference ? reference.trim() : '',
    notes: notes ? notes.trim() : '',
    performedBy: userId,
    createdAt: new Date()
  });

  // 4. Log activity
  const actionName =
    type === 'STOCK_IN' || type === 'RETURNED'
      ? 'STOCK_ADDED'
      : type === 'STOCK_OUT'
      ? 'STOCK_REMOVED'
      : 'STOCK_ADJUSTED';

  await logProductActivity(product._id, userId, actionName, {
    movementType: type,
    quantity,
    previousQuantity,
    newQuantity,
    reason
  });

  await logAuditEvent(null, {
    action: 'STOCK_ADJUSTED',
    userId,
    entityType: 'PRODUCT',
    entityId: product._id.toString(),
    metadata: { movementType: type, quantity, previousQuantity, newQuantity, reason }
  });

  // 5. Send alerts if low stock or out of stock
  await handleStockAlertNotifications(updatedProduct, previousQuantity, newQuantity, userId);

  return { product: updatedProduct, movement };
}

/**
 * Get inventory table with filtering and pagination
 */
export const getInventory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      category,
      stockStatus,
      page = '1',
      limit = '25',
      sortBy = 'stockQuantity',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
      status: { $ne: 'ARCHIVED' }
    };

    if (category && mongoose.Types.ObjectId.isValid(category as string)) {
      query.categoryId = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { sku: searchRegex }, { brand: searchRegex }];
    }

    if (stockStatus) {
      if (stockStatus === 'OUT_OF_STOCK') {
        query.stockQuantity = 0;
      } else if (stockStatus === 'LOW_STOCK') {
        query.$expr = {
          $and: [
            { $gt: ['$stockQuantity', 0] },
            { $lte: ['$stockQuantity', '$lowStockThreshold'] }
          ]
        };
      } else if (stockStatus === 'IN_STOCK') {
        query.$expr = {
          $gt: ['$stockQuantity', '$lowStockThreshold']
        };
      }
    }

    const sortField = ['stockQuantity', 'name', 'updatedAt'].includes(sortBy as string)
      ? (sortBy as string)
      : 'stockQuantity';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .populate('categoryId', 'name description')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      ProductModel.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        inventory: products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory',
      error: error.message
    });
  }
};

/**
 * Get high-level inventory summaries
 */
export const getInventorySummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [totalProducts, unitsResult, outOfStockCount, lowStockCount] = await Promise.all([
      ProductModel.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      ProductModel.aggregate([
        { $match: { status: { $ne: 'ARCHIVED' } } },
        { $group: { _id: null, totalUnits: { $sum: '$stockQuantity' } } }
      ]),
      ProductModel.countDocuments({ status: { $ne: 'ARCHIVED' }, stockQuantity: 0 }),
      ProductModel.countDocuments({
        status: { $ne: 'ARCHIVED' },
        $expr: {
          $and: [
            { $gt: ['$stockQuantity', 0] },
            { $lte: ['$stockQuantity', '$lowStockThreshold'] }
          ]
        }
      })
    ]);

    const totalUnits = unitsResult.length > 0 ? unitsResult[0].totalUnits : 0;
    const inStockCount = Math.max(0, totalProducts - outOfStockCount - lowStockCount);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalUnits,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        inStock: inStockCount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory summary',
      error: error.message
    });
  }
};

/**
 * Get low stock and out of stock products
 */
export const getLowStockProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const products = await ProductModel.find({
      status: { $ne: 'ARCHIVED' },
      $expr: {
        $lte: ['$stockQuantity', '$lowStockThreshold']
      }
    })
      .populate('categoryId', 'name')
      .sort({ stockQuantity: 1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low-stock products',
      error: error.message
    });
  }
};

/**
 * Get paginated inventory history audit trail
 */
export const getInventoryHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      productId,
      type,
      performedBy,
      startDate,
      endDate,
      search,
      page = '1',
      limit = '25'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (productId && mongoose.Types.ObjectId.isValid(productId as string)) {
      query.productId = productId;
    }

    if (type && typeof type === 'string') {
      query.type = type;
    }

    if (performedBy && mongoose.Types.ObjectId.isValid(performedBy as string)) {
      query.performedBy = performedBy;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      // Look up matching product IDs first
      const matchingProducts = await ProductModel.find({
        $or: [{ name: searchRegex }, { sku: searchRegex }]
      }).select('_id');

      const productIds = matchingProducts.map(p => p._id);

      query.$or = [
        { reason: searchRegex },
        { reference: searchRegex },
        { notes: searchRegex },
        { productId: { $in: productIds } }
      ];
    }

    const [movements, total] = await Promise.all([
      InventoryMovementModel.find(query)
        .populate({
          path: 'productId',
          select: 'name sku unit categoryId images sellingPrice lowStockThreshold',
          populate: { path: 'categoryId', select: 'name' }
        })
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      InventoryMovementModel.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        history: movements,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory history',
      error: error.message
    });
  }
};

/**
 * Record a standard inventory movement (Stock In, Stock Out, Restocking, Returned, Transfers)
 */
export const recordMovement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { productId, type, quantity, reason, reference, notes } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Valid product ID is required' });
      return;
    }

    if (!type || !POSITIVE_MOVEMENT_TYPES.concat(NEGATIVE_MOVEMENT_TYPES).includes(type)) {
      res.status(400).json({ success: false, message: 'Valid movement type is required' });
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ success: false, message: 'Quantity must be a positive number greater than 0' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'Reason is required for inventory movements' });
      return;
    }

    const result = await applyStockMovement({
      productId,
      type,
      quantity: Math.round(qty),
      reason,
      reference,
      notes,
      userId: user._id
    });

    const populatedMovement = await InventoryMovementModel.findById(result.movement._id)
      .populate('productId', 'name sku unit')
      .populate('performedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Stock movement recorded successfully (${type === 'STOCK_IN' ? '+' : '-'}${qty})`,
      data: {
        product: result.product,
        movement: populatedMovement
      }
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Insufficient stock') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to record inventory movement'
    });
  }
};

/**
 * Record a stock adjustment (physical count discrepancy, damaged, lost, correction)
 */
export const recordAdjustment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { productId, type, quantity, reason, notes, reference } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Valid product ID is required' });
      return;
    }

    const allowedAdjustments: InventoryMovementType[] = [
      'ADJUSTMENT_IN',
      'ADJUSTMENT_OUT',
      'DAMAGED',
      'LOST',
      'RETURNED'
    ];

    if (!type || !allowedAdjustments.includes(type)) {
      res.status(400).json({
        success: false,
        message: `Adjustment type must be one of: ${allowedAdjustments.join(', ')}`
      });
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ success: false, message: 'Quantity must be a positive number greater than 0' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'Reason is strictly required for stock adjustments' });
      return;
    }

    const result = await applyStockMovement({
      productId,
      type,
      quantity: Math.round(qty),
      reason,
      reference,
      notes,
      userId: user._id
    });

    const populatedMovement = await InventoryMovementModel.findById(result.movement._id)
      .populate('productId', 'name sku unit')
      .populate('performedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Stock adjustment recorded successfully',
      data: {
        product: result.product,
        movement: populatedMovement
      }
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Insufficient stock') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to record stock adjustment'
    });
  }
};

/**
 * Get aggregated trends over 7, 30, or 90 days for Recharts
 */
export const getInventoryTrends = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { days = '30' } = req.query;
    const numDays = Math.min(90, Math.max(7, parseInt(days as string, 10) || 30));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    startDate.setHours(0, 0, 0, 0);

    const movements = await InventoryMovementModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: 1,
          quantity: 1,
          isAddition: { $in: ['$type', POSITIVE_MOVEMENT_TYPES] },
          isDeduction: { $in: ['$type', NEGATIVE_MOVEMENT_TYPES] }
        }
      },
      {
        $group: {
          _id: '$date',
          stockIn: {
            $sum: {
              $cond: [{ $eq: ['$isAddition', true] }, '$quantity', 0]
            }
          },
          stockOut: {
            $sum: {
              $cond: [{ $eq: ['$isDeduction', true] }, '$quantity', 0]
            }
          },
          movementCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format into contiguous dates so charts are smooth and continuous
    const trendMap = new Map<string, { date: string; stockIn: number; stockOut: number; movementCount: number }>();
    movements.forEach(m => {
      trendMap.set(m._id, {
        date: m._id,
        stockIn: m.stockIn,
        stockOut: m.stockOut,
        movementCount: m.movementCount
      });
    });

    const continuousTrends = [];
    const curr = new Date(startDate);
    const today = new Date();

    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        continuousTrends.push(trendMap.get(dateStr)!);
      } else {
        continuousTrends.push({
          date: dateStr,
          stockIn: 0,
          stockOut: 0,
          movementCount: 0
        });
      }
      curr.setDate(curr.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: continuousTrends
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory trends',
      error: error.message
    });
  }
};
