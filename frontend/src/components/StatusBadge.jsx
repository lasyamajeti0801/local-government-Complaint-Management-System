import React from 'react';
import { 
  Clock, CheckCircle, AlertCircle, Play, UserCheck, ShieldCheck, XCircle, FileText 
} from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const s = status || 'SUBMITTED';

  switch (s) {
    case 'SUBMITTED':
      return <span className="badge badge-submitted"><FileText size={12} /> SUBMITTED</span>;
    case 'UNDER_REVIEW':
      return <span className="badge badge-under-review"><Clock size={12} /> UNDER REVIEW</span>;
    case 'ASSIGNED':
      return <span className="badge badge-assigned"><UserCheck size={12} /> ASSIGNED</span>;
    case 'FIELD_VERIFICATION':
      return <span className="badge badge-field"><Play size={12} /> FIELD VERIFICATION</span>;
    case 'IN_PROGRESS':
      return <span className="badge badge-in-progress"><Play size={12} /> IN PROGRESS</span>;
    case 'RESOLUTION_SUBMITTED':
      return <span className="badge badge-resolution-submitted"><AlertCircle size={12} /> RESOLUTION SUBMITTED</span>;
    case 'CITIZEN_VERIFICATION':
      return <span className="badge badge-field"><UserCheck size={12} /> CITIZEN VERIFICATION</span>;
    case 'RESOLVED':
      return <span className="badge badge-resolved"><CheckCircle size={12} /> RESOLVED</span>;
    case 'CLOSED':
      return <span className="badge badge-closed"><ShieldCheck size={12} /> CLOSED</span>;
    case 'REJECTED':
      return <span className="badge badge-rejected"><XCircle size={12} /> REJECTED</span>;
    default:
      return <span className="badge badge-submitted">{s}</span>;
  }
};
