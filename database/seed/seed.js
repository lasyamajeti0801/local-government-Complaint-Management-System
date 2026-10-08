const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getDb, run, exec, query } = require('../db');

async function seed() {
  console.log('🌱 Starting Nagar Connect database seed...');
  await getDb();

  // Hash passwords
  const salt = bcrypt.genSaltSync(10);
  const hashPass = (pw) => bcrypt.hashSync(pw, salt);

  const citizenHash = hashPass('Citizen@123');
  const officerHash = hashPass('Officer@123');
  const fieldHash = hashPass('Field@123');
  const adminHash = hashPass('Admin@123');
  const commHash = hashPass('Comm@123');
  const knowHash = hashPass('Know@123');
  const superHash = hashPass('Super@123');

  // 1. Roles
  const roles = [
    { id: 'ROLE_CITIZEN', name: 'CITIZEN', description: 'Resident citizen submitting & tracking civic complaints' },
    { id: 'ROLE_OFFICER', name: 'OFFICER', description: 'Department nodal officer managing queue, SLAs and assignment' },
    { id: 'ROLE_FIELD_STAFF', name: 'FIELD_STAFF', description: 'Field engineer or crew executing on-ground resolutions' },
    { id: 'ROLE_MUNICIPAL_ADMIN', name: 'MUNICIPAL_ADMIN', description: 'Administrative director overseeing civic municipal operations' },
    { id: 'ROLE_COMMISSIONER', name: 'COMMISSIONER', description: 'Municipal Commissioner holding city-wide executive authority' },
    { id: 'ROLE_KNOWLEDGE_ADMIN', name: 'KNOWLEDGE_ADMIN', description: 'Curator & knowledge engineer managing RAG documents and policies' },
    { id: 'ROLE_SUPER_ADMIN', name: 'SUPER_ADMIN', description: 'System administrator controlling security, RBAC and configurations' }
  ];

  for (const r of roles) {
    await run(
      `INSERT OR REPLACE INTO roles (id, name, description) VALUES (?, ?, ?)`,
      [r.id, r.name, r.description]
    );
  }

  // 2. Departments
  const departments = [
    { id: 'DEPT_WATER', code: 'WTR', name: 'Water Supply & Distribution', desc: 'Potable water distribution, pipeline maintenance, leakages, and booster pumps', sla: 24 },
    { id: 'DEPT_SANITATION', code: 'SAN', name: 'Sanitation & Waste Management', desc: 'Door-to-door garbage collection, street sweeping, dump sites, and segregation', sla: 24 },
    { id: 'DEPT_ROADS', code: 'RDS', name: 'Roads & Civil Infrastructure', desc: 'Pothole restoration, asphalt resurfacing, footpaths, and storm dividers', sla: 72 },
    { id: 'DEPT_LIGHTING', code: 'LGT', name: 'Street Lighting & Electricals', desc: 'LED pole maintenance, glowing high-masts, dark corridors, and wiring', sla: 24 },
    { id: 'DEPT_DRAINAGE', code: 'DRN', name: 'Drainage & Sewerage Systems', desc: 'Desilting culverts, open drains, manhole covers, and stormwater overflows', sla: 36 },
    { id: 'DEPT_HEALTH', code: 'HLT', name: 'Public Health & Vector Control', desc: 'Anti-larval fogging, stray animal management, food safety, and sanitization', sla: 48 },
    { id: 'DEPT_PARKS', code: 'PRK', name: 'Parks & Urban Greenery', desc: 'Horticulture, municipal parks, tree trimming, and playground equipment', sla: 96 },
    { id: 'DEPT_ADMIN', code: 'ADM', name: 'General Municipal Administration', desc: 'Civic permits, revenue, public records, grievance redressal governance', sla: 48 }
  ];

  for (const d of departments) {
    await run(
      `INSERT OR REPLACE INTO departments (id, code, name, description, sla_hours_default) VALUES (?, ?, ?, ?, ?)`,
      [d.id, d.code, d.name, d.desc, d.sla]
    );
  }

  // 3. Demo Users
  const users = [
    {
      id: 'usr_citizen_1',
      full_name: 'Priya Sharma',
      email: 'citizen@nagarconnect.gov.in',
      password_hash: citizenHash,
      phone: '+91 98450 12345',
      role_id: 'ROLE_CITIZEN',
      department_id: null,
      designation: 'Resident Citizen',
      ward_number: 'Ward 14 - Gandhinagar',
      address: 'House #42, 3rd Cross, Gandhinagar'
    },
    {
      id: 'usr_officer_water',
      full_name: 'Er. Rajesh Verma',
      email: 'officer.water@nagarconnect.gov.in',
      password_hash: officerHash,
      phone: '+91 98450 23456',
      role_id: 'ROLE_OFFICER',
      department_id: 'DEPT_WATER',
      designation: 'Assistant Executive Engineer (Water)',
      employee_id: 'EMP-WTR-042',
      ward_number: 'Zones 1-4'
    },
    {
      id: 'usr_officer_sanitation',
      full_name: 'Dr. Anita Deshmukh',
      email: 'officer.sanitation@nagarconnect.gov.in',
      password_hash: officerHash,
      phone: '+91 98450 34567',
      role_id: 'ROLE_OFFICER',
      department_id: 'DEPT_SANITATION',
      designation: 'Chief Health & Sanitation Inspector',
      employee_id: 'EMP-SAN-108',
      ward_number: 'Central Zone'
    },
    {
      id: 'usr_field_ramesh',
      full_name: 'Ramesh Kumar',
      email: 'field.ramesh@nagarconnect.gov.in',
      password_hash: fieldHash,
      phone: '+91 98450 45678',
      role_id: 'ROLE_FIELD_STAFF',
      department_id: 'DEPT_ROADS',
      designation: 'Senior Field Technician (Infrastructure)',
      employee_id: 'EMP-FLD-301',
      ward_number: 'Ward 14 & 15'
    },
    {
      id: 'usr_admin',
      full_name: 'Sunil Kulkarni',
      email: 'admin@nagarconnect.gov.in',
      password_hash: adminHash,
      phone: '+91 98450 56789',
      role_id: 'ROLE_MUNICIPAL_ADMIN',
      department_id: 'DEPT_ADMIN',
      designation: 'Additional Municipal Commissioner',
      employee_id: 'EMP-ADM-005',
      ward_number: 'All Zones'
    },
    {
      id: 'usr_commissioner',
      full_name: 'Dr. Meenakshi Sundaram, IAS',
      email: 'commissioner@nagarconnect.gov.in',
      password_hash: commHash,
      phone: '+91 98450 67890',
      role_id: 'ROLE_COMMISSIONER',
      department_id: 'DEPT_ADMIN',
      designation: 'Municipal Commissioner',
      employee_id: 'IAS-MC-001',
      ward_number: 'City Jurisdiction'
    },
    {
      id: 'usr_knowledge_admin',
      full_name: 'Vikramaditya Sengupta',
      email: 'knowledge.admin@nagarconnect.gov.in',
      password_hash: knowHash,
      phone: '+91 98450 78901',
      role_id: 'ROLE_KNOWLEDGE_ADMIN',
      department_id: 'DEPT_ADMIN',
      designation: 'Chief Knowledge Officer & RAG Lead',
      employee_id: 'EMP-KNO-012',
      ward_number: 'Central Headquarters'
    },
    {
      id: 'usr_superadmin',
      full_name: 'System Security Master',
      email: 'superadmin@nagarconnect.gov.in',
      password_hash: superHash,
      phone: '+91 98450 99999',
      role_id: 'ROLE_SUPER_ADMIN',
      department_id: 'DEPT_ADMIN',
      designation: 'Chief Information Security Officer',
      employee_id: 'SYS-SEC-001',
      ward_number: 'Global'
    }
  ];

  for (const u of users) {
    await run(
      `INSERT OR REPLACE INTO users (id, full_name, email, password_hash, phone, role_id, department_id, designation, employee_id, ward_number, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.full_name, u.email, u.password_hash, u.phone, u.role_id, u.department_id, u.designation, u.employee_id || null, u.ward_number, u.address || null]
    );
  }

  // 4. Complaint Categories
  const categories = [
    { id: 'CAT_WTR_LEAK', dept: 'DEPT_WATER', name: 'Water Main Leakage & Burst Pipe', code: 'WTR-LEAK', prio: 'HIGH', sla: 24 },
    { id: 'CAT_WTR_CONTAM', dept: 'DEPT_WATER', name: 'Contaminated / Muddy Water Supply', code: 'WTR-CONT', prio: 'CRITICAL', sla: 12 },
    { id: 'CAT_SAN_GARBAGE', dept: 'DEPT_SANITATION', name: 'Uncollected Street Garbage', code: 'SAN-GARB', prio: 'MEDIUM', sla: 24 },
    { id: 'CAT_SAN_OVERFLOW', dept: 'DEPT_SANITATION', name: 'Overflowing Community Dustbin', code: 'SAN-BINS', prio: 'HIGH', sla: 16 },
    { id: 'CAT_RDS_POTHOLE', dept: 'DEPT_ROADS', name: 'Deep Dangerous Road Pothole', code: 'RDS-POTH', prio: 'HIGH', sla: 48 },
    { id: 'CAT_RDS_FOOTPATH', dept: 'DEPT_ROADS', name: 'Broken Pedestrian Footpath / Slab', code: 'RDS-FOOT', prio: 'LOW', sla: 96 },
    { id: 'CAT_LGT_DARK', dept: 'DEPT_LIGHTING', name: 'Streetlight Not Functioning / Dark Corridor', code: 'LGT-DARK', prio: 'MEDIUM', sla: 24 },
    { id: 'CAT_DRN_BLOCKED', dept: 'DEPT_DRAINAGE', name: 'Blocked Stormwater Drain / Waterlogging', code: 'DRN-BLOK', prio: 'HIGH', sla: 24 },
    { id: 'CAT_HLT_FOGGING', dept: 'DEPT_HEALTH', name: 'Mosquito Breeding & Request for Fogging', code: 'HLT-FOG', prio: 'MEDIUM', sla: 48 },
    { id: 'CAT_PRK_TREE', dept: 'DEPT_PARKS', name: 'Dangerous Overhanging Tree Branch', code: 'PRK-TREE', prio: 'MEDIUM', sla: 48 }
  ];

  for (const c of categories) {
    await run(
      `INSERT OR REPLACE INTO complaint_categories (id, department_id, name, code, default_priority, sla_hours) VALUES (?, ?, ?, ?, ?, ?)`,
      [c.id, c.dept, c.name, c.code, c.prio, c.sla]
    );
  }

  // 5. Sample Complaints across realistic lifecycle
  const complaints = [
    {
      id: 'cmp_001',
      tracking_id: 'NGC-2026-000001',
      citizen_id: 'usr_citizen_1',
      category_id: 'CAT_RDS_POTHOLE',
      department_id: 'DEPT_ROADS',
      title: 'Severe pothole crater near Subhash Chowk junction',
      desc: 'A 2-foot wide pothole crater has formed right after the monsoon shower. Two two-wheelers skidded yesterday. Immediate asphalt filling needed before evening traffic.',
      address: 'Opposite State Bank Branch, Subhash Chowk, Main Road',
      landmark: 'Near SBI ATM',
      ward: 'Ward 14',
      prio: 'HIGH',
      status: 'IN_PROGRESS',
      sla_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
    },
    {
      id: 'cmp_002',
      tracking_id: 'NGC-2026-000002',
      citizen_id: 'usr_citizen_1',
      category_id: 'CAT_WTR_LEAK',
      department_id: 'DEPT_WATER',
      title: 'High-pressure underground water pipe burst',
      desc: 'Treated drinking water is flooding the street from an underground pipeline fracture since 6 AM. Millions of liters are being wasted.',
      address: '7th Cross Road, Ashok Nagar Colony',
      landmark: 'Near Water Tank #3',
      ward: 'Ward 11',
      prio: 'CRITICAL',
      status: 'ASSIGNED',
      sla_deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    },
    {
      id: 'cmp_003',
      tracking_id: 'NGC-2026-000003',
      citizen_id: 'usr_citizen_1',
      category_id: 'CAT_SAN_GARBAGE',
      department_id: 'DEPT_SANITATION',
      title: 'Commercial garbage dumped along market perimeter',
      desc: 'Multiple commercial vendors have discarded vegetable refuse and wet waste along the pavement. Intense foul smell and stray cattle gathering.',
      address: 'Vegetable Market Road, Ward 14',
      landmark: 'Backside of Municipal Market Complex',
      ward: 'Ward 14',
      prio: 'MEDIUM',
      status: 'RESOLUTION_SUBMITTED',
      sla_deadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
    },
    {
      id: 'cmp_004',
      tracking_id: 'NGC-2026-000004',
      citizen_id: 'usr_citizen_1',
      category_id: 'CAT_LGT_DARK',
      department_id: 'DEPT_LIGHTING',
      title: 'Consecutive streetlights out on Ring Road corridor',
      desc: 'Four consecutive LED streetlights (Poles L-14-102 to L-14-106) are completely dead. Road is pitch dark causing safety hazards for women and seniors.',
      address: 'Outer Ring Road, Sector B',
      landmark: 'Near Government High School',
      ward: 'Ward 14',
      prio: 'MEDIUM',
      status: 'RESOLVED',
      sla_deadline: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      resolution_summary: 'Replaced faulty 90W driver and loose cabling at Pole 104. All 4 luminaires tested and operational.'
    },
    {
      id: 'cmp_005',
      tracking_id: 'NGC-2026-000005',
      citizen_id: 'usr_citizen_1',
      category_id: 'CAT_DRN_BLOCKED',
      department_id: 'DEPT_DRAINAGE',
      title: 'Stormwater culvert clogged with plastic debris',
      desc: 'Storm culvert near railway underpass is heavily choked with silt and single-use plastic. Backflow entering service lane.',
      address: 'Railway Underpass Link Road',
      landmark: 'Culvert Bridge #2',
      ward: 'Ward 9',
      prio: 'HIGH',
      status: 'SUBMITTED',
      sla_deadline: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    }
  ];

  for (const cp of complaints) {
    await run(
      `INSERT OR REPLACE INTO complaints (id, tracking_id, citizen_id, category_id, department_id, title, description, location_address, landmark, ward_number, priority, status, sla_deadline, created_at, resolved_at, resolution_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cp.id, cp.tracking_id, cp.citizen_id, cp.category_id, cp.department_id, cp.title, cp.desc, cp.address, cp.landmark, cp.ward, cp.prio, cp.status, cp.sla_deadline, cp.created_at, cp.resolved_at || null, cp.resolution_summary || null]
    );

    // Initial Status History entry
    await run(
      `INSERT OR REPLACE INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`hist_${cp.id}_1`, cp.id, null, 'SUBMITTED', cp.citizen_id, 'Citizen logged complaint via Nagar Connect Portal', cp.created_at]
    );
  }

  // 6. Assignment & Field Task for cmp_001
  await run(
    `INSERT OR REPLACE INTO complaint_assignments (id, complaint_id, assigned_by_user_id, assigned_to_user_id, assigned_role, instructions, target_completion_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['asgn_001', 'cmp_001', 'usr_admin', 'usr_field_ramesh', 'FIELD_STAFF', 'Mobilize cold-mix asphalt patch team. Ensure traffic cone barriers.', new Date(Date.now() + 24 * 3600 * 1000).toISOString(), 'ACTIVE']
  );

  await run(
    `INSERT OR REPLACE INTO field_tasks (id, complaint_id, assignment_id, field_staff_id, task_title, task_description, state, arrived_at, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['task_001', 'cmp_001', 'asgn_001', 'usr_field_ramesh', 'Asphalt Patch Repair - Subhash Chowk', 'Fill and level 2ft pothole with bitumen cold-mix and mechanical vibratory plate compactor.', 'IN_PROGRESS', new Date(Date.now() - 2 * 3600 * 1000).toISOString(), new Date(Date.now() - 1 * 3600 * 1000).toISOString()]
  );

  await run(
    `INSERT OR REPLACE INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_user_id, remarks, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['hist_cmp_001_2', 'cmp_001', 'SUBMITTED', 'IN_PROGRESS', 'usr_field_ramesh', 'Field Staff Ramesh Kumar arrived on site with equipment and began asphalt patching', new Date(Date.now() - 1 * 3600 * 1000).toISOString()]
  );

  // Resolution submitted task for cmp_003
  await run(
    `INSERT OR REPLACE INTO complaint_assignments (id, complaint_id, assigned_by_user_id, assigned_to_user_id, assigned_role, instructions, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['asgn_003', 'cmp_003', 'usr_officer_sanitation', 'usr_field_ramesh', 'FIELD_STAFF', 'Deploy sanitary tipper vehicle and clear accumulated refuse.', 'COMPLETED']
  );

  await run(
    `INSERT OR REPLACE INTO field_tasks (id, complaint_id, assignment_id, field_staff_id, task_title, task_description, state, completed_at, resolution_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['task_003', 'cmp_003', 'asgn_003', 'usr_field_ramesh', 'Sanitation Clearance - Market Perimeter', 'Cleared 1.8 MT wet organic waste using compactor vehicle. Sprayed lime powder.', 'RESOLUTION_SUBMITTED', new Date(Date.now() - 2 * 3600 * 1000).toISOString(), 'Site cleared and sanitized with disinfectant lime. Photographs uploaded. Awaiting officer sign-off.']
  );

  // Evidence sample
  await run(
    `INSERT OR REPLACE INTO complaint_evidence (id, complaint_id, field_task_id, uploaded_by_user_id, evidence_type, file_name, file_url, caption)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['evd_001', 'cmp_001', 'task_001', 'usr_citizen_1', 'INITIAL_PROOF', 'pothole_subhash_chowk.jpg', '/uploads/sample_pothole.jpg', 'Photograph of deep road crater submitted by citizen']
  );

  // Feedback for resolved complaint cmp_004
  await run(
    `INSERT OR REPLACE INTO complaint_feedback (id, complaint_id, citizen_id, rating, comment, is_satisfied)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['fb_004', 'cmp_004', 'usr_citizen_1', 5, 'Quick response! The streetlights were fixed within 24 hours. The street is safe again.', 1]
  );

  // Notices
  await run(
    `INSERT OR REPLACE INTO municipal_notices (id, title, content, department_id, priority)
     VALUES (?, ?, ?, ?, ?)`,
    ['ntc_001', 'Monsoon Drainage Clearing Drive Commences', 'All ward officers are instructed to complete pre-monsoon culvert desilting by 15th of this month. Citizens can report waterlogging hotspots directly via Nagar Connect.', 'DEPT_DRAINAGE', 'HIGH']
  );

  console.log('✅ Core foundation, authentication, complaints, and assignments seeded successfully!');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = { seed };
