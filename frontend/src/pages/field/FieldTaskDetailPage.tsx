// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/pages/field/FieldTaskDetailPage.tsx
// Complete task detail view — all actions, evidence, timeline.
// =============================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFieldTaskDetail, useFieldTaskActions } from '../../hooks/useFieldTasks';
import { FieldTaskStatusBadge } from '../../components/field/FieldTaskStatusBadge';
import { FieldTaskTimeline }    from '../../components/field/FieldTaskTimeline';
import { EvidenceUploader }     from '../../components/field/EvidenceUploader';
import {
  AcceptTaskModal,
  ArriveModal,
  StartWorkModal,
  CompleteWorkModal,
  SubmitResolutionModal,
  CannotResolveModal,
  EscalateModal,
  AddNotesModal,
} from '../../components/field/FieldActionModals';
import {
  PRIORITY_CONFIG,
  EVIDENCE_CATEGORY_LABELS,
  getSLAStatus,
  formatDateTime,
  formatFileSize,
  getAvailableActions,
} from '../../components/field/fieldUtils';
import type { EvidenceItem } from '../../types/fieldTask.types';

// ─────────────────────────────────────────
// Info row helper
// ─────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
    <dd className="col-span-2 text-sm text-gray-800">{value ?? <span className="text-gray-400">—</span>}</dd>
  </div>
);

// ─────────────────────────────────────────
// Evidence gallery
// ─────────────────────────────────────────
const EvidenceGallery: React.FC<{ items: EvidenceItem[] }> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <p className="text-3xl mb-2">📂</p>
        <p>No evidence uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => {
        const isImage = item.mime_type?.startsWith('image/');
        return (
          <a
            key={item.id}
            href={item.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              group block border border-gray-200 rounded-lg overflow-hidden
              hover:shadow-md hover:border-blue-300 transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
            aria-label={`View ${EVIDENCE_CATEGORY_LABELS[item.evidence_category] ?? item.evidence_category}: ${item.file_name}`}
          >
            {isImage ? (
              <img
                src={item.file_url}
                alt={item.file_name}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-150"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-32 bg-gray-50 flex flex-col items-center justify-center gap-1">
                <span className="text-4xl" aria-hidden="true">📄</span>
                <span className="text-xs text-gray-500 text-center px-2 truncate w-full text-center">
                  {item.file_name}
                </span>
              </div>
            )}
            <div className="p-2 bg-white">
              <p className="text-xs font-medium text-gray-700 truncate">
                {EVIDENCE_CATEGORY_LABELS[item.evidence_category] ?? item.evidence_category}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatFileSize(item.file_size)} · {formatDateTime(item.created_at)}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export const FieldTaskDetailPage: React.FC = () => {
  const { taskId }  = useParams<{ taskId: string }>();
  const navigate    = useNavigate();
  const { task, loading, error, refresh } = useFieldTaskDetail(taskId ?? null);

  const [activeModal, setActiveModal]     = useState<string | null>(null);
  const [activeTab,   setActiveTab]       = useState<'details' | 'evidence' | 'timeline'>('details');

  const { accept, arrive, startWork, completeWork, submitResolution,
          cannotResolve, escalate, actionLoading, actionError, clearError } = useFieldTaskActions(
    () => { refresh(); setActiveModal(null); }
  );

  // Evidence state (local append without full re-fetch)
  const [localEvidence, setLocalEvidence] = useState<EvidenceItem[]>([]);

  if (loading) {
    return (
      <main className="p-4 md:p-6 max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </main>
    );
  }

  if (error || !task) {
    return (
      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <p className="font-medium">⚠️ {error ?? 'Task not found.'}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => navigate(-1)} className="text-xs underline">← Back</button>
            {error && <button onClick={refresh} className="text-xs underline">Retry</button>}
          </div>
        </div>
      </main>
    );
  }

  const priorityCfg     = PRIORITY_CONFIG[task.complaint_priority] ?? PRIORITY_CONFIG['MEDIUM'];
  const sla             = getSLAStatus(task.sla_deadline, task.status);
  const availableActions = getAvailableActions(task.status);
  const allEvidence     = [...(task.evidence ?? []), ...localEvidence];

  const tabs: { key: 'details' | 'evidence' | 'timeline'; label: string; count?: number }[] = [
    { key: 'details',  label: 'Details' },
    { key: 'evidence', label: 'Evidence', count: allEvidence.length },
    { key: 'timeline', label: 'Timeline', count: task.statusHistory?.length },
  ];

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Back nav */}
      <nav aria-label="Breadcrumb">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          ← My Tasks
        </button>
      </nav>

      {/* Task header */}
      <header className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        {/* Complaint ID + status */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {task.complaint_number}
            </span>
            <h1 className="text-lg font-bold text-gray-900 mt-1 leading-snug">
              {task.complaint_title}
            </h1>
          </div>
          <FieldTaskStatusBadge status={task.status} size="lg" />
        </div>

        {/* Priority + SLA row */}
        <div className="flex flex-wrap gap-3 text-sm">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityCfg.color} ${priorityCfg.bgColor}`}>
            {priorityCfg.label} Priority
          </span>
          <span className={`flex items-center gap-1 text-xs ${sla.colorClass}`}>
            ⏱ SLA: {sla.label}
          </span>
          {task.department_name && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              🏛 {task.department_name}
            </span>
          )}
          {task.category_name && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {task.category_name}
            </span>
          )}
        </div>

        {/* Location */}
        {task.location_address && (
          <p className="text-sm text-gray-600 flex items-start gap-1.5">
            <span aria-hidden="true" className="mt-0.5">📍</span>
            <span>
              {task.location_address}
              {task.location_landmark && (
                <span className="text-gray-400"> · Near {task.location_landmark}</span>
              )}
            </span>
          </p>
        )}
      </header>

      {/* Action error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
          <span>⚠️</span>
          <div className="flex-1">
            <p>{actionError}</p>
            <button onClick={clearError} className="text-xs underline mt-1">Dismiss</button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {availableActions.length > 0 && (
        <section aria-label="Available actions">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Available Actions</h2>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <button
                key={action}
                onClick={() => setActiveModal(action)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium border
                  transition-colors duration-100
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  ${ACTION_BUTTON_STYLE[action] ?? 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:ring-blue-400'}
                `}
              >
                {ACTION_LABELS[action]}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div>
        <div
          role="tablist"
          aria-label="Task sections"
          className="flex border-b border-gray-200 gap-0"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tab-${tab.key}`}
              id={`tab-btn-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-100
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400
                ${activeTab === tab.key
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="pt-4">

          {/* Details panel */}
          <div
            role="tabpanel"
            id="tab-details"
            aria-labelledby="tab-btn-details"
            hidden={activeTab !== 'details'}
          >
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Complaint Information</h2>
              <dl>
                <InfoRow label="Complaint No." value={task.complaint_number} />
                <InfoRow label="Category"      value={task.category_name} />
                <InfoRow label="Department"    value={task.department_name} />
                <InfoRow label="Priority"      value={
                  <span className={`text-xs font-medium ${priorityCfg.color}`}>{priorityCfg.label}</span>
                } />
                <InfoRow label="Location"      value={task.location_address} />
                <InfoRow label="Landmark"      value={task.location_landmark} />
                <InfoRow label="Assigned"      value={formatDateTime(task.assigned_at)} />
                <InfoRow label="SLA Deadline"  value={
                  <span className={sla.colorClass}>{sla.label}</span>
                } />
                <InfoRow label="Officer"       value={task.officer_name} />
                <InfoRow label="Description"   value={
                  <span className="whitespace-pre-line">{task.complaint_description}</span>
                } />
              </dl>
            </div>

            {/* Work notes section */}
            {task.work_notes && (
              <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">Field Notes</h2>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {task.work_notes}
                </pre>
              </div>
            )}

            {/* Work description */}
            {task.work_description && (
              <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">Work Description</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {task.work_description}
                </p>
              </div>
            )}

            {/* Resolution notes */}
            {task.resolution_notes && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-green-800 mb-3">Resolution Summary</h2>
                <p className="text-sm text-green-700 leading-relaxed whitespace-pre-line">
                  {task.resolution_notes}
                </p>
                <p className="text-xs text-green-500 mt-2">
                  Submitted: {formatDateTime(task.resolution_submitted_at)}
                </p>
              </div>
            )}

            {/* Cannot resolve reason */}
            {task.cannot_resolve_reason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-red-800 mb-2">Cannot Resolve — Reason</h2>
                <p className="text-sm text-red-700">{task.cannot_resolve_reason}</p>
              </div>
            )}

            {/* Escalation */}
            {task.escalation_reason && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-orange-800 mb-2">Escalation Details</h2>
                <p className="text-sm text-orange-700"><strong>Reason:</strong> {task.escalation_reason}</p>
                {task.escalation_notes && (
                  <p className="text-sm text-orange-600 mt-1">{task.escalation_notes}</p>
                )}
              </div>
            )}
          </div>

          {/* Evidence panel */}
          <div
            role="tabpanel"
            id="tab-evidence"
            aria-labelledby="tab-btn-evidence"
            hidden={activeTab !== 'evidence'}
            className="space-y-5"
          >
            {/* Upload section — only if work is in progress or completed */}
            {(availableActions.includes('uploadEvidence')) && (
              <EvidenceUploader
                taskId={task.id}
                onUploaded={(ev) => setLocalEvidence((prev) => [...prev, ev])}
              />
            )}

            {/* Gallery */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Uploaded Evidence</h2>
              <EvidenceGallery items={allEvidence} />
            </div>
          </div>

          {/* Timeline panel */}
          <div
            role="tabpanel"
            id="tab-timeline"
            aria-labelledby="tab-btn-timeline"
            hidden={activeTab !== 'timeline'}
          >
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Task Status History</h2>
              <FieldTaskTimeline history={task.statusHistory ?? []} />
            </div>
          </div>

        </div>
      </div>

      {/* ─── All Action Modals ─── */}
      <AcceptTaskModal
        open={activeModal === 'accept'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => accept(task.id)}
        loading={actionLoading === 'accept'}
        taskTitle={task.complaint_title}
      />
      <ArriveModal
        open={activeModal === 'arrive'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => arrive(task.id)}
        loading={actionLoading === 'arrive'}
        taskTitle={task.complaint_title}
      />
      <StartWorkModal
        open={activeModal === 'start'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => startWork(task.id)}
        onConfirmWithNotes={(notes) => startWork(task.id, notes)}
        loading={actionLoading === 'start'}
        taskTitle={task.complaint_title}
      />
      <CompleteWorkModal
        open={activeModal === 'complete'}
        onClose={() => setActiveModal(null)}
        onConfirm={(payload) => completeWork(task.id, payload)}
        loading={actionLoading === 'complete'}
        taskTitle={task.complaint_title}
        existingWorkNotes={task.work_notes}
      />
      <SubmitResolutionModal
        open={activeModal === 'submitResolution'}
        onClose={() => setActiveModal(null)}
        onConfirm={(notes) => submitResolution(task.id, { resolutionNotes: notes })}
        loading={actionLoading === 'resolution'}
        taskTitle={task.complaint_title}
      />
      <CannotResolveModal
        open={activeModal === 'cannotResolve'}
        onClose={() => setActiveModal(null)}
        onConfirm={(reason) => cannotResolve(task.id, reason)}
        loading={actionLoading === 'cannot-resolve'}
        taskTitle={task.complaint_title}
      />
      <EscalateModal
        open={activeModal === 'escalate'}
        onClose={() => setActiveModal(null)}
        onConfirm={(reason, notes) => escalate(task.id, reason, notes)}
        loading={actionLoading === 'escalate'}
        taskTitle={task.complaint_title}
      />
      <AddNotesModal
        open={activeModal === 'addNotes'}
        onClose={() => setActiveModal(null)}
        onConfirm={async (notes) => {
          const { fieldTaskService } = await import('../../services/fieldTaskService');
          await fieldTaskService.addWorkNotes(task.id, notes);
          refresh();
          setActiveModal(null);
        }}
        loading={false}
      />
    </main>
  );
};

// ─────────────────────────────────────────
// Action button styles per action type
// ─────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  accept:           '✅ Accept Task',
  arrive:           '📍 Mark Arrived',
  start:            '🔧 Start Work',
  complete:         '🏁 Complete Work',
  submitResolution: '📤 Submit Resolution',
  addNotes:         '📝 Add Notes',
  uploadEvidence:   '📷 Upload Evidence',
  cannotResolve:    '🚫 Cannot Resolve',
  escalate:         '⚠️ Escalate',
};

const ACTION_BUTTON_STYLE: Record<string, string> = {
  accept:           'bg-green-700 text-white border-green-700 hover:bg-green-800 focus:ring-green-400',
  arrive:           'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800 focus:ring-cyan-400',
  start:            'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 focus:ring-amber-400',
  complete:         'bg-teal-700 text-white border-teal-700 hover:bg-teal-800 focus:ring-teal-400',
  submitResolution: 'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-400',
  addNotes:         'border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:ring-blue-400',
  uploadEvidence:   'border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 focus:ring-indigo-400',
  cannotResolve:    'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-400',
  escalate:         'border-orange-300 text-orange-700 bg-white hover:bg-orange-50 focus:ring-orange-400',
};

export default FieldTaskDetailPage;
