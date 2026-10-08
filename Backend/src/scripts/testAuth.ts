import { TEST_ACCOUNTS } from './seedTestAccounts.js';

async function testAll() {
  console.log('Testing authentication for all 5 official test accounts...');
  let allPass = true;

  for (const acc of TEST_ACCOUNTS) {
    // 1. Test Email Login
    const emailRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: acc.email, password: acc.password })
    });
    const emailData = await emailRes.json();
    const emailOk = emailData.success && emailData.user?.role === acc.role;

    // 2. Test Mobile Login
    const mobileRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: acc.mobile, password: acc.password })
    });
    const mobileData = await mobileRes.json();
    const mobileOk = mobileData.success && mobileData.user?.role === acc.role;

    if (emailOk && mobileOk) {
      console.log(`✓ ${acc.role.padEnd(8)}: PASS | Email (${acc.email}) & Mobile (${acc.mobile}) -> Role: ${emailData.user.role}`);
    } else {
      allPass = false;
      console.error(`✗ ${acc.role.padEnd(8)}: FAIL | Email: ${emailOk}, Mobile: ${mobileOk}`, { emailData, mobileData });
    }
  }

  if (allPass) {
    console.log('🎉 ALL 10 AUTHENTICATION TESTS PASSED!');
  } else {
    process.exit(1);
  }
}

testAll().catch(console.error);
