/**
 * Nagar Connect - Member 1 to 4 Integration Tests
 */
const assert = require('assert');
const bcrypt = require('bcryptjs');
const { get: dbGet, query: dbQuery, run: dbRun } = require('../database/db');

async function runCoreTests() {
  console.log('\n🧪 ===============================================');
  console.log('🧪 RUNNING MEMBER 1 - 4 WORKFLOW & DATABASE TESTS');
  console.log('🧪 ===============================================\n');

  // Test Auth & Users
  console.log('▶ Test 1: User Authentication & Role Verification');
  const citizen = await dbGet("SELECT * FROM users WHERE email = 'citizen@nagarconnect.gov.in'");
  assert(citizen, 'Citizen user must exist in seed');
  assert.strictEqual(citizen.role, 'CITIZEN', 'Role must be CITIZEN');
  const passOk = bcrypt.compareSync('Citizen@123', citizen.password_hash);
  assert(passOk, 'Password verification must pass');
  console.log('  ✅ Test 1 Passed: Citizen authentication is valid.\n');

  // Test Complaints
  console.log('▶ Test 2: Complaint Lifecycles & Entities');
  const complaints = await dbQuery('SELECT * FROM complaints');
  assert(complaints.length >= 5, 'Seed complaints must be present');
  console.log(`  Found ${complaints.length} complaints across departments.`);
  console.log('  ✅ Test 2 Passed: Shared complaint entity is active.\n');

  // Test Field Task & Timeline
  console.log('▶ Test 3: Field Task & Timeline Integration');
  const fieldTask = await dbGet("SELECT * FROM field_tasks WHERE task_state = 'IN_PROGRESS'");
  assert(fieldTask, 'In progress field task must exist');
  const timeline = await dbQuery('SELECT * FROM complaint_status_history WHERE complaint_id = ?', [fieldTask.complaint_id]);
  assert(timeline.length > 0, 'Timeline entries must exist');
  console.log(`  Complaint ${fieldTask.complaint_id} has ${timeline.length} timeline milestones.`);
  console.log('  ✅ Test 3 Passed: Field task & timeline integration verified.\n');

  console.log('🎉 ALL MEMBER 1-4 TESTS PASSED! 🏛️\n');
}

module.exports = { runCoreTests };
