// ============================================================
// NAGAR CONNECT - SYSTEM INTEGRATION & VERIFICATION TEST SUITE
// Tests Member 1 Foundation + Member 2 Citizen + Member 3 Officer
// ============================================================

const assert = require('assert');
const authService = require('../backend/services/authService');
const complaintService = require('../backend/services/complaintService');
const officerService = require('../backend/services/officerService');
const assignmentService = require('../backend/services/assignmentService');
const slaService = require('../backend/services/slaService');
const db = require('../backend/config/db');

async function runTestSuite() {
  console.log('🏛️ NAGAR CONNECT TEST SUITE STARTING...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
      failed++;
    }
  }

  // ------------------------------------------------------------
  // SECTION 1: MEMBER 1 (Foundation + Auth + RBAC + DB)
  // ------------------------------------------------------------
  console.log('--- SECTION 1: MEMBER 1 (Foundation, Auth, RBAC) ---');

  let citizenAuth, officerWaterAuth, fieldWaterAuth;

  test('M1.1: Citizen login with valid credentials returns JWT and role', () => {
    citizenAuth = authService.login('citizen@nagarconnect.gov.in', 'Citizen@123');
    assert(citizenAuth.token, 'Token must exist');
    assert.strictEqual(citizenAuth.user.role, 'CITIZEN');
    assert.strictEqual(citizenAuth.user.email, 'citizen@nagarconnect.gov.in');
  });

  test('M1.2: Officer login returns JWT, role OFFICER, and department', () => {
    officerWaterAuth = authService.login('officer.water@nagarconnect.gov.in', 'Officer@123');
    assert(officerWaterAuth.token, 'Token must exist');
    assert.strictEqual(officerWaterAuth.user.role, 'OFFICER');
    assert.strictEqual(officerWaterAuth.user.department_id, 'dept-water');
  });

  test('M1.3: Field Staff login returns role FIELD_STAFF', () => {
    fieldWaterAuth = authService.login('field.water@nagarconnect.gov.in', 'Field@123');
    assert(fieldWaterAuth.token);
    assert.strictEqual(fieldWaterAuth.user.role, 'FIELD_STAFF');
  });

  test('M1.4: Invalid credentials throw 401 Unauthorized', () => {
    assert.throws(() => {
      authService.login('citizen@nagarconnect.gov.in', 'WrongPassword!');
    }, /Invalid municipal credentials/);
  });

  // ------------------------------------------------------------
  // SECTION 2: MEMBER 2 (Citizen Complaint Lodging & Tracking)
  // ------------------------------------------------------------
  console.log('\n--- SECTION 2: MEMBER 2 (Citizen Complaint Portal) ---');

  let createdComplaintId;
  let createdComplaintNumber;

  test('M2.1: Citizen creates new complaint with realistic NGC-2026-XXXXXX number', () => {
    const complaint = complaintService.createComplaint(citizenAuth.user.id, {
      title: 'Water valve broken at Ward 14 circle',
      description: 'Underground municipal valve is leaking potable water onto the road continuously.',
      department_id: 'dept-water',
      category_id: 'cat-wtr-leak',
      location_address: 'Gandhi Circle, Ward 14',
      landmark: 'Near Gandhi Statue',
      ward_number: 'Ward 14',
      priority: 'HIGH'
    });

    assert(complaint.id, 'Complaint ID must exist');
    assert(complaint.complaint_number.startsWith('NGC-2026-'), 'Complaint number format NGC-2026-XXXXXX');
    assert.strictEqual(complaint.status, 'SUBMITTED');
    assert.strictEqual(complaint.priority, 'HIGH');
    assert(complaint.sla_deadline, 'SLA deadline must be calculated');

    createdComplaintId = complaint.id;
    createdComplaintNumber = complaint.complaint_number;
  });

  test('M2.2: Complaint appears in Citizen My Complaints list', () => {
    const { complaints, stats } = complaintService.getCitizenComplaints(citizenAuth.user.id);
    assert(complaints.length > 0);
    const found = complaints.find(c => c.id === createdComplaintId);
    assert(found, 'Created complaint must appear in citizen list');
    assert(stats.total >= 1);
  });

  test('M2.3: Complaint timeline includes SUBMITTED event', () => {
    const complaint = complaintService.getComplaintById(createdComplaintId, citizenAuth.user);
    assert(complaint.timeline.length >= 1);
    assert.strictEqual(complaint.timeline[0].new_status, 'SUBMITTED');
  });

  // ------------------------------------------------------------
  // SECTION 3: MEMBER 3 (Department Officer Management)
  // ------------------------------------------------------------
  console.log('\n--- SECTION 3: MEMBER 3 (Department Officer Management) ---');

  test('M3.1: Officer views Dashboard KPIs (New, Assigned, Pending, Overdue, Escalated)', () => {
    const stats = officerService.getDashboardStats(officerWaterAuth.user);
    assert(stats.kpis, 'KPIs object must exist');
    assert(typeof stats.kpis.total === 'number');
    assert(typeof stats.kpis.newComplaints === 'number');
    assert(typeof stats.kpis.overdue === 'number');
    assert(Array.isArray(stats.categoryStats));
    assert(Array.isArray(stats.recentActivity));
  });

  test('M3.2: Officer views Queue and finds newly submitted complaint with SLA metrics', () => {
    const queue = officerService.getQueue(officerWaterAuth.user, { status: 'SUBMITTED' });
    const found = queue.find(c => c.id === createdComplaintId);
    assert(found, 'Officer should see newly created complaint in queue');
    assert(found.sla_metrics, 'SLA metrics must be computed');
    assert(found.sla_metrics.formattedRemaining, 'Remaining SLA text must exist');
  });

  test('M3.3: Officer reviews complaint and transitions status to UNDER_REVIEW', () => {
    const updated = officerService.updateStatus(officerWaterAuth.user, createdComplaintId, 'UNDER_REVIEW', 'Reviewed and verified location.');
    assert.strictEqual(updated.status, 'UNDER_REVIEW');
    const lastTimeline = updated.timeline[updated.timeline.length - 1];
    assert.strictEqual(lastTimeline.new_status, 'UNDER_REVIEW');
    assert.strictEqual(lastTimeline.action, 'REVIEWED');
  });

  test('M3.4: Officer assigns field staff Ramesh Kumar (Contract ready for Member 4)', () => {
    const updated = officerService.assignFieldStaff(officerWaterAuth.user, createdComplaintId, {
      fieldStaffId: fieldWaterAuth.user.id,
      assignmentType: 'FIELD_WORK',
      instructions: 'Repair 150mm valve gasket and conduct pressure test',
      priority: 'HIGH',
      deadlineHours: 12
    });

    assert.strictEqual(updated.status, 'ASSIGNED');
    assert(updated.assignments.length >= 1);
    const latestAsg = updated.assignments[0];
    assert.strictEqual(latestAsg.assigned_to_user_id, fieldWaterAuth.user.id);
    assert.strictEqual(latestAsg.instructions, 'Repair 150mm valve gasket and conduct pressure test');

    // Verify task created in field_tasks table for Member 4
    const task = db.get('SELECT * FROM field_tasks WHERE complaint_id = ?', [createdComplaintId]);
    assert(task, 'Field task must be created for Member 4');
    assert.strictEqual(task.field_staff_id, fieldWaterAuth.user.id);
    assert.strictEqual(task.status, 'ASSIGNED');
  });

  test('M3.5: Officer reassigns complaint to another technician (B. Mahesh Babu)', () => {
    const updated = officerService.reassignFieldStaff(officerWaterAuth.user, createdComplaintId, {
      newFieldStaffId: 'usr-field-water-2',
      instructions: 'Urgent reassignment: bring dewatering pump',
      reason: 'Ramesh Kumar engaged in emergency mainline burst'
    });

    const activeAsg = updated.assignments.find(a => a.status === 'PENDING' || a.status === 'ACCEPTED');
    assert(activeAsg, 'Active assignment must exist');
    assert.strictEqual(activeAsg.assigned_to_user_id, 'usr-field-water-2');

    // Old assignment marked REASSIGNED
    const oldAsg = updated.assignments.find(a => a.status === 'REASSIGNED');
    assert(oldAsg, 'Old assignment must be marked REASSIGNED');
  });

  test('M3.6: Officer modifies priority to CRITICAL and recalculates SLA deadline', () => {
    const oldDeadline = db.get('SELECT sla_deadline FROM complaints WHERE id = ?', [createdComplaintId]).sla_deadline;
    const updated = officerService.changePriority(officerWaterAuth.user, createdComplaintId, 'CRITICAL', 'Heavy flooding endangering nearby transformer');

    assert.strictEqual(updated.priority, 'CRITICAL');
    assert.notStrictEqual(updated.sla_deadline, oldDeadline);
  });

  test('M3.7: Officer adds internal note (restricted from citizen view)', () => {
    const comments = officerService.addComment(officerWaterAuth.user, createdComplaintId, {
      message: 'Notified Assistant Engineer Electrical to temporarily isolate sub-station.',
      commentType: 'INTERNAL_NOTE',
      isInternal: 1
    });

    assert(comments.length >= 1);
    const last = comments[comments.length - 1];
    assert.strictEqual(last.is_internal, 1);

    // Verify Citizen cannot view this internal comment
    const citizenView = complaintService.getComplaintById(createdComplaintId, citizenAuth.user);
    const leaked = citizenView.comments.find(c => c.id === last.id);
    assert.strictEqual(leaked, undefined, 'Citizen must NOT see internal officer notes');
  });

  test('M3.8: Officer escalates complaint to L1_OFFICER with reason', () => {
    const updated = officerService.escalate(officerWaterAuth.user, createdComplaintId, {
      escalationLevel: 'L1_OFFICER',
      reason: 'PUBLIC_SAFETY',
      notes: 'Water pooling near electrical substation.'
    });

    assert.strictEqual(updated.is_escalated, 1);
    assert.strictEqual(updated.escalation_level, 'L1_OFFICER');
    assert(updated.escalations.length >= 1);
  });

  test('M3.9: Member 4 Field Staff queries assigned tasks via shared API', () => {
    const tasks = assignmentService.getFieldStaffTasks('usr-field-water-2');
    assert(tasks.length >= 1);
    const foundTask = tasks.find(t => t.complaint_id === createdComplaintId);
    assert(foundTask, 'Field staff must be able to retrieve assigned task');
    assert.strictEqual(foundTask.complaint_number, createdComplaintNumber);
  });

  test('M3.10: Officer approves resolution and moves ticket to CITIZEN_VERIFICATION', () => {
    const updated = officerService.approveResolution(officerWaterAuth.user, createdComplaintId, {
      remarks: 'Valve replaced with PN16 ductile iron unit. Hydro-tested at 4 bar pressure. Satisfactory.'
    });

    assert.strictEqual(updated.status, 'CITIZEN_VERIFICATION');
    assert(updated.resolution_summary.includes('Hydro-tested'));
  });

  test('M3.11: Citizen submits 5-star feedback and complaint closes', () => {
    const closed = complaintService.submitFeedback(citizenAuth.user.id, createdComplaintId, {
      rating: 5,
      comment: 'Very fast repair by the municipal water works crew. Excellent service.'
    });

    assert.strictEqual(closed.status, 'CLOSED');
    assert(closed.closed_at);
    assert(closed.feedback);
    assert.strictEqual(closed.feedback.rating, 5);
  });

  console.log('\n============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().catch(e => {
    console.error('Fatal test error:', e);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
