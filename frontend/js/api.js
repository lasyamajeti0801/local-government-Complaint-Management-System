// ============================================================
// NAGAR CONNECT - API CLIENT SERVICE
// ============================================================

const API_BASE = (function() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000')) {
      return 'http://localhost:3000/api';
    }
  }
  return '/api';
})();

window.api = {
  getToken() {
    return localStorage.getItem('nagar_token') || null;
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 && !endpoint.includes('/login')) {
          localStorage.removeItem('nagar_token');
          localStorage.removeItem('nagar_user');
          window.location.hash = '#login';
        }
        throw new Error(data.error || data.message || `Server request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    return this.request(queryString ? `${endpoint}?${queryString}` : endpoint, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
