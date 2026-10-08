// =============================================================
// NAGAR CONNECT — MEMBER 4
// tests/member4/fieldTask.test.js
// Comprehensive test suite for Field Operations.
// Framework: Jest + Supertest (matches M1/M2/M3 test pattern)
// =============================================================

const request = require('supertest');
const app     = require('../../backend/app'); // M1 Express app
const { pool } = require('../../backend/utils/db');

// ─────────────────────────────────────────
// Test data (tokens obtained from M1 auth)
// ─────────────────────────────────────────
let citizenToken,  officerToken,  fieldStaffToken,
    fieldStaff2Token, adminToken;

let testComplaintId, testAssignmentId, testTaskId;

// ─────────────────────────────────────────
// SETUP: login as all demo roles
// ─────────────────────────────────────────
beforeAll(async () => {
  const login = async (email, password) => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    return res.body.data.token;
  };

  [
    citizenToken,
    officerToken,
    fieldStaffToken,
    fieldStaff2Token,
    adminToken,
  ] = await Promise.all([
    login('citizen_1@nagarconnect.gov.in',      'Demo@1234'),
    login('officer_1@nagarconnect.gov.in',       'Demo@1234'),
    login('field_staff_1@nagarconnect.gov.in',   'Demo@1234'),
    login('field_staff_2@nagarconnect.gov.in',   'Demo@1234'),
    login('municipal_admin@nagarconnect.gov.in', 'Demo@1234'),
  ]);

  // Create a complaint as citizen
  const compRes = await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      title:             'Test road pothole — M4 test',
      description:       'Large pothole near test park gate causing accidents.',
      category:          'Roads & Infrastructure',
      location_address:  '12 Test Road, Hyderabad',
      location_landmark: 'Near Test Park Gate',
      priority:          'HIGH',
    });
  expect(compRes.status).toBe(201);
  testComplaintId = compRes.body.data.complaint.id;
});

afterAll(async () => {
  await pool.end();
});

// ─────────────────────────────────────────
// SECTION 1: Officer assigning field staff
// ─────────────────────────────────────────
describe('Officer → Assign Field Staff', () => {
  test('Officer can assign a field staff to a complaint', async () => {
    const res = await request(app)
      .post(`/api/officer/complaints/${testComplaintId}/assign-field-staff`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ fieldStaffId: (await getFieldStaffId(pool)) });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task).toHaveProperty('id');
    expect(res.body.data.task.status).toBe('ASSIGNED');
    testTaskId = res.body.data.task.id;
  });

  test('Citizen CANNOT assign field staff', async () => {
    const res = await request(app)
      .post(`/api/officer/complaints/${testComplaintId}/assign-field-staff`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ fieldStaffId: 'any-id' });
    expect(res.status).toBe(403);
  });

  test('Cannot assign to non-FIELD_STAFF user', async () => {
    const officerUserId = await getOfficerUserId(pool);
    const res = await request(app)
      .post(`/api/officer/complaints/${testComplaintId}/assign-field-staff`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ fieldStaffId: officerUserId });
    expect(res.status).toBe(400);
  });

  test('Cannot create duplicate active task for same complaint', async () => {
    const staffId = await getFieldStaffId(pool);
    const res = await request(app)
      .post(`/api/officer/complaints/${testComplaintId}/assign-field-staff`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ fieldStaffId: staffId });
    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────
// SECTION 2: Field Staff Dashboard
// ─────────────────────────────────────────
describe('Field Staff Dashboard', () => {
  test('Field staff can load dashboard', async () => {
    const res = await request(app)
      .get('/api/field/dashboard')
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('counts');
    expect(res.body.data).toHaveProperty('todayTasks');
    expect(res.body.data).toHaveProperty('pendingTasks');
  });

  test('Citizen CANNOT access field dashboard', async () => {
    const res = await request(app)
      .get('/api/field/dashboard')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  test('Unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/field/dashboard');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────
// SECTION 3: Task List
// ─────────────────────────────────────────
describe('Field Task List', () => {
  test('Field staff can list their tasks', async () => {
    const res = await request(app)
      .get('/api/field/tasks')
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
  });

  test('Can filter tasks by status', async () => {
    const res = await request(app)
      .get('/api/field/tasks?status=ASSIGNED')
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
    res.body.data.tasks.forEach((t) => expect(t.status).toBe('ASSIGNED'));
  });

  test('Can filter tasks by priority', async () => {
    const res = await request(app)
      .get('/api/field/tasks?priority=HIGH')
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
    res.body.data.tasks.forEach((t) =>
      expect(['HIGH', 'CRITICAL']).toContain(t.complaint_priority)
    );
  });

  test('Can search tasks', async () => {
    const res = await request(app)
      .get('/api/field/tasks?search=pothole')
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────
// SECTION 4: Task Detail
// ─────────────────────────────────────────
describe('Field Task Detail', () => {
  test('Field staff can view their own task', async () => {
    const res = await request(app)
      .get(`/api/field/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testTaskId);
    expect(res.body.data).toHaveProperty('statusHistory');
    expect(res.body.data).toHaveProperty('evidence');
  });

  test('Different field staff CANNOT view task (IDOR protection)', async () => {
    const res = await request(app)
      .get(`/api/field/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${fieldStaff2Token}`);
    expect(res.status).toBe(403);
  });

  test('Officer CAN view task detail', async () => {
    const res = await request(app)
      .get(`/api/field/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
  });

  test('Citizen CANNOT view field task detail', async () => {
    const res = await request(app)
      .get(`/api/field/tasks/${testTaskId}`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  test('Invalid task ID returns 404', async () => {
    const res = await request(app)
      .get('/api/field/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────
// SECTION 5: Task Lifecycle — Happy Path
// ─────────────────────────────────────────
describe('Task Lifecycle — Happy Path', () => {
  test('ASSIGNED → ACCEPTED', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${testTaskId}/accept`)
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('ACCEPTED');
  });

  test('ACCEPTED → ARRIVED', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${testTaskId}/arrive`)
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('ARRIVED');
  });

  test('ARRIVED → IN_PROGRESS', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${testTaskId}/start`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({ workNotes: 'Site inspection started. Pothole confirmed at 3m diameter.' });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('IN_PROGRESS');
  });

  test('Can add work notes without status change', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${testTaskId}/notes`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({ notes: 'Filling started. Road base applied.' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('IN_PROGRESS → WORK_COMPLETED (requires workDescription)', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${testTaskId}/complete`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({
        workDescription: 'Pothole filled with cold mix asphalt and compacted. Surface leveled. Bitumen applied.',
        workNotes:       'Final inspection passed.',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('WORK_COMPLETED');
  });

  test('WORK_COMPLETED → RESOLUTION_SUBMITTED', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${testTaskId}/submit-resolution`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({
        resolutionNotes: 'Pothole has been completely repaired. Road surface is smooth and safe for traffic. No further action required.',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('RESOLUTION_SUBMITTED');
  });
});

// ─────────────────────────────────────────
// SECTION 6: Officer Verification
// ─────────────────────────────────────────
describe('Officer Verification', () => {
  test('Officer can approve a submitted resolution', async () => {
    const res = await request(app)
      .post(`/api/officer/tasks/${testTaskId}/verify-resolution`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ approved: true, remarks: 'Field work verified on site photos. Approved.' });
    expect(res.status).toBe(200);
    expect(res.body.data.approved).toBe(true);
  });

  test('Field staff CANNOT verify resolution', async () => {
    const res = await request(app)
      .post(`/api/officer/tasks/${testTaskId}/verify-resolution`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({ approved: true });
    expect(res.status).toBe(403);
  });

  test('Cannot verify task not in RESOLUTION_SUBMITTED status', async () => {
    // Try to re-verify an already-processed task
    const res = await request(app)
      .post(`/api/officer/tasks/${testTaskId}/verify-resolution`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ approved: true });
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────
// SECTION 7: Invalid Status Transitions
// ─────────────────────────────────────────
describe('Invalid Status Transitions', () => {
  let newTaskId;

  beforeAll(async () => {
    // Create fresh complaint + task in ASSIGNED state
    const compRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Transition test complaint',
        description: 'Testing invalid transitions.',
        category: 'Sanitation',
        location_address: '5 Test Street',
        priority: 'MEDIUM',
      });
    const complaintId = compRes.body.data.complaint.id;
    const taskRes = await request(app)
      .post(`/api/officer/complaints/${complaintId}/assign-field-staff`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ fieldStaffId: await getFieldStaffId(pool) });
    newTaskId = taskRes.body.data.task.id;
  });

  test('ASSIGNED → ARRIVED is invalid (must go ASSIGNED→ACCEPTED→ARRIVED)', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${newTaskId}/arrive`)
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(422);
  });

  test('ASSIGNED → RESOLUTION_SUBMITTED is invalid', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${newTaskId}/submit-resolution`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({ resolutionNotes: 'This should fail.' });
    expect(res.status).toBe(422);
  });

  test('ASSIGNED → WORK_COMPLETED is invalid', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${newTaskId}/complete`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({ workDescription: 'This should also fail.' });
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────
// SECTION 8: Cannot Resolve
// ─────────────────────────────────────────
describe('Cannot Resolve', () => {
  let cannotTaskId;

  beforeAll(async () => {
    const compRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Cannot resolve test', description: 'Test cannot resolve.',
        category: 'Drainage', location_address: '9 Test Lane', priority: 'LOW',
      });
    const taskRes = await request(app)
      .post(`/api/officer/complaints/${compRes.body.data.complaint.id}/assign-field-staff`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ fieldStaffId: await getFieldStaffId(pool) });
    cannotTaskId = taskRes.body.data.task.id;
  });

  test('Cannot resolve requires reason', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${cannotTaskId}/cannot-resolve`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({ cannotResolveReason: 'short' }); // too short
    expect(res.status).toBe(400);
  });

  test('Valid cannot-resolve submission', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${cannotTaskId}/cannot-resolve`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({
        cannotResolveReason: 'Issue requires specialized PWD team. Underground main pipe leak beyond field staff scope.',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('CANNOT_RESOLVE');
  });

  test('Cannot take further action after CANNOT_RESOLVE (terminal)', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${cannotTaskId}/accept`)
      .set('Authorization', `Bearer ${fieldStaffToken}`);
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────
// SECTION 9: Evidence Upload
// ─────────────────────────────────────────
describe('Evidence Upload', () => {
  let evidenceTaskId;

  beforeAll(async () => {
    // Create + advance task to IN_PROGRESS
    const compRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Evidence test complaint', description: 'Testing evidence upload.',
        category: 'Street Lighting', location_address: '3 Evidence Street', priority: 'MEDIUM',
      });
    const cid = compRes.body.data.complaint.id;
    const taskRes = await request(app)
      .post(`/api/officer/complaints/${cid}/assign-field-staff`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ fieldStaffId: await getFieldStaffId(pool) });
    evidenceTaskId = taskRes.body.data.task.id;

    // Advance to IN_PROGRESS
    await request(app).post(`/api/field/tasks/${evidenceTaskId}/accept`).set('Authorization', `Bearer ${fieldStaffToken}`);
    await request(app).post(`/api/field/tasks/${evidenceTaskId}/arrive`).set('Authorization', `Bearer ${fieldStaffToken}`);
    await request(app).post(`/api/field/tasks/${evidenceTaskId}/start`).set('Authorization', `Bearer ${fieldStaffToken}`).send({});
  });

  test('Can upload a before photo', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${evidenceTaskId}/evidence`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .field('evidenceCategory', 'BEFORE_PHOTO')
      .field('description', 'Streetlight completely dark.')
      .attach('file', Buffer.from('fake-image-content'), { filename: 'before.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
    expect(res.body.data.evidence.evidence_category).toBe('BEFORE_PHOTO');
  });

  test('Rejects file over size limit', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
    const res = await request(app)
      .post(`/api/field/tasks/${evidenceTaskId}/evidence`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .field('evidenceCategory', 'AFTER_PHOTO')
      .attach('file', largeBuffer, { filename: 'huge.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(413);
  });

  test('Rejects invalid evidence category', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${evidenceTaskId}/evidence`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .field('evidenceCategory', 'INVALID_CATEGORY')
      .attach('file', Buffer.from('x'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
  });

  test('Different field staff CANNOT upload to another staff task (IDOR)', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${evidenceTaskId}/evidence`)
      .set('Authorization', `Bearer ${fieldStaff2Token}`)
      .field('evidenceCategory', 'BEFORE_PHOTO')
      .attach('file', Buffer.from('x'), { filename: 'hack.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
  });

  test('Citizen CANNOT upload evidence to field task', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${evidenceTaskId}/evidence`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('evidenceCategory', 'BEFORE_PHOTO')
      .attach('file', Buffer.from('x'), { filename: 'citizen.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────
// SECTION 10: Escalation
// ─────────────────────────────────────────
describe('Escalation', () => {
  let escalateTaskId;

  beforeAll(async () => {
    const compRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Escalation test', description: 'Test escalation flow.',
        category: 'Water Supply', location_address: '7 Water Lane', priority: 'CRITICAL',
      });
    const taskRes = await request(app)
      .post(`/api/officer/complaints/${compRes.body.data.complaint.id}/assign-field-staff`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ fieldStaffId: await getFieldStaffId(pool) });
    escalateTaskId = taskRes.body.data.task.id;
    // Accept first
    await request(app).post(`/api/field/tasks/${escalateTaskId}/accept`).set('Authorization', `Bearer ${fieldStaffToken}`);
  });

  test('Escalation requires reason of 10+ chars', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${escalateTaskId}/escalate`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({ escalationReason: 'short' });
    expect(res.status).toBe(400);
  });

  test('Valid escalation changes status to NEEDS_ESCALATION', async () => {
    const res = await request(app)
      .post(`/api/field/tasks/${escalateTaskId}/escalate`)
      .set('Authorization', `Bearer ${fieldStaffToken}`)
      .send({
        escalationReason: 'Main water supply pipe requires municipal engineering team. Work is beyond field staff scope.',
        escalationNotes:  'Leak is estimated at 50 liters/minute. Requires heavy machinery.',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('NEEDS_ESCALATION');
  });
});

// ─────────────────────────────────────────
// SECTION 11: Regression — M1/M2/M3 not broken
// ─────────────────────────────────────────
describe('Regression — Previous Members', () => {
  test('M1: Auth login still works', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen_1@nagarconnect.gov.in', password: 'Demo@1234' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  test('M2: Citizen can still create complaint', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Regression test complaint',
        description: 'Testing M2 regression.',
        category: 'Roads & Infrastructure',
        location_address: 'Test Road',
        priority: 'LOW',
      });
    expect(res.status).toBe(201);
  });

  test('M2: Citizen can list their complaints', async () => {
    const res = await request(app)
      .get('/api/complaints/my')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
  });

  test('M3: Officer can list complaints queue', async () => {
    const res = await request(app)
      .get('/api/officer/complaints')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
async function getFieldStaffId(pool) {
  const res = await pool.query(
    `SELECT id FROM users WHERE email = 'field_staff_1@nagarconnect.gov.in' LIMIT 1`
  );
  return res.rows[0]?.id;
}

async function getOfficerUserId(pool) {
  const res = await pool.query(
    `SELECT id FROM users WHERE email = 'officer_1@nagarconnect.gov.in' LIMIT 1`
  );
  return res.rows[0]?.id;
}
