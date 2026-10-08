// ============================================================
// NAGAR CONNECT - OFFICER COMPLAINT QUEUE (Member 3 Core)
// ============================================================

window.renderOfficerQueuePage = async function(container, queryParams = {}) {
  const user = window.auth.getUser();

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#officer-dashboard">${window.i18n.t('dashboard')}</a>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">${window.i18n.t('officerQueue')}</span>
    </nav>

    <!-- Page Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">
          📋 ${window.i18n.t('complaintQueueTitle')}
        </h1>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${window.i18n.t('tagline')}
        </div>
      </div>
      <div>
        <button class="btn btn-secondary" id="btn-refresh-queue">
          ${window.i18n.t('refreshQueue')}
        </button>
      </div>
    </div>

    <!-- Filter & Search Toolbar (Component from Design System) -->
    <div class="filter-toolbar">
      <div class="search-input-wrapper">
        <span class="search-icon-pos">🔍</span>
        <input type="text" id="queue-search" class="form-control" placeholder="${window.i18n.t('searchPlaceholder')}" value="${queryParams.search || ''}" />
      </div>

      <div class="filter-selects-group">
        <!-- Status Filter -->
        <select id="filter-status" class="form-select" style="width: auto;">
          <option value="ALL">${window.i18n.t('allStatuses')}</option>
          <option value="SUBMITTED" ${queryParams.status === 'SUBMITTED' ? 'selected' : ''}>New (Submitted)</option>
          <option value="UNDER_REVIEW" ${queryParams.status === 'UNDER_REVIEW' ? 'selected' : ''}>Under Review</option>
          <option value="ASSIGNED" ${queryParams.status === 'ASSIGNED' ? 'selected' : ''}>Assigned to Field</option>
          <option value="IN_PROGRESS" ${queryParams.status === 'IN_PROGRESS' ? 'selected' : ''}>Work in Progress</option>
          <option value="RESOLUTION_SUBMITTED" ${queryParams.status === 'RESOLUTION_SUBMITTED' ? 'selected' : ''}>Resolution Submitted</option>
          <option value="CITIZEN_VERIFICATION" ${queryParams.status === 'CITIZEN_VERIFICATION' ? 'selected' : ''}>Citizen Verification</option>
          <option value="RESOLVED" ${queryParams.status === 'RESOLVED' ? 'selected' : ''}>Resolved</option>
          <option value="CLOSED" ${queryParams.status === 'CLOSED' ? 'selected' : ''}>Closed</option>
        </select>

        <!-- Priority Filter -->
        <select id="filter-priority" class="form-select" style="width: auto;">
          <option value="ALL">${window.i18n.t('allPriorities')}</option>
          <option value="CRITICAL" ${queryParams.priority === 'CRITICAL' ? 'selected' : ''}>Critical</option>
          <option value="HIGH" ${queryParams.priority === 'HIGH' ? 'selected' : ''}>High</option>
          <option value="MEDIUM" ${queryParams.priority === 'MEDIUM' ? 'selected' : ''}>Medium</option>
          <option value="LOW" ${queryParams.priority === 'LOW' ? 'selected' : ''}>Low</option>
        </select>

        <!-- SLA Status Filter -->
        <select id="filter-sla" class="form-select" style="width: auto;">
          <option value="ALL">${window.i18n.t('allSla')}</option>
          <option value="OVERDUE" ${queryParams.sla_status === 'OVERDUE' ? 'selected' : ''}>⚠️ Overdue Only</option>
          <option value="APPROACHING_DEADLINE" ${queryParams.sla_status === 'APPROACHING_DEADLINE' ? 'selected' : ''}>⏳ Approaching Deadline</option>
          <option value="ON_TRACK" ${queryParams.sla_status === 'ON_TRACK' ? 'selected' : ''}>✓ On Track</option>
        </select>

        <!-- Sort By -->
        <select id="filter-sort" class="form-select" style="width: auto;">
          <option value="SLA_URGENCY">Sort: SLA Urgency</option>
          <option value="NEWEST">Sort: Newest First</option>
          <option value="PRIORITY">Sort: Priority</option>
          <option value="OLDEST">Sort: Oldest First</option>
        </select>
      </div>
    </div>

    <!-- Table Container Placeholder -->
    <div id="queue-table-container" class="table-container">
      <div style="padding: 3rem; text-align: center;" class="text-muted">
        Loading grievances from municipal registry...
      </div>
    </div>
  `;

  // Function to fetch and render table
  async function loadQueueData() {
    const search = container.querySelector('#queue-search').value.trim();
    const status = container.querySelector('#filter-status').value;
    const priority = container.querySelector('#filter-priority').value;
    const slaStatus = container.querySelector('#filter-sla').value;
    const sortBy = container.querySelector('#filter-sort').value;

    const params = {
      search,
      status: status !== 'ALL' ? status : undefined,
      priority: priority !== 'ALL' ? priority : undefined,
      sla_status: slaStatus !== 'ALL' ? slaStatus : undefined,
      sortBy
    };

    if (queryParams.is_escalated) {
      params.is_escalated = '1';
    }

    try {
      const res = await window.api.get('/officer/queue', params);
      const complaints = res.data || [];
      renderQueueTable(complaints);
    } catch (err) {
      window.toast.error('Failed to load complaint queue: ' + err.message);
    }
  }

  function renderQueueTable(complaints) {
    const tableContainer = container.querySelector('#queue-table-container');

    if (complaints.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No Matching Grievances Found</div>
          <div class="empty-state-desc">No complaints match your active filter criteria. Try adjusting the search query or status filters.</div>
          <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Reset Filters</button>
        </div>
      `;
      const resetBtn = tableContainer.querySelector('#btn-reset-filters');
      if (resetBtn) {
        resetBtn.onclick = () => {
          container.querySelector('#queue-search').value = '';
          container.querySelector('#filter-status').value = 'ALL';
          container.querySelector('#filter-priority').value = 'ALL';
          container.querySelector('#filter-sla').value = 'ALL';
          loadQueueData();
        };
      }
      return;
    }

    const formatDate = (iso) => {
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      } catch (e) { return iso; }
    };

    tableContainer.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="data-table" aria-label="Officer Grievance Queue">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Category</th>
              <th>Citizen</th>
              <th>Location & Landmark</th>
              <th>Priority</th>
              <th>Created Date</th>
              <th>SLA Status & Time</th>
              <th>Status</th>
              <th>Assigned Staff</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(c => {
              const sla = c.sla_metrics || {};
              let slaPillClass = 'sla-on-track';
              if (sla.slaStatus === 'OVERDUE') slaPillClass = 'sla-overdue';
              else if (sla.slaStatus === 'APPROACHING_DEADLINE') slaPillClass = 'sla-approaching';

              return `
                <tr>
                  <!-- 1. Complaint ID -->
                  <td>
                    <a href="#officer-complaint-detail?id=${c.id}" style="font-weight: 700; color: var(--gov-blue-700); font-family: monospace;">
                      ${c.complaint_number}
                    </a>
                    ${c.is_escalated ? '<span title="Escalated to Higher Authority" style="margin-left: 0.3rem;">🚨</span>' : ''}
                  </td>

                  <!-- 2. Category -->
                  <td>
                    <div style="font-weight: 600; font-size: 0.85rem;">${c.category_name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${c.department_name}</div>
                  </td>

                  <!-- 3. Citizen -->
                  <td>
                    <div style="font-weight: 600;">${c.citizen_name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${c.citizen_phone || 'Citizen'}</div>
                  </td>

                  <!-- 4. Location -->
                  <td style="max-width: 200px;">
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.825rem;" title="${c.location_address}">
                      📍 ${c.location_address}
                    </div>
                    ${c.landmark ? `<div style="font-size: 0.72rem; color: var(--text-muted);">Near: ${c.landmark}</div>` : ''}
                  </td>

                  <!-- 5. Priority -->
                  <td>
                    <span class="badge badge-priority-${c.priority}">${c.priority}</span>
                  </td>

                  <!-- 6. Created Date -->
                  <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                    ${formatDate(c.created_at)}
                  </td>

                  <!-- 7. SLA Status & Remaining Time -->
                  <td>
                    <span class="sla-pill ${slaPillClass}">
                      ${sla.slaStatus === 'OVERDUE' ? '⚠️ ' : (sla.slaStatus === 'APPROACHING_DEADLINE' ? '⏳ ' : '✓ ')}
                      ${sla.formattedRemaining}
                    </span>
                  </td>

                  <!-- 8. Status -->
                  <td>
                    <span class="badge badge-status-${c.status}">${c.status.replace(/_/g, ' ')}</span>
                  </td>

                  <!-- 9. Assigned Staff -->
                  <td>
                    ${c.assigned_staff_name ? `
                      <div style="font-weight: 600; font-size: 0.825rem;">👷 ${c.assigned_staff_name}</div>
                      <div style="font-size: 0.7rem; color: var(--text-muted);">${c.assigned_staff_designation || 'Technician'}</div>
                    ` : `
                      <span class="badge badge-priority-LOW">Unassigned</span>
                    `}
                  </td>

                  <!-- 10. Action -->
                  <td style="text-align: right; white-space: nowrap;">
                    <button class="btn btn-primary btn-sm" onclick="window.location.hash='#officer-complaint-detail?id=${c.id}'">
                      Manage →
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="window.openQuickActionModal('${c.id}')" title="Quick Actions">
                      ⚡
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding: 0.85rem 1.25rem; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted);">
        <span>Showing <strong>${complaints.length}</strong> complaints in municipal queue</span>
        <span>Active SLA monitoring enabled</span>
      </div>
    `;
  }

  // Filter change listeners
  container.querySelector('#queue-search').oninput = debounce(loadQueueData, 350);
  container.querySelector('#filter-status').onchange = loadQueueData;
  container.querySelector('#filter-priority').onchange = loadQueueData;
  container.querySelector('#filter-sla').onchange = loadQueueData;
  container.querySelector('#filter-sort').onchange = loadQueueData;
  container.querySelector('#btn-refresh-queue').onclick = () => {
    loadQueueData();
    window.toast.info('Refreshed complaint queue.');
  };

  // Initial load
  loadQueueData();
};

function debounce(fn, wait) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Quick Action Modal Launcher directly from queue
window.openQuickActionModal = async function(complaintId) {
  try {
    const res = await window.api.get(`/officer/complaints/${complaintId}`);
    const c = res.data;

    const staffRes = await window.api.get('/officer/field-staff');
    const staffList = staffRes.data || [];

    window.modal.open({
      title: `⚡ Quick Action: ${c.complaint_number}`,
      contentHtml: `
        <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
          <div style="font-weight: 700; color: var(--text-primary);">${c.title}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
            Priority: <strong>${c.priority}</strong> • Status: <strong>${c.status}</strong> • Citizen: ${c.citizen_name}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <!-- Quick Assign -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Assign Field Personnel</label>
            <select id="quick-assign-staff" class="form-select">
              <option value="">-- Choose Field Technician --</option>
              ${staffList.map(s => `
                <option value="${s.id}">${s.name} (${s.designation || 'Technician'}) - ${s.active_tasks_count || 0} active tasks</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Work Instructions</label>
            <input type="text" id="quick-instructions" class="form-control" placeholder="e.g. Inspect pipeline and repair joint leak" value="Inspect site and remediate grievance as per municipal SOP." />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="window.executeQuickAssign('${c.id}')">Assign & Dispatch</button>
        <a href="#officer-complaint-detail?id=${c.id}" class="btn btn-outline-primary" onclick="window.modal.close()">Full Action Center →</a>
      `
    });
  } catch (err) {
    window.toast.error('Could not load complaint details: ' + err.message);
  }
};

window.executeQuickAssign = async function(complaintId) {
  const staffId = document.getElementById('quick-assign-staff').value;
  const instructions = document.getElementById('quick-instructions').value;

  if (!staffId) {
    window.toast.warning('Please select a field technician.');
    return;
  }

  try {
    await window.api.post(`/officer/complaints/${complaintId}/assign`, {
      fieldStaffId: staffId,
      instructions,
      deadlineHours: 24
    });
    window.modal.close();
    window.toast.success('Field technician assigned successfully!');
    if (window.renderOfficerQueuePage) {
      window.router.handleRoute();
    }
  } catch (err) {
    window.toast.error('Assignment failed: ' + err.message);
  }
};
