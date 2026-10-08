// ============================================================
// NAGAR CONNECT - SIDEBAR COMPONENT (Multilingual)
// ============================================================

window.renderSidebar = function() {
  const user = window.auth.getUser();
  const currentHash = window.location.hash || (user && user.role === 'CITIZEN' ? '#citizen-dashboard' : '#officer-dashboard');
  const isTe = window.i18n.getLang() === 'te';

  const container = document.getElementById('sidebar-container');
  if (!container) return;

  if (!user) {
    container.innerHTML = `
      <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <div>🏛️ ${window.i18n.t('appTitle')}</div>
        <div style="margin-top: 0.5rem; font-size: 0.75rem;">
          ${isTe ? 'దయచేసి మున్సిపల్ ఆధారాలతో లాగిన్ అవ్వండి.' : 'Please log in with municipal credentials.'}
        </div>
      </div>
    `;
    return;
  }

  const isOfficerOrAdmin = ['OFFICER', 'COMMISSIONER', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isCitizen = user.role === 'CITIZEN' || user.role === 'SUPER_ADMIN';

  let navItems = [];

  if (isOfficerOrAdmin) {
    navItems.push({
      section: isTe ? 'అధికారి కార్యకలాపాలు' : 'Officer Operations',
      items: [
        { hash: '#officer-dashboard', label: window.i18n.t('officerDashboardTitle'), icon: '📊' },
        { hash: '#officer-queue', label: window.i18n.t('officerQueue'), icon: '📋' },
        { hash: '#officer-sla', label: window.i18n.t('slaRules'), icon: '⏱️' }
      ]
    });
  }

  if (isCitizen) {
    navItems.push({
      section: isTe ? 'పౌర ఫిర్యాదుల పరిష్కారం' : 'Citizen Grievance Redressal',
      items: [
        { hash: '#citizen-dashboard', label: window.i18n.t('myComplaints'), icon: '📁' },
        { hash: '#citizen-create', label: window.i18n.t('lodgeGrievance'), icon: '➕' }
      ]
    });
  }

  // Cross-role inspection links for testing
  if (isOfficerOrAdmin) {
    navItems.push({
      section: isTe ? 'పౌర వేదిక (ప్రివ్యూ)' : 'Citizen Portal (Preview)',
      items: [
        { hash: '#citizen-dashboard', label: isTe ? 'పౌర వీక్షణ' : 'Citizen View', icon: '👥' },
        { hash: '#citizen-create', label: isTe ? 'పౌర ఫిర్యాదు పరీక్ష' : 'Test Citizen Lodge', icon: '✍️' }
      ]
    });
  }

  const html = `
    <div>
      ${navItems.map(sec => `
        <div class="sidebar-nav-section" style="margin-bottom: 1.25rem;">
          <div class="sidebar-section-title">${sec.section}</div>
          ${sec.items.map(it => {
            const isActive = currentHash.startsWith(it.hash);
            return `
              <a href="${it.hash}" class="sidebar-link ${isActive ? 'active' : ''}">
                <div class="sidebar-link-content">
                  <span style="font-size: 1.1rem;">${it.icon}</span>
                  <span>${it.label}</span>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>

    <!-- Municipal Status Widget -->
    <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--emerald-600); display: inline-block;"></span>
        ${window.i18n.t('appTitle')} Gateway
      </div>
      <div>${window.i18n.t('activeJurisdiction')}</div>
      <div>Helpline: <strong>1800-425-1982</strong></div>
    </div>
  `;

  container.innerHTML = html;
};
