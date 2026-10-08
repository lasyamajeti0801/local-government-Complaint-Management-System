// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/pages/field/FieldTaskListPage.tsx
// Searchable, filterable task list for Field Staff.
// =============================================================

import React, { useState, useEffect, useDeferredValue } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFieldTaskList } from '../../hooks/useFieldTasks';
import { FieldTaskCard } from '../../components/field/FieldTaskCard';
import { FieldTaskStatusBadge } from '../../components/field/FieldTaskStatusBadge';
import type { FieldTaskStatus } from '../../types/fieldTask.types';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All',              value: '' },
  { label: 'Assigned',        value: 'ASSIGNED' },
  { label: 'Accepted',        value: 'ACCEPTED' },
  { label: 'Arrived',         value: 'ARRIVED' },
  { label: 'In Progress',     value: 'IN_PROGRESS' },
  { label: 'Work Completed',  value: 'WORK_COMPLETED' },
  { label: 'Submitted',       value: 'RESOLUTION_SUBMITTED' },
  { label: 'Cannot Resolve',  value: 'CANNOT_RESOLVE' },
  { label: 'Escalated',       value: 'NEEDS_ESCALATION' },
];

const PRIORITY_FILTERS: { label: string; value: string }[] = [
  { label: 'All Priorities', value: '' },
  { label: '🔴 Critical',    value: 'CRITICAL' },
  { label: '🟠 High',        value: 'HIGH' },
  { label: '🟡 Medium',      value: 'MEDIUM' },
  { label: '⚪ Low',         value: 'LOW' },
];

export const FieldTaskListPage: React.FC = () => {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();

  const [searchInput,  setSearchInput]  = useState('');
  const [status,       setStatus]       = useState(params.get('status') ?? '');
  const [priority,     setPriority]     = useState(params.get('priority') ?? '');
  const [todayOnly,    setTodayOnly]    = useState(params.get('todayOnly') === 'true');
  const [overdueOnly,  setOverdueOnly]  = useState(params.get('overdueOnly') === 'true');

  // Debounce search input
  const deferredSearch = useDeferredValue(searchInput);

  const { tasks, total, loading, error, refresh } = useFieldTaskList({
    status:      status || undefined,
    priority:    priority || undefined,
    search:      deferredSearch || undefined,
    todayOnly:   todayOnly  || undefined,
    overdueOnly: overdueOnly || undefined,
  });

  return (
    <main className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Field Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${total} task${total !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <button
          onClick={() => navigate('/field/dashboard')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Search + filters */}
      <section aria-label="Search and filters" className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true">🔍</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by complaint ID, title, or location..."
            className="
              w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
              placeholder:text-gray-400
            "
            aria-label="Search tasks"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Filter by priority"
          >
            {PRIORITY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Toggle chips */}
          <button
            type="button"
            onClick={() => { setTodayOnly(!todayOnly); setOverdueOnly(false); }}
            className={`
              text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors
              ${todayOnly
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }
            `}
            aria-pressed={todayOnly}
          >
            📅 Today
          </button>

          <button
            type="button"
            onClick={() => { setOverdueOnly(!overdueOnly); setTodayOnly(false); }}
            className={`
              text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors
              ${overdueOnly
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'
              }
            `}
            aria-pressed={overdueOnly}
          >
            ⚠️ Overdue
          </button>

          {/* Clear filters */}
          {(status || priority || todayOnly || overdueOnly || searchInput) && (
            <button
              type="button"
              onClick={() => {
                setStatus(''); setPriority('');
                setTodayOnly(false); setOverdueOnly(false);
                setSearchInput('');
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <p className="font-medium">⚠️ {error}</p>
          <button onClick={refresh} className="mt-1 text-xs underline">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-base font-medium text-gray-500">No tasks found</p>
          <p className="text-sm mt-1">
            {searchInput ? `No results for "${searchInput}"` : 'Try adjusting your filters.'}
          </p>
        </div>
      )}

      {/* Task grid */}
      {!loading && tasks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.map((task) => (
            <FieldTaskCard
              key={task.id}
              task={task}
              onAction={(taskId, action) => navigate(`/field/tasks/${taskId}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default FieldTaskListPage;
