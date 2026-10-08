// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/components/field/FieldTaskStatusBadge.tsx
// Extends M1 StatusBadge — specific to field task statuses.
// =============================================================

import React from 'react';
import type { FieldTaskStatus } from '../../types/fieldTask.types';
import { FIELD_STATUS_CONFIG } from './fieldUtils';

interface Props {
  status:    FieldTaskStatus;
  showIcon?: boolean;
  size?:     'sm' | 'md' | 'lg';
}

export const FieldTaskStatusBadge: React.FC<Props> = ({
  status,
  showIcon = true,
  size = 'md',
}) => {
  const cfg = FIELD_STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${sizeClasses} ${cfg.color} ${cfg.bgColor}
      `}
      aria-label={`Status: ${cfg.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotColor}`} aria-hidden="true" />
      {showIcon && <span aria-hidden="true">{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
};

export default FieldTaskStatusBadge;
