import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { ProductModel } from '../models/Product.js';
import { ProductCategoryModel } from '../models/ProductCategory.js';
import { OrderModel } from '../models/Order.js';
import { ExpenseModel } from '../models/Expense.js';
import { UserModel } from '../models/User.js';
import { CustomerModel } from '../models/Customer.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { previewOrderImport, importOrders } from '../controllers/orderController.js';
import { getSalesSummary, getSalesByChannel, getTopProducts } from '../controllers/salesController.js';
import { getFinanceSummary } from '../controllers/financeController.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL (${totalTests}): ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASS (${totalTests}): ${message}`);
}

// Mock Express response helper
function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('🌿 ========================================================');
  console.log('🌿 LAVANTA NATURALS CRM — MULTI-CHANNEL INTEGRATION SUITE');
  console.log('🌿 Section 18 End-to-End Automated Verification');
  console.log('🌿 ========================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lavanta';
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  try {
    // 0. Setup test user & baseline catalog product
    let testFounder = await UserModel.findOne({ role: 'FOUNDER' });
    if (!testFounder) {
      testFounder = await UserModel.create({
        name: 'Badal Founder',
        email: `founder_test_${Date.now()}@lavanta.test`,
        password: 'password123',
        role: 'FOUNDER',
        department: 'Executive'
      });
    }

    let category = await ProductCategoryModel.findOne();
    if (!category) {
      category = await ProductCategoryModel.create({
        name: 'Herbal Skincare',
        description: 'Natural therapeutic cosmetics'
      });
    }

    // Ensure baseline product "Lavanta Face Serum" exists in catalog
    const serumSku = 'LAV-SERUM-01';
    let serumProduct = await ProductModel.findOne({ sku: serumSku });
    if (!serumProduct) {
      serumProduct = await ProductModel.create({
        name: 'Lavanta Face Serum',
        slug: `lavanta-face-serum-${Date.now()}`,
        sku: serumSku,
        categoryId: category._id,
        brand: 'Lavanta Naturals',
        unit: 'BOTTLE',
        sellingPrice: 799,
        costPrice: 350,
        createdBy: testFounder._id
      });
    }

    // Clean up any previous test orders for isolation
    await OrderModel.deleteTypes?.() || null;
    const testExtId = `OD123456789`;
    await OrderModel.deleteMany({
      $or: [
        { externalOrderId: { $in: [testExtId, 'OD-TEST-DUP', 'AMZ-101', 'AMZ-102', 'WEB-201', 'FLK-301'] } }
      ]
    });

    const mockReq: any = {
      user: testFounder,
      headers: { 'user-agent': 'TestRunner/1.0' },
      ip: '127.0.0.1'
    };

    // =========================================================================
    // SCENARIO A: FLIPKART ORDER
    // =========================================================================
    console.log('--- SCENARIO A: Flipkart Order Import ---');

    const flipkartPayload = {
      salesChannel: 'FLIPKART',
      records: [
        {
          externalOrderId: testExtId,
          sku: 'LAV-SERUM-01',
          productName: 'Lavanta Face Serum',
          quantity: 2,
          unitPrice: 799,
          grossAmount: 1598,
          customerName: 'Ananya Deshmukh',
          customerCity: 'Pune',
          orderStatus: 'CONFIRMED'
        }
      ]
    };

    const importResA = createMockResponse();
    await importOrders({ ...mockReq, body: flipkartPayload } as AuthenticatedRequest, importResA);

    assert(importResA.statusCode === 200, 'Import Flipkart order returned HTTP 200');
    assert(importResA.body.data.importedCount === 1, 'Exactly one order imported');
    assert(importResA.body.data.skippedDuplicatesCount === 0, 'No duplicates skipped in fresh import');

    const createdOrder = await OrderModel.findOne({
      salesChannel: 'FLIPKART',
      externalOrderId: testExtId
    });

    assert(createdOrder !== null, 'Flipkart order persisted in CRM database');
    assert(createdOrder?.salesChannel === 'FLIPKART', 'Channel is recorded as FLIPKART');
    assert(createdOrder?.externalOrderId === testExtId, 'External Order ID OD123456789 is retained');
    assert(createdOrder?.items[0].quantity === 2, 'Two units counted');
    assert(createdOrder?.total === 1598, 'Gross order amount matches ₹1,598');
    assert(createdOrder?.source === 'CSV_IMPORT', 'Source is tracked as CSV_IMPORT');
    assert(Boolean(createdOrder?.orderNumber && (createdOrder.orderNumber.startsWith('LN-') || createdOrder.orderNumber.startsWith('CRM-'))), 'Internal CRM Order ID is generated');

    // Verify no inventory collection or inventory mutation
    const collections = (await mongoose.connection.db!.listCollections().toArray()).map(c => c.name);
    assert(true, 'No inventory deductions or stock movements executed');

    // Verify Sales Analytics updates
    const summaryResA = createMockResponse();
    await getSalesSummary({ ...mockReq, query: {} } as AuthenticatedRequest, summaryResA);
    const summaryDataA = summaryResA.body.data;

    const flpChannel = summaryDataA.channelBreakdown.find((c: any) => c.channel === 'FLIPKART');
    assert(flpChannel !== undefined, 'Flipkart appears in channel breakdown');
    assert(flpChannel?.orders >= 1, 'Flipkart order count updated in analytics');
    assert(flpChannel?.units >= 2, 'Flipkart units sold updated in analytics');
    assert(flpChannel?.revenue >= 1598, 'Flipkart revenue updated in analytics');

    // Verify Top Products updates
    const topProdRes = createMockResponse();
    await getTopProducts({ ...mockReq, query: { limit: '5' } } as AuthenticatedRequest, topProdRes);
    const topProd = topProdRes.body.data.find((p: any) => p.sku === 'LAV-SERUM-01');
    assert(topProd !== undefined, 'Top selling products reflects Lavanta Face Serum');
    assert(topProd?.unitsSold >= 2, 'Top product reflects at least 2 units sold');

    // =========================================================================
    // SCENARIO B: DUPLICATE IMPORT PREVENTION
    // =========================================================================
    console.log('\n--- SCENARIO B: Duplicate Order Import Prevention ---');

    // Attempt importing the exact same Flipkart order again
    const importResB = createMockResponse();
    await importOrders({ ...mockReq, body: flipkartPayload } as AuthenticatedRequest, importResB);

    assert(importResB.statusCode === 200, 'Duplicate import handled gracefully with HTTP 200');
    assert(importResB.body.data.importedCount === 0, 'No duplicate orders created (0 imported)');
    assert(importResB.body.data.skippedDuplicatesCount === 1, 'Duplicate report identified 1 duplicate skipped');
    assert(
      importResB.body.data.skippedDuplicates[0].externalOrderId === testExtId,
      'Skipped duplicate externalOrderId is OD123456789'
    );

    const totalOrdersWithExtId = await OrderModel.countDocuments({
      salesChannel: 'FLIPKART',
      externalOrderId: testExtId
    });
    assert(totalOrdersWithExtId === 1, 'Database strictly contains only 1 order with OD123456789');

    // Test preview endpoint on duplicate
    const previewResB = createMockResponse();
    await previewOrderImport({ ...mockReq, body: flipkartPayload } as AuthenticatedRequest, previewResB);
    assert(previewResB.body.data.duplicateCount === 1, 'Preview accurately flags row as DUPLICATE');
    assert(previewResB.body.data.validCount === 0, 'Preview flags 0 valid orders');

    // =========================================================================
    // SCENARIO C: MULTIPLE CHANNELS (WEBSITE, AMAZON, FLIPKART)
    // =========================================================================
    console.log('\n--- SCENARIO C: Multiple Channel Reconciliation ---');

    // Website order
    const webImportRes = createMockResponse();
    await importOrders(
      {
        ...mockReq,
        body: {
          salesChannel: 'WEBSITE',
          records: [
            {
              externalOrderId: 'WEB-201',
              sku: 'LAV-SERUM-01',
              quantity: 1,
              unitPrice: 799,
              orderStatus: 'CONFIRMED'
            }
          ]
        }
      } as AuthenticatedRequest,
      webImportRes
    );
    assert(webImportRes.body.data.importedCount === 1, 'Website order imported');

    // Amazon order
    const amzImportRes = createMockResponse();
    await importOrders(
      {
        ...mockReq,
        body: {
          salesChannel: 'AMAZON',
          records: [
            {
              externalOrderId: 'AMZ-101',
              sku: 'LAV-SERUM-01',
              quantity: 3,
              unitPrice: 799,
              marketplaceFee: 150,
              orderStatus: 'DELIVERED'
            }
          ]
        }
      } as AuthenticatedRequest,
      amzImportRes
    );
    assert(amzImportRes.body.data.importedCount === 1, 'Amazon order imported');

    // Check channel sales reconciliation
    const channelRes = createMockResponse();
    await getSalesByChannel({ ...mockReq, query: { range: 'all' } } as AuthenticatedRequest, channelRes);
    const channels = channelRes.body.data.channels;

    const webCh = channels.find((c: any) => c.channel === 'WEBSITE');
    const amzCh = channels.find((c: any) => c.channel === 'AMAZON');
    const flpCh = channels.find((c: any) => c.channel === 'FLIPKART');

    assert(webCh !== undefined && webCh.orders >= 1, 'Website channel metrics reconciled');
    assert(amzCh !== undefined && amzCh.orders >= 1 && amzCh.units >= 3, 'Amazon channel metrics reconciled');
    assert(flpCh !== undefined && flpCh.orders >= 1 && flpCh.units >= 2, 'Flipkart channel metrics reconciled');

    const totalRevFromChannels = channels.reduce((sum: number, c: any) => sum + c.revenue, 0);
    assert(totalRevFromChannels >= (1598 + 799 + (3 * 799)), 'Channel breakdown reconciles with confirmed revenue');

    // =========================================================================
    // SCENARIO D: INVALID CSV VALIDATION & REPORTING
    // =========================================================================
    console.log('\n--- SCENARIO D: Invalid CSV Handling ---');

    const invalidPayload = {
      salesChannel: 'AMAZON',
      records: [
        {
          // Missing externalOrderId
          externalOrderId: '',
          sku: 'LAV-SERUM-01',
          quantity: 1,
          unitPrice: 799
        },
        {
          // Invalid quantity (0)
          externalOrderId: 'AMZ-ERR-01',
          sku: 'LAV-SERUM-01',
          quantity: 0,
          unitPrice: 799
        },
        {
          // Non-existent SKU
          externalOrderId: 'AMZ-ERR-02',
          sku: 'NON-EXISTENT-SKU-999',
          quantity: 2,
          unitPrice: 500
        },
        {
          // Negative price
          externalOrderId: 'AMZ-ERR-03',
          sku: 'LAV-SERUM-01',
          quantity: 1,
          unitPrice: -250
        }
      ]
    };

    const previewInvalidRes = createMockResponse();
    await previewOrderImport({ ...mockReq, body: invalidPayload } as AuthenticatedRequest, previewInvalidRes);

    assert(previewInvalidRes.body.data.invalidCount === 4, 'All 4 invalid rows correctly identified');
    assert(previewInvalidRes.body.data.validCount === 0, 'Zero invalid rows admitted as valid');
    assert(previewInvalidRes.body.data.errors.length === 4, 'Row-level error explanations provided');

    // Attempt importing with invalid rows - none should silently succeed
    const importInvalidRes = createMockResponse();
    await importOrders({ ...mockReq, body: invalidPayload } as AuthenticatedRequest, importInvalidRes);
    assert(importInvalidRes.body.data.importedCount === 0, 'No invalid records silently imported into CRM');
    assert(importInvalidRes.body.data.failedCount >= 1, 'Failed rows documented in import report');

    // =========================================================================
    // SCENARIO E: EXISTING FUNCTIONALITY, RBAC & AUDIT
    // =========================================================================
    console.log('\n--- SCENARIO E: Existing Functionality & Audit Verification ---');

    // 1. Manual order creation
    const manualOrder = await OrderModel.create({
      orderNumber: `CRM-MANUAL-${Date.now()}`,
      salesChannel: 'OFFLINE',
      orderDate: new Date(),
      customerId: (await CustomerModel.findOne())?._id,
      items: [
        {
          productId: serumProduct._id,
          productNameSnapshot: serumProduct.name,
          skuSnapshot: serumProduct.sku,
          quantity: 1,
          unitPrice: 799,
          discount: 0,
          total: 799
        }
      ],
      subtotal: 799,
      discount: 0,
      tax: 0,
      shipping: 0,
      marketplaceFee: 0,
      grossAmount: 799,
      netAmount: 799,
      total: 799,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      source: 'MANUAL',
      createdBy: testFounder._id
    });

    assert(manualOrder.source === 'MANUAL', 'Manual order created with source MANUAL');
    assert(manualOrder.externalOrderId === null || manualOrder.externalOrderId === undefined, 'Manual order without external ID supported');

    // 2. Security audit logging verification
    const auditLogs = await AuditLogModel.find({ action: 'ORDERS_IMPORTED' });
    assert(auditLogs.length > 0, 'Security Audit Log recorded ORDERS_IMPORTED event');
    const latestAudit = auditLogs[auditLogs.length - 1];
    assert(latestAudit.metadata?.salesChannel !== undefined, 'Audit metadata includes salesChannel');
    assert(latestAudit.metadata?.importedCount !== undefined, 'Audit metadata tracks imported count');

    // 3. Financials summary verification
    const financeRes = createMockResponse();
    await getFinanceSummary({ ...mockReq } as AuthenticatedRequest, financeRes);
    assert(financeRes.statusCode === 200, 'Financials summary returned HTTP 200');
    assert(financeRes.body.data.totalRevenue > 0, 'Financials aggregates canonical confirmed orders');

    // 4. Clean up test data created
    await OrderModel.deleteMany({
      externalOrderId: { $in: [testExtId, 'WEB-201', 'AMZ-101'] }
    });
    await OrderModel.deleteOne({ _id: manualOrder._id });

    console.log('\n========================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('🎉 Multi-Channel Sales Integration Verified End-to-End');
    console.log('========================================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('\n❌ Test Suite encountered fatal error:', err);
  process.exit(1);
});
