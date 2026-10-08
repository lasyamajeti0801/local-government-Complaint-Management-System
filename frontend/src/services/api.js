/**
 * Nagar Connect - Central API Client Service
 */

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('nagar_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
  // 1. Auth & Session
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  demoLogin: async (role) => {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Demo switch failed');
    }
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getDemoUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return res.json();
  },

  // 2. Complaints (Member 2 Citizen)
  getDepartments: async () => {
    const res = await fetch(`${API_BASE}/complaints/departments`);
    return res.json();
  },

  getCategories: async (deptId) => {
    const url = deptId ? `${API_BASE}/complaints/categories?department_id=${deptId}` : `${API_BASE}/complaints/categories`;
    const res = await fetch(url);
    return res.json();
  },

  getComplaints: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/complaints?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getComplaintById: async (id) => {
    const res = await fetch(`${API_BASE}/complaints/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  createComplaint: async (complaintData) => {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(complaintData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit complaint');
    }
    return res.json();
  },

  submitFeedback: async (id, feedback) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(feedback)
    });
    return res.json();
  },

  addComment: async (id, commentText, isInternal = false) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ comment_text: commentText, is_internal: isInternal })
    });
    return res.json();
  },

  // 3. Officer (Member 3)
  getOfficerQueue: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/officer/queue?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getFieldStaffList: async () => {
    const res = await fetch(`${API_BASE}/officer/field-staff`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  assignComplaint: async (complaintId, staffId, notes, priority) => {
    const res = await fetch(`${API_BASE}/officer/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ complaint_id: complaintId, field_staff_id: staffId, notes, priority })
    });
    return res.json();
  },

  approveResolution: async (complaintId, remarks) => {
    const res = await fetch(`${API_BASE}/officer/approve-resolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ complaint_id: complaintId, remarks })
    });
    return res.json();
  },

  escalateComplaint: async (complaintId, reason, escalateTo) => {
    const res = await fetch(`${API_BASE}/officer/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ complaint_id: complaintId, reason, escalate_to_role: escalateTo })
    });
    return res.json();
  },

  // 4. Field Staff (Member 4)
  getFieldTasks: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/field/tasks?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getFieldTaskById: async (id) => {
    const res = await fetch(`${API_BASE}/field/tasks/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  updateFieldTaskState: async (id, newState, notes = '', cannotResolveReason = null) => {
    const res = await fetch(`${API_BASE}/field/tasks/${id}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ newState, notes, cannotResolveReason })
    });
    return res.json();
  },

  submitFieldResolution: async (id, resolutionData) => {
    const res = await fetch(`${API_BASE}/field/tasks/${id}/submit-resolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(resolutionData)
    });
    return res.json();
  },

  // 5. MEMBER 5 Central RAG & Knowledge Intelligence
  queryRAG: async (queryText, departmentFilter = null) => {
    const res = await fetch(`${API_BASE}/rag/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ queryText, departmentFilter })
    });
    return res.json();
  },

  getDocuments: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/documents?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getDocumentDetails: async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getDocumentChunks: async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}/chunks`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  uploadDocument: async (formData) => {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },

  deleteDocument: async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getRAGStats: async () => {
    const res = await fetch(`${API_BASE}/rag/stats`);
    return res.json();
  },

  rebuildRAGIndex: async () => {
    const res = await fetch(`${API_BASE}/rag/reindex`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // 6. Analytics
  getAnalyticsKPIs: async () => {
    const res = await fetch(`${API_BASE}/analytics/kpis`);
    return res.json();
  },

  getDepartmentBreakdown: async () => {
    const res = await fetch(`${API_BASE}/analytics/department-breakdown`);
    return res.json();
  },

  getTrends: async () => {
    const res = await fetch(`${API_BASE}/analytics/trends`);
    return res.json();
  },

  // 7. Admin
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getNotices: async () => {
    const res = await fetch(`${API_BASE}/admin/notices`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  }
};
