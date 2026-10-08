const bcrypt = require('bcryptjs');
const { getDb, query, run, exec, initSchema } = require('../db');

async function seed() {
  console.log('🌱 Starting Nagar Connect Database Seeding...');
  await initSchema();

  // Clear existing data for fresh seed if needed
  await exec(`
    DELETE FROM rag_responses;
    DELETE FROM rag_queries;
    DELETE FROM document_chunks;
    DELETE FROM document_versions;
    DELETE FROM documents;
    DELETE FROM notifications;
    DELETE FROM audit_logs;
    DELETE FROM municipal_notices;
    DELETE FROM system_settings;
    DELETE FROM complaint_feedback;
    DELETE FROM complaint_evidence;
    DELETE FROM complaint_comments;
    DELETE FROM field_tasks;
    DELETE FROM complaint_assignments;
    DELETE FROM complaint_status_history;
    DELETE FROM escalations;
    DELETE FROM complaints;
    DELETE FROM sla_rules;
    DELETE FROM complaint_categories;
    DELETE FROM users;
    DELETE FROM departments;
    DELETE FROM permissions;
    DELETE FROM roles;
  `);

  console.log('🧹 Cleaned existing tables.');

  // 1. ROLES
  const roles = [
    { id: 'ROLE_CITIZEN', name: 'CITIZEN', description: 'Resident citizen lodging grievances & checking public knowledge' },
    { id: 'ROLE_OFFICER', name: 'OFFICER', description: 'Departmental grievance redressal officer reviewing & assigning complaints' },
    { id: 'ROLE_FIELD_STAFF', name: 'FIELD_STAFF', description: 'Municipal field staff executing ground repairs & uploading evidence' },
    { id: 'ROLE_MUNICIPAL_ADMIN', name: 'MUNICIPAL_ADMIN', description: 'Municipal zone administrator managing operations & SLA' },
    { id: 'ROLE_COMMISSIONER', name: 'COMMISSIONER', description: 'Municipal Commissioner overlooking city-wide civic performance & intelligence' },
    { id: 'ROLE_KNOWLEDGE_ADMIN', name: 'KNOWLEDGE_ADMIN', description: 'Knowledge base administrator managing RAG documents, policies & indexing' },
    { id: 'ROLE_SUPER_ADMIN', name: 'SUPER_ADMIN', description: 'Platform super administrator managing users, roles, permissions & security' }
  ];

  for (const r of roles) {
    await run('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [r.id, r.name, r.description]);
  }
  console.log('✅ Roles seeded.');

  // 2. PERMISSIONS
  const permissions = [
    { role_id: 'ROLE_CITIZEN', perm: 'COMPLAINT_CREATE' },
    { role_id: 'ROLE_CITIZEN', perm: 'COMPLAINT_VIEW_OWN' },
    { role_id: 'ROLE_CITIZEN', perm: 'COMPLAINT_FEEDBACK' },
    { role_id: 'ROLE_CITIZEN', perm: 'RAG_QUERY_PUBLIC' },

    { role_id: 'ROLE_OFFICER', perm: 'COMPLAINT_VIEW_DEPT' },
    { role_id: 'ROLE_OFFICER', perm: 'COMPLAINT_ASSIGN' },
    { role_id: 'ROLE_OFFICER', perm: 'COMPLAINT_STATUS_UPDATE' },
    { role_id: 'ROLE_OFFICER', perm: 'COMPLAINT_ESCALATE' },
    { role_id: 'ROLE_OFFICER', perm: 'RAG_QUERY_OFFICER' },

    { role_id: 'ROLE_FIELD_STAFF', perm: 'FIELD_TASK_VIEW' },
    { role_id: 'ROLE_FIELD_STAFF', perm: 'FIELD_TASK_UPDATE' },
    { role_id: 'ROLE_FIELD_STAFF', perm: 'FIELD_EVIDENCE_UPLOAD' },
    { role_id: 'ROLE_FIELD_STAFF', perm: 'RAG_QUERY_FIELD' },

    { role_id: 'ROLE_MUNICIPAL_ADMIN', perm: 'ANALYTICS_VIEW' },
    { role_id: 'ROLE_MUNICIPAL_ADMIN', perm: 'DEPT_MANAGE' },
    { role_id: 'ROLE_MUNICIPAL_ADMIN', perm: 'RAG_QUERY_ADMIN' },

    { role_id: 'ROLE_COMMISSIONER', perm: 'CITY_INTELLIGENCE_VIEW' },
    { role_id: 'ROLE_COMMISSIONER', perm: 'EXECUTIVE_RAG' },

    { role_id: 'ROLE_KNOWLEDGE_ADMIN', perm: 'DOCUMENTS_MANAGE' },
    { role_id: 'ROLE_KNOWLEDGE_ADMIN', perm: 'RAG_INDEX_REBUILD' },

    { role_id: 'ROLE_SUPER_ADMIN', perm: 'ALL_ACCESS' }
  ];

  let pCount = 1;
  for (const p of permissions) {
    await run('INSERT INTO permissions (id, role_id, permission_name) VALUES (?, ?, ?)', [
      `PERM_${pCount++}`,
      p.role_id,
      p.perm
    ]);
  }
  console.log('✅ Permissions seeded.');

  // 3. DEPARTMENTS
  const departments = [
    {
      id: 'DEPT_WATER',
      name: 'Water Supply & Sewerage',
      code: 'WATER',
      description: 'Drinking water distribution, pipeline maintenance, leak repair & sewer lines',
      contact_email: 'water.support@nagarconnect.gov.in',
      contact_phone: '1800-425-9283',
      sla_hours: 24,
      icon: 'droplet'
    },
    {
      id: 'DEPT_SANITATION',
      name: 'Sanitation & Solid Waste',
      code: 'SANITATION',
      description: 'Door-to-door garbage collection, street sweeping & dump yard management',
      contact_email: 'sanitation@nagarconnect.gov.in',
      contact_phone: '1800-425-9284',
      sla_hours: 12,
      icon: 'trash-2'
    },
    {
      id: 'DEPT_ROADS',
      name: 'Roads & Infrastructure',
      code: 'ROADS',
      description: 'Pothole repairs, asphalt resurfacing, footpaths & road signage maintenance',
      contact_email: 'roads@nagarconnect.gov.in',
      contact_phone: '1800-425-9285',
      sla_hours: 72,
      icon: 'truck'
    },
    {
      id: 'DEPT_LIGHTING',
      name: 'Street Lighting & Electrical',
      code: 'LIGHTING',
      description: 'LED street lamp repairs, dark spot illumination & transformer feeder maintenance',
      contact_email: 'lighting@nagarconnect.gov.in',
      contact_phone: '1800-425-9286',
      sla_hours: 24,
      icon: 'zap'
    },
    {
      id: 'DEPT_DRAINAGE',
      name: 'Storm Water Drainage',
      code: 'DRAINAGE',
      description: 'Desilting of storm water drains, nala clearing & waterlogging mitigation',
      contact_email: 'drainage@nagarconnect.gov.in',
      contact_phone: '1800-425-9287',
      sla_hours: 36,
      icon: 'cloud-rain'
    },
    {
      id: 'DEPT_HEALTH',
      name: 'Public Health & Pest Control',
      code: 'HEALTH',
      description: 'Mosquito fogging, anti-larval operations, stray animal control & food hygiene',
      contact_email: 'health@nagarconnect.gov.in',
      contact_phone: '1800-425-9288',
      sla_hours: 24,
      icon: 'activity'
    },
    {
      id: 'DEPT_PARKS',
      name: 'Parks & Urban Greenery',
      code: 'PARKS',
      description: 'Public park maintenance, tree pruning, lawn upkeep & children play zones',
      contact_email: 'parks@nagarconnect.gov.in',
      contact_phone: '1800-425-9289',
      sla_hours: 48,
      icon: 'trees'
    },
    {
      id: 'DEPT_TOWN_PLANNING',
      name: 'Town Planning & Encroachments',
      code: 'TOWN_PLANNING',
      description: 'Unauthorized construction vigilance, road margin encroachment clearing',
      contact_email: 'townplanning@nagarconnect.gov.in',
      contact_phone: '1800-425-9290',
      sla_hours: 96,
      icon: 'map-pin'
    }
  ];

  for (const d of departments) {
    await run(
      'INSERT INTO departments (id, name, code, description, contact_email, contact_phone, sla_hours, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [d.id, d.name, d.code, d.description, d.contact_email, d.contact_phone, d.sla_hours, d.icon]
    );
  }
  console.log('✅ Departments seeded.');

  // 4. USERS (Demo accounts with hashed passwords)
  const salt = bcrypt.genSaltSync(10);
  const users = [
    {
      id: 'USR_CITIZEN_1',
      name: 'Ananya Sharma',
      email: 'citizen@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Citizen@123', salt),
      role: 'CITIZEN',
      department_id: null,
      phone: '+91 98765 43210',
      ward_number: 'Ward 42 (Jubilee Hills)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    },
    {
      id: 'USR_OFFICER_WATER',
      name: 'Rajesh Varma (AE - Water)',
      email: 'officer.water@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Officer@123', salt),
      role: 'OFFICER',
      department_id: 'DEPT_WATER',
      phone: '+91 98480 11223',
      ward_number: 'Zone 3 (Central)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 'USR_OFFICER_SANITATION',
      name: 'Kavita Reddy (SI - Sanitation)',
      email: 'officer.sanitation@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Officer@123', salt),
      role: 'OFFICER',
      department_id: 'DEPT_SANITATION',
      phone: '+91 98480 33445',
      ward_number: 'Zone 2 (North)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
      id: 'USR_FIELD_1',
      name: 'Ramesh Kumar (Field Lead)',
      email: 'field.ramesh@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Field@123', salt),
      role: 'FIELD_STAFF',
      department_id: 'DEPT_WATER',
      phone: '+91 97000 88991',
      ward_number: 'Ward 42 & 43',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    {
      id: 'USR_FIELD_2',
      name: 'Suresh Babu (Sanitation Lead)',
      email: 'field.suresh@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Field@123', salt),
      role: 'FIELD_STAFF',
      department_id: 'DEPT_SANITATION',
      phone: '+91 97000 88992',
      ward_number: 'Ward 38 & 39',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    {
      id: 'USR_ADMIN_1',
      name: 'Srinivas Rao (Zonal Admin)',
      email: 'admin@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Admin@123', salt),
      role: 'MUNICIPAL_ADMIN',
      department_id: null,
      phone: '+91 94400 55667',
      ward_number: 'HQ Administration',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
    },
    {
      id: 'USR_COMMISSIONER',
      name: 'Dr. Venkatesh Murthy IAS (Commissioner)',
      email: 'commissioner@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Commissioner@123', salt),
      role: 'COMMISSIONER',
      department_id: null,
      phone: '+91 94400 11000',
      ward_number: 'City Municipal HQ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    {
      id: 'USR_KNOWLEDGE_ADMIN',
      name: 'Pooja Hegde (Knowledge & AI Lead)',
      email: 'knowledge.admin@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Knowledge@123', salt),
      role: 'KNOWLEDGE_ADMIN',
      department_id: null,
      phone: '+91 98499 77889',
      ward_number: 'E-Governance & RAG Cell',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
    },
    {
      id: 'USR_SUPER_ADMIN',
      name: 'System Administrator',
      email: 'superadmin@nagarconnect.gov.in',
      password_hash: bcrypt.hashSync('Super@123', salt),
      role: 'SUPER_ADMIN',
      department_id: null,
      phone: '+91 99999 00000',
      ward_number: 'State Data Centre',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    }
  ];

  for (const u of users) {
    await run(
      'INSERT INTO users (id, name, email, password_hash, role, department_id, phone, ward_number, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.password_hash, u.role, u.department_id, u.phone, u.ward_number, u.avatar]
    );
  }
  console.log('✅ Demo users seeded.');

  // 5. COMPLAINT CATEGORIES
  const categories = [
    // Water
    { id: 'CAT_WTR_01', dept: 'DEPT_WATER', name: 'Main Pipeline Drinking Water Leakage', sla: 24, prio: 'HIGH', desc: 'Severe water loss or pressure drop in main supply lines' },
    { id: 'CAT_WTR_02', dept: 'DEPT_WATER', name: 'Contaminated / Muddy Water Supply', sla: 12, prio: 'CRITICAL', desc: 'Foul odor or contamination in tap water posing health risk' },
    { id: 'CAT_WTR_03', dept: 'DEPT_WATER', name: 'No Water Supply on Scheduled Time', sla: 18, prio: 'MEDIUM', desc: 'Disruption in residential distribution schedule' },
    { id: 'CAT_WTR_04', dept: 'DEPT_WATER', name: 'Sewer Line Choking / Manhole Overflow', sla: 12, prio: 'HIGH', desc: 'Raw sewage backflow onto roadway or residential lane' },
    // Sanitation
    { id: 'CAT_SAN_01', dept: 'DEPT_SANITATION', name: 'Garbage Dump Not Cleared / Overflowing Bin', sla: 12, prio: 'HIGH', desc: 'Public bin spilling over or waste rotting in open space' },
    { id: 'CAT_SAN_02', dept: 'DEPT_SANITATION', name: 'Door-to-Door Waste Collector Absent', sla: 24, prio: 'LOW', desc: 'Sanitation tipper did not arrive in street for 2+ days' },
    { id: 'CAT_SAN_03', dept: 'DEPT_SANITATION', name: 'Dead Animal Removal on Public Road', sla: 6, prio: 'CRITICAL', desc: 'Urgent sanitary removal of animal carcass' },
    { id: 'CAT_SAN_04', dept: 'DEPT_SANITATION', name: 'Commercial Debris Dumping on Footpath', sla: 36, prio: 'MEDIUM', desc: 'Illegal dumping of construction or commercial waste' },
    // Roads
    { id: 'CAT_RDS_01', dept: 'DEPT_ROADS', name: 'Deep Dangerous Pothole on Main Carriage-way', sla: 48, prio: 'HIGH', desc: 'Hazardous crater endangering 2-wheeler riders & traffic' },
    { id: 'CAT_RDS_02', dept: 'DEPT_ROADS', name: 'Broken Footpath Slab / Missing Paver Blocks', sla: 72, prio: 'MEDIUM', desc: 'Pedestrian hazard with exposed ditch' },
    { id: 'CAT_RDS_03', dept: 'DEPT_ROADS', name: 'Speed Breaker Repainting & Signage', sla: 96, prio: 'LOW', desc: 'Unmarked speed bump causing vehicular damage' },
    // Lighting
    { id: 'CAT_LGT_01', dept: 'DEPT_LIGHTING', name: 'Non-Functional Street Lights (Entire Street)', sla: 24, prio: 'HIGH', desc: 'Total darkness in street posing security risk' },
    { id: 'CAT_LGT_02', dept: 'DEPT_LIGHTING', name: 'Flickering / Damaged Single LED Fixture', sla: 48, prio: 'LOW', desc: 'Individual pole light failure' },
    { id: 'CAT_LGT_03', dept: 'DEPT_LIGHTING', name: 'Exposed Live Electrical Wires on Pole', sla: 4, prio: 'CRITICAL', desc: 'Immediate electrocution risk during rain/pedestrian movement' },
    // Drainage
    { id: 'CAT_DRN_01', dept: 'DEPT_DRAINAGE', name: 'Monsoon Waterlogging on Road Junction', sla: 12, prio: 'HIGH', desc: 'Severe water buildup impeding vehicular flow' },
    { id: 'CAT_DRN_02', dept: 'DEPT_DRAINAGE', name: 'Blocked Stormwater Grating / Silt Accumulation', sla: 36, prio: 'MEDIUM', desc: 'Clogged inlets preventing runoff flow' },
    // Health
    { id: 'CAT_HLT_01', dept: 'DEPT_HEALTH', name: 'Mosquito Breeding & Request for Fogging', sla: 24, prio: 'MEDIUM', desc: 'High mosquito density near stagnated water' },
    { id: 'CAT_HLT_02', dept: 'DEPT_HEALTH', name: 'Stray Dog Menace / Aggressive Pack Alert', sla: 24, prio: 'HIGH', desc: 'Bite risk or packs chasing night commuters' }
  ];

  for (const c of categories) {
    await run(
      'INSERT INTO complaint_categories (id, department_id, name, description, standard_sla_hours, default_priority) VALUES (?, ?, ?, ?, ?, ?)',
      [c.id, c.dept, c.name, c.desc, c.sla, c.prio]
    );
  }
  console.log('✅ Complaint categories seeded.');

  // 6. COMPLAINTS & LIFECYCLE SEEDING
  const now = new Date();
  const pastDays = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const futureHours = (h) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

  const seedComplaints = [
    {
      id: 'CMP_001',
      complaint_id: 'NGC-2026-000001',
      citizen_id: 'USR_CITIZEN_1',
      department_id: 'DEPT_WATER',
      category_id: 'CAT_WTR_01',
      title: 'Major drinking water pipeline burst with water gushing onto main road',
      description: 'The 300mm cast iron drinking water feeder line cracked near Road No. 36 junction. Thousands of liters of purified municipal water are getting wasted, flooding adjacent shops.',
      location_address: 'Plot 412, Road No. 36, Jubilee Hills',
      landmark: 'Opposite Peddamma Temple Metro Station Pillar 1284',
      ward_number: 'Ward 42',
      latitude: 17.4326,
      longitude: 78.4071,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      sla_deadline: futureHours(14),
      is_escalated: 0,
      created_at: pastDays(1)
    },
    {
      id: 'CMP_002',
      complaint_id: 'NGC-2026-000002',
      citizen_id: 'USR_CITIZEN_1',
      department_id: 'DEPT_SANITATION',
      category_id: 'CAT_SAN_01',
      title: 'Secondary waste collection dumper overflowing for 3 consecutive days',
      description: 'The community garbage container at corner of 5th cross has not been cleared since Tuesday. Stray cattle and dogs are scattering waste across school entrance.',
      location_address: 'Corner of 5th Cross & 2nd Main, Madhapur',
      landmark: 'Near Government High School Gate',
      ward_number: 'Ward 43',
      latitude: 17.4483,
      longitude: 78.3915,
      priority: 'HIGH',
      status: 'RESOLUTION_SUBMITTED',
      sla_deadline: futureHours(4),
      is_escalated: 0,
      created_at: pastDays(2)
    },
    {
      id: 'CMP_003',
      complaint_id: 'NGC-2026-000003',
      citizen_id: 'USR_CITIZEN_1',
      department_id: 'DEPT_ROADS',
      category_id: 'CAT_RDS_01',
      title: 'Caved in road trench forming dangerous 2-foot pothole after optic fiber digging',
      description: 'Private telecom contractors left road unpaved after fiber laying. Heavy rain created a deep subsidence causing frequent bike skids.',
      location_address: 'Street 7, Kakatiya Hills, Kavuri Hills Phase 1',
      landmark: 'Adjacent to State Bank ATM',
      ward_number: 'Ward 42',
      latitude: 17.4395,
      longitude: 78.3982,
      priority: 'CRITICAL',
      status: 'UNDER_REVIEW',
      sla_deadline: futureHours(40),
      is_escalated: 0,
      created_at: pastDays(0.5)
    },
    {
      id: 'CMP_004',
      complaint_id: 'NGC-2026-000004',
      citizen_id: 'USR_CITIZEN_1',
      department_id: 'DEPT_LIGHTING',
      category_id: 'CAT_LGT_03',
      title: 'Exposed live wiring hanging loose from street lighting pole near playground',
      description: 'Inspection chamber cover on light pole #LP-42-19 was damaged. Raw live cables are exposed 1 foot from ground level where neighborhood kids play cricket.',
      location_address: 'Municipal Park Perimeter Road, Ward 42',
      landmark: 'Near Children Play Area East Gate',
      ward_number: 'Ward 42',
      latitude: 17.4351,
      longitude: 78.4019,
      priority: 'CRITICAL',
      status: 'RESOLVED',
      sla_deadline: pastDays(1),
      is_escalated: 0,
      created_at: pastDays(3)
    },
    {
      id: 'CMP_005',
      complaint_id: 'NGC-2026-000005',
      citizen_id: 'USR_CITIZEN_1',
      department_id: 'DEPT_DRAINAGE',
      category_id: 'CAT_DRN_01',
      title: 'Severe rainwater stagnation and storm drain choke during evening downpour',
      description: 'The roadside drain culvert is completely jammed with plastic and silt. 1.5 feet water stagnates within 15 minutes of rain.',
      location_address: 'Main Road Underpass, Hitech City Flyover',
      landmark: 'Underpass ramp towards Cyber Towers',
      ward_number: 'Ward 44',
      latitude: 17.4504,
      longitude: 78.3808,
      priority: 'HIGH',
      status: 'SUBMITTED',
      sla_deadline: futureHours(32),
      is_escalated: 0,
      created_at: pastDays(0.2)
    }
  ];

  for (const c of seedComplaints) {
    await run(
      `INSERT INTO complaints (
        id, complaint_id, citizen_id, department_id, category_id, title, description,
        location_address, landmark, ward_number, latitude, longitude, priority, status,
        sla_deadline, is_escalated, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.complaint_id,
        c.citizen_id,
        c.department_id,
        c.category_id,
        c.title,
        c.description,
        c.location_address,
        c.landmark,
        c.ward_number,
        c.latitude,
        c.longitude,
        c.priority,
        c.status,
        c.sla_deadline,
        c.is_escalated,
        c.created_at,
        c.created_at
      ]
    );

    // Initial status history
    await run(
      `INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `HIST_${c.id}_01`,
        c.id,
        null,
        'SUBMITTED',
        c.citizen_id,
        'Grievance registered through Nagar Connect Citizen Portal',
        c.created_at
      ]
    );

    // Initial citizen evidence
    await run(
      `INSERT INTO complaint_evidence (id, complaint_id, uploaded_by_user_id, evidence_type, file_path, file_url, caption, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `EVID_${c.id}_01`,
        c.id,
        c.citizen_id,
        'CITIZEN_INITIAL',
        '/uploads/evidence/initial_sample.jpg',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600',
        'Initial spot photo taken by citizen at the time of lodging',
        c.created_at
      ]
    );
  }

  // Add field task & assignments for CMP_001
  await run(
    `INSERT INTO complaint_assignments (id, complaint_id, assigned_by_user_id, assigned_to_user_id, role, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'ASGN_001',
      'CMP_001',
      'USR_OFFICER_WATER',
      'USR_FIELD_1',
      'FIELD_STAFF',
      'Urgent valve shutdown required. Deploy dewatering pump and collar clamp.',
      'ACTIVE',
      pastDays(0.8)
    ]
  );

  await run(
    `INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'HIST_CMP_001_02',
      'CMP_001',
      'SUBMITTED',
      'UNDER_REVIEW',
      'USR_OFFICER_WATER',
      'Officer reviewed incident severity and verified location coordinates',
      pastDays(0.9)
    ]
  );

  await run(
    `INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'HIST_CMP_001_03',
      'CMP_001',
      'UNDER_REVIEW',
      'ASSIGNED',
      'USR_OFFICER_WATER',
      'Assigned to Ramesh Kumar (Water Supply Field Lead)',
      pastDays(0.8)
    ]
  );

  await run(
    `INSERT INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, remarks, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'HIST_CMP_001_04',
      'CMP_001',
      'ASSIGNED',
      'IN_PROGRESS',
      'USR_FIELD_1',
      'Field team reached spot with excavator and replacement pipeline joint',
      pastDays(0.4)
    ]
  );

  await run(
    `INSERT INTO field_tasks (id, complaint_id, assigned_field_staff_id, assigned_by_officer_id, task_state, priority, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'TASK_001',
      'CMP_001',
      'USR_FIELD_1',
      'USR_OFFICER_WATER',
      'IN_PROGRESS',
      'HIGH',
      'Ground excavation ongoing. Main feeder isolated.',
      pastDays(0.8)
    ]
  );

  // CMP_002 Resolution submitted flow
  await run(
    `INSERT INTO field_tasks (id, complaint_id, assigned_field_staff_id, assigned_by_officer_id, task_state, priority, notes, before_photo_url, after_photo_url, resolution_description, resolved_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'TASK_002',
      'CMP_002',
      'USR_FIELD_2',
      'USR_OFFICER_SANITATION',
      'RESOLUTION_SUBMITTED',
      'HIGH',
      'Compactor truck deployed. Area sanitized with lime powder.',
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
      'Removed 4.5 metric tonnes of garbage via Tipper AP-28-V-1928. Sprayed disinfectants around school perimeter.',
      pastDays(0.2),
      pastDays(1.5)
    ]
  );

  // CMP_004 Feedback & Resolution
  await run(
    `INSERT INTO complaint_feedback (id, complaint_id, citizen_id, rating, comments, reopen_requested, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'FDBK_004',
      'CMP_004',
      'USR_CITIZEN_1',
      5,
      'Extremely prompt electrical repair! Linemen arrived within 2 hours and insulated the wire. Very grateful.',
      0,
      pastDays(0.5)
    ]
  );

  console.log('✅ Complaints & Field tasks seeded.');

  // 7. MEMBER 5 RAG KNOWLEDGE DOCUMENTS SEEDING
  // Realistic municipal knowledge base documents covering SOPs, Citizen Charter, Field Safety, Bylaws
  const ragDocs = [
    {
      id: 'DOC_001',
      document_id: 'DOC-GHMC-2026-001',
      title: 'Municipal Citizen Charter & Citizen Grievance Redressal SLA Guidelines 2026',
      department: 'General Administration',
      document_type: 'Citizen Charter',
      version: '2026.1',
      effective_date: '2026-01-01',
      language: 'English',
      uploaded_by: 'USR_KNOWLEDGE_ADMIN',
      visibility: 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
      status: 'INDEXED',
      content: `
MUNICIPAL CORPORATION CITIZEN CHARTER 2026
CHAPTER 1: CITIZEN RIGHTS AND GRIEVANCE REDRESSAL GUARANTEES

1.1 Right to Service & Guaranteed Timelines:
Every citizen residing within the municipal corporation boundaries has the statutory right to basic civic amenities and guaranteed grievance redressal under the Right to Public Services Act.

1.2 Departmental Service Level Agreement (SLA) Matrix:
- Water Supply Main Pipeline Burst: Maximum resolution within 24 hours. Immediate water supply cutoff to prevent wastage within 2 hours of report.
- Drinking Water Contamination: Redressed within 12 hours with mandatory water sample testing by Public Health lab.
- Garbage Clearance & Overflowing Bins: Mandatory clearance within 12 hours of citizen lodging complaint.
- Dead Animal Removal: High emergency response within 6 hours.
- Dangerous Potholes on Carriage-way: Temporary cold-mix filling within 24 hours, permanent mastic asphalt restoration within 48 to 72 hours.
- Street Light Non-Functionality: Repaired within 24 hours for main roads and 48 hours for interior residential lanes.
- Exposed Live Electrical Wires on Lamp Poles: Zero tolerance emergency response within 4 hours.
- Stormwater Drain Overflow / Monsoon Waterlogging: Dewatering pumps deployed within 2 hours, desilting completion within 12-36 hours.

1.3 Compensation for SLA Default:
If a grievance is not resolved within the notified statutory SLA without valid technological or natural calamity justification, the citizen is eligible for token civic compensation of Rs. 50 per day of delay, automatically debited against departmental contingency funds upon Commissioner review.

1.4 Escalation Framework:
Level 1: Ward Level Officer / Assistant Engineer (AE) - Time: 0 to 24 hours.
Level 2: Zonal Executive Engineer (EE) - Time: 24 to 48 hours.
Level 3: Superintending Engineer / Zonal Commissioner - Time: 48 to 72 hours.
Level 4: Municipal Commissioner Civic Grievance Cell - Time: > 72 hours.
      `
    },
    {
      id: 'DOC_002',
      document_id: 'DOC-GHMC-2026-002',
      title: 'Standard Operating Procedures (SOP) for Drinking Water Pipeline & Sewer Line Maintenance',
      department: 'Water Supply & Sewerage',
      document_type: 'SOP',
      version: '3.2',
      effective_date: '2026-02-15',
      language: 'English',
      uploaded_by: 'USR_KNOWLEDGE_ADMIN',
      visibility: 'OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
      status: 'INDEXED',
      content: `
DEPARTMENT OF WATER SUPPLY & SEWERAGE - STANDARD OPERATING PROCEDURES (SOP-WTR-2026)
SECTION A: PIPELINE BURST INSPECTION & VALVE ISOLATION

A.1 Emergency First Response Protocol:
Upon receiving a pipeline burst alert tagged HIGH or CRITICAL in Nagar Connect:
1. The Assistant Engineer (AE) must acknowledge the complaint within 15 minutes.
2. The Line Inspector must dispatch the nearest Valve Operator to turn off the upstream sluice valve to prevent road undercutting.
3. Geo-coordinate check: Check the GIS layer to verify presence of underground gas pipelines, HT power cables, or fiber optic lines before initiating mechanical JCB digging.

A.2 Dewatering and Trench Safety:
- For trenches deeper than 1.5 meters, safety trench shoring boxes must be installed to prevent wall collapse.
- Dewatering pumps (minimum 5 HP submersible or diesel trash pumps) must discharge water strictly into stormwater drains, never into private residential basements.
- Replacement pipeline joints must use standard DI (Ductile Iron) K-9 grade pipes with EPDM rubber gaskets conforming to IS:8329.

SECTION B: SEWAGE OVERFLOW & MANHOLE DESILTING PROTOCOLS

B.1 Prohibition of Manual Scavenging:
Under the Prohibition of Employment as Manual Scavengers and their Rehabilitation Act, entry of human workers into manholes or sewer chambers without mechanical breathing apparatus and robotic super-sucker machines is STRICTLY ILLEGAL and constitutes a non-bailable offense.

B.2 Mechanical Desilting Procedure:
1. Deploy vehicle-mounted High-Velocity Jetting Machine (minimum 120 bar pressure) and Vacuum Suction Grabber.
2. Sludge must be transferred directly into airtight sealed sludge tankers and transported to the designated Sewage Treatment Plant (STP) drying beds.
3. Post-unblocking, apply 5% bleaching powder slurry around the manhole cover within 10 meters radius to eliminate biological pathogens.
      `
    },
    {
      id: 'DOC_003',
      document_id: 'DOC-GHMC-2026-003',
      title: 'Field Staff Safety Protocols & Personal Protective Equipment (PPE) Compliance Manual',
      department: 'All Departments',
      document_type: 'Safety Manual',
      version: '1.4',
      effective_date: '2026-01-10',
      language: 'English',
      uploaded_by: 'USR_KNOWLEDGE_ADMIN',
      visibility: 'FIELD_STAFF,OFFICER,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
      status: 'INDEXED',
      content: `
MUNICIPAL CORPORATION OCCUPATIONAL HEALTH & SAFETY GUIDELINES (FIELD-SAFETY-2026)
MODULE 1: MANDATORY PERSONAL PROTECTIVE EQUIPMENT (PPE) BY TASK TYPE

1.1 Street Lighting and Electrical Work:
- Arc-flash rated dielectric safety helmet (IS 2925 certified).
- 11kV electrical insulating rubber gloves conforming to IEC 60903 Class 2.
- Electrical hazard (EH) rated steel-toe safety boots with vulcanized rubber soles.
- Voltage tester and non-contact AC voltage detector stick must be tested before touching any metallic lamppost casing.
- Always implement Lockout/Tagout (LOTO) procedures at the feeder pillar box before starting line maintenance.

1.2 Sanitation & Waste Handling:
- Heavy-duty puncture-resistant nitrile / Kevlar coated gloves to guard against broken glass and biomedical sharps.
- N95 particulate respirators or carbon filter half-face masks when handling decomposing solid waste.
- High-visibility fluorescent lime-yellow safety jackets with 3M retro-reflective tape during all daytime and night shifts.

1.3 Road Work & Heavy Machinery Operations:
- Traffic cone cordoning: Place retro-reflective safety cones at 50 meters, 30 meters, and 10 meters before the work zone.
- Flashing amber beacon light mounted on municipal repair vehicle roof.
- High-decibel backup alarm on all rollers, tippers, and JCB loaders.
- First Aid Kit containing burn dressing, antiseptic solution, eye wash cups, and trauma bandages must be present in every field truck.
      `
    },
    {
      id: 'DOC_004',
      document_id: 'DOC-GHMC-2026-004',
      title: 'Solid Waste Segregation Bylaws & Penalties for Commercial Open Dumping',
      department: 'Sanitation & Solid Waste',
      document_type: 'Bylaw',
      version: '2026.2',
      effective_date: '2026-03-01',
      language: 'English',
      uploaded_by: 'USR_KNOWLEDGE_ADMIN',
      visibility: 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
      status: 'INDEXED',
      content: `
MUNICIPAL SOLID WASTE MANAGEMENT & LITTERING BYLAWS 2026
SECTION 4: MANDATORY 3-WAY SOURCE SEGREGATION

4.1 Waste Categorization Rules:
All domestic, commercial, and institutional establishments must segregate solid waste into three distinct streams before handing over to municipal Swachh Auto Tippers:
1. Wet Waste (Green Bin): Vegetable peels, leftover food, fruit rinds, garden leaves, eggshells, organic biodegradable matter.
2. Dry Waste (Blue Bin): Paper, cardboard boxes, plastics, milk pouches, glass bottles, metal cans, polythene bags.
3. Domestic Hazardous Waste (Red Bin / Bag): Sanitary pads, diapers, expired medicines, batteries, mosquito repellent mats, paint cans, tube lights.

SECTION 5: SCHEDULE OF CIVIC FINES AND PENALTIES

5.1 Violations and Spot Fines:
- First-time unsegregated waste handover: Warning notice and educational pamphlet.
- Second-time unsegregated waste: Fine of Rs. 200 for residential households; Rs. 1,000 for commercial shops.
- Open littering or spitting in public places: Spot fine of Rs. 500.
- Illegal dumping of Construction & Demolition (C&D) debris on road or vacant plots: Fine of Rs. 10,000 for first offense plus cost of municipal towing and removal. Repeat offense leads to sealing of construction site.
- Burning of dry leaves or plastic waste in open air: Severe penalty of Rs. 5,000 per incident under National Green Tribunal (NGT) environmental directions.
      `
    },
    {
      id: 'DOC_005',
      document_id: 'DOC-GHMC-2026-005',
      title: 'Municipal Internal Governance, Financial Sanctions & Administrative Delegation Rules',
      department: 'General Administration',
      document_type: 'Policy',
      version: '4.0',
      effective_date: '2026-01-01',
      language: 'English',
      uploaded_by: 'USR_KNOWLEDGE_ADMIN',
      visibility: 'MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
      status: 'INDEXED',
      content: `
INTERNAL MUNICIPAL GOVERNANCE & FINANCIAL SANCTION POWERS (CONFIDENTIAL ADMIN POLICY)
SECTION 2: FINANCIAL SANCTION DELEGATION LIMITS

2.1 Emergency Civic Repair Spending Caps:
- Assistant Engineer (AE): Up to Rs. 25,000 per emergency repair job without prior quotation, capped at Rs. 1,00,000 per month.
- Executive Engineer (EE): Up to Rs. 2,50,000 per civil contract with single-source quotation for urgent flood/pipe burst situations.
- Superintending Engineer (SE): Up to Rs. 10,00,000 per project under Zonal Development Fund.
- Zonal Commissioner (ZC): Up to Rs. 50,00,000 with e-tender waiver in declared natural disasters.
- Municipal Commissioner: Full sanction power up to Rs. 5,00,00,000 subject to Standing Committee post-facto ratification within 30 days.

SECTION 3: DISCIPLINARY ACTIONS FOR CHRONIC SLA VIOLATIONS

3.1 Officer Accountability Matrix:
- If an officer accumulates more than 15 overdue SLA complaints in a calendar month without genuine site hindrance, a formal departmental memo (Rule 9) will be issued.
- Three consecutive months of sub-70% SLA compliance leads to forfeiture of performance incentives and adverse entry in the officer's Annual Confidential Report (ACR).
      `
    }
  ];

  for (const doc of ragDocs) {
    await run(
      `INSERT INTO documents (
        id, document_id, title, department, document_type, version, effective_date,
        language, uploaded_by, visibility, status, total_chunks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        doc.document_id,
        doc.title,
        doc.department,
        doc.document_type,
        doc.version,
        doc.effective_date,
        doc.language,
        doc.uploaded_by,
        doc.visibility,
        doc.status,
        0, // Will be updated during chunking
        pastDays(10),
        pastDays(1)
      ]
    );

    // Initial version
    await run(
      `INSERT INTO document_versions (id, document_id, version, changes_summary, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `VER_${doc.id}_1`,
        doc.id,
        doc.version,
        'Initial baseline upload into Nagar Connect RAG Knowledge Base',
        doc.uploaded_by,
        pastDays(10)
      ]
    );
  }
  console.log('✅ RAG Documents seeded.');

  // 8. NOTICES
  const notices = [
    {
      id: 'NOT_01',
      title: '🚨 Pre-Monsoon Nala Desilting & Drainage Drive in All Wards',
      content: 'Special emergency de-silting teams deployed across Wards 35 to 48. Citizens are requested not to dump plastic packaging into roadside open channels.',
      dept: 'DEPT_DRAINAGE',
      prio: 'HIGH'
    },
    {
      id: 'NOT_02',
      title: '💧 Drinking Water Supply Timing Revision for Summer Season',
      content: 'Water supply in Zone 3 will be released between 06:00 AM to 08:30 AM on alternate days starting this Monday to maintain balanced reservoir pressure.',
      dept: 'DEPT_WATER',
      prio: 'NORMAL'
    },
    {
      id: 'NOT_03',
      title: '🌿 Free Sapling Distribution under Urban Greenery Mission',
      content: 'Citizens can collect native shade tree saplings (Neem, Gulmohar, Kanuga) from local ward municipal nursery upon showing property tax receipt.',
      dept: 'DEPT_PARKS',
      prio: 'NORMAL'
    }
  ];

  for (const n of notices) {
    await run(
      `INSERT INTO municipal_notices (id, title, content, department_id, priority, is_active, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.title, n.content, n.dept, n.prio, 1, pastDays(2)]
    );
  }

  // 9. SYSTEM SETTINGS
  const settings = [
    { key: 'MUNICIPALITY_NAME', value: 'Greater Hyderabad Municipal Corporation (GHMC)', desc: 'Official Name of Municipality' },
    { key: 'MUNICIPALITY_CODE', value: 'GHMC-TELANGANA', desc: 'Municipal Jurisdiction Code' },
    { key: 'PORTAL_TAGLINE', value: 'Your Voice. Our Responsibility. A Better Nagar.', desc: 'Civic Tagline' },
    { key: 'SLA_AUTO_ESCALATE', value: 'true', desc: 'Enable automatic escalation on SLA breach' },
    { key: 'DEFAULT_LANGUAGE', value: 'English', desc: 'Default system language' },
    { key: 'ENABLE_RAG_ASSISTANT', value: 'true', desc: 'Activate centralized RAG knowledge assistant across portals' },
    { key: 'RAG_LLM_PROVIDER', value: 'LOCAL_DETERMINISTIC', desc: 'RAG Provider: LOCAL_DETERMINISTIC, EXTERNAL_API, or DEMO' }
  ];

  for (const s of settings) {
    await run(
      'INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)',
      [s.key, s.value, s.desc]
    );
  }

  // 10. NOTIFICATIONS
  await run(
    `INSERT INTO notifications (id, user_id, title, message, type, link_url, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'NOTIF_01',
      'USR_CITIZEN_1',
      'Water Pipeline Repair In Progress',
      'Field crew under Ramesh Kumar has started repair work for complaint NGC-2026-000001.',
      'STATUS_UPDATE',
      '/citizen/complaints/CMP_001',
      0,
      pastDays(0.4)
    ]
  );

  console.log('✅ Nagar Connect Database Seeding Completed Successfully! 🏛️');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seed process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
