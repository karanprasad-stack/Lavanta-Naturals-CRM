import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OrderModel, IOrder, OrderStatus, PaymentStatus } from '../models/Order.js';
import { OrderActivityModel, OrderActivityType } from '../models/OrderActivity.js';
import { ProductModel } from '../models/Product.js';
import { CustomerModel } from '../models/Customer.js';
import { InventoryMovementModel } from '../models/InventoryMovement.js';
import { NotificationModel } from '../models/Notification.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { handleStockAlertNotifications } from '../utils/inventoryNotifications.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Helper to log order activity
 */
async function logOrderActivity(
  orderId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  type: OrderActivityType,
  metadata: Record<string, any> = {}
) {
  try {
    await OrderActivityModel.create({
      orderId,
      userId,
      type,
      metadata,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('Failed to log order activity:', err);
  }
}

/**
 * Deduct inventory for confirmed order items atomically
 */
async function deductOrderInventory(
  order: IOrder,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  // 1. Pre-validation: verify all items have sufficient stock
  for (const item of order.items) {
    const product = await ProductModel.findById(item.productId);
    if (!product) {
      throw new Error(`Product "${item.productNameSnapshot}" no longer exists in catalog`);
    }
    if (product.status === 'ARCHIVED') {
      throw new Error(`Product "${item.productNameSnapshot}" is archived and cannot be fulfilled`);
    }
    if (product.stockQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for "${item.productNameSnapshot}". Available: ${product.stockQuantity}, requested: ${item.quantity}`
      );
    }
  }

  // 2. Perform atomic stock deductions and movement records
  for (const item of order.items) {
    const product = await ProductModel.findById(item.productId);
    if (!product) continue;

    const previousQuantity = product.stockQuantity;
    const newQuantity = previousQuantity - item.quantity;

    const updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: product._id, stockQuantity: previousQuantity },
      { $set: { stockQuantity: newQuantity } },
      { new: true }
    );

    if (!updatedProduct) {
      throw new Error(`Concurrent stock modification detected for "${item.productNameSnapshot}". Please retry.`);
    }

    await InventoryMovementModel.create({
      productId: product._id,
      type: 'STOCK_OUT',
      quantity: item.quantity,
      previousQuantity,
      newQuantity,
      reason: `Order ${order.orderNumber} confirmed fulfillment`,
      reference: order.orderNumber,
      notes: `Customer order items dispatched. Unit price: ₹${item.unitPrice}`,
      performedBy: userId,
      createdAt: new Date()
    });

    // Check if low stock or out of stock alerts should trigger
    await handleStockAlertNotifications(updatedProduct, previousQuantity, newQuantity, userId);
  }
}

/**
 * Restore inventory for cancelled order items
 */
async function restoreOrderInventory(
  order: IOrder,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  for (const item of order.items) {
    const product = await ProductModel.findById(item.productId);
    if (!product) continue;

    const previousQuantity = product.stockQuantity;
    const newQuantity = previousQuantity + item.quantity;

    const updatedProduct = await ProductModel.findOneAndUpdate(
      { _id: product._id, stockQuantity: previousQuantity },
      { $set: { stockQuantity: newQuantity } },
      { new: true }
    );

    if (!updatedProduct) {
      // Fallback
      await ProductModel.findByIdAndUpdate(product._id, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    await InventoryMovementModel.create({
      productId: product._id,
      type: 'RETURNED',
      quantity: item.quantity,
      previousQuantity,
      newQuantity,
      reason: `Stock restored from cancelled order ${order.orderNumber}`,
      reference: order.orderNumber,
      notes: `Order was cancelled by user`,
      performedBy: userId,
      createdAt: new Date()
    });
  }
}

/**
 * Create a new order
 */
export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      customerId,
      customerData, // optional inline customer details
      items,
      discount = 0,
      tax = 0,
      shipping = 0,
      source = 'MANUAL',
      notes = '',
      orderStatus = 'PENDING',
      paymentStatus = 'PENDING'
    } = req.body;

    // 1. Resolve or Create Customer
    let targetCustomerId = customerId;
    if (!targetCustomerId && customerData) {
      if (!customerData.name || !customerData.phone) {
        res.status(400).json({ success: false, message: 'Customer name and phone are required' });
        return;
      }
      let existingCust = await CustomerModel.findOne({
        $or: [{ phone: customerData.phone.trim() }, { email: customerData.email?.trim().toLowerCase() }]
      });
      if (existingCust) {
        targetCustomerId = existingCust._id;
      } else {
        const newCust = await CustomerModel.create({
          name: customerData.name.trim(),
          email: customerData.email ? customerData.email.trim().toLowerCase() : `${Date.now()}@guest.lavantanaturals.com`,
          phone: customerData.phone.trim(),
          address: customerData.address || '',
          city: customerData.city || '',
          state: customerData.state || '',
          pincode: customerData.pincode || ''
        });
        targetCustomerId = newCust._id;
      }
    }

    if (!targetCustomerId || !mongoose.Types.ObjectId.isValid(targetCustomerId)) {
      res.status(400).json({ success: false, message: 'Valid customer is required' });
      return;
    }

    const customerExists = await CustomerModel.findById(targetCustomerId);
    if (!customerExists) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    // 2. Validate line items and build snapshots
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must contain at least one item' });
      return;
    }

    let calculatedSubtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        res.status(400).json({ success: false, message: 'Invalid product ID in order items' });
        return;
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ success: false, message: 'Item quantity must be at least 1' });
        return;
      }

      const product = await ProductModel.findById(item.productId);
      if (!product) {
        res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
        return;
      }

      if (product.status === 'ARCHIVED') {
        res.status(400).json({ success: false, message: `Product "${product.name}" is archived` });
        return;
      }

      // Check available stock
      if (product.stockQuantity < qty) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity} ${product.unit.toLowerCase()}s, requested: ${qty}`
        });
        return;
      }

      const unitPrice = item.unitPrice !== undefined ? Math.max(0, Number(item.unitPrice)) : product.sellingPrice;
      const itemDiscount = item.discount ? Math.max(0, Number(item.discount)) : 0;
      const itemTotal = Math.max(0, qty * unitPrice - itemDiscount);

      calculatedSubtotal += itemTotal;

      resolvedItems.push({
        productId: product._id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        quantity: qty,
        unitPrice,
        discount: itemDiscount,
        total: itemTotal
      });
    }

    // 3. Financial calculations
    const orderDiscount = Math.max(0, Number(discount) || 0);
    const orderTax = Math.max(0, Number(tax) || 0);
    const orderShipping = Math.max(0, Number(shipping) || 0);
    const calculatedTotal = Math.max(0, calculatedSubtotal - orderDiscount + orderTax + orderShipping);

    // 4. Generate unique order number
    const orderNum = await generateOrderNumber();

    const order = new OrderModel({
      orderNumber: orderNum,
      customerId: targetCustomerId,
      items: resolvedItems,
      subtotal: calculatedSubtotal,
      discount: orderDiscount,
      tax: orderTax,
      shipping: orderShipping,
      total: calculatedTotal,
      orderStatus: orderStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
      paymentStatus: paymentStatus || 'PENDING',
      source: source || 'MANUAL',
      notes: notes ? notes.trim() : '',
      createdBy: user._id,
      confirmedBy: orderStatus === 'CONFIRMED' ? user._id : null,
      inventoryDeducted: false
    });

    // If initial status is CONFIRMED, deduct inventory now
    if (order.orderStatus === 'CONFIRMED') {
      await deductOrderInventory(order, user._id);
      order.inventoryDeducted = true;
    }

    await order.save();

    // 5. Activity Log
    await logOrderActivity(order._id, user._id, 'ORDER_CREATED', {
      orderNumber: order.orderNumber,
      total: order.total,
      itemCount: order.items.length
    });

    if (order.orderStatus === 'CONFIRMED') {
      await logOrderActivity(order._id, user._id, 'ORDER_CONFIRMED', {
        orderNumber: order.orderNumber
      });
    }

    const populatedOrder = await OrderModel.findById(order._id)
      .populate('customerId')
      .populate('createdBy', 'name email role')
      .populate('confirmedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Order ${orderNum} created successfully`,
      data: populatedOrder
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

/**
 * Get paginated orders with filters
 */
export const getOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      orderStatus,
      paymentStatus,
      source,
      startDate,
      endDate,
      page = '1',
      limit = '25'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (orderStatus && typeof orderStatus === 'string') {
      query.orderStatus = orderStatus;
    }

    if (paymentStatus && typeof paymentStatus === 'string') {
      query.paymentStatus = paymentStatus;
    }

    if (source && typeof source === 'string') {
      query.source = source;
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
      // Look up matching customer IDs
      const matchingCustomers = await CustomerModel.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }]
      }).select('_id');

      const custIds = matchingCustomers.map(c => c._id);

      query.$or = [
        { orderNumber: searchRegex },
        { customerId: { $in: custIds } },
        { 'items.productNameSnapshot': searchRegex },
        { 'items.skuSnapshot': searchRegex }
      ];
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .populate('customerId')
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      OrderModel.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
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
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

/**
 * Get single order by ID or orderNumber
 */
export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await OrderModel.findById(id)
        .populate('customerId')
        .populate('createdBy', 'name email role')
        .populate('confirmedBy', 'name email role')
        .populate('cancelledBy', 'name email role');
    } else {
      order = await OrderModel.findOne({ orderNumber: id.toUpperCase() })
        .populate('customerId')
        .populate('createdBy', 'name email role')
        .populate('confirmedBy', 'name email role')
        .populate('cancelledBy', 'name email role');
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Retrieve order activity timeline
    const activities = await OrderActivityModel.find({ orderId: order._id })
      .populate('userId', 'name role')
      .sort({ createdAt: 1 });

    // Retrieve inventory movements related to this order
    const stockMovements = await InventoryMovementModel.find({ reference: order.orderNumber })
      .populate('productId', 'name sku unit')
      .populate('performedBy', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        order,
        activities,
        stockMovements
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details',
      error: error.message
    });
  }
};

/**
 * Confirm order and reduce inventory
 */
export const confirmOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.orderStatus === 'CONFIRMED') {
      res.status(400).json({ success: false, message: 'Order is already confirmed' });
      return;
    }

    if (order.orderStatus === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Cannot confirm a cancelled order' });
      return;
    }

    if (order.orderStatus === 'DELIVERED') {
      res.status(400).json({ success: false, message: 'Order is already delivered' });
      return;
    }

    // Deduct stock if not already deducted
    if (!order.inventoryDeducted) {
      await deductOrderInventory(order, user._id);
      order.inventoryDeducted = true;
    }

    order.orderStatus = 'CONFIRMED';
    order.confirmedBy = user._id;
    await order.save();

    await logOrderActivity(order._id, user._id, 'ORDER_CONFIRMED', {
      orderNumber: order.orderNumber
    });

    await logAuditEvent(req, {
      action: 'ORDER_CONFIRMED',
      entityType: 'ORDER',
      entityId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber, total: order.total }
    });

    const populated = await OrderModel.findById(order._id)
      .populate('customerId')
      .populate('confirmedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} confirmed successfully. Inventory updated.`,
      data: populated
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to confirm order'
    });
  }
};

/**
 * Cancel order and restore inventory if needed
 */
export const cancelOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason = '' } = req.body;

    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.orderStatus === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Order is already cancelled' });
      return;
    }

    // If inventory was previously deducted, restore it now
    if (order.inventoryDeducted) {
      await restoreOrderInventory(order, user._id);
      order.inventoryDeducted = false; // Prevent duplicate restoration
    }

    order.orderStatus = 'CANCELLED';
    order.cancelledBy = user._id;
    if (reason) {
      order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    }
    await order.save();

    await logOrderActivity(order._id, user._id, 'ORDER_CANCELLED', {
      orderNumber: order.orderNumber,
      reason
    });

    await logAuditEvent(req, {
      action: 'ORDER_CANCELLED',
      entityType: 'ORDER',
      entityId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber, reason }
    });

    const populated = await OrderModel.findById(order._id)
      .populate('customerId')
      .populate('cancelledBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} cancelled. Inventory stock restored where applicable.`,
      data: populated
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};

/**
 * Update order status workflow (PROCESSING, SHIPPED, DELIVERED)
 */
export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body;

    const allowedTransitions: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED'];
    if (!status || !allowedTransitions.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedTransitions.join(', ')}`
      });
      return;
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.orderStatus === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Cannot update status of a cancelled order' });
      return;
    }

    // Must be confirmed before moving to processing or shipping
    if (status === 'PROCESSING' && order.orderStatus === 'PENDING') {
      res.status(400).json({ success: false, message: 'Order must be confirmed before processing' });
      return;
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (status === 'DELIVERED' && order.paymentStatus === 'PENDING') {
      // Auto-mark paid on delivery if manual cash on delivery
      order.paymentStatus = 'PAID';
    }

    await order.save();

    let activityType: OrderActivityType = 'ORDER_PROCESSING';
    if (status === 'SHIPPED') activityType = 'ORDER_SHIPPED';
    if (status === 'DELIVERED') activityType = 'ORDER_DELIVERED';
    if (status === 'REFUNDED') activityType = 'ORDER_REFUNDED';

    await logOrderActivity(order._id, user._id, activityType, {
      from: previousStatus,
      to: status
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const allowedPaymentStatuses: PaymentStatus[] = [
      'PENDING',
      'PAID',
      'PARTIALLY_PAID',
      'FAILED',
      'REFUNDED'
    ];

    if (!paymentStatus || !allowedPaymentStatuses.includes(paymentStatus)) {
      res.status(400).json({
        success: false,
        message: `Payment status must be one of: ${allowedPaymentStatuses.join(', ')}`
      });
      return;
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const previousPayment = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    await order.save();

    await logOrderActivity(order._id, user._id, 'PAYMENT_UPDATED', {
      from: previousPayment,
      to: paymentStatus
    });

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment status'
    });
  }
};
