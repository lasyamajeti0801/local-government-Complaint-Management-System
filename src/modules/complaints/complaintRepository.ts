import type { Complaint, ComplaintStatus, FieldStaffOption } from './types';
import { COMPLAINT_STORAGE_KEY } from './complaintConstants';

const LEGACY_CITIZEN_STORAGE_KEY = 'nagar-connect-citizen-demo-v1';

const staff: FieldStaffOption[] = [
  { id: 'field-01', name: 'Suresh Kumar', team: 'Road maintenance team', department: 'Roads & Infrastructure', initials: 'SK' },
  { id: 'field-02', name: 'Kavita Rao', team: 'Drainage response team', department: 'Water & Sanitation', initials: 'KR' },
  { id: 'field-03', name: 'Imran Sheikh', team: 'Sanitation response team', department: 'Waste Management', initials: 'IS' },
  { id: 'field-04', name: 'Pooja Verma', team: 'Electrical field team', department: 'Street Lighting', initials: 'PV' },
];

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function createTimeline(entries: Array<{ title: string; detail?: string; createdAt: string }>) {
  return entries.map((entry, index) => ({ ...entry, id: `event-${index + 1}` }));
}

function createSeedComplaints(): Complaint[] {
  const waterSubmittedAt = hoursAgo(0.6);
  const potholeSubmittedAt = hoursAgo(3.3);
  const garbageSubmittedAt = hoursAgo(4);
  const lightSubmittedAt = hoursAgo(17);
  const drainSubmittedAt = hoursAgo(27);
  const schoolSubmittedAt = hoursAgo(34);
  const dumpingSubmittedAt = hoursAgo(40);
  const footpathSubmittedAt = hoursAgo(51);
  const reopenedSla = minutesFromNow(1_800);
  const resolvedSla = minutesFromNow(800);

  return [
    {
      id: 'demo-1284', complaintNumber: 'NGC-2026-001284', citizenId: 'demo-citizen-meera',
      citizenName: 'Meera Iyer', citizenInitials: 'MI', citizenPhone: '9000000001',
      title: 'Water supply disruption',
      description: 'Residents on Lake View Road have had no water supply since early morning. The disruption is affecting several homes and a nearby community clinic. Please inspect the pipeline connection near the south junction.',
      category: 'Water & Sanitation', categoryIcon: 'water', department: 'Water Supply',
      location: 'Lake View Road', landmark: 'South junction, near community clinic', ward: 'Ward 12',
      priority: 'HIGH', status: 'SUBMITTED', createdAt: waterSubmittedAt, slaDeadline: minutesFromNow(134),
      evidence: [],
      timeline: createTimeline([{ title: 'Complaint submitted', detail: 'Citizen portal', createdAt: waterSubmittedAt }]), comments: [],
    },
    {
      id: 'demo-1281', complaintNumber: 'NGC-2026-001281', citizenId: 'demo-citizen-rahul',
      citizenName: 'Rahul Menon', citizenInitials: 'RM',
      title: 'Pothole on main road',
      description: 'A deep pothole has formed near the bus stop on MG Road. Two two-wheelers have already lost balance at this spot. The road is busy during school hours and needs urgent barricading and repair.',
      category: 'Roads & Infrastructure', categoryIcon: 'roads', department: 'Roads & Infrastructure',
      location: 'MG Road, near bus stop', ward: 'Ward 08', priority: 'URGENT', status: 'SUBMITTED',
      createdAt: potholeSubmittedAt, slaDeadline: minutesFromNow(-80), evidence: [],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: potholeSubmittedAt },
        { title: 'SLA deadline passed', createdAt: minutesFromNow(-80) },
      ]), comments: [],
    },
    {
      id: 'demo-1276', complaintNumber: 'NGC-2026-001276', citizenId: 'demo-citizen-fatima',
      citizenName: 'Fatima Khan', citizenInitials: 'FK',
      title: 'Garbage not collected',
      description: 'The community waste collection point has not been cleared for three days. Waste is spilling onto the footpath and attracting stray animals. Please arrange a collection and inspect the regular pickup schedule.',
      category: 'Waste Management', categoryIcon: 'waste', department: 'Sanitation',
      location: 'Green Park', ward: 'Ward 03', priority: 'MEDIUM', status: 'UNDER_REVIEW',
      createdAt: garbageSubmittedAt, slaDeadline: minutesFromNow(340), evidence: [],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: garbageSubmittedAt },
        { title: 'Review started', detail: 'Ananya Sharma · Department officer', createdAt: hoursAgo(3.5) },
      ]), comments: [],
    },
    {
      id: 'demo-1269', complaintNumber: 'NGC-2026-001269', citizenId: 'demo-citizen-arjun',
      citizenName: 'Arjun Patel', citizenInitials: 'AP',
      title: 'Streetlight not working',
      description: 'The streetlight opposite the public library has been out for four nights. The stretch is poorly lit and used by pedestrians returning from the evening market.',
      category: 'Street Lighting', categoryIcon: 'lighting', department: 'Electrical',
      location: 'Temple Street', ward: 'Ward 17', priority: 'HIGH', status: 'ASSIGNED',
      createdAt: lightSubmittedAt, slaDeadline: minutesFromNow(1_680), assignedStaffId: 'field-04',
      assignedStaffName: 'Pooja Verma', assignedStaffTeam: 'Electrical field team', evidence: [],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: lightSubmittedAt },
        { title: 'Assigned to field team', detail: 'Pooja Verma · Ananya Sharma', createdAt: hoursAgo(16) },
      ]), comments: [],
    },
    {
      id: 'demo-1258', complaintNumber: 'NGC-2026-001258', citizenId: 'demo-citizen-divya',
      citizenName: 'Divya Nair', citizenInitials: 'DN',
      title: 'Blocked storm drain',
      description: 'The storm drain outside house 41 is blocked with construction debris. With rain forecast this week, water may flood the lane and nearby ground-floor homes.',
      category: 'Drainage', categoryIcon: 'drainage', department: 'Water Supply',
      location: 'Rose Colony', ward: 'Ward 06', priority: 'HIGH', status: 'IN_PROGRESS',
      createdAt: drainSubmittedAt, slaDeadline: minutesFromNow(-25), assignedStaffId: 'field-02',
      assignedStaffName: 'Kavita Rao', assignedStaffTeam: 'Drainage response team', evidence: [],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: drainSubmittedAt },
        { title: 'Assigned to field team', detail: 'Kavita Rao · Ananya Sharma', createdAt: hoursAgo(26) },
        { title: 'Work started', detail: 'Field staff update', createdAt: hoursAgo(2) },
      ]), comments: [],
    },
    {
      id: 'demo-1251', complaintNumber: 'NGC-2026-001251', citizenId: 'demo-citizen-vikram',
      citizenName: 'Vikram Das', citizenInitials: 'VD',
      title: 'Water leakage near school',
      description: 'A leaking pipe is creating a pool of water outside Civic Centre Primary School. Children have to walk into the road to avoid it.',
      category: 'Water & Sanitation', categoryIcon: 'water', department: 'Water Supply',
      location: 'Civic Centre Primary School', ward: 'Ward 11', priority: 'MEDIUM', status: 'ASSIGNED',
      createdAt: schoolSubmittedAt, slaDeadline: minutesFromNow(490), assignedStaffId: 'field-02',
      assignedStaffName: 'Kavita Rao', assignedStaffTeam: 'Water works field team', evidence: [],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: schoolSubmittedAt },
        { title: 'Assigned to field team', detail: 'Kavita Rao · Ananya Sharma', createdAt: hoursAgo(33) },
      ]), comments: [],
    },
    {
      id: 'demo-1244', complaintNumber: 'NGC-2026-001244', citizenId: 'demo-citizen-neha',
      citizenName: 'Neha Thomas', citizenInitials: 'NT',
      title: 'Illegal dumping by market',
      description: 'A large pile of construction waste has been dumped behind the central market. It is blocking the service lane and has not been cleared despite two requests to the site supervisor.',
      category: 'Public Nuisance', categoryIcon: 'other', department: 'Sanitation',
      location: 'Central Market', ward: 'Ward 01', priority: 'URGENT', status: 'ESCALATED',
      createdAt: dumpingSubmittedAt, slaDeadline: minutesFromNow(-180), assignedStaffId: 'field-03',
      assignedStaffName: 'Imran Sheikh', assignedStaffTeam: 'Sanitation response team', evidence: [],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: dumpingSubmittedAt },
        { title: 'Escalated to department head', detail: 'Ananya Sharma', createdAt: hoursAgo(2) },
      ]), comments: [],
    },
    {
      id: 'demo-1239', complaintNumber: 'NGC-2026-001239', citizenId: 'demo-citizen-joseph',
      citizenName: 'Joseph Mathew', citizenInitials: 'JM',
      title: 'Damaged footpath tiles',
      description: 'Several footpath tiles in front of the post office are cracked and uneven. Field staff have submitted photos of the repaired section for officer verification.',
      category: 'Roads & Infrastructure', categoryIcon: 'roads', department: 'Roads & Infrastructure',
      location: 'Station Road, post office', ward: 'Ward 09', priority: 'LOW', status: 'RESOLUTION_SUBMITTED',
      createdAt: footpathSubmittedAt, slaDeadline: resolvedSla, assignedStaffId: 'field-01',
      assignedStaffName: 'Suresh Kumar', assignedStaffTeam: 'Road maintenance team', evidence: [],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: footpathSubmittedAt },
        { title: 'Assigned to field team', detail: 'Suresh Kumar · Ananya Sharma', createdAt: hoursAgo(30) },
        { title: 'Resolution submitted', detail: 'Field staff update · Evidence added', createdAt: hoursAgo(1) },
      ]), comments: [],
    },
    {
      id: 'demo-1228', complaintNumber: 'NGC-2026-001228', citizenId: 'demo-citizen-meera',
      citizenName: 'Meera Iyer', citizenInitials: 'MI', citizenPhone: '9000000001',
      title: 'Streetlight repaired near park',
      description: 'The streetlight near the east gate of the neighborhood park had stopped working. The field team replaced the damaged fitting and uploaded completion evidence.',
      category: 'Street Lighting', categoryIcon: 'lighting', department: 'Electrical',
      location: 'Lake View Park, east gate', landmark: 'Park entrance', ward: 'Ward 12',
      priority: 'MEDIUM', status: 'RESOLVED', createdAt: hoursAgo(96), slaDeadline: minutesFromNow(-20_000),
      assignedStaffId: 'field-04', assignedStaffName: 'Pooja Verma', assignedStaffTeam: 'Electrical field team',
      evidence: [{ id: 'evidence-demo-1', fileName: 'repaired-streetlight.jpg', mimeType: 'image/jpeg', size: 342_000, uploadedAt: hoursAgo(20) }],
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: hoursAgo(96) },
        { title: 'Assigned to field team', detail: 'Pooja Verma · Ananya Sharma', createdAt: hoursAgo(80) },
        { title: 'Resolution submitted', detail: 'Replacement fitting installed', createdAt: hoursAgo(24) },
        { title: 'Complaint resolved', detail: 'Verified by department officer', createdAt: hoursAgo(20) },
      ]),
      comments: [],
    },
    {
      id: 'demo-1220', complaintNumber: 'NGC-2026-001220', citizenId: 'demo-citizen-meera',
      citizenName: 'Meera Iyer', citizenInitials: 'MI', citizenPhone: '9000000001',
      title: 'Overflowing public bin',
      description: 'The public bin at the corner of Lake View Road was overflowing and blocking part of the footpath. The issue was reported and the sanitation team completed a collection.',
      category: 'Waste Management', categoryIcon: 'waste', department: 'Sanitation',
      location: 'Lake View Road, corner market', landmark: 'Outside Green Basket store', ward: 'Ward 12',
      priority: 'LOW', status: 'CLOSED', createdAt: hoursAgo(210), slaDeadline: minutesFromNow(-40_000),
      assignedStaffId: 'field-03', assignedStaffName: 'Imran Sheikh', assignedStaffTeam: 'Sanitation response team',
      evidence: [],
      feedback: { rating: 5, comment: 'Quick and courteous service. Thank you.', createdAt: hoursAgo(35) },
      timeline: createTimeline([
        { title: 'Complaint submitted', detail: 'Citizen portal', createdAt: hoursAgo(210) },
        { title: 'Assigned to field team', detail: 'Imran Sheikh · Ananya Sharma', createdAt: hoursAgo(204) },
        { title: 'Resolution submitted', detail: 'Collection completed', createdAt: hoursAgo(192) },
        { title: 'Complaint resolved', detail: 'Verified by department officer', createdAt: hoursAgo(190) },
        { title: 'Complaint closed', detail: 'Citizen confirmation received', createdAt: hoursAgo(35) },
      ]),
      comments: [],
    },
  ];
}

const validStatuses: ComplaintStatus[] = [
  'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'FIELD_VERIFICATION', 'IN_PROGRESS',
  'RESOLUTION_SUBMITTED', 'CITIZEN_VERIFICATION', 'RESOLVED', 'CLOSED', 'REJECTED',
  'ESCALATED', 'CANNOT_RESOLVE', 'NEEDS_ESCALATION', 'REOPENED',
];

function isComplaint(value: unknown): value is Complaint {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && typeof item.complaintNumber === 'string'
    && typeof item.citizenName === 'string'
    && typeof item.title === 'string'
    && typeof item.description === 'string'
    && typeof item.category === 'string'
    && typeof item.department === 'string'
    && typeof item.location === 'string'
    && typeof item.ward === 'string'
    && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(item.priority))
    && validStatuses.includes(item.status as ComplaintStatus)
    && typeof item.createdAt === 'string'
    && typeof item.slaDeadline === 'string'
    && Array.isArray(item.timeline)
    && Array.isArray(item.comments);
}

function migrateComplaint(value: Complaint): Complaint {
  const citizenId = value.citizenId || (
    value.citizenName === 'Meera Iyer'
      ? 'demo-citizen-meera'
      : `demo-citizen-${value.citizenName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  );
  return {
    ...value,
    citizenId,
    citizenInitials: value.citizenInitials || value.citizenName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
  };
}

export const complaintRepository = {
  getAll(): Complaint[] {
    const current = localStorage.getItem(COMPLAINT_STORAGE_KEY);
    const legacyCitizenData = localStorage.getItem(LEGACY_CITIZEN_STORAGE_KEY);
    const saved = current ?? legacyCitizenData;
    if (!saved) {
      const seeded = createSeedComplaints();
      localStorage.setItem(COMPLAINT_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(saved);
    } catch {
      throw new Error('Saved complaint demo data is unreadable. Clear the Nagar Connect demo data to continue.');
    }
    if (!Array.isArray(parsed) || !parsed.every(isComplaint)) {
      throw new Error('Saved complaint demo data is invalid. Clear the Nagar Connect demo data to continue.');
    }

    const migrated = parsed.map(migrateComplaint);
    if (current === null || legacyCitizenData !== null || JSON.stringify(migrated) !== saved) {
      localStorage.setItem(COMPLAINT_STORAGE_KEY, JSON.stringify(migrated));
      if (legacyCitizenData !== null) localStorage.removeItem(LEGACY_CITIZEN_STORAGE_KEY);
    }
    return migrated;
  },

  saveAll(complaints: Complaint[]): void {
    localStorage.setItem(COMPLAINT_STORAGE_KEY, JSON.stringify(complaints));
  },

  getFieldStaff(): FieldStaffOption[] {
    return staff;
  },
};
