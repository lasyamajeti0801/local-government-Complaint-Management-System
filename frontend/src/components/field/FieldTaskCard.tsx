// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/components/field/FieldTaskCard.tsx
// Task card shown in dashboard lists — reuses M1 Card component.
// =============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FieldTask } from '../../types/fieldTask.types';
import { FieldTaskStatusBadge } from './FieldTaskStatusBadge';
import {
  PRIORITY_CONFIG,
  getSLAStatus,
  formatDateTime,
  getAvailableActions,
} from './fieldUtils';

interface Props {
  task:         FieldTask;
  onAction?:    (taskId: string, action: string) => void;
  compact?:     boolean;
}

export const FieldTaskCard: React.FC<Props> = ({ task, onAction, compact = false }) => {
  const navigate        = useNavigate();
  const priorityCfg     = PRIORITY_CONFIG[task.complaint_priority] ?? PRIORITY_CONFIG['MEDIUM'];
  const sla             = getSLAStatus(task.sla_deadline, task.status);
  const availableActions = getAvailableActions(task.status);

  const handleViewDetail = () => navigate(`/field/tasks/${task.id}`);

  return (
    <article
      className={`
        bg-white border border-gray-200 rounded-lg shadow-sm
        hover:shadow-md hover:border-blue-300 transition-all duration-150
        cursor-pointer focus-within:ring-2 focus-within:ring-blue-400
        ${sla.isOverdue ? 'border-l-4 border-l-red-500' : ''}
      `}
      onClick={handleViewDetail}
      aria-label={`Task for complaint ${task.complaint_number}`}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Complaint ID + Category */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {task.complaint_number}
              </span>
              {task.category_name && (
                <span className="text-xs text-gray-500 truncate">{task.category_name}</span>
              )}
            </div>
            {/* Title */}
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
              {task.complaint_title}
            </h3>
          </div>

          {/* Priority Badge */}
          <span
            className={`
              flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full
              ${priorityCfg.color} ${priorityCfg.bgColor}
            `}
            aria-label={`Priority: ${priorityCfg.label}`}
          >
            {priorityCfg.label}
          </span>
        </div>

        {/* Location */}
        {task.location_address && (
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1 truncate">
            <span aria-hidden="true">📍</span>
            <span className="truncate">{task.location_address}</span>
            {task.location_landmark && (
              <span className="text-gray-400">· {task.location_landmark}</span>
            )}
          </p>
        )}
      </div>

      {/* Status + SLA row */}
      <div className={`px-4 ${compact ? 'pb-3' : 'pb-2'} flex items-center justify-between gap-2`}>
        <FieldTaskStatusBadge status={task.status} size="sm" />
        <span className={`text-xs ${sla.colorClass}`} aria-label={`SLA: ${sla.label}`}>
          ⏱ {sla.label}
        </span>
      </div>

      {/* Detail row — assigned date + department */}
      {!compact && (
        <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2">
          <span>Assigned {formatDateTime(task.assigned_at)}</span>
          {task.department_name && <span>{task.department_name}</span>}
        </div>
      )}

      {/* Quick action buttons (stop propagation so card nav doesn't fire) */}
      {!compact && availableActions.length > 0 && onAction && (
        <div
          className="px-4 pb-3 flex gap-2 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {availableActions.slice(0, 2).map((action) => (
            <button
              key={action}
              onClick={() => onAction(task.id, action)}
              className="
                text-xs px-3 py-1.5 rounded border border-blue-300
                text-blue-700 bg-white hover:bg-blue-50
                font-medium transition-colors duration-100
                focus:outline-none focus:ring-2 focus:ring-blue-400
              "
              aria-label={`${action} task ${task.complaint_number}`}
            >
              {ACTION_LABELS[action] ?? action}
            </button>
          ))}
          <button
            onClick={handleViewDetail}
            className="
              text-xs px-3 py-1.5 rounded border border-gray-200
              text-gray-600 bg-white hover:bg-gray-50
              font-medium transition-colors duration-100
              focus:outline-none focus:ring-2 focus:ring-gray-300
            "
          >
            View Details →
          </button>
        </div>
      )}
    </article>
  );
};

const ACTION_LABELS: Record<string, string> = {
  accept:          '✅ Accept Task',
  arrive:          '📍 Mark Arrived',
  start:           '🔧 Start Work',
  complete:        '🏁 Mark Complete',
  submitResolution:'📤 Submit Resolution',
  addNotes:        '📝 Add Notes',
  uploadEvidence:  '📷 Upload Evidence',
  cannotResolve:   '🚫 Cannot Resolve',
  escalate:        '⚠️ Escalate',
};

export default FieldTaskCard;
