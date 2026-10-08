// ============================================================
// NAGAR CONNECT - CLIENT-SIDE SPA ROUTER
// ============================================================

window.router = {
  routes: {},

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('authStateChanged', () => {
      window.renderNavbar();
      window.renderSidebar();
      this.handleRoute();
    });
    this.handleRoute();
  },

  handleRoute() {
    const rawHash = window.location.hash || '';
    const hashWithoutHash = rawHash.startsWith('#') ? rawHash.substring(1) : rawHash;
    const [path, queryString] = hashWithoutHash.split('?');

    const params = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((val, key) => {
        params[key] = val;
      });
    }

    const user = window.auth.getUser();
    const isAuth = window.auth.isAuthenticated();
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Default route assignment
    let route = path || (isAuth ? (user.role === 'CITIZEN' ? 'citizen-dashboard' : 'officer-dashboard') : 'login');

    // Route Protection
    if (!isAuth && route !== 'login') {
      window.location.hash = '#login';
      return;
    }

    if (isAuth && route === 'login') {
      window.location.hash = user.role === 'CITIZEN' ? '#citizen-dashboard' : '#officer-dashboard';
      return;
    }

    // Update UI components
    window.renderNavbar();
    window.renderSidebar();

    // Render corresponding view
    switch (route) {
      case 'login':
        window.renderLoginPage(mainContent);
        break;

      case 'officer-dashboard':
        window.renderOfficerDashboardPage(mainContent);
        break;

      case 'officer-queue':
        window.renderOfficerQueuePage(mainContent, params);
        break;

      case 'officer-complaint-detail':
        window.renderOfficerComplaintDetailPage(mainContent, params.id);
        break;

      case 'officer-sla':
        window.renderOfficerSlaPage(mainContent);
        break;

      case 'citizen-dashboard':
        window.renderCitizenDashboardPage(mainContent);
        break;

      case 'citizen-create':
        window.renderCitizenCreatePage(mainContent);
        break;

      case 'citizen-detail':
        window.renderCitizenDetailPage(mainContent, params.id);
        break;

      default:
        mainContent.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🏛️</div>
            <div class="empty-state-title">Page Not Found</div>
            <div class="empty-state-desc">The requested municipal portal view (${route}) does not exist.</div>
            <a href="#${isAuth ? (user.role === 'CITIZEN' ? 'citizen-dashboard' : 'officer-dashboard') : 'login'}" class="btn btn-primary">
              Return Home
            </a>
          </div>
        `;
        break;
    }

    window.scrollTo(0, 0);
  }
};
