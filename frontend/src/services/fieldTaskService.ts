// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/services/fieldTaskService.ts
// API client for Field Operations — extends M1 axiosInstance.
// =============================================================

import axios from 'axios';
import type {
  FieldTask,
  FieldDashboardData,
  EvidenceItem,
  FieldTaskStatusHistory,
  CompleteWorkPayload,
  SubmitResolutionPayload,
  CannotResolvePayload,
  EscalatePayload,
  AssignFieldStaffPayload,
  VerifyResolutionPayload,
  ApiResponse,
} from '../types/fieldTask.types';

// Reuse M1 axios instance (baseURL + auth interceptors already set)
// If M1 exports it as `api` or `axiosInstance`, import from there:
//   import api from './api';
// Fallback: create a minimal instance matching M1's pattern
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach JWT token from localStorage (matches M1 auth pattern)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─────────────────────────────────────────
// Field Staff API
// ─────────────────────────────────────────

export const fieldTaskService = {

  /** GET /api/field/dashboard */
  getDashboard: async (): Promise<FieldDashboardData> => {
    const res = await api.get<ApiResponse<FieldDashboardData>>('/field/dashboard');
    return res.data.data!;
  },

  /** GET /api/field/tasks */
  listTasks: async (params?: {
    status?: string;
    priority?: string;
    search?: string;
    todayOnly?: boolean;
    overdueOnly?: boolean;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: FieldTask[]; total: number }> => {
    const res = await api.get<ApiResponse<{ tasks: FieldTask[]; total: number }>>(
      '/field/tasks',
      { params }
    );
    return res.data.data!;
  },

  /** GET /api/field/tasks/:taskId */
  getTaskDetail: async (taskId: string): Promise<FieldTask & { statusHistory: FieldTaskStatusHistory[]; evidence: EvidenceItem[] }> => {
    const res = await api.get<ApiResponse<FieldTask & { statusHistory: FieldTaskStatusHistory[]; evidence: EvidenceItem[] }>>(
      `/field/tasks/${taskId}`
    );
    return res.data.data!;
  },

  /** GET /api/field/tasks/:taskId/history */
  getTaskHistory: async (taskId: string): Promise<FieldTaskStatusHistory[]> => {
    const res = await api.get<ApiResponse<{ history: FieldTaskStatusHistory[] }>>(
      `/field/tasks/${taskId}/history`
    );
    return res.data.data!.history;
  },

  /** GET /api/field/tasks/:taskId/evidence */
  getEvidence: async (taskId: string): Promise<EvidenceItem[]> => {
    const res = await api.get<ApiResponse<{ evidence: EvidenceItem[] }>>(
      `/field/tasks/${taskId}/evidence`
    );
    return res.data.data!.evidence;
  },

  /** POST /api/field/tasks/:taskId/accept */
  acceptTask: async (taskId: string): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/field/tasks/${taskId}/accept`
    );
    return res.data.data!.task;
  },

  /** POST /api/field/tasks/:taskId/arrive */
  markArrived: async (taskId: string): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/field/tasks/${taskId}/arrive`
    );
    return res.data.data!.task;
  },

  /** POST /api/field/tasks/:taskId/start */
  startWork: async (taskId: string, workNotes?: string): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/field/tasks/${taskId}/start`,
      { workNotes }
    );
    return res.data.data!.task;
  },

  /** POST /api/field/tasks/:taskId/notes */
  addWorkNotes: async (taskId: string, notes: string): Promise<void> => {
    await api.post(`/field/tasks/${taskId}/notes`, { notes });
  },

  /** POST /api/field/tasks/:taskId/complete */
  completeWork: async (taskId: string, payload: CompleteWorkPayload): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/field/tasks/${taskId}/complete`,
      payload
    );
    return res.data.data!.task;
  },

  /** POST /api/field/tasks/:taskId/evidence  (multipart/form-data) */
  uploadEvidence: async (
    taskId: string,
    file: File,
    evidenceCategory: string,
    description?: string,
    onProgress?: (pct: number) => void
  ): Promise<EvidenceItem> => {
    const form = new FormData();
    form.append('file', file);
    form.append('evidenceCategory', evidenceCategory);
    if (description) form.append('description', description);

    const res = await api.post<ApiResponse<{ evidence: EvidenceItem }>>(
      `/field/tasks/${taskId}/evidence`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }
    );
    return res.data.data!.evidence;
  },

  /** POST /api/field/tasks/:taskId/submit-resolution */
  submitResolution: async (taskId: string, payload: SubmitResolutionPayload): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/field/tasks/${taskId}/submit-resolution`,
      payload
    );
    return res.data.data!.task;
  },

  /** POST /api/field/tasks/:taskId/cannot-resolve */
  cannotResolve: async (taskId: string, payload: CannotResolvePayload): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/field/tasks/${taskId}/cannot-resolve`,
      payload
    );
    return res.data.data!.task;
  },

  /** POST /api/field/tasks/:taskId/escalate */
  escalateTask: async (taskId: string, payload: EscalatePayload): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/field/tasks/${taskId}/escalate`,
      payload
    );
    return res.data.data!.task;
  },
};

// ─────────────────────────────────────────
// Officer API extensions (for M3 officer dashboard)
// ─────────────────────────────────────────
export const officerFieldService = {

  /** POST /api/officer/complaints/:complaintId/assign-field-staff */
  assignFieldStaff: async (
    complaintId: string,
    payload: AssignFieldStaffPayload
  ): Promise<FieldTask> => {
    const res = await api.post<ApiResponse<{ task: FieldTask }>>(
      `/officer/complaints/${complaintId}/assign-field-staff`,
      payload
    );
    return res.data.data!.task;
  },

  /** GET /api/officer/complaints/:complaintId/field-tasks */
  getComplaintFieldTasks: async (complaintId: string): Promise<FieldTask[]> => {
    const res = await api.get<ApiResponse<{ tasks: FieldTask[] }>>(
      `/officer/complaints/${complaintId}/field-tasks`
    );
    return res.data.data!.tasks;
  },

  /** POST /api/officer/tasks/:taskId/verify-resolution */
  verifyResolution: async (
    taskId: string,
    payload: VerifyResolutionPayload
  ): Promise<{ success: boolean; approved: boolean }> => {
    const res = await api.post<ApiResponse<{ success: boolean; approved: boolean }>>(
      `/officer/tasks/${taskId}/verify-resolution`,
      payload
    );
    return res.data.data!;
  },
};

export default fieldTaskService;
