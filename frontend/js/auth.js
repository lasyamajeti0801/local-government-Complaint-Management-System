// ============================================================
// NAGAR CONNECT - AUTHENTICATION STATE & DEMO SWITCHER
// ============================================================

window.auth = {
  getUser() {
    try {
      const u = localStorage.getItem('nagar_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('nagar_token') && !!this.getUser();
  },

  hasRole(...roles) {
    const user = this.getUser();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  },

  async login(email, password) {
    const res = await window.api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      localStorage.setItem('nagar_token', res.data.token);
      localStorage.setItem('nagar_user', JSON.stringify(res.data.user));
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: res.data.user }));
      
      // Smart redirect based on role
      if (['OFFICER', 'COMMISSIONER', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN'].includes(res.data.user.role)) {
        window.location.hash = '#officer-dashboard';
      } else if (res.data.user.role === 'CITIZEN') {
        window.location.hash = '#citizen-dashboard';
      } else {
        window.location.hash = '#officer-dashboard';
      }
      return res.data.user;
    }
    throw new Error(res.error || 'Authentication failed.');
  },

  logout() {
    localStorage.removeItem('nagar_token');
    localStorage.removeItem('nagar_user');
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: null }));
    window.location.hash = '#login';
  },

  // 1-Click Demo Account Quick Switcher
  DEMO_ACCOUNTS: {
    CITIZEN: {
      email: 'citizen@nagarconnect.gov.in',
      pass: 'Citizen@123',
      name: 'Anita Rao',
      role: 'CITIZEN',
      label: 'Citizen (Ward 14)'
    },
    OFFICER_WATER: {
      email: 'officer.water@nagarconnect.gov.in',
      pass: 'Officer@123',
      name: 'Rajesh Varma, EE',
      role: 'OFFICER',
      label: 'Officer (Water Supply)'
    },
    OFFICER_SANITATION: {
      email: 'officer.sanitation@nagarconnect.gov.in',
      pass: 'Officer@123',
      name: 'Meera Joshi, CHO',
      role: 'OFFICER',
      label: 'Officer (Sanitation)'
    },
    OFFICER_ROADS: {
      email: 'officer.roads@nagarconnect.gov.in',
      pass: 'Officer@123',
      name: 'K. Venkatesh, EE',
      role: 'OFFICER',
      label: 'Officer (Roads & Infra)'
    },
    FIELD_WATER: {
      email: 'field.water@nagarconnect.gov.in',
      pass: 'Field@123',
      name: 'Ramesh Kumar',
      role: 'FIELD_STAFF',
      label: 'Field Staff (Water Dept)'
    },
    ADMIN: {
      email: 'admin@nagarconnect.gov.in',
      pass: 'Admin@123',
      name: 'Sunita Deshmukh',
      role: 'MUNICIPAL_ADMIN',
      label: 'Municipal Administrator'
    },
    COMMISSIONER: {
      email: 'commissioner@nagarconnect.gov.in',
      pass: 'Commissioner@123',
      name: 'Dr. S. R. Krishnan, IAS',
      role: 'COMMISSIONER',
      label: 'Municipal Commissioner'
    }
  },

  async quickLogin(accountKey) {
    const acc = this.DEMO_ACCOUNTS[accountKey];
    if (!acc) throw new Error(`Unknown demo account: ${accountKey}`);
    return this.login(acc.email, acc.pass);
  }
};
