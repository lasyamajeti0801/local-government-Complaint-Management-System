// ============================================================
// NAGAR CONNECT - SHARED COMPLAINT TIMELINE COMPONENT
// Established in Member 2 & Reused by Member 3 & subsequent modules
// ============================================================

window.renderComplaintTimeline = function(historyEvents = [], currentStatus = 'SUBMITTED') {
  if (!historyEvents || historyEvents.length === 0) {
    return `
      <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No status transitions recorded yet.
      </div>
    `;
  }

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  };

  const actionLabels = {
    SUBMITTED: { label: 'Grievance Lodged', icon: '📝', cls: 'info' },
    REVIEWED: { label: 'Officer Review Commenced', icon: '🔍', cls: 'warning' },
    ASSIGNED: { label: 'Field Staff Assigned', icon: '👷', cls: 'info' },
    STATUS_UPDATED: { label: 'Progress Update', icon: '⚙️', cls: 'info' },
    ESCALATED: { label: 'High Priority Escalation', icon: '🚨', cls: 'danger' },
    RESOLUTION_SUBMITTED: { label: 'Field Work Completed & Proof Uploaded', icon: '📸', cls: 'completed' },
    RESOLVED: { label: 'Officer Verified & Resolved', icon: '✓', cls: 'completed' },
    CLOSED: { label: 'Citizen Confirmed & Ticket Closed', icon: '🔒', cls: 'completed' },
    REJECTED: { label: 'Grievance Rejected', icon: '✕', cls: 'danger' }
  };

  return `
    <div class="timeline">
      ${historyEvents.map((evt, idx) => {
        const isLatest = idx === historyEvents.length - 1;
        const meta = actionLabels[evt.action] || { label: evt.action, icon: '•', cls: 'info' };
        
        let markerClass = '';
        if (['RESOLVED', 'CLOSED', 'RESOLUTION_SUBMITTED'].includes(evt.new_status)) {
          markerClass = 'completed';
        } else if (evt.action === 'ESCALATED' || evt.new_status === 'REJECTED') {
          markerClass = 'danger';
        } else if (evt.new_status === 'UNDER_REVIEW') {
          markerClass = 'warning';
        }

        const actorRoleFormatted = evt.actor_role 
          ? evt.actor_role.replace(/_/g, ' ') 
          : 'MUNICIPAL SYSTEM';

        return `
          <div class="timeline-item ${markerClass}">
            <div class="timeline-marker">${meta.icon}</div>
            <div class="timeline-content" style="${isLatest ? 'border-left: 3px solid var(--gov-blue-600);' : ''}">
              <div class="timeline-header">
                <span class="timeline-action">${meta.label}</span>
                <span class="timeline-date">${formatTime(evt.created_at)}</span>
              </div>
              <div class="timeline-actor">
                👤 ${evt.actor_name || 'System'} • <span style="font-weight: 500; font-size: 0.72rem; text-transform: uppercase;">${actorRoleFormatted}</span>
                ${evt.actor_designation ? `(${evt.actor_designation})` : ''}
              </div>
              ${evt.remarks ? `
                <div class="timeline-remarks">${evt.remarks}</div>
              ` : ''}
              ${evt.new_status ? `
                <div style="margin-top: 0.4rem;">
                  <span class="badge badge-status-${evt.new_status}">Status: ${evt.new_status.replace(/_/g, ' ')}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};
