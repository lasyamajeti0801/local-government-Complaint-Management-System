// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/components/field/fieldUtils.ts
// Utility helpers for Field Operations UI.
// Uses M1 design tokens — no custom colors invented here.
// =============================================================

import type { FieldTaskStatus, ComplaintPriority } from '../../types/fieldTask.types';

// ─────────────────────────────────────────
// Status display config — uses M1 design tokens
// ─────────────────────────────────────────
export const FIELD_STATUS_CONFIG: Record<FieldTaskStatus, {
  label:      string;
  color:      string;   // CSS class using M1 design tokens
  bgColor:    string;
  dotColor:   string;
  icon:       string;   // emoji / unicode for accessibility
  isTerminal: boolean;
}> = {
  ASSIGNED: {
    label:      'Assigned',
    color:      'text-blue-700',
    bgColor:    'bg-blue-50 border-blue-200',
    dotColor:   'bg-blue-500',
    icon:       '📋',
    isTerminal: false,
  },
  ACCEPTED: {
    label:      'Accepted',
    color:      'text-indigo-700',
    bgColor:    'bg-indigo-50 border-indigo-200',
    dotColor:   'bg-indigo-500',
    icon:       '✅',
    isTerminal: false,
  },
  ARRIVED: {
    label:      'Arrived at Site',
    color:      'text-cyan-700',
    bgColor:    'bg-cyan-50 border-cyan-200',
    dotColor:   'bg-cyan-500',
    icon:       '📍',
    isTerminal: false,
  },
  IN_PROGRESS: {
    label:      'In Progress',
    color:      'text-amber-700',
    bgColor:    'bg-amber-50 border-amber-200',
    dotColor:   'bg-amber-500',
    icon:       '🔧',
    isTerminal: false,
  },
  WORK_COMPLETED: {
    label:      'Work Completed',
    color:      'text-teal-700',
    bgColor:    'bg-teal-50 border-teal-200',
    dotColor:   'bg-teal-500',
    icon:       '🏁',
    isTerminal: false,
  },
  RESOLUTION_SUBMITTED: {
    label:      'Resolution Submitted',
    color:      'text-green-700',
    bgColor:    'bg-green-50 border-green-200',
    dotColor:   'bg-green-500',
    icon:       '📤',
    isTerminal: true,
  },
  CANNOT_RESOLVE: {
    label:      'Cannot Resolve',
    color:      'text-red-700',
    bgColor:    'bg-red-50 border-red-200',
    dotColor:   'bg-red-500',
    icon:       '🚫',
    isTerminal: true,
  },
  NEEDS_ESCALATION: {
    label:      'Escalated',
    color:      'text-orange-700',
    bgColor:    'bg-orange-50 border-orange-200',
    dotColor:   'bg-orange-500',
    icon:       '⚠️',
    isTerminal: true,
  },
};

// ─────────────────────────────────────────
// Priority config — reuses M1/M2 PriorityBadge conventions
// ─────────────────────────────────────────
export const PRIORITY_CONFIG: Record<ComplaintPriority, {
  label:    string;
  color:    string;
  bgColor:  string;
  order:    number;   // sort order (lower = higher urgency)
}> = {
  CRITICAL: { label: 'Critical', color: 'text-red-700',    bgColor: 'bg-red-100',    order: 1 },
  HIGH:     { label: 'High',     color: 'text-orange-700', bgColor: 'bg-orange-100', order: 2 },
  MEDIUM:   { label: 'Medium',   color: 'text-amber-700',  bgColor: 'bg-amber-100',  order: 3 },
  LOW:      { label: 'Low',      color: 'text-gray-600',   bgColor: 'bg-gray-100',   order: 4 },
};

// ─────────────────────────────────────────
// Evidence category labels
// ─────────────────────────────────────────
export const EVIDENCE_CATEGORY_LABELS: Record<string, string> = {
  BEFORE_PHOTO:   'Before Photo',
  AFTER_PHOTO:    'After Photo',
  FIELD_DOCUMENT: 'Field Document',
  FIELD_NOTES:    'Field Notes',
  OTHER:          'Other Evidence',
};

// ─────────────────────────────────────────
// SLA helpers
// ─────────────────────────────────────────
export function getSLAStatus(slaDeadline: string | null, status: FieldTaskStatus): {
  isOverdue:    boolean;
  remainingMs:  number;
  label:        string;
  colorClass:   string;
} {
  const terminal = ['RESOLUTION_SUBMITTED', 'CANNOT_RESOLVE', 'NEEDS_ESCALATION'];
  if (!slaDeadline || terminal.includes(status)) {
    return { isOverdue: false, remainingMs: 0, label: '—', colorClass: 'text-gray-400' };
  }

  const remaining = new Date(slaDeadline).getTime() - Date.now();
  const isOverdue = remaining < 0;

  if (isOverdue) {
    const hours = Math.abs(Math.floor(remaining / 3_600_000));
    return {
      isOverdue:  true,
      remainingMs: remaining,
      label:      `Overdue by ${hours}h`,
      colorClass: 'text-red-600 font-semibold',
    };
  }

  const hours   = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  if (hours < 4) {
    return { isOverdue: false, remainingMs: remaining, label: `${hours}h ${minutes}m left`, colorClass: 'text-amber-600 font-medium' };
  }
  if (hours < 24) {
    return { isOverdue: false, remainingMs: remaining, label: `${hours}h left`, colorClass: 'text-blue-600' };
  }
  const days = Math.floor(hours / 24);
  return { isOverdue: false, remainingMs: remaining, label: `${days}d left`, colorClass: 'text-gray-500' };
}

// ─────────────────────────────────────────
// Format date
// ─────────────────────────────────────────
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─────────────────────────────────────────
// File size formatter
// ─────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1_048_576)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

// ─────────────────────────────────────────
// Get next valid action buttons for a task status
// ─────────────────────────────────────────
export type FieldAction =
  | 'accept'
  | 'arrive'
  | 'start'
  | 'complete'
  | 'submitResolution'
  | 'cannotResolve'
  | 'escalate'
  | 'addNotes'
  | 'uploadEvidence';

export function getAvailableActions(status: FieldTaskStatus): FieldAction[] {
  switch (status) {
    case 'ASSIGNED':
      return ['accept', 'cannotResolve', 'escalate'];
    case 'ACCEPTED':
      return ['arrive', 'addNotes', 'cannotResolve', 'escalate'];
    case 'ARRIVED':
      return ['start', 'addNotes', 'uploadEvidence', 'cannotResolve', 'escalate'];
    case 'IN_PROGRESS':
      return ['addNotes', 'uploadEvidence', 'complete', 'cannotResolve', 'escalate'];
    case 'WORK_COMPLETED':
      return ['uploadEvidence', 'submitResolution', 'addNotes'];
    default:
      return [];
  }
}
