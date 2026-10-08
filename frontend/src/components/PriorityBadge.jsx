import React from 'react';
import { AlertTriangle, AlertOctagon, Info, ArrowDown } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const p = (priority || 'MEDIUM').toUpperCase();

  switch (p) {
    case 'CRITICAL':
      return <span className="badge priority-critical"><AlertOctagon size={12} /> CRITICAL</span>;
    case 'HIGH':
      return <span className="badge priority-high"><AlertTriangle size={12} /> HIGH</span>;
    case 'MEDIUM':
      return <span className="badge priority-medium"><Info size={12} /> MEDIUM</span>;
    case 'LOW':
      return <span className="badge priority-low"><ArrowDown size={12} /> LOW</span>;
    default:
      return <span className="badge priority-medium">{p}</span>;
  }
};
