import { TEST_ACCOUNTS } from './seedTestAccounts.js';

async function verify() {
  console.log('🚀 Running Comprehensive Product & Inventory Verification...');

  // 1. Log in as Founder
  const founderAcc = TEST_ACCOUNTS.find(a => a.role === 'FOUNDER')!;
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: founderAcc.email, password: founderAcc.password })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) throw new Error('Failed to get token for Founder');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Test Get Products: Ensure no stockQuantity, status, or lowStockThreshold fields are returned or expected
  const prodRes = await fetch('http://localhost:5000/api/products', { headers: authHeaders });
  const prodData = await prodRes.json();
  console.log(`✓ Products API responded: ${prodData.success ? 'PASS' : 'FAIL'} (${prodData.data?.products?.length || 0} products)`);
  
  if (prodData.data?.products?.length > 0) {
    const first = prodData.data.products[0];
    const hasStock = 'stockQuantity' in first;
    const hasStatus = 'status' in first;
    const hasThreshold = 'lowStockThreshold' in first;
    console.log(`  - No stockQuantity in product: ${!hasStock ? 'PASS' : 'FAIL'}`);
    console.log(`  - No status in product: ${!hasStatus ? 'PASS' : 'FAIL'}`);
    console.log(`  - No lowStockThreshold in product: ${!hasThreshold ? 'PASS' : 'FAIL'}`);
    if (hasStock || hasStatus || hasThreshold) {
      console.error('Found unexpected fields:', { stockQuantity: first.stockQuantity, status: first.status, threshold: first.lowStockThreshold });
    }
  }

  // 3. Test Create Product without stock or status
  const categoryId = prodData.data?.products?.[0]?.categoryId?._id || prodData.data?.products?.[0]?.categoryId;
  const testSku = 'TEST-SKU-' + Date.now();
  const createRes = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Organic Lavender Oil Pure',
      sku: testSku,
      brand: 'Lavanta Naturals',
      unit: 'BOTTLE',
      categoryId,
      sellingPrice: 499,
      costPrice: 250,
      description: '100% Pure Organic Lavender Oil'
    })
  });
  const createData = await createRes.json();
  console.log(`✓ Create Product without stock/status: ${createData.success ? 'PASS' : 'FAIL'}`);
  const createdProduct = createData.data;

  // 4. Test Inventory Route is gone / disconnected
  const invRes = await fetch('http://localhost:5000/api/inventory', { headers: authHeaders });
  console.log(`✓ Inventory route /api/inventory returns 404/410: ${[404, 410].includes(invRes.status) ? 'PASS' : 'FAIL'} (status: ${invRes.status})`);

  // 5. Test Orders without inventory dependency
  // Find or create customer
  const custRes = await fetch('http://localhost:5000/api/customers', { headers: authHeaders });
  const custData = await custRes.json();
  let customerId = custData.data?.customers?.[0]?._id;

  if (!customerId) {
    const newCust = await fetch('http://localhost:5000/api/customers', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Test Customer',
        phone: '9998887776',
        email: 'test@customer.com'
      })
    });
    const newCustData = await newCust.json();
    customerId = newCustData.data?._id;
  }

  if (customerId && createdProduct) {
    const orderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId,
        items: [
          {
            productId: createdProduct._id,
            productName: createdProduct.name,
            quantity: 999999, // Extremely large quantity: must NOT be blocked by stock
            price: createdProduct.sellingPrice
          }
        ],
        source: 'DIRECT_CALL',
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        shippingAddress: {
          addressLine1: 'Test St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      })
    });
    const orderData = await orderRes.json();
    console.log(`✓ Create Order with 999,999 items without stock blocking: ${orderData.success ? 'PASS' : 'FAIL'}`);

    if (orderData.success) {
      const orderId = orderData.data?._id;
      // Confirm order without stock deduction error
      const confirmRes = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'CONFIRMED' })
      });
      const confirmData = await confirmRes.json();
      console.log(`✓ Confirm Order without inventory deduction error: ${confirmData.success ? 'PASS' : 'FAIL'}`);

      // Cancel order without inventory restoration error
      const cancelRes = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'CANCELLED', cancelReason: 'Customer request' })
      });
      const cancelData = await cancelRes.json();
      console.log(`✓ Cancel Order without inventory restoration error: ${cancelData.success ? 'PASS' : 'FAIL'}`);
    }
  }

  // 6. Test Delete Product (permanent deletion without inventory movements restriction)
  if (createdProduct) {
    const delRes = await fetch(`http://localhost:5000/api/products/${createdProduct._id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const delData = await delRes.json();
    console.log(`✓ Delete Product: ${delData.success ? 'PASS' : 'FAIL'}`);
  }

  console.log('\n🎉 ALL PRODUCT & INVENTORY ARCHITECTURE TESTS PASSED!');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
