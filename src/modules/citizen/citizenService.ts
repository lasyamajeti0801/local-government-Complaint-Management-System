import { complaintRepository } from '../complaints/complaintRepository';
import type { Complaint, ComplaintEvidence, ComplaintFeedback, ComplaintPriority } from '../complaints/types';
import {
  categories,
  CITIZEN_DEMO_USER,
  generateComplaintNumber,
  normalizePhone,
  validateCitizenComplaint,
  type CitizenComplaintInput,
} from './citizenRules';

function makeTimelineEvent(title: string, detail?: string) {
  return { id: crypto.randomUUID(), title, detail, createdAt: new Date().toISOString() };
}

function getSlaDeadline(priority: ComplaintPriority, now: Date): string {
  const hours: Record<ComplaintPriority, number> = {
    URGENT: 4,
    HIGH: 24,
    MEDIUM: 72,
    LOW: 120,
  };
  return new Date(now.getTime() + hours[priority] * 60 * 60 * 1_000).toISOString();
}

export const citizenService = {
  getCurrentCitizen() {
    return CITIZEN_DEMO_USER;
  },

  getCategories() {
    return categories;
  },

  getMyComplaints(): Complaint[] {
    return complaintRepository.getAll()
      .filter((complaint) => complaint.citizenId === CITIZEN_DEMO_USER.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createComplaint(input: CitizenComplaintInput): Complaint {
    const validationError = validateCitizenComplaint(input);
    if (validationError) throw new Error(validationError);

    const complaints = complaintRepository.getAll();
    const category = categories.find((item) => item.name === input.category);
    if (!category) throw new Error('The selected complaint category is no longer available.');

    const now = new Date();
    const evidence: ComplaintEvidence[] = input.evidence.map((file) => ({
      ...file,
      id: file.id || crypto.randomUUID(),
      uploadedAt: now.toISOString(),
    }));
    const complaint: Complaint = {
      id: crypto.randomUUID(),
      complaintNumber: generateComplaintNumber(complaints, now),
      citizenId: CITIZEN_DEMO_USER.id,
      citizenName: input.contactName.trim(),
      citizenInitials: input.contactName.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      citizenPhone: normalizePhone(input.contactPhone),
      title: input.title.trim(),
      description: input.description.trim(),
      category: category.name,
      categoryIcon: category.icon,
      department: category.department,
      location: input.location.trim(),
      landmark: input.landmark.trim() || undefined,
      ward: input.ward.trim(),
      priority: input.priority,
      status: 'SUBMITTED',
      createdAt: now.toISOString(),
      slaDeadline: getSlaDeadline(input.priority, now),
      evidence,
      timeline: [makeTimelineEvent('Complaint submitted', 'Citizen portal')],
      comments: [],
    };

    complaintRepository.saveAll([complaint, ...complaints]);
    return complaint;
  },

  submitFeedback(complaintId: string, rating: number, comment: string): Complaint[] {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Choose a rating from 1 to 5 stars.');
    }
    const complaints = complaintRepository.getAll();
    const target = complaints.find((item) => item.id === complaintId && item.citizenId === CITIZEN_DEMO_USER.id);
    if (!target) throw new Error('This complaint could not be found in your account.');
    if (!['RESOLVED', 'CLOSED'].includes(target.status)) {
      throw new Error('Feedback is available after a complaint has been resolved.');
    }
    if (comment.trim().length > 1_000) throw new Error('Feedback must be 1,000 characters or fewer.');

    const feedback: ComplaintFeedback = {
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = complaints.map((item) => item.id === complaintId
      ? { ...item, feedback, timeline: [...item.timeline, makeTimelineEvent('Citizen feedback submitted', `${rating} out of 5 stars`)] }
      : item);
    complaintRepository.saveAll(updated);
    return updated.filter((item) => item.citizenId === CITIZEN_DEMO_USER.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  reopenComplaint(complaintId: string): Complaint[] {
    const complaints = complaintRepository.getAll();
    const target = complaints.find((item) => item.id === complaintId && item.citizenId === CITIZEN_DEMO_USER.id);
    if (!target) throw new Error('This complaint could not be found in your account.');
    if (!['RESOLVED', 'CLOSED'].includes(target.status)) {
      throw new Error('Only a resolved or closed complaint can be reopened.');
    }

    const now = new Date();
    const updated = complaints.map((item) => item.id === complaintId
      ? {
          ...item,
          status: 'REOPENED' as const,
          slaDeadline: getSlaDeadline(item.priority, now),
          timeline: [...item.timeline, makeTimelineEvent('Complaint reopened by citizen', 'The department will review this case again')],
        }
      : item);
    complaintRepository.saveAll(updated);
    return updated.filter((item) => item.citizenId === CITIZEN_DEMO_USER.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
