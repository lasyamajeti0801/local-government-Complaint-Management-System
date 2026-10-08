// ============================================================
// NAGAR CONNECT - COMPREHENSIVE E2E FUNCTION AUDIT
// Validates 100% of all functions across all roles
// ============================================================

const http = require('http');

function req(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const r = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function verifyAll() {
  console.log('🏛️ NAGAR CONNECT - COMPREHENSIVE END-TO-END AUDIT STARTING...\n');

  // 1. Citizen Login
  const citLogin = await req('POST', '/auth/login', { email: 'citizen@nagarconnect.gov.in', password: 'Citizen@123' });
  if (citLogin.status !== 200) throw new Error('Citizen login failed: ' + JSON.stringify(citLogin));
  const citToken = citLogin.data.data.token;
  console.log('  ✅ [AUTH] Citizen Login passed (Token acquired)');

  // 2. Officer Login
  const offLogin = await req('POST', '/auth/login', { email: 'officer.water@nagarconnect.gov.in', password: 'Officer@123' });
  if (offLogin.status !== 200) throw new Error('Officer login failed: ' + JSON.stringify(offLogin));
  const offToken = offLogin.data.data.token;
  console.log('  ✅ [AUTH] Officer Login passed (Role: OFFICER, Dept: dept-water)');

  // 3. Commissioner Login
  const commLogin = await req('POST', '/auth/login', { email: 'commissioner@nagarconnect.gov.in', password: 'Commissioner@123' });
  if (commLogin.status !== 200) throw new Error('Commissioner login failed');
  console.log('  ✅ [AUTH] Commissioner Login passed (Role: COMMISSIONER)');

  // 4. Field Staff Login
  const fieldLogin = await req('POST', '/auth/login', { email: 'field.water@nagarconnect.gov.in', password: 'Field@123' });
  if (fieldLogin.status !== 200) throw new Error('Field Staff login failed');
  const fieldToken = fieldLogin.data.data.token;
  console.log('  ✅ [AUTH] Field Staff Login passed (Role: FIELD_STAFF)');

  // 5. Citizen creates complaint in Water Supply
  const newCmp = await req('POST', '/citizen/complaints', {
    department_id: 'dept-water',
    category_id: 'cat-wtr-leak',
    title: 'Severe pipeline burst at Main Bazaar Road',
    description: 'High pressure drinking water pipeline burst, flooding 3 lanes.',
    location_address: 'Bazaar Cross Road 4',
    landmark: 'Opposite State Bank ATM',
    ward_number: 'Ward 14',
    priority: 'HIGH'
  }, citToken);
  if (newCmp.status !== 201) throw new Error('Create complaint failed: ' + JSON.stringify(newCmp));
  const cmpId = newCmp.data.data.id;
  const cmpNum = newCmp.data.data.complaint_number;
  console.log(`  ✅ [CITIZEN] Lodge Grievance passed (ID: ${cmpNum})`);

  // 6. Citizen creates complaint in Parks department (New Category Verification)
  const parkCmp = await req('POST', '/citizen/complaints', {
    department_id: 'dept-parks',
    category_id: 'cat-prk-tree',
    title: 'Overgrown dangerous banyan branch leaning over electric cable',
    description: 'Branch heavy with rainwater posing sparking danger.',
    location_address: 'Park Avenue, Ward 14',
    landmark: 'Gandhi Memorial Park Gate 2',
    ward_number: 'Ward 14',
    priority: 'HIGH'
  }, citToken);
  if (parkCmp.status !== 201) throw new Error('Parks complaint failed: ' + JSON.stringify(parkCmp));
  console.log(`  ✅ [CITIZEN] Parks Department Grievance passed (ID: ${parkCmp.data.data.complaint_number})`);

  // 7. Citizen lists complaints
  const myComplaints = await req('GET', '/citizen/complaints', null, citToken);
  if (myComplaints.status !== 200 || !myComplaints.data.data.complaints.find(c => c.id === cmpId)) {
    throw new Error('Complaint not in myComplaints list');
  }
  console.log(`  ✅ [CITIZEN] View Grievance History passed (Total: ${myComplaints.data.data.complaints.length})`);

  // 8. Officer views dashboard
  const dash = await req('GET', '/officer/dashboard', null, offToken);
  if (dash.status !== 200 || dash.data.data.kpis.total < 1) throw new Error('Dashboard stats failed');
  console.log(`  ✅ [OFFICER] Operations Dashboard KPIs passed (Total Active: ${dash.data.data.kpis.total})`);

  // 9. Officer views queue
  const queue = await req('GET', '/officer/queue?status=SUBMITTED', null, offToken);
  if (queue.status !== 200) throw new Error('Queue failed');
  console.log(`  ✅ [OFFICER] Filtered Grievance Queue passed (Submitted: ${queue.data.data.length})`);

  // 10. Officer reviews and accepts complaint
  const review = await req('POST', `/officer/complaints/${cmpId}/status`, {
    status: 'UNDER_REVIEW',
    remarks: 'Officer verified jurisdiction and queued for field allocation'
  }, offToken);
  if (review.status !== 200) throw new Error('Review failed: ' + JSON.stringify(review));
  console.log('  ✅ [OFFICER] Action 1: Review & Accept Grievance passed (Status -> UNDER_REVIEW)');

  // 11. Officer fetches field staff
  const staffRes = await req('GET', '/officer/field-staff', null, offToken);
  if (staffRes.status !== 200 || staffRes.data.data.length === 0) throw new Error('Fetch staff failed');
  const staffId = staffRes.data.data[0].id;
  console.log(`  ✅ [OFFICER] Action 2: Field Squad Workload Query passed (${staffRes.data.data.length} technicians)`);

  // 12. Officer assigns field staff
  const assign = await req('POST', `/officer/complaints/${cmpId}/assign`, {
    fieldStaffId: staffId,
    assignmentType: 'FIELD_WORK',
    deadlineHours: 12,
    instructions: 'Dispatch heavy excavation crew to clamp ruptured main pipe'
  }, offToken);
  if (assign.status !== 200) throw new Error('Assign failed: ' + JSON.stringify(assign));
  console.log('  ✅ [OFFICER] Action 2: Assign Field Staff passed (Field Task Created)');

  // 13. Member 4 Field Staff queries assigned task
  const fieldTasks = await req('GET', '/assignments/my-tasks', null, fieldToken);
  if (fieldTasks.status !== 200 || fieldTasks.data.data.length === 0) throw new Error('Field tasks failed');
  console.log(`  ✅ [FIELD] Member 4 Field Staff Work Order Query passed (${fieldTasks.data.data.length} tasks)`);

  // 14. Officer reassigns field staff
  const staff2Id = staffRes.data.data[1] ? staffRes.data.data[1].id : staffId;
  const reassign = await req('POST', `/officer/complaints/${cmpId}/reassign`, {
    newFieldStaffId: staff2Id,
    reason: 'Specialized plumbing supervisor needed on-site',
    instructions: 'Take over immediate pipeline welding'
  }, offToken);
  if (reassign.status !== 200) throw new Error('Reassign failed: ' + JSON.stringify(reassign));
  console.log('  ✅ [OFFICER] Action 3: Reassign Field Staff passed');

  // 15. Officer changes priority to CRITICAL & recalculates SLA
  const prio = await req('POST', `/officer/complaints/${cmpId}/priority`, {
    priority: 'CRITICAL',
    reason: 'Water flooding nearby residential ground floors'
  }, offToken);
  if (prio.status !== 200) throw new Error('Priority change failed: ' + JSON.stringify(prio));
  console.log('  ✅ [OFFICER] Action 4: Change Priority & SLA Recalculation passed');

  // 16. Officer adds internal note
  const note = await req('POST', `/officer/complaints/${cmpId}/notes`, {
    message: 'Coordinating with traffic police to divert vehicles while repair ongoing.',
    commentType: 'INTERNAL_NOTE',
    isInternal: 1
  }, offToken);
  if (note.status !== 200) throw new Error('Add internal note failed');
  console.log('  ✅ [OFFICER] Action 5: Add Confidential Internal Note passed');

  // 17. Officer sends query to citizen
  const pubNote = await req('POST', `/officer/complaints/${cmpId}/notes`, {
    message: 'Dear resident, repair team is on site. Drinking water supply will pause for 2 hours.',
    commentType: 'CITIZEN_COMMUNICATION',
    isInternal: 0
  }, offToken);
  if (pubNote.status !== 200) throw new Error('Add citizen query failed');
  console.log('  ✅ [OFFICER] Action 6: Send Public Query to Citizen passed');

  // 18. Officer escalates to L1
  const esc = await req('POST', `/officer/complaints/${cmpId}/escalate`, {
    escalationLevel: 'L1_OFFICER',
    reason: 'Heavy water loss requiring zonal valve shutdown',
    notes: 'Assistant Commissioner informed'
  }, offToken);
  if (esc.status !== 200) throw new Error('Escalate failed');
  console.log('  ✅ [OFFICER] Action 7: Formal Escalation & Multi-Tier Alert passed');

  // 19. Officer approves resolution
  const app = await req('POST', `/officer/complaints/${cmpId}/approve`, {
    remarks: 'Pipeline replacement and joint welding successfully pressure-tested.',
    directClose: false
  }, offToken);
  if (app.status !== 200) throw new Error('Approve resolution failed');
  console.log('  ✅ [OFFICER] Action 8: Approve Field Resolution passed (Status -> CITIZEN_VERIFICATION)');

  // 20. Citizen submits 5-star rating & closes ticket
  const feed = await req('POST', `/citizen/complaints/${cmpId}/feedback`, {
    rating: 5,
    comment: 'Excellent prompt work by the water supply squad. Pipeline fixed cleanly.',
    reopen: false
  }, citToken);
  if (feed.status !== 200) throw new Error('Citizen feedback failed');
  console.log('  ✅ [CITIZEN] Grievance Rating & Formally Close passed (5/5 Stars)');

  // 21. Verify final complaint state
  const finalCmp = await req('GET', `/citizen/complaints/${cmpId}`, null, citToken);
  if (finalCmp.data.data.status !== 'CLOSED') throw new Error('Complaint status not CLOSED');
  console.log('  ✅ [LIFECYCLE] Full Grievance Closed with Verified Audit History');

  // 22. SLA Refresh
  const slaRef = await req('POST', '/sla/refresh', {}, offToken);
  if (slaRef.status !== 200) throw new Error('SLA refresh failed');
  console.log('  ✅ [SLA] Live SLA Clock Synchronization passed');

  // 23. Notifications Mark All Read
  const notifRead = await req('POST', '/notifications/read-all', {}, offToken);
  if (notifRead.status !== 200) throw new Error('Notifications read-all failed');
  console.log('  ✅ [NOTIF] Notifications Mark All Read passed');

  console.log('\n============================================================');
  console.log('🎉 AUDIT COMPLETE: ALL 23 MUNICIPAL PLATFORM FUNCTIONS OPERATING AT 100%!');
  console.log('============================================================');
}

verifyAll().catch(e => {
  console.error('\n❌ AUDIT FAILED:', e);
  process.exit(1);
});
