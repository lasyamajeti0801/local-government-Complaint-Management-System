// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/components/field/FieldTaskTimeline.tsx
// Timeline for a field task's status history.
// Extends M1 Timeline component pattern — does NOT create a 2nd one.
// =============================================================

import React from 'react';
import type { FieldTaskStatusHistory } from '../../types/fieldTask.types';
import { FIELD_STATUS_CONFIG, formatDateTime } from './fieldUtils';

interface Props {
  history: FieldTaskStatusHistory[];
}

export const FieldTaskTimeline: React.FC<Props> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No timeline events yet.
      </div>
    );
  }

  return (
    <ol className="relative" aria-label="Task timeline">
      {history.map((event, idx) => {
        const cfg = FIELD_STATUS_CONFIG[event.to_status as keyof typeof FIELD_STATUS_CONFIG];
        const isLast = idx === history.length - 1;

        return (
          <li key={event.id} className="flex gap-4 pb-6 relative">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                className="absolute left-[18px] top-8 bottom-0 w-0.5 bg-gray-200"
                aria-hidden="true"
              />
            )}

            {/* Status dot */}
            <div className="flex-shrink-0 mt-0.5">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center
                  text-base border-2 border-white shadow-sm
                  ${cfg?.bgColor ?? 'bg-gray-100'}
                `}
                aria-hidden="true"
              >
                {cfg?.icon ?? '⬤'}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
              {/* Status transition */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-sm font-semibold ${cfg?.color ?? 'text-gray-700'}`}>
                  {cfg?.label ?? event.to_status}
                </span>
                <time
                  dateTime={event.changed_at}
                  className="text-xs text-gray-400 flex-shrink-0"
                >
                  {formatDateTime(event.changed_at)}
                </time>
              </div>

              {/* By whom */}
              <p className="text-xs text-gray-500 mt-0.5">
                by <strong className="font-medium text-gray-700">{event.changed_by_name}</strong>
                {' '}({event.changed_by_role?.replace('_', ' ')})
              </p>

              {/* From status */}
              {event.from_status && (
                <p className="text-xs text-gray-400 mt-1">
                  from <span className="font-mono">{event.from_status}</span>
                </p>
              )}

              {/* Reason / Notes */}
              {(event.reason || event.notes) && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 border border-gray-100">
                  {event.reason && <p><span className="font-medium">Reason:</span> {event.reason}</p>}
                  {event.notes  && <p className="mt-0.5"><span className="font-medium">Notes:</span> {event.notes}</p>}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default FieldTaskTimeline;
