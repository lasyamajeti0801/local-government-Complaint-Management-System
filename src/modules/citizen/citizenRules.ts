import type { Complaint, ComplaintStatus } from '../complaints/types';

export const CITIZEN_DEMO_USER = {
  id: 'demo-citizen-meera',
  name: 'Meera Iyer',
  phone: '9000000001',
  initials: 'MI',
} as const;

export const CITIZEN_STATUS_FLOW: ComplaintStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'FIELD_VERIFICATION',
  'IN_PROGRESS',
  'RESOLUTION_SUBMITTED',
  'CITIZEN_VERIFICATION',
  'RESOLVED',
  'CLOSED',
];

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  ASSIGNED: 'Assigned',
  FIELD_VERIFICATION: 'Field verification',
  IN_PROGRESS: 'In progress',
  RESOLUTION_SUBMITTED: 'Resolution submitted',
  CITIZEN_VERIFICATION: 'Citizen verification',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
  CANNOT_RESOLVE: 'Cannot resolve',
  NEEDS_ESCALATION: 'Needs escalation',
  REOPENED: 'Reopened',
};

export const categories = [
  { name: 'Water & Sanitation', department: 'Water Supply', icon: 'water' as const },
  { name: 'Roads & Infrastructure', department: 'Roads & Infrastructure', icon: 'roads' as const },
  { name: 'Waste Management', department: 'Sanitation', icon: 'waste' as const },
  { name: 'Street Lighting', department: 'Electrical', icon: 'lighting' as const },
  { name: 'Drainage', department: 'Water Supply', icon: 'drainage' as const },
  { name: 'Public Nuisance', department: 'Sanitation', icon: 'other' as const },
  { name: 'Parks & Gardens', department: 'Parks & Horticulture', icon: 'other' as const },
  { name: 'Animal Control', department: 'Public Health', icon: 'other' as const },
  { name: 'Other Municipal Issue', department: 'Municipal Administration', icon: 'other' as const },
];

export interface CitizenComplaintInput {
  title: string;
  description: string;
  category: string;
  location: string;
  landmark: string;
  priority: Complaint['priority'];
  contactName: string;
  contactPhone: string;
  ward: string;
  evidence: NonNullable<Complaint['evidence']>;
}

export interface ComplaintProgressStep {
  status: ComplaintStatus;
  label: string;
  state: 'complete' | 'current' | 'upcoming';
}

export function generateComplaintNumber(complaints: Complaint[], now = new Date()): string {
  const year = now.getFullYear();
  const prefix = `NGC-${year}-`;
  const maxSequence = complaints.reduce((maximum, complaint) => {
    if (!complaint.complaintNumber.startsWith(prefix)) return maximum;
    const sequence = Number(complaint.complaintNumber.slice(prefix.length));
    return Number.isSafeInteger(sequence) ? Math.max(maximum, sequence) : maximum;
  }, 0);
  const used = new Set(complaints.map((complaint) => complaint.complaintNumber));
  let sequence = maxSequence + 1;
  let candidate = `${prefix}${String(sequence).padStart(6, '0')}`;
  while (used.has(candidate)) {
    sequence += 1;
    candidate = `${prefix}${String(sequence).padStart(6, '0')}`;
  }
  return candidate;
}

export function validateCitizenComplaint(input: CitizenComplaintInput): string | null {
  if (input.title.trim().length < 5 || input.title.trim().length > 120) {
    return 'Enter a title between 5 and 120 characters.';
  }
  if (input.description.trim().length < 20 || input.description.trim().length > 2_000) {
    return 'Describe the issue in 20 to 2,000 characters.';
  }
  if (!categories.some((category) => category.name === input.category)) {
    return 'Choose a valid complaint category.';
  }
  if (input.location.trim().length < 3 || input.location.trim().length > 180) {
    return 'Enter a location between 3 and 180 characters.';
  }
  if (input.landmark.trim().length > 120) return 'Landmark must be 120 characters or fewer.';
  if (input.contactName.trim().length < 2 || input.contactName.trim().length > 80) {
    return 'Enter a contact name between 2 and 80 characters.';
  }
  if (!/^[6-9]\d{9}$/.test(normalizePhone(input.contactPhone))) {
    return 'Enter a valid 10-digit Indian mobile number.';
  }
  if (input.evidence.length > 4) return 'Attach up to 4 photos or videos.';
  if (input.evidence.some((file) => !file.mimeType.startsWith('image/') && !file.mimeType.startsWith('video/'))) {
    return 'Only photo and video evidence is supported.';
  }
  if (input.evidence.some((file) => file.size > 25 * 1024 * 1024)) {
    return 'Each photo or video must be 25 MB or smaller.';
  }
  return null;
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function getComplaintProgress(status: ComplaintStatus): ComplaintProgressStep[] {
  let currentIndex = CITIZEN_STATUS_FLOW.indexOf(status);
  if (status === 'REOPENED') currentIndex = 0;
  if (status === 'ESCALATED' || status === 'NEEDS_ESCALATION') currentIndex = 1;
  if (status === 'CANNOT_RESOLVE') currentIndex = 5;
  return CITIZEN_STATUS_FLOW.map((step, index) => ({
    status: step,
    label: STATUS_LABELS[step],
    state: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
  }));
}

export function isResolvedStatus(status: ComplaintStatus): boolean {
  return status === 'RESOLVED' || status === 'CLOSED';
}

export function isOpenStatus(status: ComplaintStatus): boolean {
  return !isResolvedStatus(status) && status !== 'REJECTED';
}

export function isPendingStatus(status: ComplaintStatus): boolean {
  return status === 'SUBMITTED' || status === 'UNDER_REVIEW';
}

export function canReopen(status: ComplaintStatus): boolean {
  return isResolvedStatus(status);
}
