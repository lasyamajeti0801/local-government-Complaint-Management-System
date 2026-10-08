// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/hooks/useFieldTasks.ts
// Custom React hooks for Field Operations state management.
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { fieldTaskService } from '../services/fieldTaskService';
import type {
  FieldTask,
  FieldDashboardData,
  EvidenceItem,
  FieldTaskStatusHistory,
} from '../types/fieldTask.types';

// ─────────────────────────────────────────
// useFieldDashboard
// ─────────────────────────────────────────
export function useFieldDashboard() {
  const [data, setData]       = useState<FieldDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fieldTaskService.getDashboard();
      setData(result);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}

// ─────────────────────────────────────────
// useFieldTaskList
// ─────────────────────────────────────────
export function useFieldTaskList(params?: {
  status?: string;
  priority?: string;
  search?: string;
  todayOnly?: boolean;
  overdueOnly?: boolean;
}) {
  const [tasks, setTasks]     = useState<FieldTask[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fieldTaskService.listTasks(params);
      setTasks(result.tasks);
      setTotal(result.total);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  return { tasks, total, loading, error, refresh: load };
}

// ─────────────────────────────────────────
// useFieldTaskDetail
// ─────────────────────────────────────────
export function useFieldTaskDetail(taskId: string | null) {
  const [task, setTask]       = useState<(FieldTask & { statusHistory: FieldTaskStatusHistory[]; evidence: EvidenceItem[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await fieldTaskService.getTaskDetail(taskId);
      setTask(result);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  return { task, loading, error, refresh: load };
}

// ─────────────────────────────────────────
// useFieldTaskActions
// Returns action handlers with loading/error state
// ─────────────────────────────────────────
export function useFieldTaskActions(onSuccess?: (updatedTask: FieldTask, action: string) => void) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError,   setActionError]   = useState<string | null>(null);

  async function execute(action: string, fn: () => Promise<FieldTask>) {
    try {
      setActionLoading(action);
      setActionError(null);
      const updated = await fn();
      onSuccess?.(updated, action);
      return updated;
    } catch (e: any) {
      const msg = e.response?.data?.message || `Failed: ${action}`;
      setActionError(msg);
      throw new Error(msg);
    } finally {
      setActionLoading(null);
    }
  }

  return {
    actionLoading,
    actionError,
    clearError: () => setActionError(null),

    accept:    (taskId: string) =>
      execute('accept', () => fieldTaskService.acceptTask(taskId)),

    arrive:    (taskId: string) =>
      execute('arrive', () => fieldTaskService.markArrived(taskId)),

    startWork: (taskId: string, notes?: string) =>
      execute('start', () => fieldTaskService.startWork(taskId, notes)),

    completeWork: (taskId: string, payload: { workDescription: string; workNotes?: string }) =>
      execute('complete', () => fieldTaskService.completeWork(taskId, payload)),

    submitResolution: (taskId: string, payload: { resolutionNotes: string }) =>
      execute('resolution', () => fieldTaskService.submitResolution(taskId, payload)),

    cannotResolve: (taskId: string, reason: string) =>
      execute('cannot-resolve', () => fieldTaskService.cannotResolve(taskId, { cannotResolveReason: reason })),

    escalate: (taskId: string, reason: string, notes?: string) =>
      execute('escalate', () => fieldTaskService.escalateTask(taskId, { escalationReason: reason, escalationNotes: notes })),
  };
}

// ─────────────────────────────────────────
// useEvidenceUpload
// ─────────────────────────────────────────
export function useEvidenceUpload(taskId: string, onUploaded?: (evidence: EvidenceItem) => void) {
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(file: File, category: string, description?: string) {
    try {
      setUploading(true);
      setUploadError(null);
      setProgress(0);
      const evidence = await fieldTaskService.uploadEvidence(
        taskId, file, category, description,
        (pct) => setProgress(pct)
      );
      onUploaded?.(evidence);
      return evidence;
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Upload failed.';
      setUploadError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return { upload, uploading, progress, uploadError, clearError: () => setUploadError(null) };
}
