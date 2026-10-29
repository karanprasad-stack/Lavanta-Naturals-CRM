import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { isAllowlistedFounderEmail, normalizeEmail, FOUNDER_EMAIL_ALLOWLIST } from '../config/founderAllowlist.js';

const API_BASE = 'http://localhost:5000/api';

interface TestResult {
  step: number;
  description: string;
  passed: boolean;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, step: number, description: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS (${step}): ${description}`);
    results.push({ step, description, passed: true });
  } else {
    console.error(`  ❌ FAIL (${step}): ${description}`, details || '');
    results.push({ step, description, passed: false, details });
  }
}

async function runTests() {
  console.log('\n🌿 ===================================================');
  console.log('🌿 RUNNING FOUNDER ROLE ASSIGNMENT VERIFICATION SUITE');
  console.log('🌿 Testing Allowlist, Registration, RBAC & Persistence');
  console.log('🌿 ===================================================\n');

  await mongoose.connect(config.mongodbUri);

  const testEmails = [
    'aditibundela094@gmail.com',
    'badalraj1824@gmail.com',
    'unauthorized_test_user@gmail.com'
  ];

  // Clean up any existing records for test emails to ensure a clean slate
  await UserModel.deleteMany({ email: { $in: testEmails } });
  await UserModel.deleteMany({ phone: { $in: ['9888800001', '9888800002', '9888800003'] } });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: First allowlisted email receives Founder role during registration
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Registration for First Allowlisted Email ---');
    const res1 = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditi Bundela',
        email: 'aditibundela094@gmail.com',
        mobile: '9888800001',
        password: 'Lavanta@Founder123'
      })
    });
    const data1 = await res1.json();
    assert(res1.status === 201, 1, 'HTTP 201 returned for aditibundela094@gmail.com registration');
    assert(data1.user?.role === 'FOUNDER', 2, 'API response assigns role: FOUNDER', data1.user);
    assert(data1.user?.department === 'Executive', 3, 'API response assigns department: Executive');
    assert(data1.user?.designation === 'Founder', 4, 'API response assigns designation: Founder');

    const dbUser1 = await UserModel.findOne({ email: 'aditibundela094@gmail.com' });
    assert(dbUser1 !== null && dbUser1.role === 'FOUNDER', 5, 'MongoDB persisted user record role is FOUNDER');

    // -------------------------------------------------------------------------
    // TEST 2: Second allowlisted email receives Founder role during registration
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Registration for Second Allowlisted Email ---');
    const res2 = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Badal Raj',
        email: 'badalraj1824@gmail.com',
        mobile: '9888800002',
        password: 'Lavanta@Founder123'
      })
    });
    const data2 = await res2.json();
    assert(res2.status === 201, 6, 'HTTP 201 returned for badalraj1824@gmail.com registration');
    assert(data2.user?.role === 'FOUNDER', 7, 'API response assigns role: FOUNDER', data2.user);
    assert(data2.user?.department === 'Executive', 8, 'API response assigns department: Executive');
    assert(data2.user?.designation === 'Founder', 9, 'API response assigns designation: Founder');

    const dbUser2 = await UserModel.findOne({ email: 'badalraj1824@gmail.com' });
    assert(dbUser2 !== null && dbUser2.role === 'FOUNDER', 10, 'MongoDB persisted user record role is FOUNDER');

    // -------------------------------------------------------------------------
    // TEST 3: Email capitalization and whitespace normalization
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Email Capitalization and Whitespace Normalization ---');
    const variations = [
      '  aditibundela094@gmail.com  ',
      'ADITIBUNDELA094@GMAIL.COM',
      '  AditiBundela094@Gmail.Com  ',
      '  badalraj1824@gmail.com  ',
      'BADALRAJ1824@GMAIL.COM',
      '  BadalRaj1824@Gmail.Com  '
    ];
    let allNormalizedMatch = true;
    for (const v of variations) {
      if (!isAllowlistedFounderEmail(v)) {
        allNormalizedMatch = false;
        break;
      }
    }
    assert(allNormalizedMatch, 11, 'All case and whitespace email variations correctly matched allowlist');
    assert(normalizeEmail('  AditiBundela094@Gmail.COM  ') === 'aditibundela094@gmail.com', 12, 'Email correctly trimmed and lowercased');

    // -------------------------------------------------------------------------
    // TEST 4: Non-allowlisted email cannot obtain Founder privileges
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Non-Allowlisted Email Privilege Escalation Prevention ---');
    const res4 = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal User',
        email: 'unauthorized_test_user@gmail.com',
        mobile: '9888800003',
        password: 'Lavanta@User123',
        role: 'FOUNDER', // Malicious client attempt to claim FOUNDER
        department: 'Executive'
      })
    });
    const data4 = await res4.json();
    assert(res4.status === 201, 13, 'HTTP 201 returned for regular registration');
    assert(data4.user?.role === 'EMPLOYEE', 14, 'Server overrides client role with EMPLOYEE (cannot request FOUNDER)', data4.user?.role);

    const dbUser4 = await UserModel.findOne({ email: 'unauthorized_test_user@gmail.com' });
    assert(dbUser4 !== null && dbUser4.role === 'EMPLOYEE', 15, 'MongoDB persisted user record role is EMPLOYEE');

    // -------------------------------------------------------------------------
    // TEST 5: Existing accounts retain current role without automatic promotion
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Role Preservation on Login ---');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'unauthorized_test_user@gmail.com',
        password: 'Lavanta@User123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginData.user?.role === 'EMPLOYEE', 16, 'Existing user login preserves existing role (EMPLOYEE)');

    // -------------------------------------------------------------------------
    // TEST 6: Founder access persists across login, refresh (/auth/me), and session
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Founder Session & Login Persistence ---');
    const founderLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'aditibundela094@gmail.com',
        password: 'Lavanta@Founder123'
      })
    });
    const founderLoginData = await founderLoginRes.json();
    assert(founderLoginData.user?.role === 'FOUNDER', 17, 'Founder login returns role: FOUNDER');

    const meRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${founderLoginData.token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user?.role === 'FOUNDER', 18, 'Session validation (/api/auth/me) returns role: FOUNDER');

    // -------------------------------------------------------------------------
    // TEST 7: Founder-only backend routes enforce authorization
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Founder-Only Route Protection ---');
    const founderOverviewRes = await fetch(`${API_BASE}/founder/overview`, {
      headers: { Authorization: `Bearer ${founderLoginData.token}` }
    });
    assert(founderOverviewRes.status === 200, 19, 'Founder token granted access to /api/founder/overview (HTTP 200)');

    const unauthorizedOverviewRes = await fetch(`${API_BASE}/founder/overview`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    assert(unauthorizedOverviewRes.status === 403, 20, 'Employee token rejected from /api/founder/overview (HTTP 403 Forbidden)');

    // -------------------------------------------------------------------------
    // TEST 8: Duplicate registrations rejected appropriately
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Duplicate Registration Rejection ---');
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditi Duplicate Attempt',
        email: 'aditibundela094@gmail.com',
        mobile: '9888800001',
        password: 'Lavanta@Founder123'
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 21, 'Duplicate registration rejected with HTTP 409 Conflict');
    assert(dupData.message.includes('Current role: FOUNDER'), 22, 'Duplicate message reports existing account role (FOUNDER)');
    assert(dupData.message.includes('authorized Founder must approve'), 23, 'Duplicate message specifies Founder approval requirement');

    // -------------------------------------------------------------------------
    // TEST 9: Prevention of self-role modification via profile or user API
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Self-Role Modification Prevention ---');
    const profileRoleTamperRes = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ role: 'FOUNDER' })
    });
    assert(profileRoleTamperRes.status === 403, 24, 'Profile update with role rejected with HTTP 403 Forbidden');

    const userPatchTamperRes = await fetch(`${API_BASE}/users/${loginData.user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ role: 'FOUNDER' })
    });
    assert(userPatchTamperRes.status === 403, 25, 'Self updateUser with role rejected with HTTP 403 Forbidden');

    // Verify user role remained EMPLOYEE in database
    const verifyUnchanged = await UserModel.findById(loginData.user.id);
    assert(verifyUnchanged?.role === 'EMPLOYEE', 26, 'User role remained EMPLOYEE despite tampering attempts');

  } finally {
    // Clean up temporary non-allowlisted test account
    await UserModel.deleteOne({ email: 'unauthorized_test_user@gmail.com' });
    await mongoose.disconnect();
  }

  const allPassed = results.every(r => r.passed);
  console.log('\n🌿 ===================================================');
  console.log(`🌿 VERIFICATION SUMMARY: ${results.filter(r => r.passed).length}/${results.length} TESTS PASSED`);
  console.log(allPassed ? '🌿 ALL REQUIREMENTS SUCCESSFULLY VERIFIED' : '🌿 SOME TESTS FAILED');
  console.log('🌿 ===================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
