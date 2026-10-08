// =============================================================
// NAGAR CONNECT — MEMBER 4
// frontend/src/pages/field/FieldRoutes.tsx
// Route definitions for Field Operations.
// Plug into existing M1 router:
//   import FieldRoutes from './pages/field/FieldRoutes';
//   <Route path="/field/*" element={<FieldRoutes />} />
//
// Uses M1 ProtectedRoute and role guard — not a new router.
// =============================================================

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy-load heavy pages
const FieldDashboardPage = lazy(() => import('./FieldDashboardPage'));
const FieldTaskListPage  = lazy(() => import('./FieldTaskListPage'));
const FieldTaskDetailPage = lazy(() => import('./FieldTaskDetailPage'));

// M1 loading skeleton (use M1's LoadingSkeleton if exported)
const PageLoader: React.FC = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-48" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-200 rounded-xl" />
      ))}
    </div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-lg" />
      ))}
    </div>
  </div>
);

const FieldRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Default → dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />

      {/* Dashboard */}
      <Route path="dashboard" element={<FieldDashboardPage />} />

      {/* Task list */}
      <Route path="tasks" element={<FieldTaskListPage />} />

      {/* Task detail */}
      <Route path="tasks/:taskId" element={<FieldTaskDetailPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </Suspense>
);

export default FieldRoutes;
