import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { OrderModel, IOrder, OrderStatus, PaymentStatus } from '../models/Order.js';
import { OrderActivityModel, OrderActivityType } from '../models/OrderActivity.js';
import { ProductModel } from '../models/Product.js';
import { CustomerModel } from '../models/Customer.js';
import { SALES_CHANNELS, SALES_CHANNEL_CONFIGS, SalesChannelType } from '../config/salesChannels.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
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
 * Create a new order (Unified Multi-Channel Order Register)
 * Supports Website, Amazon, Flipkart, etc.
 * Enforces duplicate order prevention via salesChannel + externalOrderId.
 * Does NOT mutate operational inventory.
 */
export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      salesChannel = 'WEBSITE',
      externalOrderId,
      orderDate,
      customerId,
      customerData, // optional inline customer details
      items,
      discount = 0,
      tax = 0,
      shipping = 0,
      marketplaceFee = 0,
      source = 'MANUAL',
      notes = '',
      orderStatus = 'PENDING',
      paymentStatus = 'PENDING'
    } = req.body;

    // 1. Validate Sales Channel
    const normalizedChannel = (salesChannel || 'WEBSITE').toUpperCase() as SalesChannelType;
    if (!SALES_CHANNELS.includes(normalizedChannel)) {
      res.status(400).json({
        success: false,
        message: `Invalid sales channel: "${salesChannel}". Supported channels: ${SALES_CHANNELS.join(', ')}`
      });
      return;
    }

    // 2. Duplicate Order Prevention Check
    const cleanExternalOrderId = externalOrderId && typeof externalOrderId === 'string'
      ? externalOrderId.trim()
      : null;

    if (cleanExternalOrderId) {
      const duplicateOrder = await OrderModel.findOne({
        salesChannel: normalizedChannel,
        externalOrderId: cleanExternalOrderId
      });

      if (duplicateOrder) {
        res.status(409).json({
          success: false,
          message: `Duplicate order detected: External Order "${cleanExternalOrderId}" on channel "${normalizedChannel}" is already registered in CRM (Order #${duplicateOrder.orderNumber}).`,
          existingOrderId: duplicateOrder._id,
          existingOrderNumber: duplicateOrder.orderNumber
        });
        return;
      }
    }

    // 3. Resolve or Create Customer
    let targetCustomerId = customerId;
    if (!targetCustomerId && customerData) {
      if (!customerData.name) {
        res.status(400).json({ success: false, message: 'Customer name is required' });
        return;
      }
      const custPhone = customerData.phone ? customerData.phone.trim() : `guest-${Date.now()}`;
      const custEmail = customerData.email ? customerData.email.trim().toLowerCase() : `${Date.now()}@guest.lavantanaturals.com`;

      let existingCust = await CustomerModel.findOne({
        $or: [{ phone: custPhone }, { email: custEmail }]
      });

      if (existingCust) {
        targetCustomerId = existingCust._id;
      } else {
        const newCust = await CustomerModel.create({
          name: customerData.name.trim(),
          email: custEmail,
          phone: custPhone,
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

    // 4. Validate line items and build snapshots
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

    // 5. Financial calculations
    const orderDiscount = Math.max(0, Number(discount) || 0);
    const orderTax = Math.max(0, Number(tax) || 0);
    const orderShipping = Math.max(0, Number(shipping) || 0);
    const orderMarketplaceFee = Math.max(0, Number(marketplaceFee) || 0);
    const calculatedTotal = Math.max(0, calculatedSubtotal - orderDiscount + orderTax + orderShipping);
    const calculatedNet = Math.max(0, calculatedTotal - orderMarketplaceFee);

    // 6. Generate unique internal CRM order number
    const orderNum = await generateOrderNumber();

    const order = new OrderModel({
      orderNumber: orderNum,
      externalOrderId: cleanExternalOrderId,
      salesChannel: normalizedChannel,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      customerId: targetCustomerId,
      items: resolvedItems,
      subtotal: calculatedSubtotal,
      discount: orderDiscount,
      tax: orderTax,
      shipping: orderShipping,
      marketplaceFee: orderMarketplaceFee,
      grossAmount: calculatedTotal,
      netAmount: calculatedNet,
      total: calculatedTotal,
      orderStatus: orderStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
      paymentStatus: paymentStatus || 'PENDING',
      source: source || (normalizedChannel === 'WEBSITE' ? 'WEBSITE' : 'MANUAL'),
      notes: notes ? notes.trim() : '',
      createdBy: user._id,
      confirmedBy: orderStatus === 'CONFIRMED' ? user._id : null
    });

    await order.save();

    // 7. Activity Log
    await logOrderActivity(order._id, user._id, 'ORDER_CREATED', {
      orderNumber: order.orderNumber,
      externalOrderId: order.externalOrderId,
      salesChannel: order.salesChannel,
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
      message: `Order ${orderNum} created successfully for ${normalizedChannel}`,
      data: populatedOrder
    });
  } catch (error: any) {
    // Catch unique constraint collision gracefully
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'An order with this channel and external ID already exists in the system.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

/**
 * Get paginated orders with filters (by channel, status, payment, date range, search)
 */
export const getOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      salesChannel,
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

    // Channel filter
    if (salesChannel && typeof salesChannel === 'string' && salesChannel !== 'ALL') {
      query.salesChannel = salesChannel.toUpperCase();
    }

    // Status filter
    if (orderStatus && typeof orderStatus === 'string' && orderStatus !== 'ALL') {
      query.orderStatus = orderStatus.toUpperCase();
    }

    // Payment status filter
    if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus.toUpperCase();
    }

    // Source filter
    if (source && typeof source === 'string' && source !== 'ALL') {
      query.source = source.toUpperCase();
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search query across orderNumber, externalOrderId, customer details, product snapshots
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      const matchingCustomers = await CustomerModel.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }]
      }).select('_id');

      const custIds = matchingCustomers.map(c => c._id);

      query.$or = [
        { orderNumber: searchRegex },
        { externalOrderId: searchRegex },
        { customerId: { $in: custIds } },
        { 'items.productNameSnapshot': searchRegex },
        { 'items.skuSnapshot': searchRegex }
      ];
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .populate('customerId')
        .populate('createdBy', 'name email role')
        .populate('confirmedBy', 'name email role')
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
      order = await OrderModel.findOne({
        $or: [
          { orderNumber: id.toUpperCase() },
          { externalOrderId: id }
        ]
      })
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

    res.status(200).json({
      success: true,
      data: {
        order,
        activities
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
 * Confirm order (Order status transition only - NO inventory deduction)
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

    order.orderStatus = 'CONFIRMED';
    order.confirmedBy = user._id;
    await order.save();

    await logOrderActivity(order._id, user._id, 'ORDER_CONFIRMED', {
      orderNumber: order.orderNumber,
      salesChannel: order.salesChannel
    });

    await logAuditEvent(req, {
      action: 'ORDER_CONFIRMED',
      entityType: 'ORDER',
      entityId: order._id.toString(),
      metadata: {
        orderNumber: order.orderNumber,
        salesChannel: order.salesChannel,
        total: order.total
      }
    });

    const populated = await OrderModel.findById(order._id)
      .populate('customerId')
      .populate('confirmedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} confirmed successfully.`,
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
 * Cancel order (Status transition only - NO inventory mutation)
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

    order.orderStatus = 'CANCELLED';
    order.cancelledBy = user._id;
    order.cancelReason = reason ? reason.trim() : 'Cancelled by user';
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
      message: `Order ${order.orderNumber} cancelled successfully.`,
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
 * Update order status workflow (PROCESSING, SHIPPED, DELIVERED, REFUNDED)
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

/**
 * Helper to resolve customer for import or manual order without fabricating fake information
 */
async function resolveOrderCustomer(
  channel: SalesChannelType,
  customerData?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  },
  userId?: mongoose.Types.ObjectId
) {
  if (customerData && customerData.name && customerData.name.trim()) {
    const custPhone = customerData.phone ? customerData.phone.trim() : `guest-${Date.now()}`;
    const custEmail = customerData.email ? customerData.email.trim().toLowerCase() : `cust-${Date.now()}@lavanta.internal`;

    let existingCust = await CustomerModel.findOne({
      $or: [{ phone: custPhone }, { email: custEmail }]
    });

    if (existingCust) return existingCust;

    return await CustomerModel.create({
      name: customerData.name.trim(),
      email: custEmail,
      phone: custPhone,
      address: customerData.address || '',
      city: customerData.city || '',
      state: customerData.state || '',
      pincode: customerData.pincode || '',
      createdBy: userId
    });
  }

  // Fallback to channel-specific marketplace customer placeholder
  const channelEmail = `orders@${channel.toLowerCase()}.lavanta.internal`;
  let channelCust = await CustomerModel.findOne({ email: channelEmail });
  if (!channelCust) {
    const meta = SALES_CHANNEL_CONFIGS[channel];
    channelCust = await CustomerModel.create({
      name: `${meta?.displayName || channel} Customer`,
      email: channelEmail,
      phone: `CH-${channel}`,
      address: 'Marketplace Operations',
      city: 'Central',
      state: 'National',
      pincode: '000000',
      createdBy: userId
    });
  }
  return channelCust;
}

/**
 * POST /api/orders/import/preview
 * Analyzes CSV import records, identifies duplicates, validates product links,
 * and returns summary metrics before actual database insertion.
 */
export const previewOrderImport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { salesChannel = 'WEBSITE', records = [] } = req.body;

    const normalizedChannel = (salesChannel || 'WEBSITE').toUpperCase() as SalesChannelType;
    if (!SALES_CHANNELS.includes(normalizedChannel)) {
      res.status(400).json({
        success: false,
        message: `Invalid sales channel: "${salesChannel}". Supported channels: ${SALES_CHANNELS.join(', ')}`
      });
      return;
    }

    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No records provided for preview'
      });
      return;
    }

    const previewRows: any[] = [];
    const duplicates: any[] = [];
    const errors: any[] = [];
    const seenExternalIdsInBatch = new Set<string>();

    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (let index = 0; index < records.length; index++) {
      const raw = records[index];
      const rowNum = index + 1;
      const rowErrors: string[] = [];

      // 1. External Order ID validation
      const externalOrderId = raw.externalOrderId ? String(raw.externalOrderId).trim() : '';
      if (!externalOrderId) {
        rowErrors.push('Missing External Order ID');
      }

      // 2. Quantity validation
      const quantity = parseInt(raw.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        rowErrors.push('Quantity must be an integer >= 1');
      }

      // 3. Price validation
      const unitPrice = parseFloat(raw.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        rowErrors.push('Unit price must be a valid number >= 0');
      }

      // 4. Product matching (SKU or Name snapshot)
      const sku = raw.sku ? String(raw.sku).trim().toUpperCase() : '';
      const productName = raw.productName ? String(raw.productName).trim() : '';

      let matchedProduct = null;
      if (sku) {
        matchedProduct = await ProductModel.findOne({ sku: { $regex: new RegExp(`^${sku}$`, 'i') } });
      }
      if (!matchedProduct && productName) {
        matchedProduct = await ProductModel.findOne({ name: { $regex: new RegExp(`^${productName}$`, 'i') } });
      }

      if (!matchedProduct) {
        rowErrors.push(`Product not found in catalog (SKU: "${sku || 'N/A'}", Name: "${productName || 'N/A'}")`);
      }

      // 5. Duplicate Check
      let isDuplicate = false;
      let duplicateReason = '';

      if (externalOrderId) {
        if (seenExternalIdsInBatch.has(externalOrderId)) {
          isDuplicate = true;
          duplicateReason = `Duplicate order ID "${externalOrderId}" repeated within upload batch`;
        } else {
          seenExternalIdsInBatch.add(externalOrderId);
          const existingInDb = await OrderModel.findOne({
            salesChannel: normalizedChannel,
            externalOrderId
          });
          if (existingInDb) {
            isDuplicate = true;
            duplicateReason = `Already registered in CRM as Order #${existingInDb.orderNumber}`;
          }
        }
      }

      // Classify row
      let status: 'VALID' | 'DUPLICATE' | 'INVALID' = 'VALID';
      if (rowErrors.length > 0) {
        status = 'INVALID';
        invalidCount++;
        errors.push({ row: rowNum, externalOrderId, errors: rowErrors });
      } else if (isDuplicate) {
        status = 'DUPLICATE';
        duplicateCount++;
        duplicates.push({ row: rowNum, externalOrderId, reason: duplicateReason });
      } else {
        status = 'VALID';
        validCount++;
      }

      previewRows.push({
        row: rowNum,
        status,
        externalOrderId,
        salesChannel: normalizedChannel,
        productName: matchedProduct ? matchedProduct.name : productName,
        sku: matchedProduct ? matchedProduct.sku : sku,
        quantity: isNaN(quantity) ? 0 : quantity,
        unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        discount: parseFloat(raw.discount) || 0,
        tax: parseFloat(raw.tax) || 0,
        shipping: parseFloat(raw.shipping) || 0,
        marketplaceFee: parseFloat(raw.marketplaceFee) || 0,
        total: isNaN(quantity) || isNaN(unitPrice) ? 0 : Math.max(0, quantity * unitPrice - (parseFloat(raw.discount) || 0) + (parseFloat(raw.tax) || 0) + (parseFloat(raw.shipping) || 0)),
        customerName: raw.customerName || '',
        customerEmail: raw.customerEmail || '',
        customerPhone: raw.customerPhone || '',
        orderDate: raw.orderDate || new Date().toISOString(),
        orderStatus: raw.orderStatus || 'CONFIRMED',
        paymentStatus: raw.paymentStatus || 'PAID',
        errors: rowErrors,
        duplicateReason: isDuplicate ? duplicateReason : undefined
      });
    }

    res.status(200).json({
      success: true,
      data: {
        salesChannel: normalizedChannel,
        totalRows: records.length,
        validCount,
        duplicateCount,
        invalidCount,
        previewRows,
        duplicates,
        errors
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate import preview'
    });
  }
};

/**
 * POST /api/orders/import
 * Confirms import of validated multi-channel orders.
 * Strictly enforces duplicate prevention (skips existing orders safely without crashing batch).
 * Persists orders with source='CSV_IMPORT' and records security audit log.
 * Does NOT mutate inventory.
 */
export const importOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { salesChannel = 'WEBSITE', records = [] } = req.body;

    const normalizedChannel = (salesChannel || 'WEBSITE').toUpperCase() as SalesChannelType;
    if (!SALES_CHANNELS.includes(normalizedChannel)) {
      res.status(400).json({
        success: false,
        message: `Invalid sales channel: "${salesChannel}". Supported channels: ${SALES_CHANNELS.join(', ')}`
      });
      return;
    }

    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No records to import'
      });
      return;
    }

    const importedOrders: any[] = [];
    const skippedDuplicates: any[] = [];
    const failedRows: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowNum = i + 1;

      const externalOrderId = rec.externalOrderId ? String(rec.externalOrderId).trim() : null;
      if (!externalOrderId) {
        failedRows.push({ row: rowNum, error: 'External Order ID missing' });
        continue;
      }

      // Check DB duplication atomically
      const existing = await OrderModel.findOne({
        salesChannel: normalizedChannel,
        externalOrderId
      });
      if (existing) {
        skippedDuplicates.push({
          row: rowNum,
          externalOrderId,
          reason: `Already registered as CRM Order #${existing.orderNumber}`
        });
        continue;
      }

      // Match product
      const sku = rec.sku ? String(rec.sku).trim().toUpperCase() : '';
      const productName = rec.productName ? String(rec.productName).trim() : '';

      let product = null;
      if (sku) {
        product = await ProductModel.findOne({ sku: { $regex: new RegExp(`^${sku}$`, 'i') } });
      }
      if (!product && productName) {
        product = await ProductModel.findOne({ name: { $regex: new RegExp(`^${productName}$`, 'i') } });
      }

      if (!product) {
        failedRows.push({
          row: rowNum,
          externalOrderId,
          error: `Product with SKU "${sku}" or Name "${productName}" not found in catalog`
        });
        continue;
      }

      const qty = parseInt(rec.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        failedRows.push({ row: rowNum, externalOrderId, error: 'Quantity must be >= 1' });
        continue;
      }

      const rawPrice = rec.unitPrice !== undefined ? Number(rec.unitPrice) : product.sellingPrice;
      if (isNaN(rawPrice) || rawPrice < 0) {
        failedRows.push({ row: rowNum, externalOrderId, error: 'Unit price must be >= 0' });
        continue;
      }
      const unitPrice = rawPrice;
      const discount = Math.max(0, Number(rec.discount) || 0);
      const tax = Math.max(0, Number(rec.tax) || 0);
      const shipping = Math.max(0, Number(rec.shipping) || 0);
      const marketplaceFee = Math.max(0, Number(rec.marketplaceFee) || 0);

      const itemTotal = Math.max(0, (qty * unitPrice) - discount);
      const grossAmount = Math.max(0, itemTotal + tax + shipping);
      const netAmount = Math.max(0, grossAmount - marketplaceFee);

      // Customer resolution without fabricating fake data
      const targetCustomer = await resolveOrderCustomer(
        normalizedChannel,
        {
          name: rec.customerName,
          email: rec.customerEmail,
          phone: rec.customerPhone,
          address: rec.customerAddress,
          city: rec.customerCity,
          state: rec.customerState,
          pincode: rec.customerPincode
        },
        user._id
      );

      const orderNumber = await generateOrderNumber();

      const normalizedStatus = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'PENDING', 'CANCELLED']
        .includes((rec.orderStatus || '').toUpperCase())
        ? (rec.orderStatus.toUpperCase() as OrderStatus)
        : 'CONFIRMED';

      const normalizedPayment = ['PAID', 'PENDING', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED']
        .includes((rec.paymentStatus || '').toUpperCase())
        ? (rec.paymentStatus.toUpperCase() as PaymentStatus)
        : 'PAID';

      const order = new OrderModel({
        orderNumber,
        externalOrderId,
        salesChannel: normalizedChannel,
        orderDate: rec.orderDate ? new Date(rec.orderDate) : new Date(),
        customerId: targetCustomer._id,
        items: [
          {
            productId: product._id,
            productNameSnapshot: product.name,
            skuSnapshot: product.sku,
            quantity: qty,
            unitPrice,
            discount,
            total: itemTotal
          }
        ],
        subtotal: itemTotal,
        discount,
        tax,
        shipping,
        marketplaceFee,
        grossAmount,
        netAmount,
        total: grossAmount,
        orderStatus: normalizedStatus,
        paymentStatus: normalizedPayment,
        source: 'CSV_IMPORT',
        notes: rec.notes ? String(rec.notes).trim() : `Imported via CSV for ${normalizedChannel}`,
        createdBy: user._id,
        confirmedBy: normalizedStatus === 'CONFIRMED' ? user._id : null
      });

      await order.save();

      await logOrderActivity(order._id, user._id, 'ORDER_CREATED', {
        orderNumber: order.orderNumber,
        externalOrderId: order.externalOrderId,
        salesChannel: order.salesChannel,
        source: 'CSV_IMPORT',
        total: order.total
      });

      if (order.orderStatus === 'CONFIRMED') {
        await logOrderActivity(order._id, user._id, 'ORDER_CONFIRMED', {
          orderNumber: order.orderNumber,
          source: 'CSV_IMPORT'
        });
      }

      importedOrders.push({
        _id: order._id,
        orderNumber: order.orderNumber,
        externalOrderId: order.externalOrderId,
        total: order.total,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus
      });
    }

    // Persist security audit log
    await logAuditEvent(req, {
      action: 'ORDERS_IMPORTED',
      entityType: 'ORDER',
      metadata: {
        salesChannel: normalizedChannel,
        totalProcessed: records.length,
        importedCount: importedOrders.length,
        skippedDuplicatesCount: skippedDuplicates.length,
        failedCount: failedRows.length
      }
    });

    res.status(200).json({
      success: true,
      message: `Import completed: ${importedOrders.length} new orders created, ${skippedDuplicates.length} duplicates skipped, ${failedRows.length} invalid records rejected.`,
      data: {
        salesChannel: normalizedChannel,
        totalProcessed: records.length,
        importedCount: importedOrders.length,
        skippedDuplicatesCount: skippedDuplicates.length,
        failedCount: failedRows.length,
        importedOrders,
        skippedDuplicates,
        failedRows
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import orders'
    });
  }
};
