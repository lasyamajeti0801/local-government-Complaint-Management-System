// ============================================================
// NAGAR CONNECT - OFFICER DASHBOARD PAGE (Member 3 - Multilingual)
// ============================================================

window.renderOfficerDashboardPage = async function(container) {
  const user = window.auth.getUser();

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span>${window.i18n.t('appTitle')}</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">${window.i18n.t('dashboard')}</span>
    </nav>

    <!-- Page Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          📊 ${window.i18n.t('officerDashboardTitle')}
        </h1>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${user ? user.department_name || user.role : 'Municipal Department'} • ${window.i18n.t('activeJurisdiction')}
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <a href="#officer-queue" class="btn btn-primary">
          📋 ${window.i18n.t('officerQueue')}
        </a>
        <a href="#officer-sla" class="btn btn-secondary">
          ⏱️ ${window.i18n.t('slaRules')}
        </a>
      </div>
    </div>

    <!-- Loading Skeleton Placeholder -->
    <div id="dashboard-loading" style="padding: 2rem; text-align: center;">
      <div class="skeleton" style="height: 100px; margin-bottom: 1rem;"></div>
      <div class="skeleton" style="height: 250px;"></div>
    </div>

    <!-- Dashboard Content Container -->
    <div id="dashboard-content" class="hidden"></div>
  `;

  try {
    const res = await window.api.get('/officer/dashboard');
    const { kpis, categoryStats, recentActivity, staffWorkload } = res.data;

    const loadingEl = container.querySelector('#dashboard-loading');
    const contentEl = container.querySelector('#dashboard-content');
    if (loadingEl) loadingEl.remove();
    if (contentEl) contentEl.classList.remove('hidden');

    contentEl.innerHTML = `
      <!-- KPI Cards Grid (Specified in Member 3 Requirements) -->
      <div class="kpi-grid">
        <!-- New Complaints -->
        <a href="#officer-queue?status=SUBMITTED" class="kpi-card kpi-new" style="text-decoration: none;">
          <div class="kpi-label">
            <span>${window.i18n.t('newComplaints')}</span>
            <span class="kpi-icon">📥</span>
          </div>
          <div class="kpi-value">${kpis.newComplaints}</div>
          <div class="kpi-subtext">Awaiting triage</div>
        </a>

        <!-- Assigned Complaints -->
        <a href="#officer-queue?status=ASSIGNED" class="kpi-card kpi-assigned" style="text-decoration: none;">
          <div class="kpi-label">
            <span>${window.i18n.t('assignedComplaints')}</span>
            <span class="kpi-icon">👷</span>
          </div>
          <div class="kpi-value">${kpis.assignedComplaints}</div>
          <div class="kpi-subtext">Field crew dispatched</div>
        </a>

        <!-- Pending Review Complaints -->
        <a href="#officer-queue?status=UNDER_REVIEW" class="kpi-card kpi-pending" style="text-decoration: none;">
          <div class="kpi-label">
            <span>${window.i18n.t('pendingComplaints')}</span>
            <span class="kpi-icon">⏳</span>
          </div>
          <div class="kpi-value">${kpis.pendingComplaints}</div>
          <div class="kpi-subtext">Review or verification</div>
        </a>

        <!-- High & Critical Priority -->
        <a href="#officer-queue?priority=HIGH" class="kpi-card" style="text-decoration: none;">
          <div class="kpi-label">
            <span>${window.i18n.t('highPriority')}</span>
            <span class="kpi-icon">⚡</span>
          </div>
          <div class="kpi-value" style="color: var(--saffron-600);">${kpis.highPriority}</div>
          <div class="kpi-subtext">Urgent civic concern</div>
        </a>

        <!-- Overdue SLA Breached -->
        <a href="#officer-queue?sla_status=OVERDUE" class="kpi-card kpi-overdue" style="text-decoration: none;">
          <div class="kpi-label">
            <span style="color: var(--crimson-600);">${window.i18n.t('overdueComplaints')}</span>
            <span class="kpi-icon">⚠️</span>
          </div>
          <div class="kpi-value" style="color: var(--crimson-600);">${kpis.overdue}</div>
          <div class="kpi-subtext">Breached statutory deadline</div>
        </a>

        <!-- Escalated -->
        <a href="#officer-queue?is_escalated=1" class="kpi-card kpi-escalated" style="text-decoration: none;">
          <div class="kpi-label">
            <span>${window.i18n.t('escalatedComplaints')}</span>
            <span class="kpi-icon">🚨</span>
          </div>
          <div class="kpi-value" style="color: #7e22ce;">${kpis.escalated}</div>
          <div class="kpi-subtext">L1 / L2 higher review</div>
        </a>
      </div>

      <!-- Main Operational Grid: Category Breakdown + Recent Stream + Staff Workload -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
        
        <!-- Left: Activity Feed & Categories -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Category Workload Breakdown -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${window.i18n.t('categoryWorkload')}</div>
              <a href="#officer-queue" class="text-sm font-semibold">${window.i18n.t('officerQueue')} →</a>
            </div>
            <div class="card-body">
              ${categoryStats.length === 0 ? '<div class="text-muted text-sm">No grievances recorded yet.</div>' : `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                  ${categoryStats.map(cat => `
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 0.85rem; border-radius: var(--radius-md);">
                      <div style="font-size: 0.825rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${cat.category_name}</div>
                      <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <span style="font-size: 1.35rem; font-weight: 800; color: var(--gov-blue-700);">${cat.count}</span>
                        <span class="text-xs text-muted">grievances</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- Recent Department Activity Stream -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${window.i18n.t('recentActivityTitle')}</div>
              <span class="badge badge-priority-LOW">Live History</span>
            </div>
            <div class="card-body" style="padding: 0;">
              ${recentActivity.length === 0 ? '<div style="padding: 1.5rem;" class="text-muted text-sm">No recent activity.</div>' : `
                <div style="divide-y divide-gray-200;">
                  ${recentActivity.map(act => `
                    <div style="padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">
                          <a href="#officer-complaint-detail?id=${act.complaint_id}" style="color: var(--gov-blue-700); font-weight: 700;">
                            ${act.complaint_number}
                          </a>
                          : ${act.complaint_title}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">
                          ${act.remarks || act.action} • By <strong>${act.actor_name || 'Officer'}</strong> (${act.actor_role})
                        </div>
                      </div>
                      <div style="text-align: right; flex-shrink: 0; margin-left: 1rem;">
                        <span class="badge badge-status-${act.new_status}">${act.new_status.replace(/_/g, ' ')}</span>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">
                          ${new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

        </div>

        <!-- Right: Active Field Staff Workload Widget -->
        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">${window.i18n.t('fieldSquad')}</div>
              <span class="text-xs text-muted">Workload</span>
            </div>
            <div class="card-body">
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                Technicians available for task assignment in ${user ? user.department_name || 'department' : 'department'}:
              </div>

              ${staffWorkload.length === 0 ? '<div class="text-muted text-sm">No field staff registered for this department.</div>' : `
                <div>
                  ${staffWorkload.map(staff => `
                    <div class="workload-item">
                      <div>
                        <div style="font-weight: 700; color: var(--text-primary);">${staff.name}</div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${staff.designation || 'Technician'} • ${staff.ward_number || 'Zone 1'}</div>
                      </div>
                      <div style="text-align: right;">
                        <span class="badge ${staff.active_tasks_count > 3 ? 'badge-priority-HIGH' : 'badge-priority-LOW'}">
                          ${staff.active_tasks_count} ${window.i18n.t('activeTasks')}
                        </span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    window.toast.error('Failed to load officer dashboard: ' + err.message);
  }
};
