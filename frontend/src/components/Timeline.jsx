import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

const LIFECYCLE_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'FIELD_VERIFICATION', label: 'Field Verification' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLUTION_SUBMITTED', label: 'Resolution Submitted' },
  { key: 'CITIZEN_VERIFICATION', label: 'Citizen Verification' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' }
];

export const Timeline = ({ history = [], currentStatus = 'SUBMITTED' }) => {
  const currentIdx = LIFECYCLE_STAGES.findIndex(s => s.key === currentStatus);

  return (
    <div className="timeline-container">
      {/* 9-Stage Progress Stepper Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        marginBottom: '2rem',
        padding: '0 0.5rem',
        overflowX: 'auto'
      }}>
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isPassed = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div
              key={stage.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                minWidth: '90px',
                position: 'relative',
                zIndex: 2
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isCurrent
                    ? 'var(--gov-primary)'
                    : isPassed
                    ? 'var(--civic-green)'
                    : 'var(--bg-surface-active)',
                  color: isPassed ? 'white' : 'var(--text-disabled)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: isCurrent ? '3px solid #bfdbfe' : 'none',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(30, 58, 138, 0.2)' : 'none',
                  marginBottom: '0.35rem'
                }}
              >
                {isPassed && !isCurrent ? <Check size={14} /> : idx + 1}
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent
                    ? 'var(--gov-primary)'
                    : isPassed
                    ? 'var(--text-main)'
                    : 'var(--text-disabled)',
                  lineHeight: 1.2
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Audit Milestone List */}
      <div className="timeline">
        {history && history.length > 0 ? (
          history.map((item, idx) => (
            <div key={item.id || idx} className="timeline-item">
              <div className="timeline-dot completed">
                <Check size={12} />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-title">
                    Status updated to <strong style={{ color: 'var(--gov-primary)' }}>{item.new_status}</strong>
                  </span>
                  <span className="timeline-time">
                    {new Date(item.created_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <p className="timeline-desc">
                  {item.remarks || 'Status milestone recorded in municipal grievance log.'}
                </p>
                {item.changed_by_name && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    Action taken by: <strong>{item.changed_by_name}</strong> ({item.changed_by_role || 'Staff'})
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="timeline-item">
            <div className="timeline-dot">
              <Clock size={12} />
            </div>
            <div className="timeline-content">
              <span className="timeline-title">Complaint Logged</span>
              <p className="timeline-desc">Awaiting initial departmental officer review.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
