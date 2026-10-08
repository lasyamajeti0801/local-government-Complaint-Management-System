// ============================================================
// NAGAR CONNECT - CITIZEN DASHBOARD (Member 2 Foundation)
// ============================================================

window.renderCitizenDashboardPage = async function(container) {
  const user = window.auth.getUser();

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span>${window.i18n.t('appTitle')}</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">${window.i18n.t('myComplaints')}</span>
    </nav>

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">
          📁 ${window.i18n.t('citizenDashboardTitle')}
        </h1>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Welcome, <strong>${user ? user.name : 'Citizen'}</strong> • Ward: ${user ? user.ward_number || 'Ward 14' : 'Zone 1'}
        </div>
      </div>
      <div>
        <a href="#citizen-create" class="btn btn-primary btn-lg">
          ${window.i18n.t('lodgeGrievance')}
        </a>
      </div>
    </div>

    <!-- Citizen KPI Cards -->
    <div class="kpi-grid" id="citizen-kpi-container">
      <div class="kpi-card">
        <div class="kpi-label">Total Lodged</div>
        <div class="kpi-value" id="kpi-cit-total">-</div>
      </div>
      <div class="kpi-card" style="border-top: 4px solid var(--gov-blue-600);">
        <div class="kpi-label">Active / Open</div>
        <div class="kpi-value" id="kpi-cit-open" style="color: var(--gov-blue-700);">-</div>
      </div>
      <div class="kpi-card" style="border-top: 4px solid var(--emerald-600);">
        <div class="kpi-label">Resolved</div>
        <div class="kpi-value" id="kpi-cit-resolved" style="color: var(--emerald-600);">-</div>
      </div>
      <div class="kpi-card" style="border-top: 4px solid var(--saffron-500);">
        <div class="kpi-label">Action Pending</div>
        <div class="kpi-value" id="kpi-cit-pending" style="color: var(--saffron-600);">-</div>
      </div>
    </div>

    <!-- Complaints List Container -->
    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <div class="card-title">📜 My Submitted Complaints</div>
      </div>
      <div class="card-body" id="citizen-complaints-list" style="padding: 0;">
        <div style="padding: 2rem; text-align: center;" class="text-muted">Loading your grievances...</div>
      </div>
    </div>
  `;

  try {
    const res = await window.api.get('/citizen/complaints');
    const { complaints, stats } = res.data;

    // Fill KPIs
    container.querySelector('#kpi-cit-total').textContent = stats.total;
    container.querySelector('#kpi-cit-open').textContent = stats.open;
    container.querySelector('#kpi-cit-resolved').textContent = stats.resolved;
    container.querySelector('#kpi-cit-pending').textContent = stats.pendingAction;

    const listEl = container.querySelector('#citizen-complaints-list');

    if (complaints.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No Grievances Lodged Yet</div>
          <div class="empty-state-desc">You have not registered any civic complaints. Click below to lodge an issue with the municipal corporation.</div>
          <a href="#citizen-create" class="btn btn-primary">Lodge First Grievance</a>
        </div>
      `;
      return;
    }

    const formatDate = (iso) => {
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) { return iso; }
    };

    listEl.innerHTML = `
      <div style="divide-y divide-gray-200;">
        ${complaints.map(c => `
          <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="max-width: 650px;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span style="font-weight: 800; color: var(--gov-blue-700); font-family: monospace; font-size: 0.95rem;">
                  ${c.complaint_number}
                </span>
                <span class="badge badge-status-${c.status}">${c.status.replace(/_/g, ' ')}</span>
                <span class="badge badge-priority-${c.priority}">${c.priority}</span>
              </div>
              <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.25rem;">
                ${c.title}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Department: <strong>${c.department_name}</strong> • ${c.category_name} • Lodged: ${formatDate(c.created_at)}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.3rem;">
                📍 ${c.location_address}
              </div>
            </div>

            <div style="text-align: right; flex-shrink: 0;">
              <a href="#citizen-detail?id=${c.id}" class="btn btn-outline-primary btn-sm">
                Track Timeline →
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    window.toast.error('Failed to load citizen grievances: ' + err.message);
  }
};
