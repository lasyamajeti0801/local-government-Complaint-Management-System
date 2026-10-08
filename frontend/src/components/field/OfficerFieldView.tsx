// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/components/field/OfficerFieldView.tsx
// Extends M3 Officer Complaint Detail with Field Operations data.
// Import this into M3's ComplaintDetailPage:
//   import { OfficerFieldView } from '../../components/field/OfficerFieldView';
//   <OfficerFieldView complaintId={complaint.id} />
// =============================================================

import React, { useState, useEffect } from 'react';
import { officerFieldService } from '../../services/fieldTaskService';
import { FieldTaskStatusBadge } from './FieldTaskStatusBadge';
import { FieldTaskTimeline }    from './FieldTaskTimeline';
import { EvidenceGallery }      from './FieldTaskDetailPage'; // re-export or inline
import { formatDateTime, getSLAStatus, PRIORITY_CONFIG } from './fieldUtils';
import type { FieldTask, EvidenceItem, FieldTaskStatusHistory, VerifyResolutionPayload } from '../../types/fieldTask.types';

interface Props {
  complaintId: string;
}

export const OfficerFieldView: React.FC<Props> = ({ complaintId }) => {
  const [tasks,    setTasks]    = useState<FieldTask[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<FieldTask | null>(null);

  // Officer verify-resolution state
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError,   setVerifyError]   = useState<string | null>(null);
  const [remarks,       setRemarks]       = useState('');
  const [showVerify,    setShowVerify]    = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await officerFieldService.getComplaintFieldTasks(complaintId);
      setTasks(result);
      if (result.length > 0) setSelected(result[0]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load field tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [complaintId]);

  async function handleVerify(approved: boolean) {
    if (!selected) return;
    try {
      setVerifyLoading(true);
      setVerifyError(null);
      await officerFieldService.verifyResolution(selected.id, { approved, remarks });
      setShowVerify(false);
      await load(); // refresh
    } catch (e: any) {
      setVerifyError(e.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-24 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
        ⚠️ {error}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <p className="text-3xl mb-2">👷</p>
        <p>No field tasks assigned for this complaint yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <span aria-hidden="true">👷</span> Field Operations
        <span className="ml-auto text-xs text-gray-400 font-normal">{tasks.length} task{tasks.length > 1 ? 's' : ''}</span>
      </h3>

      {/* Task selector (if multiple) */}
      {tasks.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`
                text-xs px-2.5 py-1 rounded-full border font-medium transition-colors
                ${selected?.id === t.id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                }
              `}
            >
              Task #{t.id.slice(0, 6)}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Task header */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
            <div>
              <FieldTaskStatusBadge status={selected.status} />
              <p className="text-xs text-gray-500 mt-1">
                Assigned to: <strong>{selected.staff_name}</strong>
                {selected.staff_employee_code && ` (${selected.staff_employee_code})`}
              </p>
            </div>
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              {selected.accepted_at     && <p>Accepted:   {formatDateTime(selected.accepted_at)}</p>}
              {selected.arrived_at      && <p>Arrived:    {formatDateTime(selected.arrived_at)}</p>}
              {selected.started_at      && <p>Started:    {formatDateTime(selected.started_at)}</p>}
              {selected.completed_at    && <p>Completed:  {formatDateTime(selected.completed_at)}</p>}
              {selected.resolution_submitted_at && <p>Submitted: {formatDateTime(selected.resolution_submitted_at)}</p>}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Work description */}
            {selected.work_description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Work Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selected.work_description}</p>
              </div>
            )}

            {/* Resolution notes */}
            {selected.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 uppercase mb-1">Resolution Summary</p>
                <p className="text-sm text-green-800 whitespace-pre-line">{selected.resolution_notes}</p>
              </div>
            )}

            {/* Cannot resolve */}
            {selected.cannot_resolve_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 uppercase mb-1">Cannot Resolve — Reason</p>
                <p className="text-sm text-red-800">{selected.cannot_resolve_reason}</p>
              </div>
            )}

            {/* Escalation */}
            {selected.escalation_reason && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Escalation</p>
                <p className="text-sm text-orange-800">{selected.escalation_reason}</p>
              </div>
            )}

            {/* Officer Verify Resolution */}
            {selected.status === 'RESOLUTION_SUBMITTED' && (
              <div className="border border-blue-200 rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800 mb-3">Officer Action Required — Verify Resolution</p>
                {showVerify ? (
                  <div className="space-y-3">
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      placeholder="Remarks (optional)..."
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                    {verifyError && (
                      <p className="text-xs text-red-600">⚠️ {verifyError}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerify(true)}
                        disabled={verifyLoading}
                        className="flex-1 py-2 text-sm font-medium bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
                      >
                        {verifyLoading ? 'Processing…' : '✅ Approve Resolution'}
                      </button>
                      <button
                        onClick={() => handleVerify(false)}
                        disabled={verifyLoading}
                        className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {verifyLoading ? 'Processing…' : '❌ Reject — Return to Field'}
                      </button>
                      <button
                        onClick={() => setShowVerify(false)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVerify(true)}
                    className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
                  >
                    Review &amp; Verify Resolution
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerFieldView;
