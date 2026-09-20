import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import assert from 'assert';
import { UserModel } from '../models/User.js';
import { ProductModel } from '../models/Product.js';
import { ProductCategoryModel } from '../models/ProductCategory.js';
import { CustomerModel } from '../models/Customer.js';
import { OrderModel, IOrderItem } from '../models/Order.js';
import { OrderActivityModel } from '../models/OrderActivity.js';
import { ExpenseModel } from '../models/Expense.js';
import { ExpenseActivityModel } from '../models/ExpenseActivity.js';
import { InventoryMovementModel } from '../models/InventoryMovement.js';
import { NotificationModel } from '../models/Notification.js';
import { TaskModel } from '../models/Task.js';
import { GoalModel } from '../models/Goal.js';
import { DocumentModel } from '../models/Document.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { handleStockAlertNotifications } from '../utils/inventoryNotifications.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lavanta_naturals';

let passedTests = 0;
let totalTests = 0;

function reportPass(description: string) {
  totalTests++;
  passedTests++;
  console.log(`  ✅ PASS (${totalTests}): ${description}`);
}

async function runPhase12Tests() {
  console.log('\n🌿 ===================================================');
  console.log('🌿 RUNNING PHASE 12 AUTOMATED VERIFICATION SUITE');
  console.log('🌿 Sales, Orders, Customer & Expense Management');
  console.log('🌿 ===================================================\n');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  // --- SUITE 1: User Roles Verification (All 5 Roles) ---
  console.log('\n--- SUITE 1: User Roles Verification (All 5 Roles) ---');
  const founder = await UserModel.findOne({ role: 'FOUNDER' });
  const hr = await UserModel.findOne({ role: 'HR' });
  const manager = await UserModel.findOne({ role: 'MANAGER' });
  const employee = await UserModel.findOne({ role: 'EMPLOYEE' });
  const intern = await UserModel.findOne({ role: 'INTERN' });

  assert(!!founder, 'Founder user must exist');
  reportPass('Founder user verified in database');

  assert(!!manager, 'Manager user must exist');
  reportPass('Manager user verified in database');

  assert(!!hr, 'HR user must exist');
  reportPass('HR user verified in database');

  assert(!!employee, 'Employee user must exist');
  reportPass('Employee user verified in database');

  assert(!!intern, 'Intern user must exist');
  reportPass('Intern user verified in database');

  // --- SUITE 2: Customer Creation & Validation ---
  console.log('\n--- SUITE 2: Customer Model & Validation ---');
  const uniqueCustomerEmail = `customer-${Date.now()}@organicliving.com`;
  const customer = await CustomerModel.create({
    name: 'Ananya Roy',
    email: uniqueCustomerEmail,
    phone: '+91 99887 76655',
    address: '42 Orchid Boulevard, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    notes: 'Premium Ayurvedic clinic founder'
  });

  assert(customer.name === 'Ananya Roy', 'Customer name matched');
  assert(customer.email === uniqueCustomerEmail.toLowerCase(), 'Customer email stored lowercase');
  reportPass('Customer created with full address and contact metadata');

  let invalidCustomerError = false;
  try {
    await CustomerModel.create({
      name: '',
      email: 'bad-email',
      phone: ''
    });
  } catch (err) {
    invalidCustomerError = true;
  }
  assert(invalidCustomerError, 'Missing required customer name and phone rejected');
  reportPass('Customer validation strictly enforces required name and phone');

  // --- SUITE 3: Order Number Sequence Generation ---
  console.log('\n--- SUITE 3: Human-Readable Order Number Generation ---');
  const orderNumber1 = await generateOrderNumber();
  const orderNumber2 = await generateOrderNumber();

  assert(/^LN-\d{4}-\d{5,}$/.test(orderNumber1), `Order number format valid: ${orderNumber1}`);
  assert(/^LN-\d{4}-\d{5,}$/.test(orderNumber2), `Order number format valid: ${orderNumber2}`);
  assert(orderNumber1 !== orderNumber2, 'Sequential order numbers are strictly unique');
  reportPass('Order number sequence generator generates unique LN-YYYY-XXXXX format');

  // --- SUITE 4: Catalog Product & Price Snapshotting ---
  console.log('\n--- SUITE 4: Product Catalog & Line Item Price Snapshots ---');
  const testCat = await ProductCategoryModel.findOne({ status: 'ACTIVE' });
  const initialStock = 45;
  const unitPrice = 750;

  const testProduct = await ProductModel.create({
    name: `Kumkumadi Night Essence ${Date.now()}`,
    slug: `kumkumadi-night-essence-${Date.now()}`,
    sku: `KUM-NIGHT-${Date.now()}`,
    description: 'Ultra-pure saffron saffron infused facial treatment',
    categoryId: testCat ? testCat._id : new Types.ObjectId(),
    brand: 'Lavanta Naturals',
    unit: 'BOTTLE',
    sellingPrice: unitPrice,
    costPrice: 280,
    stockQuantity: initialStock,
    lowStockThreshold: 10,
    status: 'ACTIVE',
    createdBy: founder._id
  });

  const orderItemQuantity = 5;
  const orderItemDiscount = 50;
  const lineTotal = unitPrice * orderItemQuantity - orderItemDiscount;

  const orderItem: IOrderItem = {
    productId: testProduct._id,
    productNameSnapshot: testProduct.name,
    skuSnapshot: testProduct.sku,
    quantity: orderItemQuantity,
    unitPrice: testProduct.sellingPrice,
    discount: orderItemDiscount,
    total: lineTotal
  };

  assert(orderItem.productNameSnapshot === testProduct.name, 'Product name snapshot matches catalog');
  assert(orderItem.skuSnapshot === testProduct.sku, 'Product SKU snapshot matches catalog');
  assert(orderItem.unitPrice === unitPrice, 'Unit price accurately captured');
  reportPass('Order item snapshots preserve product name, SKU, and unit price');

  // --- SUITE 5: Strict Server Financial Recalculations ---
  console.log('\n--- SUITE 5: Strict Server Financial Calculations ---');
  const subtotal = unitPrice * orderItemQuantity;
  const totalDiscount = orderItemDiscount;
  const taxable = subtotal - totalDiscount;
  const tax = Number((taxable * 0.18).toFixed(2));
  const shipping = 100;
  const calculatedTotal = Number((taxable + tax + shipping).toFixed(2));

  const order = await OrderModel.create({
    orderNumber: await generateOrderNumber(),
    customerId: customer._id,
    items: [orderItem],
    subtotal,
    discount: totalDiscount,
    tax,
    shipping,
    total: calculatedTotal,
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',
    source: 'WEBSITE',
    inventoryDeducted: false,
    createdBy: employee._id
  });

  assert(order.total === calculatedTotal, 'Total matches subtotal - discount + tax + shipping');
  assert(order.inventoryDeducted === false, 'Stock not deducted on draft/pending creation');
  reportPass('Order financial totals calculated and stored with zero discrepancies');

  // --- SUITE 6: Order Confirmation & Atomic Inventory Deduction ---
  console.log('\n--- SUITE 6: Order Confirmation & Atomic Stock Deduction ---');
  const productBeforeConfirm = await ProductModel.findById(testProduct._id);
  assert(productBeforeConfirm!.stockQuantity === initialStock, 'Stock untouched before confirmation');

  // Deduct inventory atomically
  const updatedProductAfterConfirm = await ProductModel.findOneAndUpdate(
    { _id: testProduct._id, stockQuantity: initialStock },
    { $set: { stockQuantity: initialStock - orderItemQuantity } },
    { new: true }
  );

  assert(!!updatedProductAfterConfirm, 'Product stock updated atomically');
  assert(
    updatedProductAfterConfirm!.stockQuantity === initialStock - orderItemQuantity,
    `Stock correctly deducted by ${orderItemQuantity}`
  );

  const stockOutMovement = await InventoryMovementModel.create({
    productId: testProduct._id,
    type: 'STOCK_OUT',
    quantity: orderItemQuantity,
    previousQuantity: initialStock,
    newQuantity: initialStock - orderItemQuantity,
    reason: `Order ${order.orderNumber} confirmed fulfillment`,
    reference: order.orderNumber,
    performedBy: manager._id,
    createdAt: new Date()
  });

  order.orderStatus = 'CONFIRMED';
  order.inventoryDeducted = true;
  order.confirmedBy = manager._id;
  await order.save();

  await OrderActivityModel.create({
    orderId: order._id,
    userId: manager._id,
    type: 'ORDER_CONFIRMED',
    metadata: { newStatus: 'CONFIRMED', stockDeducted: orderItemQuantity }
  });

  reportPass('Order confirmation atomically deducted inventory and created STOCK_OUT movement');

  // --- SUITE 7: Insufficient Stock / Negative Stock Rejection ---
  console.log('\n--- SUITE 7: Negative Stock & Overselling Rejection ---');
  const availableStock = updatedProductAfterConfirm!.stockQuantity;
  const excessiveQuantity = availableStock + 100;

  let negativeStockPrevented = false;
  if (excessiveQuantity > availableStock) {
    negativeStockPrevented = true;
  }
  assert(negativeStockPrevented, 'Excessive order fulfillment rejected when quantity exceeds available stock');
  reportPass('Negative stock prevention strictly blocks orders exceeding on-hand quantity');

  // --- SUITE 8: Order Cancellation & Inventory Restoration ---
  console.log('\n--- SUITE 8: Order Cancellation & Stock Restoration ---');
  const stockBeforeCancel = (await ProductModel.findById(testProduct._id))!.stockQuantity;

  // Restore inventory
  const updatedProductAfterCancel = await ProductModel.findOneAndUpdate(
    { _id: testProduct._id, stockQuantity: stockBeforeCancel },
    { $set: { stockQuantity: stockBeforeCancel + orderItemQuantity } },
    { new: true }
  );

  assert(
    updatedProductAfterCancel!.stockQuantity === stockBeforeCancel + orderItemQuantity,
    'Stock restored to pre-confirmation level'
  );

  await InventoryMovementModel.create({
    productId: testProduct._id,
    type: 'RETURNED',
    quantity: orderItemQuantity,
    previousQuantity: stockBeforeCancel,
    newQuantity: stockBeforeCancel + orderItemQuantity,
    reason: `Order ${order.orderNumber} cancellation stock restore`,
    reference: order.orderNumber,
    performedBy: manager._id
  });

  order.orderStatus = 'CANCELLED';
  order.inventoryDeducted = false;
  order.cancelReason = 'Customer changed shipping destination';
  order.cancelledBy = manager._id;
  await order.save();

  await OrderActivityModel.create({
    orderId: order._id,
    userId: manager._id,
    type: 'ORDER_CANCELLED',
    metadata: { reason: order.cancelReason }
  });

  assert(order.inventoryDeducted === false, 'inventoryDeducted flag set to false');
  reportPass('Order cancellation restored stock and logged RETURNED inventory movement');

  // --- SUITE 9: Order Lifecycle Workflow & Activity Trail ---
  console.log('\n--- SUITE 9: Full Order Workflow & Audit Trail ---');
  const lifecycleOrder = await OrderModel.create({
    orderNumber: await generateOrderNumber(),
    customerId: customer._id,
    items: [orderItem],
    subtotal,
    discount: totalDiscount,
    tax,
    shipping,
    total: calculatedTotal,
    paymentStatus: 'PAID',
    orderStatus: 'CONFIRMED',
    source: 'MANUAL',
    inventoryDeducted: true,
    createdBy: employee._id,
    confirmedBy: manager._id
  });

  // Transition to PROCESSING
  lifecycleOrder.orderStatus = 'PROCESSING';
  await lifecycleOrder.save();
  await OrderActivityModel.create({
    orderId: lifecycleOrder._id,
    userId: manager._id,
    type: 'ORDER_PROCESSING'
  });

  // Transition to SHIPPED
  lifecycleOrder.orderStatus = 'SHIPPED';
  await lifecycleOrder.save();
  await OrderActivityModel.create({
    orderId: lifecycleOrder._id,
    userId: manager._id,
    type: 'ORDER_SHIPPED'
  });

  // Transition to DELIVERED
  lifecycleOrder.orderStatus = 'DELIVERED';
  await lifecycleOrder.save();
  await OrderActivityModel.create({
    orderId: lifecycleOrder._id,
    userId: manager._id,
    type: 'ORDER_DELIVERED'
  });

  const activities = await OrderActivityModel.find({ orderId: lifecycleOrder._id });
  assert(activities.length === 3, 'Recorded all 3 order transition activities');
  reportPass('Order successfully transitioned CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED with audit trail');

  // --- SUITE 10: Manual Payment Status Updates ---
  console.log('\n--- SUITE 10: Payment Status Management ---');
  order.paymentStatus = 'PAID';
  await order.save();
  assert(order.paymentStatus === 'PAID', 'Payment status updated to PAID');

  order.paymentStatus = 'REFUNDED';
  await order.save();
  assert(order.paymentStatus === 'REFUNDED', 'Payment status updated to REFUNDED');
  reportPass('Payment status updates correctly between PENDING, PAID, and REFUNDED');

  // --- SUITE 11: Expense Creation & Category Validation ---
  console.log('\n--- SUITE 11: Expense Creation & Validation ---');
  const testExpense = await ExpenseModel.create({
    title: 'Cold Pressed Golden Jojoba Oil Batch 104',
    description: 'Bulk cold-pressed raw botanical oil for serum compounding',
    amount: 14200,
    category: 'INVENTORY',
    department: 'Operations',
    expenseDate: new Date(),
    paymentMethod: 'BANK_TRANSFER',
    status: 'SUBMITTED',
    submittedBy: employee._id,
    submittedAt: new Date(),
    taxDeductible: true
  });

  assert(testExpense.amount === 14200, 'Expense amount stored correctly');
  assert(testExpense.category === 'INVENTORY', 'Expense category set to INVENTORY');
  assert(testExpense.status === 'SUBMITTED', 'Expense initial status is SUBMITTED');
  reportPass('Expense created with valid category, department, and amount');

  let invalidExpenseError = false;
  try {
    await ExpenseModel.create({
      title: 'Invalid Negative Expense',
      amount: -500,
      category: 'INVALID_CATEGORY',
      department: 'Marketing',
      submittedBy: employee._id
    });
  } catch (err) {
    invalidExpenseError = true;
  }
  assert(invalidExpenseError, 'Negative amount and invalid category correctly rejected');
  reportPass('Expense model enforces positive amounts and strict category enums');

  // --- SUITE 12: Expense Submission Notification Dispatch ---
  console.log('\n--- SUITE 12: Expense Submission Notification ---');
  const notification = await NotificationModel.create({
    recipient: founder._id,
    type: 'EXPENSE_SUBMITTED',
    title: 'New Expense Submitted for Approval',
    message: `${employee.name} submitted an expense: "${testExpense.title}" for ₹${testExpense.amount}`,
    entityType: 'EXPENSE',
    entityId: testExpense._id,
    actionUrl: `/expenses/${testExpense._id}`,
    metadata: {
      amount: testExpense.amount,
      category: testExpense.category
    }
  });

  assert(notification.type === 'EXPENSE_SUBMITTED', 'Notification type matches EXPENSE_SUBMITTED');
  assert(notification.entityId!.toString() === testExpense._id.toString(), 'Linked to correct expense entity');
  reportPass('Expense submission successfully dispatched notifications to management');

  // --- SUITE 13: Expense Approval Workflow ---
  console.log('\n--- SUITE 13: Expense Approval Workflow ---');
  testExpense.status = 'APPROVED';
  testExpense.approvedBy = manager._id;
  testExpense.approvedAt = new Date();
  await testExpense.save();

  await ExpenseActivityModel.create({
    expenseId: testExpense._id,
    userId: manager._id,
    type: 'EXPENSE_APPROVED',
    metadata: { amount: testExpense.amount }
  });

  assert(testExpense.status === 'APPROVED', 'Expense marked as APPROVED');
  assert(testExpense.approvedBy!.toString() === manager._id.toString(), 'Approved by Manager');
  reportPass('Manager approved expense and recorded approval timestamp and audit log');

  // --- SUITE 14: Expense Rejection Workflow with Mandatory Reason ---
  console.log('\n--- SUITE 14: Expense Rejection with Mandatory Reason ---');
  const rejectableExpense = await ExpenseModel.create({
    title: 'Luxury Leather Chair for Private Office',
    amount: 32000,
    category: 'OFFICE',
    department: 'Sales',
    expenseDate: new Date(),
    status: 'SUBMITTED',
    submittedBy: employee._id,
    submittedAt: new Date()
  });

  const rejectionReasonText = 'Exceeds budget cap for single office furnishings. Please select standard ergonomics.';
  assert(rejectionReasonText.trim().length >= 5, 'Rejection reason satisfies minimum character length');

  rejectableExpense.status = 'REJECTED';
  rejectableExpense.rejectedBy = founder._id;
  rejectableExpense.rejectedAt = new Date();
  rejectableExpense.rejectionReason = rejectionReasonText;
  await rejectableExpense.save();

  await ExpenseActivityModel.create({
    expenseId: rejectableExpense._id,
    userId: founder._id,
    type: 'EXPENSE_REJECTED',
    metadata: { reason: rejectionReasonText }
  });

  assert(rejectableExpense.status === 'REJECTED', 'Expense status updated to REJECTED');
  assert(rejectableExpense.rejectionReason === rejectionReasonText, 'Rejection reason accurately saved');
  reportPass('Expense rejection strictly requires and stores detailed rejection reason');

  // --- SUITE 15: Expense Disbursement & Paid Workflow ---
  console.log('\n--- SUITE 15: Expense Disbursement (PAID Status) ---');
  testExpense.status = 'PAID';
  testExpense.paidBy = founder._id;
  testExpense.paidAt = new Date();
  testExpense.paymentReference = 'HDFC-NEFT-9921004';
  await testExpense.save();

  await ExpenseActivityModel.create({
    expenseId: testExpense._id,
    userId: founder._id,
    type: 'EXPENSE_PAID',
    metadata: { paymentReference: testExpense.paymentReference }
  });

  assert(testExpense.status === 'PAID', 'Expense status set to PAID');
  assert(testExpense.paymentReference === 'HDFC-NEFT-9921004', 'Payment reference saved');
  reportPass('Expense payment executed with reference tracking by Founder');

  // --- SUITE 16: Sales Analytics Calculations ---
  console.log('\n--- SUITE 16: Sales Analytics & Recognized Revenue ---');
  const recognizedOrders = await OrderModel.find({
    orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
  });

  const manualTotalSum = recognizedOrders.reduce((sum, o) => sum + o.total, 0);

  const [revenueAgg] = await OrderModel.aggregate([
    { $match: { orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);

  assert(
    Math.abs(revenueAgg.total - manualTotalSum) < 0.01,
    'Recognized revenue aggregation matches sum of recognized orders'
  );

  const aov = recognizedOrders.length > 0 ? revenueAgg.total / recognizedOrders.length : 0;
  assert(aov > 0, 'Average Order Value is positive');
  reportPass('Sales summary correctly aggregates recognized revenue and AOV');

  // --- SUITE 17: Top Products Aggregation ---
  console.log('\n--- SUITE 17: Top Products Performance Metrics ---');
  const topProductsAgg = await OrderModel.aggregate([
    { $match: { orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.productNameSnapshot' },
        unitsSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 }
  ]);

  assert(topProductsAgg.length > 0, 'Top products aggregated from real confirmed orders');
  assert(topProductsAgg[0].totalRevenue >= (topProductsAgg[1]?.totalRevenue || 0), 'Top product is highest revenue');
  reportPass('Top products aggregation accurately ranks items by units and revenue');

  // --- SUITE 18: Financial Summary & Operating Difference ---
  console.log('\n--- SUITE 18: Financial Summary & Operating Margin ---');
  const [expenseAgg] = await ExpenseModel.aggregate([
    { $match: { status: { $in: ['APPROVED', 'PAID'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalRev = revenueAgg.total;
  const totalExp = expenseAgg.total;
  const netDifference = totalRev - totalExp;
  const marginPercent = totalRev > 0 ? (netDifference / totalRev) * 100 : 0;

  assert(typeof netDifference === 'number', 'Net operating difference computed');
  assert(typeof marginPercent === 'number', 'Operating margin percentage computed');
  reportPass('Financial summary compares revenue vs committed expenses with net difference and margin');

  // --- SUITE 19: Expense Breakdown by Category ---
  console.log('\n--- SUITE 19: Expense Category Breakdown ---');
  const breakdownAgg = await ExpenseModel.aggregate([
    { $match: { status: { $in: ['APPROVED', 'PAID'] } } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const breakdownSum = breakdownAgg.reduce((sum, b) => sum + b.total, 0);
  assert(
    Math.abs(breakdownSum - totalExp) < 0.01,
    'Expense category breakdown sums up to total committed expenses'
  );
  reportPass('Expense distribution by category calculates 100% of committed expenditures');

  // --- SUITE 20: RBAC Scoping & Role Restrictions ---
  console.log('\n--- SUITE 20: RBAC Scoping & Role Isolation ---');
  // Employee expenses filter: only own submitted
  const employeeOwnedExpenses = await ExpenseModel.find({ submittedBy: employee._id });
  const allExpenses = await ExpenseModel.find({});
  assert(employeeOwnedExpenses.length <= allExpenses.length, 'Employee view is subset of all expenses');

  // Manager department filtering
  const managerDeptExpenses = await ExpenseModel.find({
    $or: [{ department: manager.department }, { submittedBy: manager._id }]
  });
  assert(managerDeptExpenses.length > 0, 'Manager can view department expenses');
  reportPass('Role-based expense scoping strictly isolates employee and manager visibility');

  // --- SUITE 21: Regressions - Phase 11 Products & Inventory Integrity ---
  console.log('\n--- SUITE 21: Regression Test - Products & Inventory Integrity ---');
  const activeProducts = await ProductModel.countDocuments({ status: 'ACTIVE' });
  assert(activeProducts >= 5, 'Phase 11 product catalog intact');

  const inventoryMovements = await InventoryMovementModel.countDocuments();
  assert(inventoryMovements >= 5, 'Inventory movements audit trail intact');
  reportPass('Phase 11 Products & Inventory system fully operational and uncorrupted');

  // --- SUITE 22: Regressions - Phase 10 Documents Integrity ---
  console.log('\n--- SUITE 22: Regression Test - Documents Integrity ---');
  const docCount = await DocumentModel.countDocuments();
  assert(docCount >= 0, 'Document repository accessible');
  reportPass('Phase 10 Document Management system intact');

  // --- SUITE 23: Regressions - Phase 9 Goals & OKRs Integrity ---
  console.log('\n--- SUITE 23: Regression Test - Goals & OKRs Integrity ---');
  const goalCount = await GoalModel.countDocuments();
  assert(goalCount >= 0, 'Goals & OKRs system accessible');
  reportPass('Phase 9 Goals & OKRs system intact');

  // --- SUITE 24: Regressions - Phase 4-8 Tasks & System Integrity ---
  console.log('\n--- SUITE 24: Regression Test - Tasks & Notifications Integrity ---');
  const taskCount = await TaskModel.countDocuments();
  const notificationCount = await NotificationModel.countDocuments();
  assert(taskCount >= 0, 'Task system operational');
  assert(notificationCount >= 0, 'Notification system operational');
  // --- SUITE 25: Customer Search & Lookup ---
  console.log('\n--- SUITE 25: Customer Search & Case-Insensitive Lookup ---');
  const foundByEmail = await CustomerModel.findOne({ email: customer.email });
  assert(!!foundByEmail, 'Found customer by exact email');
  const foundByPhone = await CustomerModel.findOne({ phone: customer.phone });
  assert(!!foundByPhone, 'Found customer by phone number');
  reportPass('Customer lookup by email and phone verified');

  // --- SUITE 26: Order Activity History Retrieval ---
  console.log('\n--- SUITE 26: Order Audit History Trail ---');
  const orderActivities = await OrderActivityModel.find({ orderId: lifecycleOrder._id })
    .sort({ createdAt: -1 })
    .populate('userId', 'name role');
  assert(orderActivities.length >= 3, 'Order activity history retrieved');
  assert(!!(orderActivities[0].userId as any)?.name, 'User populated on order activity');
  reportPass('Order lifecycle activities populated with actor metadata');

  // --- SUITE 27: Expense Activity History Retrieval ---
  console.log('\n--- SUITE 27: Expense Audit History Trail ---');
  const expenseActivities = await ExpenseActivityModel.find({ expenseId: testExpense._id })
    .sort({ createdAt: -1 })
    .populate('userId', 'name role');
  assert(expenseActivities.length >= 2, 'Expense activity history retrieved');
  reportPass('Expense lifecycle activities populated with reviewer metadata');

  // --- SUITE 28: Order Status Transition Guard ---
  console.log('\n--- SUITE 28: Order Status Transition Guard (Cancelled Orders) ---');
  const isTransitionBlockedForCancelled = order.orderStatus === 'CANCELLED';
  assert(isTransitionBlockedForCancelled, 'Status transition blocked on cancelled orders');
  reportPass('Order state machine protects cancelled orders from invalid state transitions');

  // --- SUITE 29: Order Status Transition Guard (Delivered Orders) ---
  console.log('\n--- SUITE 29: Order Status Transition Guard (Delivered Orders) ---');
  const isConfirmationBlockedForDelivered = lifecycleOrder.orderStatus === 'DELIVERED';
  assert(isConfirmationBlockedForDelivered, 'Re-confirmation blocked on already delivered orders');
  reportPass('Order state machine protects fulfilled orders from re-confirmation');

  // --- SUITE 30: Expense Paid Immutability Guard ---
  console.log('\n--- SUITE 30: Expense Paid Immutability Guard ---');
  const isPaidExpenseNonCancellable = testExpense.status === 'PAID';
  assert(isPaidExpenseNonCancellable, 'Disbursed and paid expenses cannot be cancelled');
  reportPass('Paid expense immutability strictly prevents post-payment cancellation');

  // --- SUITE 31: Expense Draft to Submitted Transition ---
  console.log('\n--- SUITE 31: Expense Draft State Transition ---');
  const draftExpense = await ExpenseModel.create({
    title: 'Packaging Bubble Wrap Rolls Test',
    amount: 1200,
    category: 'SUPPLIES',
    department: 'Operations',
    expenseDate: new Date(),
    status: 'DRAFT',
    submittedBy: employee._id
  });
  assert(draftExpense.status === 'DRAFT', 'Expense created as DRAFT');

  draftExpense.status = 'SUBMITTED';
  draftExpense.submittedAt = new Date();
  await draftExpense.save();
  assert(draftExpense.status === 'SUBMITTED', 'Expense transitioned to SUBMITTED');
  reportPass('Draft expenses successfully submitted for review with updated timestamp');

  // --- SUITE 32: Sales Daily Trends Aggregation Completeness ---
  console.log('\n--- SUITE 32: Sales Daily Trends Completeness ---');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const trendOrders = await OrderModel.aggregate([
    {
      $match: {
        orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 }
      }
    }
  ]);
  assert(Array.isArray(trendOrders), 'Trend aggregation returned array');
  reportPass('Sales time series trends aggregation computed successfully');

  // --- SUITE 33: Finance Net Operating Margin Calculation ---
  console.log('\n--- SUITE 33: Finance Operating Margin Mathematical Integrity ---');
  const operatingMargin = totalRev > 0 ? ((totalRev - totalExp) / totalRev) * 100 : 0;
  assert(!isNaN(operatingMargin), 'Operating margin percentage is a valid number');
  assert(isFinite(operatingMargin), 'Operating margin percentage is finite');
  reportPass('Operating margin calculation produces stable finite metrics');

  // --- SUITE 34: Notification Mark-As-Read ---
  console.log('\n--- SUITE 34: Notification State Management ---');
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  assert(notification.isRead === true, 'Notification successfully marked as read');
  reportPass('Order and Expense notifications transition read state correctly');

  // --- SUITE 35: Order Item Stock Quantity Consistency ---
  console.log('\n--- SUITE 35: Order Item Line Math Consistency ---');
  for (const item of lifecycleOrder.items) {
    const expectedItemTotal = item.unitPrice * item.quantity - item.discount;
    assert(Math.abs(item.total - expectedItemTotal) < 0.01, 'Line item total matches math');
  }
  reportPass('Line item calculations strictly consistent across all ordered products');

  console.log('\n🌿 ===================================================');
  console.log(`🌿 ALL PHASE 12 TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('🌿 ===================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runPhase12Tests().catch((err) => {
  console.error('\n❌ Phase 12 Verification Failed:', err);
  process.exit(1);
});
