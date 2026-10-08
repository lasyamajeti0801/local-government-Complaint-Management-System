// ============================================================
// NAGAR CONNECT - COMPREHENSIVE SEED DATA
// Realistic Indian Municipal E-Governance Seed Records
// ============================================================

const bcrypt = require('bcryptjs');
const db = require('../../backend/config/db');
const { runMigrations } = require('../migrations/initDatabase');

function seedDatabase() {
  runMigrations();
  console.log('🌱 Seeding municipal e-governance data...');

  // 1. Roles
  const roles = [
    { id: 'CITIZEN', name: 'Citizen', description: 'Resident filing civic complaints and tracking status' },
    { id: 'OFFICER', name: 'Department Officer', description: 'Department officer reviewing, assigning, and managing complaints' },
    { id: 'FIELD_STAFF', name: 'Field Staff / Technician', description: 'Field crew executing physical repairs, inspections, and uploading evidence' },
    { id: 'MUNICIPAL_ADMIN', name: 'Municipal Administrator', description: 'Ward supervisor and municipal zonal administrator' },
    { id: 'COMMISSIONER', name: 'Municipal Commissioner', description: 'Executive administrative head of Nagar Municipal Corporation' },
    { id: 'KNOWLEDGE_ADMIN', name: 'Knowledge Admin', description: 'Curator of municipal rules, SOPs, and RAG knowledge base' },
    { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'System superuser managing users, roles, and global configurations' }
  ];

  const insertRole = db.db.prepare('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)');
  roles.forEach(r => insertRole.run(r.id, r.name, r.description));

  // 2. Departments
  const departments = [
    { id: 'dept-water', name: 'Water Supply & Sewerage', code: 'WTR', description: 'Drinking water distribution, pipeline maintenance, and sewer systems', email: 'water.cell@nagarconnect.gov.in', helpline: '1800-425-9001', head: 'Rajesh Varma, EE' },
    { id: 'dept-sanitation', name: 'Public Sanitation & Health', code: 'SAN', description: 'Daily street sweeping, public sanitation, disinfection, and hygiene', email: 'sanitation@nagarconnect.gov.in', helpline: '1800-425-9002', head: 'Meera Joshi, Chief Health Officer' },
    { id: 'dept-roads', name: 'Roads & Infrastructure', code: 'RDS', description: 'Asphalt paving, pothole repairs, bridges, footpaths, and road furniture', email: 'roads@nagarconnect.gov.in', helpline: '1800-425-9003', head: 'K. Venkatesh, Executive Engineer' },
    { id: 'dept-lighting', name: 'Street Lighting & Electrical', code: 'LGT', description: 'Public streetlights, high-mast lamps, timers, and electrical safety', email: 'lighting@nagarconnect.gov.in', helpline: '1800-425-9004', head: 'Anand Nair, AE Electrical' },
    { id: 'dept-drainage', name: 'Stormwater Drainage', code: 'DRN', description: 'Monsoon drains, desilting, culverts, and flood prevention', email: 'drainage@nagarconnect.gov.in', helpline: '1800-425-9005', head: 'G. Narayana, AE Drainage' },
    { id: 'dept-waste', name: 'Solid Waste Management', code: 'WST', description: 'Door-to-door collection, transfer stations, and waste segregation', email: 'swm@nagarconnect.gov.in', helpline: '1800-425-9006', head: 'Farida Khan, SWM Officer' },
    { id: 'dept-parks', name: 'Parks & Urban Forestry', code: 'PRK', description: 'Municipal gardens, tree pruning, parks maintenance, and green spaces', email: 'horticulture@nagarconnect.gov.in', helpline: '1800-425-9007', head: 'P. Ravindran, Dy Director' },
    { id: 'dept-admin', name: 'Municipal General Administration', code: 'ADM', description: 'Central grievance monitoring, civic records, and public relations', email: 'admin@nagarconnect.gov.in', helpline: '1800-425-1982', head: 'Dr. S. R. Krishnan, IAS' }
  ];

  const insertDept = db.db.prepare(`
    INSERT OR REPLACE INTO departments (id, name, code, description, contact_email, helpline, head_officer_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  departments.forEach(d => insertDept.run(d.id, d.name, d.code, d.description, d.email, d.helpline, d.head));

  // 3. Complaint Categories
  const categories = [
    { id: 'cat-wtr-leak', dept: 'dept-water', code: 'WTR_LEAK', name: 'Main Pipeline Leakage / Burst', priority: 'CRITICAL', sla: 12, desc: 'Underground drinking water main or supply pipeline burst' },
    { id: 'cat-wtr-dirty', dept: 'dept-water', code: 'WTR_DIRT', name: 'Contaminated / Muddy Water', priority: 'HIGH', sla: 24, desc: 'Tap water emitting foul odor, turbidity, or contamination' },
    { id: 'cat-wtr-press', dept: 'dept-water', code: 'WTR_PRES', name: 'Low Pressure / No Water Supply', priority: 'HIGH', sla: 24, desc: 'Scheduled supply disrupted or zero pressure at consumer terminal' },
    { id: 'cat-wtr-meter', dept: 'dept-water', code: 'WTR_METR', name: 'Defective Commercial / Domestic Meter', priority: 'LOW', sla: 72, desc: 'Water meter stuck, damaged dial, or billing dispute inspection' },

    { id: 'cat-san-dump', dept: 'dept-sanitation', code: 'SAN_DUMP', name: 'Garbage Dump Overflow / Open Dumpsite', priority: 'HIGH', sla: 24, desc: 'Community dustbin overflowing with garbage spreading onto road' },
    { id: 'cat-san-dead', dept: 'dept-sanitation', code: 'SAN_DEAD', name: 'Dead Animal Removal', priority: 'CRITICAL', sla: 12, desc: 'Carcass lying on public pathway or road causing biohazard' },
    { id: 'cat-san-toil', dept: 'dept-sanitation', code: 'SAN_TOIL', name: 'Public Toilet Maintenance & Sanitation', priority: 'MEDIUM', sla: 24, desc: 'Municipal public comfort station unhygienic or lacking water' },

    { id: 'cat-rds-pothole', dept: 'dept-roads', code: 'RDS_POTH', name: 'Hazardous Road Pothole', priority: 'HIGH', sla: 48, desc: 'Deep pothole or road cave-in posing accident risk to motorists' },
    { id: 'cat-rds-footpath', dept: 'dept-roads', code: 'RDS_FOOT', name: 'Broken Footpath / Paver Blocks', priority: 'MEDIUM', sla: 72, desc: 'Pedestrian pavement slabs cracked, missing, or obstructed' },
    { id: 'cat-rds-divider', dept: 'dept-roads', code: 'RDS_DIVD', name: 'Damaged Road Median / Railing', priority: 'MEDIUM', sla: 72, desc: 'Central divider broken due to vehicular collision' },

    { id: 'cat-lgt-outage', dept: 'dept-lighting', code: 'LGT_DARK', name: 'Streetlight Inoperative / Dark Stretch', priority: 'MEDIUM', sla: 36, desc: 'One or multiple consecutive street lights not functioning' },
    { id: 'cat-lgt-danger', dept: 'dept-lighting', code: 'LGT_WIRE', name: 'Hanging Live Wire / Pole Sparking', priority: 'CRITICAL', sla: 6, desc: 'Immediate electrocution risk or exposed feeder box' },

    { id: 'cat-drn-clog', dept: 'dept-drainage', code: 'DRN_CLOG', name: 'Blocked Stormwater Drain / Waterlogging', priority: 'CRITICAL', sla: 12, desc: 'Choked drain causing rain water inundation of colony road' },
    { id: 'cat-wst-miss', dept: 'dept-waste', code: 'WST_MISS', name: 'Door-to-Door Waste Collection Missed', priority: 'MEDIUM', sla: 24, desc: 'Municipal sanitary auto did not collect household waste' },

    { id: 'cat-prk-tree', dept: 'dept-parks', code: 'PRK_TREE', name: 'Fallen Tree / Dangerous Branch', priority: 'HIGH', sla: 24, desc: 'Fallen tree blocking roadway or overgrown branch over electricity wire' },
    { id: 'cat-prk-maint', dept: 'dept-parks', code: 'PRK_MAINT', name: 'Public Park Maintenance / Broken Equipment', priority: 'MEDIUM', sla: 48, desc: 'Damaged children play equipment, broken benches, or uncleared garden waste' },

    { id: 'cat-adm-cert', dept: 'dept-admin', code: 'ADM_CERT', name: 'Birth / Death Certificate Verification Delay', priority: 'MEDIUM', sla: 48, desc: 'Statutory citizen certificate issuance delay beyond citizen charter time' },
    { id: 'cat-adm-tax', dept: 'dept-admin', code: 'ADM_TAX', name: 'Property Tax Assessment / Mutation Query', priority: 'LOW', sla: 72, desc: 'Municipal property tax assessment discrepancy or assessment name correction' }
  ];

  const insertCat = db.db.prepare(`
    INSERT OR REPLACE INTO complaint_categories (id, department_id, code, name, default_priority, default_sla_hours, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  categories.forEach(c => insertCat.run(c.id, c.dept, c.code, c.name, c.priority, c.sla, c.desc));

  // 4. SLA Rules Table
  const slaRules = [
    { id: 'sla-crit-water', dept: 'dept-water', cat: 'cat-wtr-leak', priority: 'CRITICAL', res: 12, esc: 6, desc: 'Critical water pipeline rupture policy' },
    { id: 'sla-high-water', dept: 'dept-water', cat: 'cat-wtr-dirty', priority: 'HIGH', res: 24, esc: 12, desc: 'Water quality incident response policy' },
    { id: 'sla-high-san', dept: 'dept-sanitation', cat: 'cat-san-dump', priority: 'HIGH', res: 24, esc: 12, desc: 'Solid waste accumulation clearance policy' },
    { id: 'sla-crit-san', dept: 'dept-sanitation', cat: 'cat-san-dead', priority: 'CRITICAL', res: 12, esc: 4, desc: 'Biohazard & public hygiene rapid clearance' },
    { id: 'sla-high-rds', dept: 'dept-roads', cat: 'cat-rds-pothole', priority: 'HIGH', res: 48, esc: 24, desc: 'Major traffic corridor pothole remediation' },
    { id: 'sla-med-rds', dept: 'dept-roads', cat: 'cat-rds-footpath', priority: 'MEDIUM', res: 72, esc: 36, desc: 'Pedestrian civil works SLA' },
    { id: 'sla-crit-lgt', dept: 'dept-lighting', cat: 'cat-lgt-danger', priority: 'CRITICAL', res: 6, esc: 2, desc: 'Electrical safety emergency SLA' },
    { id: 'sla-med-lgt', dept: 'dept-lighting', cat: 'cat-lgt-outage', priority: 'MEDIUM', res: 36, esc: 18, desc: 'General streetlight maintenance' },
    { id: 'sla-crit-drn', dept: 'dept-drainage', cat: 'cat-drn-open', priority: 'CRITICAL', res: 8, esc: 3, desc: 'Manhole safety SLA' }
  ];

  const insertSla = db.db.prepare(`
    INSERT OR REPLACE INTO sla_rules (id, department_id, category_id, priority, resolution_time_hours, escalation_time_hours, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  slaRules.forEach(s => insertSla.run(s.id, s.dept, s.cat, s.priority, s.res, s.esc, s.desc));

  // 5. Users (with pre-hashed passwords)
  const users = [
    {
      id: 'usr-citizen-1',
      name: 'Anita Rao',
      email: 'citizen@nagarconnect.gov.in',
      password: 'Citizen@123',
      phone: '+91 98480 12345',
      role: 'CITIZEN',
      dept: null,
      empId: null,
      desig: 'Resident',
      ward: 'Ward 14 (Gandhi Nagar)'
    },
    {
      id: 'usr-citizen-2',
      name: 'P. Raghu Kumar',
      email: 'citizen.kumar@nagarconnect.gov.in',
      password: 'Citizen@123',
      phone: '+91 98480 98765',
      role: 'CITIZEN',
      dept: null,
      empId: null,
      desig: 'Resident',
      ward: 'Ward 08 (Tilak Road)'
    },
    {
      id: 'usr-officer-water',
      name: 'Rajesh Varma',
      email: 'officer.water@nagarconnect.gov.in',
      password: 'Officer@123',
      phone: '+91 94401 11001',
      role: 'OFFICER',
      dept: 'dept-water',
      empId: 'WTR-OFF-201',
      desig: 'Divisional Engineer (Water Distribution)',
      ward: 'Zone 1 (Wards 1-20)'
    },
    {
      id: 'usr-officer-sanitation',
      name: 'Meera Joshi',
      email: 'officer.sanitation@nagarconnect.gov.in',
      password: 'Officer@123',
      phone: '+91 94401 11002',
      role: 'OFFICER',
      dept: 'dept-sanitation',
      empId: 'SAN-OFF-304',
      desig: 'Chief Sanitary Inspector',
      ward: 'Central Zone (Wards 10-35)'
    },
    {
      id: 'usr-officer-roads',
      name: 'K. Venkatesh',
      email: 'officer.roads@nagarconnect.gov.in',
      password: 'Officer@123',
      phone: '+91 94401 11003',
      role: 'OFFICER',
      dept: 'dept-roads',
      empId: 'RDS-OFF-108',
      desig: 'Executive Engineer (Civil Infrastructure)',
      ward: 'All Municipal Zones'
    },
    {
      id: 'usr-field-water-1',
      name: 'Ramesh Kumar',
      email: 'field.water@nagarconnect.gov.in',
      password: 'Field@123',
      phone: '+91 93910 22001',
      role: 'FIELD_STAFF',
      dept: 'dept-water',
      empId: 'WTR-FLD-014',
      desig: 'Senior Pipeline Technician & Lineman',
      ward: 'Zone 1 North'
    },
    {
      id: 'usr-field-water-2',
      name: 'B. Mahesh Babu',
      email: 'field.water2@nagarconnect.gov.in',
      password: 'Field@123',
      phone: '+91 93910 22002',
      role: 'FIELD_STAFF',
      dept: 'dept-water',
      empId: 'WTR-FLD-019',
      desig: 'Valves & Booster Specialist',
      ward: 'Zone 1 South'
    },
    {
      id: 'usr-field-sanitation',
      name: 'Suresh Reddy',
      email: 'field.sanitation@nagarconnect.gov.in',
      password: 'Field@123',
      phone: '+91 93910 22003',
      role: 'FIELD_STAFF',
      dept: 'dept-sanitation',
      empId: 'SAN-FLD-088',
      desig: 'Sanitation Supervisor & Rapid Response Lead',
      ward: 'Ward 14 Gandhi Nagar'
    },
    {
      id: 'usr-field-roads',
      name: 'Priya Sharma',
      email: 'field.roads@nagarconnect.gov.in',
      password: 'Field@123',
      phone: '+91 93910 22004',
      role: 'FIELD_STAFF',
      dept: 'dept-roads',
      empId: 'RDS-FLD-052',
      desig: 'Road Pavement Quality Inspector',
      ward: 'Zone 2 East'
    },
    {
      id: 'usr-admin',
      name: 'Sunita Deshmukh',
      email: 'admin@nagarconnect.gov.in',
      password: 'Admin@123',
      phone: '+91 94401 55001',
      role: 'MUNICIPAL_ADMIN',
      dept: 'dept-admin',
      empId: 'ADM-SUP-002',
      desig: 'Additional Municipal Commissioner',
      ward: 'Municipal Headquarters'
    },
    {
      id: 'usr-commissioner',
      name: 'Dr. S. R. Krishnan, IAS',
      email: 'commissioner@nagarconnect.gov.in',
      password: 'Commissioner@123',
      phone: '+91 94401 00001',
      role: 'COMMISSIONER',
      dept: 'dept-admin',
      empId: 'IAS-NMC-001',
      desig: 'Municipal Commissioner & District Magistrate',
      ward: 'Municipal Corporation of Nagar'
    },
    {
      id: 'usr-knowledge-admin',
      name: 'Vivek Saxena',
      email: 'knowledge.admin@nagarconnect.gov.in',
      password: 'Knowledge@123',
      phone: '+91 94401 77001',
      role: 'KNOWLEDGE_ADMIN',
      dept: 'dept-admin',
      empId: 'KNG-DIR-009',
      desig: 'Director of Citizen Knowledge & E-Governance',
      ward: 'Municipal Headquarters'
    },
    {
      id: 'usr-superadmin',
      name: 'IT Cell Administrator',
      email: 'superadmin@nagarconnect.gov.in',
      password: 'Super@123',
      phone: '+91 94401 99999',
      role: 'SUPER_ADMIN',
      dept: 'dept-admin',
      empId: 'SYS-ROOT-001',
      desig: 'Chief Technical Officer',
      ward: 'Data Center'
    }
  ];

  const insertUser = db.db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, phone, role, department_id, employee_id, designation, ward_number, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  users.forEach(u => {
    const hash = bcrypt.hashSync(u.password, 8);
    insertUser.run(u.id, u.name, u.email, hash, u.phone, u.role, u.dept, u.empId, u.desig, u.ward);
  });

  // 6. Realistic Municipal Complaints (Active & Historical for Officer Queue and SLA tracking)
  const now = new Date();
  
  // Helper to format ISO SQLite date string
  const offsetHours = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

  const complaints = [
    {
      id: 'cmp-001',
      number: 'NGC-2026-000101',
      citizen_id: 'usr-citizen-1',
      dept_id: 'dept-water',
      cat_id: 'cat-wtr-leak',
      title: 'Heavy drinking water pipeline rupture near Ward 14 water tank',
      desc: 'Severe underground 150mm drinking water main burst on Gandhi Road. Clean drinking water is flooding the street and creating deep pooling near building #42. Pressure in colony is completely lost.',
      location: 'House 42, Cross Road 3, Gandhi Nagar, Ward 14',
      landmark: 'Opposite State Bank of India ATM, near Community Park',
      ward: 'Ward 14',
      lat: 17.385044,
      lng: 78.486671,
      priority: 'CRITICAL',
      status: 'SUBMITTED', // New complaint for Officer to Review & Accept!
      sla_deadline: offsetHours(10), // 10h remaining
      sla_status: 'ON_TRACK',
      created_at: offsetHours(-2),
      is_escalated: 0,
      escalation_level: 'NONE'
    },
    {
      id: 'cmp-002',
      number: 'NGC-2026-000102',
      citizen_id: 'usr-citizen-1',
      dept_id: 'dept-water',
      cat_id: 'cat-wtr-dirty',
      title: 'Contaminated brown water supply with strong chemical smell',
      desc: 'Morning municipal supply line at Tilak Road is discharging murky yellow-brown water with pungent drainage smell. Several households report illness. Immediate testing and flush needed.',
      location: 'Lane 5, Tilak Road, Shanti Nagar, Ward 12',
      landmark: 'Behind Government Primary School',
      ward: 'Ward 12',
      lat: 17.391211,
      lng: 78.490123,
      priority: 'HIGH',
      status: 'UNDER_REVIEW', // Under Officer review
      sla_deadline: offsetHours(18),
      sla_status: 'ON_TRACK',
      created_at: offsetHours(-6),
      is_escalated: 0,
      escalation_level: 'NONE'
    },
    {
      id: 'cmp-003',
      number: 'NGC-2026-000103',
      citizen_id: 'usr-citizen-2',
      dept_id: 'dept-water',
      cat_id: 'cat-wtr-press',
      title: 'Zero water supply to upper floors for 3 consecutive days',
      desc: 'Tail-end distribution line along Subhash Marg has had zero pressure during the 6 AM - 8 AM supply slot. Residents unable to store water.',
      location: 'Plot 88, Subhash Marg, Ward 08',
      landmark: 'Near Anjaneya Swamy Temple',
      ward: 'Ward 08',
      lat: 17.398500,
      lng: 78.475200,
      priority: 'MEDIUM',
      status: 'ASSIGNED', // Assigned to field staff Ramesh Kumar
      sla_deadline: offsetHours(40),
      sla_status: 'ON_TRACK',
      created_at: offsetHours(-8),
      is_escalated: 0,
      escalation_level: 'NONE'
    },
    {
      id: 'cmp-004',
      number: 'NGC-2026-000104',
      citizen_id: 'usr-citizen-2',
      dept_id: 'dept-water',
      cat_id: 'cat-wtr-leak',
      title: 'Water valve chamber overflowing onto pedestrian walkway',
      desc: 'Sub-distribution valve box leaking continuously at commercial junction. Pedestrians forced into vehicular traffic lane.',
      location: 'MG Road Commercial Arcade, Ward 10',
      landmark: 'Next to Nagar Supermarket',
      ward: 'Ward 10',
      lat: 17.401100,
      lng: 78.469900,
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      sla_deadline: offsetHours(-4), // 4h overdue!
      sla_status: 'OVERDUE', // Realistic overdue for SLA alerts & escalation test!
      created_at: offsetHours(-28),
      is_escalated: 1,
      escalation_level: 'L1_OFFICER'
    },
    {
      id: 'cmp-005',
      number: 'NGC-2026-000105',
      citizen_id: 'usr-citizen-1',
      dept_id: 'dept-sanitation',
      cat_id: 'cat-san-dump',
      title: 'Massive garbage heap overflowing into vehicular lane at Market Yard',
      desc: 'Sanitation bins at Rythu Bazar have not been emptied for 48 hours. Dogs and stray cattle are scattering plastic and organic waste over a 50-meter radius.',
      location: 'Daily Vegetable Market Yard, Main Gate, Ward 14',
      landmark: 'Opposite Municipal Shopping Complex Gate 2',
      ward: 'Ward 14',
      lat: 17.382100,
      lng: 78.489900,
      priority: 'HIGH',
      status: 'SUBMITTED',
      sla_deadline: offsetHours(16),
      sla_status: 'ON_TRACK',
      created_at: offsetHours(-8),
      is_escalated: 0,
      escalation_level: 'NONE'
    },
    {
      id: 'cmp-006',
      number: 'NGC-2026-000106',
      citizen_id: 'usr-citizen-2',
      dept_id: 'dept-sanitation',
      cat_id: 'cat-san-dead',
      title: 'Dead canine carcass on sidewalk near residential apartments',
      desc: 'Decomposing carcass emitting unbearable stench outside Sri Krishna Residency. Urgent sanitary squad and disinfectant spraying requested.',
      location: '12-4-28/B, Nehru Nagar Road, Ward 15',
      landmark: 'Front of Sri Krishna Residency Entrance',
      ward: 'Ward 15',
      lat: 17.379500,
      lng: 78.495000,
      priority: 'CRITICAL',
      status: 'ASSIGNED',
      sla_deadline: offsetHours(4), // Approaching deadline!
      sla_status: 'APPROACHING_DEADLINE',
      created_at: offsetHours(-8),
      is_escalated: 0,
      escalation_level: 'NONE'
    },
    {
      id: 'cmp-007',
      number: 'NGC-2026-000107',
      citizen_id: 'usr-citizen-1',
      dept_id: 'dept-roads',
      cat_id: 'cat-rds-pothole',
      title: 'Critical 2-foot deep pothole causing two-wheeler skids',
      desc: 'Severe crater formed after heavy rain right at the flyover descent curve. Two commuters fell yesterday night.',
      location: 'NH-65 Outer Service Road, near Flyover Pillar 22, Ward 18',
      landmark: 'Opposite Indian Oil Petrol Bunk',
      ward: 'Ward 18',
      lat: 17.410200,
      lng: 78.502000,
      priority: 'HIGH',
      status: 'SUBMITTED',
      sla_deadline: offsetHours(36),
      sla_status: 'ON_TRACK',
      created_at: offsetHours(-12),
      is_escalated: 0,
      escalation_level: 'NONE'
    },
    {
      id: 'cmp-008',
      number: 'NGC-2026-000108',
      citizen_id: 'usr-citizen-1',
      dept_id: 'dept-roads',
      cat_id: 'cat-rds-footpath',
      title: 'Collapsed footpath slabs over deep trench',
      desc: 'Pedestrian pavement slabs broken and open trench exposed for 15 meters. Elderly and schoolchildren walk here daily.',
      location: 'Station Road Promenade, Ward 11',
      landmark: 'Near Railway Station Exit 3',
      ward: 'Ward 11',
      lat: 17.420100,
      lng: 78.481200,
      priority: 'MEDIUM',
      status: 'RESOLVED', // Historical resolved record for Citizen Verification & Feedback
      sla_deadline: offsetHours(-48),
      sla_status: 'ON_TRACK',
      created_at: offsetHours(-96),
      resolved_at: offsetHours(-12),
      closed_at: offsetHours(-6),
      resolution_summary: 'Civil maintenance squad reconstructed 15 meters of precast RCC footpath slabs with anti-skid tactile tiles. Inspected and approved by EE Roads.',
      is_escalated: 0,
      escalation_level: 'NONE'
    }
  ];

  const insertComplaint = db.db.prepare(`
    INSERT OR REPLACE INTO complaints (
      id, complaint_number, citizen_id, department_id, category_id,
      title, description, location_address, landmark, ward_number,
      latitude, longitude, priority, status, sla_deadline, sla_status,
      is_escalated, escalation_level, resolution_summary, created_at, resolved_at, closed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  complaints.forEach(c => {
    insertComplaint.run(
      c.id, c.number, c.citizen_id, c.dept_id, c.cat_id,
      c.title, c.desc, c.location, c.landmark, c.ward,
      c.lat, c.lng, c.priority, c.status, c.sla_deadline, c.sla_status,
      c.is_escalated, c.escalation_level, c.resolution_summary || null,
      c.created_at, c.resolved_at || null, c.closed_at || null
    );
  });

  // 7. Status History Records
  const history = [
    // cmp-001 (New submitted)
    { id: 'his-001', cmp: 'cmp-001', prev: null, next: 'SUBMITTED', user: 'usr-citizen-1', action: 'SUBMITTED', remark: 'Complaint lodged by citizen Anita Rao via Nagar Connect portal with GPS coordinates.', time: offsetHours(-2) },
    
    // cmp-002 (Under Review)
    { id: 'his-002', cmp: 'cmp-002', prev: null, next: 'SUBMITTED', user: 'usr-citizen-1', action: 'SUBMITTED', remark: 'Initial submission of contaminated water issue.', time: offsetHours(-6) },
    { id: 'his-003', cmp: 'cmp-002', prev: 'SUBMITTED', next: 'UNDER_REVIEW', user: 'usr-officer-water', action: 'REVIEWED', remark: 'Officer Rajesh Varma marked under review. Water quality testing squad alerted.', time: offsetHours(-5) },

    // cmp-003 (Assigned)
    { id: 'his-004', cmp: 'cmp-003', prev: null, next: 'SUBMITTED', user: 'usr-citizen-2', action: 'SUBMITTED', remark: 'Complaint registered by citizen Raghu Kumar.', time: offsetHours(-8) },
    { id: 'his-005', cmp: 'cmp-003', prev: 'SUBMITTED', next: 'UNDER_REVIEW', user: 'usr-officer-water', action: 'REVIEWED', remark: 'Officer verified distribution feeder network.', time: offsetHours(-7) },
    { id: 'his-006', cmp: 'cmp-003', prev: 'UNDER_REVIEW', next: 'ASSIGNED', user: 'usr-officer-water', action: 'ASSIGNED', remark: 'Assigned to Senior Lineman Ramesh Kumar to inspect valve pressure manifold.', time: offsetHours(-6) },

    // cmp-004 (Overdue & Escalated)
    { id: 'his-007', cmp: 'cmp-004', prev: null, next: 'SUBMITTED', user: 'usr-citizen-2', action: 'SUBMITTED', remark: 'Commercial junction leak reported.', time: offsetHours(-28) },
    { id: 'his-008', cmp: 'cmp-004', prev: 'SUBMITTED', next: 'UNDER_REVIEW', user: 'usr-officer-water', action: 'REVIEWED', remark: 'Initial review commenced.', time: offsetHours(-24) },
    { id: 'his-009', cmp: 'cmp-004', prev: 'UNDER_REVIEW', next: 'UNDER_REVIEW', user: 'usr-officer-water', action: 'ESCALATED', remark: 'SLA breached after 24h threshold. Escalated to L1 Officer attention for priority machinery mobilization.', time: offsetHours(-4) },

    // cmp-008 (Resolved)
    { id: 'his-010', cmp: 'cmp-008', prev: null, next: 'SUBMITTED', user: 'usr-citizen-1', action: 'SUBMITTED', remark: 'Footpath damage logged.', time: offsetHours(-96) },
    { id: 'his-011', cmp: 'cmp-008', prev: 'SUBMITTED', next: 'ASSIGNED', user: 'usr-officer-roads', action: 'ASSIGNED', remark: 'Work order #RD-819 issued to Priya Sharma.', time: offsetHours(-90) },
    { id: 'his-012', cmp: 'cmp-008', prev: 'ASSIGNED', next: 'IN_PROGRESS', user: 'usr-field-roads', action: 'STATUS_UPDATED', remark: 'Field civil work commenced. Concrete slabs set.', time: offsetHours(-48) },
    { id: 'his-013', cmp: 'cmp-008', prev: 'IN_PROGRESS', next: 'RESOLUTION_SUBMITTED', user: 'usr-field-roads', action: 'STATUS_UPDATED', remark: 'Pavement restoration complete with photographic proof.', time: offsetHours(-18) },
    { id: 'his-014', cmp: 'cmp-008', prev: 'RESOLUTION_SUBMITTED', next: 'RESOLVED', user: 'usr-officer-roads', action: 'RESOLVED', remark: 'Executive Engineer verified quality on site and approved resolution.', time: offsetHours(-12) }
  ];

  const insertHist = db.db.prepare(`
    INSERT OR REPLACE INTO complaint_status_history (id, complaint_id, previous_status, new_status, changed_by_user_id, action, remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  history.forEach(h => insertHist.run(h.id, h.cmp, h.prev, h.next, h.user, h.action, h.remark, h.time));

  // 8. Assignments (Officer to Field Staff)
  const assignments = [
    {
      id: 'asg-001',
      cmp: 'cmp-003',
      officer: 'usr-officer-water',
      field: 'usr-field-water-1',
      dept: 'dept-water',
      type: 'FIELD_WORK',
      status: 'PENDING',
      instructions: 'Inspect the booster valve chamber at Subhash Marg junction. Check for air lock or gate valve throttling. Provide pressure gauge readings.',
      priority: 'MEDIUM',
      deadline: offsetHours(36),
      created_at: offsetHours(-6)
    },
    {
      id: 'asg-002',
      cmp: 'cmp-006',
      officer: 'usr-officer-sanitation',
      field: 'usr-field-sanitation',
      dept: 'dept-sanitation',
      type: 'FIELD_WORK',
      status: 'ACCEPTED',
      instructions: 'Mobilize dead animal removal van immediately with lime powder and quaternary ammonium disinfectant. Wear full PPE.',
      priority: 'CRITICAL',
      deadline: offsetHours(4),
      created_at: offsetHours(-8)
    },
    {
      id: 'asg-003',
      cmp: 'cmp-008',
      officer: 'usr-officer-roads',
      field: 'usr-field-roads',
      dept: 'dept-roads',
      type: 'FIELD_WORK',
      status: 'COMPLETED',
      instructions: 'Replace damaged 600x600x50mm M30 precast concrete slabs and restore kerbing.',
      priority: 'MEDIUM',
      deadline: offsetHours(-24),
      created_at: offsetHours(-90)
    }
  ];

  const insertAsg = db.db.prepare(`
    INSERT OR REPLACE INTO complaint_assignments (
      id, complaint_id, assigned_by_user_id, assigned_to_user_id,
      department_id, assignment_type, status, instructions, priority, deadline, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  assignments.forEach(a => insertAsg.run(a.id, a.cmp, a.officer, a.field, a.dept, a.type, a.status, a.instructions, a.priority, a.deadline, a.created_at));

  // 9. Comments & Internal Notes (Officer internal discussion + Citizen query)
  const comments = [
    {
      id: 'cmt-001',
      cmp: 'cmp-001',
      user: 'usr-officer-water',
      type: 'INTERNAL_NOTE',
      msg: 'Checked GIS pipeline grid map: this is a 6-inch ductile iron line laid in 2018. Main isolation valve is at Junction 4.',
      is_internal: 1,
      time: offsetHours(-1)
    },
    {
      id: 'cmt-002',
      cmp: 'cmp-002',
      user: 'usr-officer-water',
      type: 'CITIZEN_COMMUNICATION',
      msg: 'Dear Citizen, our water analysis mobile van has been dispatched to sample water at Lane 5. Please avoid drinking raw tap water until cleared.',
      is_internal: 0,
      time: offsetHours(-4)
    },
    {
      id: 'cmp-003-cmt1',
      cmp: 'cmp-003',
      user: 'usr-officer-water',
      type: 'INTERNAL_NOTE',
      msg: 'Assigned to Ramesh Kumar. Requested him to verify if illegal direct booster motor connections are causing the pressure drop.',
      is_internal: 1,
      time: offsetHours(-6)
    },
    {
      id: 'cmt-004',
      cmp: 'cmp-004',
      user: 'usr-officer-water',
      type: 'INTERNAL_NOTE',
      msg: 'ESCALATION ALERT: SLA breached. Requires heavy dewatering pump and night-shift road cutting permission from Traffic Police.',
      is_internal: 1,
      time: offsetHours(-4)
    }
  ];

  const insertCmt = db.db.prepare(`
    INSERT OR REPLACE INTO complaint_comments (id, complaint_id, user_id, comment_type, message, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  comments.forEach(c => insertCmt.run(c.id, c.cmp, c.user, c.type, c.msg, c.is_internal, c.time));

  // 10. Escalations
  const escalations = [
    {
      id: 'esc-001',
      cmp: 'cmp-004',
      user: 'usr-officer-water',
      level: 'L1_OFFICER',
      reason: 'SLA_BREACH',
      notes: 'Complaint exceeded 24 hour SLA due to awaiting traffic police trenching clearance at commercial junction. Escalated to prioritize emergency clearance.',
      status: 'OPEN',
      created_at: offsetHours(-4)
    }
  ];

  const insertEsc = db.db.prepare(`
    INSERT OR REPLACE INTO escalations (id, complaint_id, escalated_by_user_id, escalation_level, reason, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  escalations.forEach(e => insertEsc.run(e.id, e.cmp, e.user, e.level, e.reason, e.notes, e.status, e.created_at));

  // 11. Citizen Feedback for CMP-008
  const insertFb = db.db.prepare(`
    INSERT OR REPLACE INTO complaint_feedback (id, complaint_id, citizen_id, rating, comment, reopened, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `);
  insertFb.run('fb-001', 'cmp-008', 'usr-citizen-1', 5, 'Excellent rapid response! The footpath was neatly repaired with new tactile tiles and clean finish. Thank you Nagar Municipal Corporation.', offsetHours(-4));

  // 12. Contract-ready Field Tasks for Member 4
  const insertTask = db.db.prepare(`
    INSERT OR REPLACE INTO field_tasks (
      id, complaint_id, assignment_id, field_staff_id, status, arrived_at, completed_at, work_description, field_notes, resolution_summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTask.run(
    'tsk-001',
    'cmp-003',
    'asg-001',
    'usr-field-water-1',
    'ASSIGNED',
    null,
    null,
    'Investigate pipeline pressure and valve settings',
    'Tool kit and pressure gauge prepared',
    null,
    offsetHours(-6)
  );

  // 13. System Notifications
  const notifications = [
    { id: 'notif-001', user: 'usr-officer-water', title: 'New Critical Complaint', msg: 'New complaint NGC-2026-000101 lodged: Main pipeline leak in Ward 14.', type: 'WARNING', refType: 'COMPLAINT', refId: 'cmp-001', read: 0 },
    { id: 'notif-002', user: 'usr-officer-water', title: 'SLA Overdue Warning', msg: 'Complaint NGC-2026-000104 has breached SLA threshold. Action required.', type: 'ESCALATION', refType: 'COMPLAINT', refId: 'cmp-004', read: 0 },
    { id: 'notif-003', user: 'usr-citizen-1', title: 'Complaint Under Review', msg: 'Your complaint NGC-2026-000102 has been taken up for review by Water Supply Dept.', type: 'INFO', refType: 'COMPLAINT', refId: 'cmp-002', read: 1 },
    { id: 'notif-004', user: 'usr-field-water-1', title: 'New Field Task Assigned', msg: 'Officer Rajesh Varma assigned Task for NGC-2026-000103: Inspect booster valve.', type: 'ASSIGNMENT', refType: 'TASK', refId: 'tsk-001', read: 0 }
  ];

  const insertNotif = db.db.prepare(`
    INSERT OR REPLACE INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  notifications.forEach(n => insertNotif.run(n.id, n.user, n.title, n.msg, n.type, n.refType, n.refId, n.read));

  // 14. Municipal Notices
  const notices = [
    { id: 'not-001', title: 'Special Monsoon Drain De-Silting Drive 2026', dept: 'dept-drainage', content: 'Citizens are notified that major stormwater trunk drains across Wards 1 to 25 will undergo mechanical de-silting from 10th to 20th October.', severity: 'NORMAL' },
    { id: 'not-002', title: 'Emergency Water Pipeline Interconnection Works - Zone 1', dept: 'dept-water', content: 'Supply will be regulated at low pressure between 2:00 PM and 6:00 PM on Friday due to trunk main valve upgrade.', severity: 'URGENT' }
  ];

  const insertNotice = db.db.prepare(`
    INSERT OR REPLACE INTO municipal_notices (id, title, department_id, content, severity, start_date, is_active)
    VALUES (?, ?, ?, ?, ?, CURRENT_DATE, 1)
  `);
  notices.forEach(n => insertNotice.run(n.id, n.title, n.dept, n.content, n.severity));

  console.log('✅ Seeding completed successfully with realistic Indian municipal data!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
