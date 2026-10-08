// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/pages/field/FieldDashboardPage.tsx
// Field Staff home dashboard — uses M1 layout + design system.
// =============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldDashboard, useFieldTaskActions } from '../../hooks/useFieldTasks';
import { FieldTaskCard } from '../../components/field/FieldTaskCard';
import {
  AcceptTaskModal,
  ArriveModal,
  StartWorkModal,
} from '../../components/field/FieldActionModals';
import { FIELD_STATUS_CONFIG, formatDateTime } from '../../components/field/fieldUtils';
import type { FieldTask, FieldTaskStatus } from '../../types/fieldTask.types';

// ─────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────
interface StatCardProps {
  label:      string;
  value:      number | string;
  icon:       string;
  color:      string;
  bgColor:    string;
  onClick?:   () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bgColor, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      flex items-center gap-3 p-4 rounded-xl border
      ${bgColor} text-left w-full
      hover:shadow-md transition-shadow duration-150
      focus:outline-none focus:ring-2 focus:ring-blue-400
      ${onClick ? 'cursor-pointer' : 'cursor-default'}
    `}
    aria-label={`${label}: ${value}`}
  >
    <span className="text-2xl" aria-hidden="true">{icon}</span>
    <div>
      <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
    </div>
  </button>
);

// ─────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-200 rounded-xl" />
      ))}
    </div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-32 bg-gray-200 rounded-lg" />
    ))}
  </div>
);

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export const FieldDashboardPage: React.FC = () => {
  const navigate                              = useNavigate();
  const { data, loading, error, refresh }    = useFieldDashboard();
  const [activeModal, setActiveModal]        = useState<string | null>(null);
  const [selectedTask, setSelectedTask]      = useState<FieldTask | null>(null);

  const { accept, arrive, startWork, actionLoading, actionError } = useFieldTaskActions(
    (updatedTask, action) => {
      refresh();
      setActiveModal(null);
      setSelectedTask(null);
    }
  );

  function handleQuickAction(taskId: string, action: string) {
    const allTasks = [
      ...(data?.todayTasks ?? []),
      ...(data?.pendingTasks ?? []),
      ...(data?.inProgressTasks ?? []),
      ...(data?.overdueTasks ?? []),
    ];
    const task = allTasks.find((t) => t.id === taskId);
    if (task) setSelectedTask(task);
    setActiveModal(action);
  }

  if (loading) {
    return (
      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        <DashboardSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <p className="font-medium">⚠️ Error loading dashboard</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const c = data.counts;

  return (
    <main className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Page header */}
      <header>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Field Operations Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your field tasks and assignments — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      {/* Action error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ⚠️ {actionError}
        </div>
      )}

      {/* KPI Stats grid */}
      <section aria-label="Task statistics">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <StatCard
            label="Today's Tasks" value={Number(c.today_count)}
            icon="📅" color="text-blue-700" bgColor="bg-blue-50 border-blue-200"
            onClick={() => navigate('/field/tasks?todayOnly=true')}
          />
          <StatCard
            label="In Progress" value={Number(c.in_progress_count)}
            icon="🔧" color="text-amber-700" bgColor="bg-amber-50 border-amber-200"
            onClick={() => navigate('/field/tasks?status=IN_PROGRESS')}
          />
          <StatCard
            label="Pending" value={Number(c.pending_count)}
            icon="⏳" color="text-indigo-700" bgColor="bg-indigo-50 border-indigo-200"
            onClick={() => navigate('/field/tasks?status=ASSIGNED,ACCEPTED,ARRIVED')}
          />
          <StatCard
            label="High Priority" value={Number(c.high_priority_count)}
            icon="🔴" color="text-red-700" bgColor="bg-red-50 border-red-200"
            onClick={() => navigate('/field/tasks?priority=HIGH,CRITICAL')}
          />
          <StatCard
            label="Overdue" value={Number(c.overdue_count)}
            icon="⚠️" color="text-orange-700" bgColor="bg-orange-50 border-orange-200"
            onClick={() => navigate('/field/tasks?overdueOnly=true')}
          />
          <StatCard
            label="Escalated" value={Number(c.escalated_count)}
            icon="📢" color="text-purple-700" bgColor="bg-purple-50 border-purple-200"
            onClick={() => navigate('/field/tasks?status=NEEDS_ESCALATION')}
          />
          <StatCard
            label="Completed" value={Number(c.completed_count)}
            icon="✅" color="text-green-700" bgColor="bg-green-50 border-green-200"
            onClick={() => navigate('/field/tasks?status=RESOLUTION_SUBMITTED,CANNOT_RESOLVE')}
          />
        </div>
      </section>

      {/* In Progress Tasks */}
      {data.inProgressTasks.length > 0 && (
        <section aria-label="In-progress tasks">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span aria-hidden="true">🔧</span> Active Work
            <span className="ml-auto text-xs text-gray-400 font-normal">
              {data.inProgressTasks.length} task{data.inProgressTasks.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.inProgressTasks.map((task) => (
              <FieldTaskCard key={task.id} task={task} onAction={handleQuickAction} />
            ))}
          </div>
        </section>
      )}

      {/* Overdue Tasks */}
      {data.overdueTasks.length > 0 && (
        <section aria-label="Overdue tasks">
          <h2 className="text-base font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span aria-hidden="true">⚠️</span> Overdue Tasks
            <span className="ml-auto text-xs text-red-400 font-normal">
              {data.overdueTasks.length} overdue
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.overdueTasks.map((task) => (
              <FieldTaskCard key={task.id} task={task} onAction={handleQuickAction} />
            ))}
          </div>
        </section>
      )}

      {/* Today's Tasks */}
      <section aria-label="Today's tasks">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <span aria-hidden="true">📅</span> Today's Tasks
          </h2>
          <button
            onClick={() => navigate('/field/tasks?todayOnly=true')}
            className="text-xs text-blue-600 hover:underline"
          >
            View All →
          </button>
        </div>
        {data.todayTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-sm">No tasks assigned for today.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.todayTasks.slice(0, 6).map((task) => (
              <FieldTaskCard key={task.id} task={task} onAction={handleQuickAction} />
            ))}
          </div>
        )}
      </section>

      {/* Pending Tasks */}
      {data.pendingTasks.length > 0 && (
        <section aria-label="Pending tasks">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span aria-hidden="true">⏳</span> Pending Tasks
            </h2>
            <button
              onClick={() => navigate('/field/tasks')}
              className="text-xs text-blue-600 hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.pendingTasks.slice(0, 4).map((task) => (
              <FieldTaskCard key={task.id} task={task} onAction={handleQuickAction} compact />
            ))}
          </div>
        </section>
      )}

      {/* ─── Modals ─── */}
      {selectedTask && (
        <>
          <AcceptTaskModal
            open={activeModal === 'accept'}
            onClose={() => setActiveModal(null)}
            onConfirm={() => accept(selectedTask.id)}
            loading={actionLoading === 'accept'}
            taskTitle={selectedTask.complaint_title}
          />
          <ArriveModal
            open={activeModal === 'arrive'}
            onClose={() => setActiveModal(null)}
            onConfirm={() => arrive(selectedTask.id)}
            loading={actionLoading === 'arrive'}
            taskTitle={selectedTask.complaint_title}
          />
          <StartWorkModal
            open={activeModal === 'start'}
            onClose={() => setActiveModal(null)}
            onConfirm={() => startWork(selectedTask.id)}
            onConfirmWithNotes={(notes) => startWork(selectedTask.id, notes)}
            loading={actionLoading === 'start'}
            taskTitle={selectedTask.complaint_title}
          />
        </>
      )}
    </main>
  );
};

export default FieldDashboardPage;
