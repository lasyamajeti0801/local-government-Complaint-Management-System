export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'FIELD_VERIFICATION'
  | 'IN_PROGRESS'
  | 'RESOLUTION_SUBMITTED'
  | 'CITIZEN_VERIFICATION'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'CANNOT_RESOLVE'
  | 'NEEDS_ESCALATION'
  | 'REOPENED';

export type ComplaintCategoryIcon = 'water' | 'roads' | 'waste' | 'lighting' | 'drainage' | 'other';

export interface ComplaintTimelineEvent {
  id: string;
  title: string;
  detail?: string;
  createdAt: string;
}

export interface ComplaintComment {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface ComplaintEvidence {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface ComplaintFeedback {
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  complaintNumber: string;
  citizenId?: string;
  citizenName: string;
  citizenInitials: string;
  citizenPhone?: string;
  title: string;
  description: string;
  category: string;
  categoryIcon: ComplaintCategoryIcon;
  department: string;
  location: string;
  landmark?: string;
  ward: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  slaDeadline: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffTeam?: string;
  evidence?: ComplaintEvidence[];
  feedback?: ComplaintFeedback;
  timeline: ComplaintTimelineEvent[];
  comments: ComplaintComment[];
}

export interface FieldStaffOption {
  id: string;
  name: string;
  team: string;
  department: string;
  initials: string;
}
