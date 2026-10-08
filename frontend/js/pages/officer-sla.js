// ============================================================
// NAGAR CONNECT - SLA BENCHMARK MATRIX PAGE (Member 3)
// ============================================================

window.renderOfficerSlaPage = async function(container) {
  const user = window.auth.getUser();

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#officer-dashboard">Officer Dashboard</a>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">SLA Benchmarks</span>
    </nav>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">
          ⏱️ Municipal Service Level Agreement (SLA) Benchmarks
        </h1>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Mandatory statutory resolution windows and automatic escalation thresholds established by Nagar Municipal Council.
        </div>
      </div>
      <div>
        <button class="btn btn-primary" id="btn-recalculate-sla">
          ⚡ Refresh Live SLA Clock
        </button>
      </div>
    </div>

    <!-- Summary Policy Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="card" style="border-left: 4px solid var(--crimson-600);">
        <div class="card-body">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--crimson-600);">Critical Priority</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0.25rem 0;">6 - 12 Hours</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Mainline leaks, open manholes, live wire hazards</div>
        </div>
      </div>

      <div class="card" style="border-left: 4px solid var(--saffron-500);">
        <div class="card-body">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--saffron-500);">High Priority</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0.25rem 0;">24 - 48 Hours</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Contaminated water, major road potholes, garbage overflow</div>
        </div>
      </div>

      <div class="card" style="border-left: 4px solid var(--gov-blue-600);">
        <div class="card-body">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--gov-blue-600);">Medium Priority</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0.25rem 0;">36 - 72 Hours</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Footpath slabs, non-critical streetlight outages</div>
        </div>
      </div>

      <div class="card" style="border-left: 4px solid #64748b;">
        <div class="card-body">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Low Priority</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0.25rem 0;">72 - 120 Hours</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Meter checks, general civic surveys</div>
        </div>
      </div>
    </div>

    <!-- Rules Table Container -->
    <div id="sla-rules-container" class="table-container">
      <div style="padding: 2rem; text-align: center;" class="text-muted">Loading statutory rules...</div>
    </div>
  `;

  async function loadSlaRules() {
    try {
      const res = await window.api.get('/sla/rules');
      const rules = res.data || [];
      const tableContainer = container.querySelector('#sla-rules-container');

      if (rules.length === 0) {
        tableContainer.innerHTML = '<div style="padding: 2rem; text-align: center;" class="text-muted">No custom department SLA rules defined. Standard priority thresholds apply.</div>';
        return;
      }

      tableContainer.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Policy / Civic Category</th>
              <th>Department</th>
              <th>Priority Level</th>
              <th>Statutory Resolution SLA</th>
              <th>Auto-Escalation Window</th>
              <th>Policy Description</th>
            </tr>
          </thead>
          <tbody>
            ${rules.map(r => `
              <tr>
                <td><strong>${r.category_name || 'Department Default'}</strong></td>
                <td><span class="badge badge-priority-LOW">${r.department_name}</span></td>
                <td><span class="badge badge-priority-${r.priority}">${r.priority}</span></td>
                <td>
                  <span style="font-weight: 800; color: var(--gov-blue-700); font-size: 0.95rem;">
                    ${r.resolution_time_hours} Hours
                  </span>
                </td>
                <td>
                  <span style="font-weight: 700; color: var(--saffron-600); font-size: 0.9rem;">
                    After ${r.escalation_time_hours} Hours
                  </span>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${r.description || 'Statutory municipal benchmark.'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      window.toast.error('Failed to load SLA rules: ' + err.message);
    }
  }

  container.querySelector('#btn-recalculate-sla').onclick = async () => {
    try {
      const res = await window.api.post('/sla/refresh');
      window.toast.success(res.message || 'SLA statuses recalculated across all active grievances.');
    } catch (e) {
      window.toast.error(e.message);
    }
  };

  loadSlaRules();
};
