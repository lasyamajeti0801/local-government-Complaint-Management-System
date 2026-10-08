// ============================================================
// NAGAR CONNECT - NAVBAR COMPONENT (Multilingual)
// ============================================================

window.renderNavbar = function() {
  const user = window.auth.getUser();
  const currentLang = window.i18n.getLang();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const navHtml = `
    <!-- Top Government Identity Ribbon -->
    <header class="gov-top-bar" role="banner">
      <div class="gov-top-bar-left">
        <span class="gov-emblem-badge">
          ${window.i18n.t('govHeader')}
        </span>
      </div>
      <div class="gov-top-bar-right">
        <span class="gov-helpline">${window.i18n.t('helplineText')}</span>
        <button class="btn-pill-sm" id="btn-demo-switcher" title="Quickly switch between Citizen, Officer, Field, and Admin roles">
          ${window.i18n.t('demoSwitcher')}
        </button>
        <button class="btn-pill-sm" id="btn-lang-toggle" title="Switch language English / తెలుగు">
          🌐 <span>${currentLang === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>
        <button class="btn-pill-sm" id="btn-theme-toggle" title="Toggle Light / Dark mode">
          ${isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </header>

    <!-- Main Navigation Bar -->
    <nav class="municipal-navbar" aria-label="Main Navigation">
      <a href="#${user && user.role === 'CITIZEN' ? 'citizen-dashboard' : 'officer-dashboard'}" class="navbar-brand">
        <div class="brand-emblem-icon">🏛️</div>
        <div class="brand-text-block">
          <span class="brand-title">
            ${window.i18n.t('appTitle')}
            <span style="font-size: 0.65rem; background: var(--gov-blue-600); color: #fff; padding: 0.15rem 0.45rem; border-radius: var(--radius-full); font-weight: 600; vertical-align: middle;">
              e-Gov
            </span>
          </span>
          <span class="brand-subtitle">“${window.i18n.t('tagline')}”</span>
        </div>
      </a>

      <div class="navbar-actions">
        ${user ? `
          <!-- Active User Profile & Department Badge -->
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="text-align: right; line-height: 1.2;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${user.name}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">
                ${user.department_name ? user.department_name : (user.ward_number || user.role)}
              </div>
            </div>
            <span class="badge badge-priority-MEDIUM" style="font-size: 0.68rem;">
              ${user.role.replace(/_/g, ' ')}
            </span>
          </div>

          <!-- Notification Bell -->
          <button class="btn btn-secondary btn-icon" id="btn-notifications-drawer" title="Municipal Notifications" style="position: relative;">
            🔔
            <span id="unread-notif-pill" style="display: none; position: absolute; top: -4px; right: -4px; background: var(--crimson-600); color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 0.65rem; font-weight: bold; line-height: 16px; text-align: center;">0</span>
          </button>

          <!-- Logout Button -->
          <button class="btn btn-outline-primary btn-sm" id="btn-nav-logout">
            🚪 ${window.i18n.t('logout')}
          </button>
        ` : `
          <!-- Guest State -->
          <a href="#login" class="btn btn-primary btn-sm">
            🔐 ${window.i18n.t('login')}
          </a>
        `}
      </div>
    </nav>
  `;

  const container = document.getElementById('navbar-container');
  if (container) {
    container.innerHTML = navHtml;
    attachNavbarEvents();
  }
};

function attachNavbarEvents() {
  // Theme Toggle
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.onclick = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const nextTheme = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('nagar_theme', nextTheme);
      window.renderNavbar();
    };
  }

  // Language Toggle
  const langBtn = document.getElementById('btn-lang-toggle');
  if (langBtn) {
    langBtn.onclick = () => {
      const cur = window.i18n.getLang();
      const next = cur === 'en' ? 'te' : 'en';
      window.i18n.setLang(next);
      window.renderNavbar();
      window.renderSidebar();
      if (window.router) window.router.handleRoute();
    };
  }

  // Demo Switcher Modal
  const demoBtn = document.getElementById('btn-demo-switcher');
  if (demoBtn) {
    demoBtn.onclick = () => showDemoSwitcherModal();
  }

  // Logout
  const logoutBtn = document.getElementById('btn-nav-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      window.auth.logout();
      window.toast.info('Logged out from Nagar Connect session.');
    };
  }

  // Notifications Bell
  const notifBtn = document.getElementById('btn-notifications-drawer');
  if (notifBtn) {
    notifBtn.onclick = () => showNotificationsDrawer();
  }

  // Load unread count
  loadNotificationCount();
}

async function loadNotificationCount() {
  if (!window.auth.isAuthenticated()) return;
  try {
    const res = await window.api.get('/notifications');
    if (res.success && res.data) {
      const unread = res.data.filter(n => !n.is_read).length;
      const pill = document.getElementById('unread-notif-pill');
      if (pill) {
        if (unread > 0) {
          pill.textContent = unread;
          pill.style.display = 'block';
        } else {
          pill.style.display = 'none';
        }
      }
    }
  } catch (e) {
    // Fail silently
  }
}

function showDemoSwitcherModal() {
  const accounts = window.auth.DEMO_ACCOUNTS;
  const user = window.auth.getUser();

  const optionsHtml = Object.entries(accounts).map(([key, acc]) => {
    const isCurrent = user && user.email === acc.email;
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 0.6rem; background: ${isCurrent ? 'var(--gov-blue-50)' : 'var(--bg-card)'};">
        <div>
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">
            ${acc.name} ${isCurrent ? '<span style="color: var(--gov-blue-700); font-size: 0.75rem;">(Active)</span>' : ''}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            Role: <strong>${acc.role}</strong> • ${acc.label}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-secondary); font-family: monospace;">
            ${acc.email}
          </div>
        </div>
        <button class="btn btn-sm ${isCurrent ? 'btn-secondary' : 'btn-primary'}" onclick="window.switchDemoUser('${key}')" ${isCurrent ? 'disabled' : ''}>
          ${isCurrent ? 'Current Session' : 'Switch To →'}
        </button>
      </div>
    `;
  }).join('');

  window.modal.open({
    title: '⚡ Municipal Demo Role Switcher',
    contentHtml: `
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        Select an authorized municipal demo account to test role-specific workflows (Officer Queue, SLA tracking, Field assignments, Citizen portal).
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        ${optionsHtml}
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Close</button>
    `
  });
}

window.switchDemoUser = async function(key) {
  try {
    await window.auth.quickLogin(key);
    window.modal.close();
    window.toast.success(`Switched session to ${window.auth.DEMO_ACCOUNTS[key].name} (${window.auth.DEMO_ACCOUNTS[key].role})`);
  } catch (err) {
    window.toast.error(err.message);
  }
};

async function showNotificationsDrawer() {
  try {
    const res = await window.api.get('/notifications');
    const notifs = res.data || [];

    const contentHtml = notifs.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">No Notifications</div>
        <div class="empty-state-desc">You are completely up to date with municipal alerts.</div>
      </div>
    ` : `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 0.75rem;">
        <button class="btn btn-sm btn-secondary" onclick="window.markAllNotifsRead()">Mark All Read</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${notifs.map(n => `
          <div style="padding: 0.75rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: ${n.is_read ? 'var(--bg-secondary)' : 'var(--bg-card)'}; border-left: 3px solid ${n.type === 'ESCALATION' ? 'var(--crimson-600)' : (n.type === 'WARNING' ? 'var(--saffron-500)' : 'var(--gov-blue-600)')};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
              <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${n.title}</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.35;">${n.message}</div>
          </div>
        `).join('')}
      </div>
    `;

    window.modal.open({
      title: '🔔 Municipal Grievance Notifications',
      contentHtml
    });
  } catch (e) {
    window.toast.error('Failed to load notifications.');
  }
}

window.markAllNotifsRead = async function() {
  await window.api.post('/notifications/read-all');
  window.modal.close();
  loadNotificationCount();
  window.toast.success('All notifications marked as read.');
};
