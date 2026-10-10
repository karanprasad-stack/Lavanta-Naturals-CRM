import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { ProductModel } from '../models/Product.js';
import { CustomerModel } from '../models/Customer.js';
import { OrderModel, IOrderItem } from '../models/Order.js';
import { OrderActivityModel } from '../models/OrderActivity.js';
import { ExpenseModel } from '../models/Expense.js';
import { ExpenseActivityModel } from '../models/ExpenseActivity.js';
import { InventoryMovementModel } from '../models/InventoryMovement.js';

async function seedSalesAndExpenses() {
  try {
    console.log('[Seed] Connecting to MongoDB:', config.mongodbUri);
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] Connected to database');

    const founder = await UserModel.findOne({ role: 'FOUNDER' });
    const manager = await UserModel.findOne({ role: 'MANAGER' });
    const employee = await UserModel.findOne({ role: 'EMPLOYEE' });
    const hr = await UserModel.findOne({ role: 'HR' });

    if (!founder || !manager || !employee) {
      throw new Error('Founder, Manager, and Employee users required. Run main seed script first.');
    }

    const products = await ProductModel.find();
    if (products.length === 0) {
      throw new Error('No active products found. Run seedProducts.ts first.');
    }

    console.log(`[Seed] Found ${products.length} products to create orders from.`);

    // 1. Seed Customers
    console.log('[Seed] Seeding customers...');
    const customerData = [
      {
        name: 'Aarav Mehta',
        email: 'aarav.mehta@gmail.com',
        phone: '+91 98201 23456',
        address: '14 Lotus Enclave, Koregaon Park',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        notes: 'Premium organic spa & wellness clinic repeat wholesale buyer'
      },
      {
        name: 'Sunita Deshmukh',
        email: 'sunita.d@outlook.com',
        phone: '+91 98450 78901',
        address: '88 Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        notes: 'Monthly recurring retail and salon partner'
      },
      {
        name: 'Rohan Singhania',
        email: 'rohan.singhania@techcorp.in',
        phone: '+91 99100 55432',
        address: 'Tower 4, DLF Phase 5',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122002',
        notes: 'Direct web consumer - Lavender & Kumkumadi fan'
      },
      {
        name: 'Dr. Meera Nambiar',
        email: 'dr.meera@ayurnaturals.org',
        phone: '+91 97422 11223',
        address: 'Marine Drive Bayview',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682011',
        notes: 'Ayurvedic dermatologist endorsing Lavanta oils'
      }
    ];

    const customers: any[] = [];
    for (const c of customerData) {
      let existing = await CustomerModel.findOne({ email: c.email });
      if (!existing) {
        existing = await CustomerModel.create(c);
      }
      customers.push(existing);
    }
    console.log(`[Seed] Verified ${customers.length} customers.`);

    // 2. Seed Orders
    console.log('[Seed] Seeding orders with inventory movements...');
    const currentYear = new Date().getFullYear();
    const orderDefs = [
      {
        orderNumber: `LN-${currentYear}-00101`,
        customerIdx: 0,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        items: [
          { prodIdx: 0, qty: 5, discount: 0 },
          { prodIdx: 1 % products.length, qty: 3, discount: 50 }
        ],
        shippingFee: 150,
        taxPercent: 0.18,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        inventoryDeducted: true
      },
      {
        orderNumber: `LN-${currentYear}-00102`,
        customerIdx: 1,
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        items: [
          { prodIdx: 2 % products.length, qty: 4, discount: 0 },
          { prodIdx: 3 % products.length, qty: 2, discount: 0 }
        ],
        shippingFee: 100,
        taxPercent: 0.18,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        inventoryDeducted: true
      },
      {
        orderNumber: `LN-${currentYear}-00103`,
        customerIdx: 2,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        items: [
          { prodIdx: 0, qty: 2, discount: 20 }
        ],
        shippingFee: 50,
        taxPercent: 0.18,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        inventoryDeducted: true
      },
      {
        orderNumber: `LN-${currentYear}-00104`,
        customerIdx: 3,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        items: [
          { prodIdx: 1 % products.length, qty: 6, discount: 100 },
          { prodIdx: 2 % products.length, qty: 4, discount: 0 }
        ],
        shippingFee: 200,
        taxPercent: 0.18,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        inventoryDeducted: true
      },
      {
        orderNumber: `LN-${currentYear}-00105`,
        customerIdx: 0,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        items: [
          { prodIdx: 0, qty: 3, discount: 0 }
        ],
        shippingFee: 100,
        taxPercent: 0.18,
        createdAt: new Date(),
        inventoryDeducted: false
      },
      {
        orderNumber: `LN-${currentYear}-00106`,
        customerIdx: 1,
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        paymentMethod: 'UPI',
        items: [
          { prodIdx: 0, qty: 2, discount: 0 }
        ],
        shippingFee: 0,
        taxPercent: 0.18,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        inventoryDeducted: false,
        cancelReason: 'Customer requested change in formulation and address'
      }
    ];

    for (const def of orderDefs) {
      const existing = await OrderModel.findOne({ orderNumber: def.orderNumber });
      if (existing) continue;

      const cust = customers[def.customerIdx];
      const items: IOrderItem[] = [];
      let subtotal = 0;
      let totalDiscount = 0;

      for (const itemDef of def.items) {
        const prod = products[itemDef.prodIdx];
        const unitPrice = prod.sellingPrice || 500;
        const lineDiscount = itemDef.discount || 0;
        const lineTotal = unitPrice * itemDef.qty - lineDiscount;
        subtotal += unitPrice * itemDef.qty;
        totalDiscount += lineDiscount;

        items.push({
          productId: prod._id,
          productNameSnapshot: prod.name,
          skuSnapshot: prod.sku,
          quantity: itemDef.qty,
          unitPrice: unitPrice,
          discount: lineDiscount,
          total: Number(lineTotal.toFixed(2))
        });
      }

      const taxableAmount = Math.max(subtotal - totalDiscount, 0);
      const taxAmount = Number((taxableAmount * def.taxPercent).toFixed(2));
      const grandTotal = Number((taxableAmount + taxAmount + def.shippingFee).toFixed(2));

      const order = await OrderModel.create({
        orderNumber: def.orderNumber,
        customerId: cust._id,
        items,
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(totalDiscount.toFixed(2)),
        tax: taxAmount,
        shipping: def.shippingFee,
        total: grandTotal,
        paymentStatus: def.paymentStatus,
        orderStatus: def.status,
        source: 'MANUAL',
        inventoryDeducted: def.inventoryDeducted,
        notes: `Seed order for ${cust.name}`,
        cancelReason: def.cancelReason,
        createdBy: employee._id,
        confirmedBy: def.status !== 'PENDING' && def.status !== 'CANCELLED' ? manager._id : null,
        createdAt: def.createdAt,
        updatedAt: def.createdAt
      });

      // Log activity
      const activityType =
        def.status === 'DELIVERED'
          ? 'ORDER_DELIVERED'
          : def.status === 'SHIPPED'
          ? 'ORDER_SHIPPED'
          : def.status === 'CONFIRMED'
          ? 'ORDER_CONFIRMED'
          : def.status === 'CANCELLED'
          ? 'ORDER_CANCELLED'
          : 'ORDER_CREATED';

      await OrderActivityModel.create({
        orderId: order._id,
        userId: def.status === 'DELIVERED' || def.status === 'CONFIRMED' ? manager._id : employee._id,
        type: activityType,
        metadata: { status: def.status, total: order.total },
        createdAt: def.createdAt
      });

      // If inventory deducted, also log movement record to keep sync
      if (def.inventoryDeducted) {
        for (const item of items) {
          const product = await ProductModel.findById(item.productId);
          if (product) {
            await InventoryMovementModel.create({
              productId: product._id,
              type: 'STOCK_OUT',
              quantity: item.quantity,
              previousQuantity: product.stockQuantity + item.quantity,
              newQuantity: product.stockQuantity,
              reason: `Order ${order.orderNumber} fulfillment`,
              reference: order.orderNumber,
              performedBy: manager._id,
              createdAt: def.createdAt
            });
          }
        }
      }
    }
    console.log('[Seed] Orders seeded successfully.');

    // 3. Seed Expenses
    console.log('[Seed] Seeding expenses...');
    const expenseDefs = [
      {
        title: 'Cold-Pressed Lavender & Kumkumadi Essential Extracts',
        description: 'Certified organic botanical oil batch from Himalayan botanical cooperative',
        amount: 38500,
        category: 'INVENTORY',
        department: 'Operations',
        status: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: 'NEFT-HDFC-9923841',
        submittedBy: manager._id,
        approvedBy: founder._id,
        paidBy: founder._id,
        daysAgo: 12,
        taxDeductible: true
      },
      {
        title: 'Eco-Friendly Frosted Glass Dropper Bottles & Bamboo Caps',
        description: '500 units 30ml amber & frosted pipette containers with sustainable embossing',
        amount: 22400,
        category: 'SUPPLIES',
        department: 'Operations',
        status: 'PAID',
        paymentMethod: 'UPI',
        paymentReference: 'UPI-AXIS-0029381',
        submittedBy: manager._id,
        approvedBy: founder._id,
        paidBy: founder._id,
        daysAgo: 8,
        taxDeductible: true
      },
      {
        title: 'Instagram & Meta Wellness Influencer Campaign',
        description: 'Sponsored holistic skincare testimonials and influencer partnership reach',
        amount: 18000,
        category: 'MARKETING',
        department: 'Marketing',
        status: 'APPROVED',
        paymentMethod: 'CREDIT_CARD',
        submittedBy: employee._id,
        approvedBy: manager._id,
        daysAgo: 3,
        taxDeductible: true
      },
      {
        title: 'Cloud ERP & Secure Collaboration Workspace Subscriptions',
        description: 'Monthly cloud infrastructure, database hosting, and team communication license',
        amount: 6499,
        category: 'SOFTWARE',
        department: 'Technology',
        status: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        paymentReference: 'CC-ICICI-8823',
        submittedBy: employee._id,
        approvedBy: founder._id,
        paidBy: founder._id,
        daysAgo: 15,
        taxDeductible: true
      },
      {
        title: 'Formulation Lab Cleanliness & Autoclave Servicing',
        description: 'Scheduled calibration and sanitization servicing for precision compounding lab',
        amount: 8200,
        category: 'MAINTENANCE',
        department: 'Operations',
        status: 'SUBMITTED',
        paymentMethod: 'BANK_TRANSFER',
        submittedBy: employee._id,
        daysAgo: 1,
        taxDeductible: true
      },
      {
        title: 'Courier Express Dispatch - Regional Salon Samples',
        description: 'Priority sample delivery to 15 partner wellness studios across Mumbai and Pune',
        amount: 2850,
        category: 'SHIPPING',
        department: 'Sales',
        status: 'APPROVED',
        paymentMethod: 'UPI',
        submittedBy: employee._id,
        approvedBy: manager._id,
        daysAgo: 2,
        taxDeductible: true
      },
      {
        title: 'Luxury Hotel Conference Room Booking for Partner Dinner',
        description: 'Private banquet hall reservation for retail distributor kickoff',
        amount: 25000,
        category: 'TRAVEL',
        department: 'Sales',
        status: 'REJECTED',
        rejectionReason: 'Exceeds budget guidelines for local salon partner meetings. Please use Lavanta HQ executive lounge instead.',
        rejectedBy: founder._id,
        submittedBy: employee._id,
        daysAgo: 4,
        taxDeductible: false
      }
    ];

    for (const expDef of expenseDefs) {
      const existing = await ExpenseModel.findOne({ title: expDef.title });
      if (existing) continue;

      const date = new Date(Date.now() - expDef.daysAgo * 24 * 60 * 60 * 1000);
      const expense = await ExpenseModel.create({
        title: expDef.title,
        description: expDef.description,
        amount: expDef.amount,
        category: expDef.category,
        department: expDef.department,
        status: expDef.status,
        paymentMethod: expDef.paymentMethod,
        paymentReference: expDef.paymentReference || '',
        submittedBy: expDef.submittedBy,
        submittedAt: date,
        expenseDate: date,
        approvedBy: expDef.approvedBy || null,
        approvedAt: expDef.approvedBy ? date : null,
        rejectedBy: expDef.rejectedBy || null,
        rejectedAt: expDef.rejectedBy ? date : null,
        rejectionReason: expDef.rejectionReason || '',
        paidBy: expDef.paidBy || null,
        paidAt: expDef.paidBy ? date : null,
        taxDeductible: expDef.taxDeductible,
        createdAt: date,
        updatedAt: date
      });

      await ExpenseActivityModel.create({
        expenseId: expense._id,
        userId: expDef.submittedBy,
        type: 'EXPENSE_SUBMITTED',
        metadata: { amount: expense.amount, category: expense.category },
        createdAt: date
      });

      if (expDef.status === 'APPROVED' || expDef.status === 'PAID') {
        await ExpenseActivityModel.create({
          expenseId: expense._id,
          userId: expDef.approvedBy || founder._id,
          type: 'EXPENSE_APPROVED',
          metadata: { amount: expense.amount },
          createdAt: date
        });
      }

      if (expDef.status === 'PAID') {
        await ExpenseActivityModel.create({
          expenseId: expense._id,
          userId: expDef.paidBy || founder._id,
          type: 'EXPENSE_PAID',
          metadata: { paymentReference: expDef.paymentReference },
          createdAt: date
        });
      }

      if (expDef.status === 'REJECTED') {
        await ExpenseActivityModel.create({
          expenseId: expense._id,
          userId: expDef.rejectedBy || founder._id,
          type: 'EXPENSE_REJECTED',
          metadata: { reason: expDef.rejectionReason },
          createdAt: date
        });
      }
    }
    console.log('[Seed] Expenses seeded successfully.');

    console.log('[Seed] Phase 12 Sales & Expenses seed completed!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

seedSalesAndExpenses();
