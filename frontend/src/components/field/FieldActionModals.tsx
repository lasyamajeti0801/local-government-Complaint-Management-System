// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/components/field/FieldActionModals.tsx
// All action modals (Accept, Arrive, Start, Complete, Resolution,
// CannotResolve, Escalate, AddNotes) — uses M1 Modal component.
// =============================================================

import React, { useState, useId } from 'react';

// ─────────────────────────────────────────
// Shared modal shell
// Reuses M1 Modal if available: import { Modal } from '../common/Modal'
// Inline fallback provided here so M4 is self-contained
// ─────────────────────────────────────────
interface ModalShellProps {
  open:      boolean;
  onClose:   () => void;
  title:     string;
  children:  React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// Shared action button row
// ─────────────────────────────────────────
interface ActionRowProps {
  onCancel:    () => void;
  onConfirm:   () => void;
  loading:     boolean;
  confirmLabel: string;
  confirmStyle?: string;
  disabled?:   boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({
  onCancel, onConfirm, loading, confirmLabel, confirmStyle, disabled,
}) => (
  <div className="flex gap-3 pt-2">
    <button
      type="button"
      onClick={onCancel}
      className="
        flex-1 py-2 px-4 rounded-md border border-gray-300
        text-sm font-medium text-gray-700
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300
      "
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onConfirm}
      disabled={loading || disabled}
      className={`
        flex-1 py-2 px-4 rounded-md text-sm font-medium text-white
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-1
        ${confirmStyle ?? 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-400'}
      `}
    >
      {loading ? 'Processing…' : confirmLabel}
    </button>
  </div>
);

// ─────────────────────────────────────────
// AcceptTaskModal
// ─────────────────────────────────────────
interface SimpleModalProps {
  open:       boolean;
  onClose:    () => void;
  onConfirm:  () => void;
  loading:    boolean;
  taskTitle:  string;
}

export const AcceptTaskModal: React.FC<SimpleModalProps> = ({
  open, onClose, onConfirm, loading, taskTitle,
}) => (
  <ModalShell open={open} onClose={onClose} title="Accept Task">
    <p className="text-sm text-gray-600">
      You are accepting responsibility for:
    </p>
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm font-medium text-blue-800">
      {taskTitle}
    </div>
    <p className="text-xs text-gray-500">
      Accepting this task confirms that you will proceed to the location and complete the field work.
    </p>
    <ActionRow
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={loading}
      confirmLabel="✅ Accept Task"
      confirmStyle="bg-green-700 hover:bg-green-800 focus:ring-green-400"
    />
  </ModalShell>
);

// ─────────────────────────────────────────
// ArriveModal
// ─────────────────────────────────────────
export const ArriveModal: React.FC<SimpleModalProps> = ({
  open, onClose, onConfirm, loading, taskTitle,
}) => (
  <ModalShell open={open} onClose={onClose} title="Mark Arrival">
    <p className="text-sm text-gray-600">
      Confirm that you have arrived at the complaint location for:
    </p>
    <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3 text-sm font-medium text-cyan-800">
      {taskTitle}
    </div>
    <ActionRow
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={loading}
      confirmLabel="📍 Confirm Arrival"
      confirmStyle="bg-cyan-700 hover:bg-cyan-800 focus:ring-cyan-400"
    />
  </ModalShell>
);

// ─────────────────────────────────────────
// StartWorkModal
// ─────────────────────────────────────────
interface StartWorkModalProps extends SimpleModalProps {
  onConfirmWithNotes: (notes: string) => void;
}

export const StartWorkModal: React.FC<StartWorkModalProps> = ({
  open, onClose, onConfirmWithNotes, loading, taskTitle,
}) => {
  const id = useId();
  const [notes, setNotes] = useState('');

  return (
    <ModalShell open={open} onClose={onClose} title="Start Field Work">
      <p className="text-sm text-gray-600">Start work on:</p>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm font-medium text-amber-800">
        {taskTitle}
      </div>
      <div>
        <label htmlFor={`${id}-notes`} className="block text-xs font-medium text-gray-700 mb-1">
          Initial Observations <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id={`${id}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What did you find on arrival? Initial site condition..."
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>
      <ActionRow
        onCancel={onClose}
        onConfirm={() => onConfirmWithNotes(notes)}
        loading={loading}
        confirmLabel="🔧 Start Work"
        confirmStyle="bg-amber-600 hover:bg-amber-700 focus:ring-amber-400"
      />
    </ModalShell>
  );
};

// ─────────────────────────────────────────
// CompleteWorkModal
// ─────────────────────────────────────────
interface CompleteWorkModalProps {
  open:                  boolean;
  onClose:               () => void;
  onConfirm:             (payload: { workDescription: string; workNotes?: string }) => void;
  loading:               boolean;
  taskTitle:             string;
  existingWorkNotes?:    string | null;
}

export const CompleteWorkModal: React.FC<CompleteWorkModalProps> = ({
  open, onClose, onConfirm, loading, taskTitle, existingWorkNotes,
}) => {
  const id = useId();
  const [workDescription, setWorkDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError]                     = useState('');

  function handleSubmit() {
    if (workDescription.trim().length < 10) {
      setError('Work description must be at least 10 characters.');
      return;
    }
    setError('');
    onConfirm({ workDescription: workDescription.trim(), workNotes: additionalNotes.trim() || undefined });
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Mark Work as Completed">
      <p className="text-sm text-gray-600 font-medium">{taskTitle}</p>

      {existingWorkNotes && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-600">
          <p className="font-medium mb-1">Existing work notes:</p>
          <p className="whitespace-pre-line">{existingWorkNotes}</p>
        </div>
      )}

      <div>
        <label htmlFor={`${id}-desc`} className="block text-xs font-medium text-gray-700 mb-1">
          Work Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${id}-desc`}
          value={workDescription}
          onChange={(e) => { setWorkDescription(e.target.value); setError(''); }}
          rows={4}
          placeholder="Describe what work was performed, what issue was found, and what action was taken..."
          className={`
            w-full text-sm border rounded-md px-3 py-2
            focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none
            ${error ? 'border-red-400' : 'border-gray-300'}
          `}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <p className="text-xs text-gray-400 mt-1">{workDescription.length} chars (min 10)</p>
      </div>

      <div>
        <label htmlFor={`${id}-extra`} className="block text-xs font-medium text-gray-700 mb-1">
          Additional Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id={`${id}-extra`}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          rows={2}
          placeholder="Materials used, additional observations, follow-up needed..."
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-700">
        ⚠️ After marking complete, upload after-evidence photos before submitting for resolution.
      </div>

      <ActionRow
        onCancel={onClose}
        onConfirm={handleSubmit}
        loading={loading}
        confirmLabel="🏁 Mark as Completed"
        confirmStyle="bg-teal-700 hover:bg-teal-800 focus:ring-teal-400"
        disabled={workDescription.trim().length < 10}
      />
    </ModalShell>
  );
};

// ─────────────────────────────────────────
// SubmitResolutionModal
// ─────────────────────────────────────────
interface SubmitResolutionModalProps {
  open:       boolean;
  onClose:    () => void;
  onConfirm:  (notes: string) => void;
  loading:    boolean;
  taskTitle:  string;
}

export const SubmitResolutionModal: React.FC<SubmitResolutionModalProps> = ({
  open, onClose, onConfirm, loading, taskTitle,
}) => {
  const id = useId();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (notes.trim().length < 10) {
      setError('Resolution notes must be at least 10 characters.');
      return;
    }
    setError('');
    onConfirm(notes.trim());
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Submit Resolution for Officer Review">
      <p className="text-sm text-gray-600 font-medium">{taskTitle}</p>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-700">
        📋 Once submitted, the Officer will review your field work and evidence before marking the complaint resolved.
      </div>

      <div>
        <label htmlFor={`${id}-res`} className="block text-xs font-medium text-gray-700 mb-1">
          Resolution Summary <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${id}-res`}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setError(''); }}
          rows={5}
          placeholder="Summarize: What was the issue? What was done? What is the current condition? Is the complaint fully resolved?"
          className={`
            w-full text-sm border rounded-md px-3 py-2
            focus:outline-none focus:ring-2 focus:ring-green-400 resize-none
            ${error ? 'border-red-400' : 'border-gray-300'}
          `}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <ActionRow
        onCancel={onClose}
        onConfirm={handleSubmit}
        loading={loading}
        confirmLabel="📤 Submit for Officer Review"
        confirmStyle="bg-green-700 hover:bg-green-800 focus:ring-green-400"
        disabled={notes.trim().length < 10}
      />
    </ModalShell>
  );
};

// ─────────────────────────────────────────
// CannotResolveModal
// ─────────────────────────────────────────
interface CannotResolveModalProps {
  open:       boolean;
  onClose:    () => void;
  onConfirm:  (reason: string) => void;
  loading:    boolean;
  taskTitle:  string;
}

const CANNOT_RESOLVE_REASONS = [
  'Issue requires a different department',
  'Required equipment / resources unavailable',
  'Site inaccessible',
  'Insufficient information in complaint',
  'Issue beyond field staff scope',
  'Safety hazard — specialist required',
  'Other (describe below)',
];

export const CannotResolveModal: React.FC<CannotResolveModalProps> = ({
  open, onClose, onConfirm, loading, taskTitle,
}) => {
  const id = useId();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason,   setCustomReason]   = useState('');
  const [error, setError]                   = useState('');

  const finalReason = selectedReason === 'Other (describe below)'
    ? customReason.trim()
    : selectedReason;

  function handleSubmit() {
    if (!finalReason || finalReason.length < 10) {
      setError('Please provide a reason of at least 10 characters.');
      return;
    }
    setError('');
    onConfirm(finalReason);
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Report: Cannot Resolve">
      <p className="text-sm text-gray-600">
        Complaint: <strong>{taskTitle}</strong>
      </p>

      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-700">
        ⚠️ This action will return the complaint to the officer for further action.
      </div>

      <div>
        <fieldset>
          <legend className="text-xs font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </legend>
          <div className="space-y-2">
            {CANNOT_RESOLVE_REASONS.map((r) => (
              <label key={r} className="flex items-start gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="radio"
                  name={`${id}-reason`}
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => { setSelectedReason(r); setError(''); }}
                  className="mt-0.5 accent-red-600"
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>

        {selectedReason === 'Other (describe below)' && (
          <textarea
            value={customReason}
            onChange={(e) => { setCustomReason(e.target.value); setError(''); }}
            rows={3}
            placeholder="Describe why this cannot be resolved..."
            className="mt-3 w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        )}

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <ActionRow
        onCancel={onClose}
        onConfirm={handleSubmit}
        loading={loading}
        confirmLabel="🚫 Submit Cannot Resolve"
        confirmStyle="bg-red-700 hover:bg-red-800 focus:ring-red-400"
        disabled={!finalReason || finalReason.length < 10}
      />
    </ModalShell>
  );
};

// ─────────────────────────────────────────
// EscalateModal
// ─────────────────────────────────────────
interface EscalateModalProps {
  open:       boolean;
  onClose:    () => void;
  onConfirm:  (reason: string, notes: string) => void;
  loading:    boolean;
  taskTitle:  string;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  open, onClose, onConfirm, loading, taskTitle,
}) => {
  const id   = useId();
  const [reason, setReason] = useState('');
  const [notes,  setNotes]  = useState('');
  const [error,  setError]  = useState('');

  function handleSubmit() {
    if (reason.trim().length < 10) {
      setError('Escalation reason must be at least 10 characters.');
      return;
    }
    setError('');
    onConfirm(reason.trim(), notes.trim());
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Request Escalation">
      <p className="text-sm text-gray-600 font-medium">{taskTitle}</p>

      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-xs text-orange-700">
        ⚠️ Use escalation when the issue requires higher authority, specialist intervention, or cross-department coordination.
      </div>

      <div>
        <label htmlFor={`${id}-esc-reason`} className="block text-xs font-medium text-gray-700 mb-1">
          Escalation Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${id}-esc-reason`}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(''); }}
          rows={3}
          placeholder="Why does this need escalation? What is blocking resolution?"
          className={`w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none ${error ? 'border-red-400' : 'border-gray-300'}`}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-esc-notes`} className="block text-xs font-medium text-gray-700 mb-1">
          Additional Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id={`${id}-esc-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any additional context for the officer..."
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>

      <ActionRow
        onCancel={onClose}
        onConfirm={handleSubmit}
        loading={loading}
        confirmLabel="⚠️ Submit Escalation"
        confirmStyle="bg-orange-600 hover:bg-orange-700 focus:ring-orange-400"
        disabled={reason.trim().length < 10}
      />
    </ModalShell>
  );
};

// ─────────────────────────────────────────
// AddNotesModal
// ─────────────────────────────────────────
interface AddNotesModalProps {
  open:      boolean;
  onClose:   () => void;
  onConfirm: (notes: string) => void;
  loading:   boolean;
}

export const AddNotesModal: React.FC<AddNotesModalProps> = ({
  open, onClose, onConfirm, loading,
}) => {
  const id = useId();
  const [notes, setNotes] = useState('');

  return (
    <ModalShell open={open} onClose={onClose} title="Add Field Notes">
      <div>
        <label htmlFor={`${id}-notes`} className="block text-xs font-medium text-gray-700 mb-1">
          Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${id}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Site observations, work performed, materials used, problems encountered..."
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          autoFocus
        />
      </div>
      <ActionRow
        onCancel={onClose}
        onConfirm={() => { if (notes.trim()) onConfirm(notes.trim()); }}
        loading={loading}
        confirmLabel="📝 Save Notes"
        disabled={!notes.trim()}
      />
    </ModalShell>
  );
};
