const axios = require('axios');
const io = require('../client/node_modules/socket.io-client');

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let doctorToken = '';
let patientAToken = '';
let patientBToken = '';
let patientAId = '';
let patientBId = '';
let doctorRecordId = '';
let patientAAppointmentId = '';

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol}: ${name}`);
  if (details) console.log(`   Details: ${details}`);
}

async function runRBACTests() {
  console.log('\n======================================================');
  console.log('   CLINIC QUEUE MANAGEMENT SYSTEM - RBAC SECURITY TEST');
  console.log('======================================================\n');

  try {
    // 0. Setup: Authenticate Admin & Doctor, Register Patients
    console.log('--- Setting up test accounts ---');

    // Admin login (with 2FA support if enabled)
    const adminRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@clinic.com',
      password: 'admin123'
    });
    if (adminRes.data.requires2FA) {
      const verifyRes = await axios.post(`${BASE_URL}/api/auth/2fa/verify`, {
        email: 'admin@clinic.com',
        code: adminRes.data.mockOTP
      });
      adminToken = verifyRes.data.token;
    } else {
      adminToken = adminRes.data.token;
    }

    // Doctor login (with 2FA support if enabled)
    const docRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'dr.akash@clinic.com',
      password: 'doctor123'
    });
    if (docRes.data.requires2FA) {
      const verifyRes = await axios.post(`${BASE_URL}/api/auth/2fa/verify`, {
        email: 'dr.akash@clinic.com',
        code: docRes.data.mockOTP
      });
      doctorToken = verifyRes.data.token;
    } else {
      doctorToken = docRes.data.token;
    }

    // Get doctor record ID
    const docListRes = await axios.get(`${BASE_URL}/api/doctors`);
    const docRecord = docListRes.data.find(d => d.email === 'dr.akash@clinic.com') || docListRes.data[0];
    doctorRecordId = docRecord._id;

    // Register Patient A
    const patientAEmail = `test_patient_a_${Date.now()}@example.com`;
    const patientARes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Patient Alice',
      email: patientAEmail,
      password: 'password123',
      phone: '9811111111'
    });
    patientAToken = patientARes.data.token;
    patientAId = patientARes.data.user.id || patientARes.data.user._id;

    // Register Patient B
    const patientBEmail = `test_patient_b_${Date.now()}@example.com`;
    const patientBRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Patient Bob',
      email: patientBEmail,
      password: 'password123',
      phone: '9822222222'
    });
    patientBToken = patientBRes.data.token;
    patientBId = patientBRes.data.user.id || patientBRes.data.user._id;

    // Patient A books an appointment with doctor
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const apptRes = await axios.post(
      `${BASE_URL}/api/appointments`,
      { doctorId: doctorRecordId, date: dateStr, time: '10:00' },
      { headers: { Authorization: `Bearer ${patientAToken}` } }
    );
    patientAAppointmentId = apptRes.data._id;
    console.log(`Setup complete. Patient A Appt ID: ${patientAAppointmentId}\n`);

    // TEST 1: Patient attempting to access Admin API
    try {
      await axios.get(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${patientAToken}` }
      });
      recordTest('Test 1: Patient accessing Admin API (GET /api/users)', false, 'Expected 403 Forbidden, but request succeeded');
    } catch (err) {
      const status = err.response?.status;
      recordTest('Test 1: Patient accessing Admin API (GET /api/users)', status === 403, `HTTP ${status}: ${err.response?.data?.message}`);
    }

    // TEST 2: Doctor attempting to access Admin API
    try {
      await axios.get(`${BASE_URL}/api/analytics/predictive`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      recordTest('Test 2: Doctor accessing Admin API (GET /api/analytics/predictive)', false, 'Expected 403 Forbidden, but request succeeded');
    } catch (err) {
      const status = err.response?.status;
      recordTest('Test 2: Doctor accessing Admin API (GET /api/analytics/predictive)', status === 403, `HTTP ${status}: ${err.response?.data?.message}`);
    }

    // TEST 3: ID Tampering - Patient B attempting to access Patient A's appointment
    try {
      await axios.get(`${BASE_URL}/api/appointments/${patientAAppointmentId}`, {
        headers: { Authorization: `Bearer ${patientBToken}` }
      });
      recordTest('Test 3: ID Tampering (Patient B accessing Patient A appointment)', false, 'Expected 403 Forbidden, but Patient B viewed Patient A data');
    } catch (err) {
      const status = err.response?.status;
      recordTest('Test 3: ID Tampering (Patient B accessing Patient A appointment)', status === 403, `HTTP ${status}: ${err.response?.data?.message}`);
    }

    // TEST 4: Role Tampering in Registration Body
    try {
      const fakeAdminRes = await axios.post(`${BASE_URL}/api/auth/register`, {
        name: 'Hacker Admin',
        email: `fake_admin_${Date.now()}@clinic.com`,
        password: 'password123',
        role: 'admin' // Attempting privilege escalation
      });
      recordTest('Test 4: Role tampering in registration body (role: admin)', false, 'Expected 403 Forbidden, but got 200/201');
    } catch (err) {
      const status = err.response?.status;
      recordTest('Test 4: Role tampering in registration body (role: admin)', status === 403, `HTTP ${status}: ${err.response?.data?.message}`);
    }

    // TEST 5: Role Tampering in Profile Update
    try {
      await axios.put(
        `${BASE_URL}/api/auth/profile`,
        { role: 'admin' },
        { headers: { Authorization: `Bearer ${patientAToken}` } }
      );
      // Double check if role actually changed
      const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${patientAToken}` }
      });
      const roleNotChanged = meRes.data.user.role === 'patient';
      recordTest('Test 5: Role tampering in profile update (elevate to admin)', roleNotChanged, `Role remained '${meRes.data.user.role}'`);
    } catch (err) {
      const status = err.response?.status;
      recordTest('Test 5: Role tampering in profile update (elevate to admin)', status === 403, `HTTP ${status}: ${err.response?.data?.message}`);
    }

    // TEST 6: Patient tampering with token number or priority on booking
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const tamperedBooking = await axios.post(
      `${BASE_URL}/api/appointments`,
      {
        doctorId: doctorRecordId,
        date: dayAfterStr,
        time: '11:00',
        tokenNumber: 999, // Tampered token
        priority: 'emergency' // Tampered priority
      },
      { headers: { Authorization: `Bearer ${patientBToken}` } }
    );
    const prioritySanitized = tamperedBooking.data.priority === 'normal';
    const tokenSanitized = tamperedBooking.data.tokenNumber !== 999;
    recordTest(
      'Test 6: Patient tampering with token number & priority on booking',
      prioritySanitized && tokenSanitized,
      `Allocated token: #${tamperedBooking.data.tokenNumber} (not 999), Priority: '${tamperedBooking.data.priority}' (not 'emergency')`
    );

    // TEST 7: Unauthenticated request to protected APIs
    try {
      await axios.get(`${BASE_URL}/api/appointments/my`);
      recordTest('Test 7: Unauthenticated access to protected API (GET /api/appointments/my)', false, 'Expected 401 Unauthorized');
    } catch (err) {
      const status = err.response?.status;
      recordTest('Test 7: Unauthenticated access to protected API (GET /api/appointments/my)', status === 401, `HTTP ${status}: ${err.response?.data?.message}`);
    }

    // TEST 8: Socket.IO Authentication & Room Isolation
    const socketAuthPromise = new Promise((resolve) => {
      const guestSocket = io(BASE_URL, {
        auth: { token: patientAToken } // Patient A socket
      });

      guestSocket.on('connect', () => {
        // Patient A tries to join doctor room
        guestSocket.emit('join', `doctor_${doctorRecordId}`);
      });

      guestSocket.on('error', (err) => {
        guestSocket.disconnect();
        resolve({ blocked: true, message: err.message });
      });

      setTimeout(() => {
        guestSocket.disconnect();
        resolve({ blocked: false, message: 'No error emitted after timeout' });
      }, 1500);
    });

    const socketResult = await socketAuthPromise;
    recordTest(
      'Test 8: Socket.IO room isolation (Patient trying to join private Doctor room)',
      socketResult.blocked,
      socketResult.message
    );

    // TEST 9: Atomic Token Generation & Race Conditions
    console.log('   Running concurrent token race test (10 simultaneous bookings)...');
    const raceDate = new Date();
    raceDate.setDate(raceDate.getDate() + 5);
    const raceDateStr = raceDate.toISOString().split('T')[0];

    // Create 10 patient accounts to book simultaneously
    const tokens = [];
    const bookingPromises = [];
    for (let i = 0; i < 10; i++) {
      const pEmail = `race_patient_${Date.now()}_${i}@test.com`;
      const pReg = await axios.post(`${BASE_URL}/api/auth/register`, {
        name: `Race Patient ${i}`,
        email: pEmail,
        password: 'password123',
        phone: `983333333${i}`
      });
      tokens.push(pReg.data.token);
    }

    // Fire all 10 booking requests at the exact same millisecond
    for (let i = 0; i < 10; i++) {
      bookingPromises.push(
        axios.post(
          `${BASE_URL}/api/appointments`,
          { doctorId: doctorRecordId, date: raceDateStr, time: `09:${10 + i}` },
          { headers: { Authorization: `Bearer ${tokens[i]}` } }
        )
      );
    }

    const raceResponses = await Promise.all(bookingPromises);
    const allocatedTokens = raceResponses.map(r => r.data.tokenNumber);
    const uniqueTokens = new Set(allocatedTokens);
    const hasNoDuplicates = uniqueTokens.size === 10;
    recordTest(
      'Test 9: Atomic token generation & race conditions (10 concurrent bookings)',
      hasNoDuplicates,
      `Allocated tokens: [${allocatedTokens.sort((a,b)=>a-b).join(', ')}] (Unique: ${uniqueTokens.size}/10)`
    );

    // TEST 10: Deactivated user session rejection
    console.log('   Deactivating Patient B account via Admin endpoint...');
    await axios.patch(
      `${BASE_URL}/api/users/${patientBId}/status`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    // Patient B now attempts to use their pre-existing valid JWT
    try {
      await axios.get(`${BASE_URL}/api/appointments/my`, {
        headers: { Authorization: `Bearer ${patientBToken}` }
      });
      recordTest('Test 10: Deactivated user session rejection', false, 'Expected 403 Forbidden, but deactivated session was accepted');
    } catch (err) {
      const status = err.response?.status;
      recordTest(
        'Test 10: Deactivated user session rejection (immediate session blocking)',
        status === 403,
        `HTTP ${status}: ${err.response?.data?.message}`
      );
    }

  } catch (unexpectedErr) {
    console.error('Unexpected test harness error:', unexpectedErr);
  } finally {
    if (adminToken) {
      try {
        const usersRes = await axios.get(`${BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const testUsers = (usersRes.data || []).filter(u => 
          u.email && (u.email.startsWith('test_patient_') || u.email.startsWith('race_patient_'))
        );
        for (const u of testUsers) {
          await axios.delete(`${BASE_URL}/api/users/${u._id}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          }).catch(() => {});
        }
      } catch (e) {}
    }
  }

  // Summary
  console.log('\n======================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`RBAC SECURITY AUDIT SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('======================================================\n');
}

runRBACTests();
