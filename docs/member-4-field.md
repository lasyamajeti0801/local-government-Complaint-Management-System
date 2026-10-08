# NAGAR CONNECT — Member 4: Field Operations & Resolution
## Handoff Documentation

> Branch: `feature/member-4-field`
> Depends on: M1 (Foundation), M2 (Citizen), M3 (Officer)
> Next: Member 5 (RAG / Knowledge Intelligence)

---

## 1. Summary

Member 4 implements the complete **Field Staff Portal** — the mobile-first interface through which field workers receive, accept, perform, document, and submit resolution for assigned complaints.

Everything **extends** the M1/M2/M3 foundation. No new authentication, no new complaint system, no new timeline, no duplicate tables.

---

## 2. Architecture Overview

```
M3 Officer Dashboard
        |
        | POST /api/officer/complaints/:id/assign-field-staff
        v
   field_tasks (NEW table)
        |
        v
Field Staff Dashboard  (/field/dashboard)
        |
        +-- Accept Task
        +-- Mark Arrived
        +-- Start Work
        +-- Add Notes
        +-- Upload Before Photo
        +-- Upload After Photo
        +-- Complete Work
        +-- Submit Resolution
        +-- Cannot Resolve
        +-- Escalate
                |
                v
      Officer Verification Panel
                |
                v
    Complaint -> CITIZEN_VERIFICATION
```

---

## 3. Database Changes

### New Tables

#### `field_tasks`
| Column | Type | Description |
|---|---|---|
| `id` | UUID PK | Task identifier |
| `complaint_id` | UUID FK | Parent complaint |
| `assignment_id` | UUID FK | Parent assignment |
| `field_staff_id` | UUID FK | Assigned field staff |
| `assigned_by` | UUID FK | Officer who assigned |
| `status` | VARCHAR(30) | Lifecycle status |
| `assigned_at` | TIMESTAMPTZ | Task creation time |
| `accepted_at` | TIMESTAMPTZ | Acceptance time |
| `arrived_at` | TIMESTAMPTZ | On-site arrival |
| `started_at` | TIMESTAMPTZ | Work start |
| `completed_at` | TIMESTAMPTZ | Work completion |
| `resolution_submitted_at` | TIMESTAMPTZ | Resolution submission |
| `sla_deadline` | TIMESTAMPTZ | SLA reference |
| `work_notes` | TEXT | Running field notes |
| `work_description` | TEXT | Structured work description |
| `resolution_notes` | TEXT | Final resolution summary |
| `cannot_resolve_reason` | TEXT | Reason if CANNOT_RESOLVE |
| `escalation_reason` | TEXT | Reason if NEEDS_ESCALATION |

#### `field_task_status_history`
Audit log of every status transition on a field task.

### Extended Tables (safe ALTER TABLE ADD COLUMN IF NOT EXISTS)

| Table | Column Added | Purpose |
|---|---|---|
| `complaint_evidence` | `evidence_category` | BEFORE_PHOTO, AFTER_PHOTO, etc. |
| `complaint_evidence` | `field_task_id` | Links evidence to field task |
| `complaint_status_history` | `source` | FIELD / OFFICER / CITIZEN / SYSTEM |
| `complaint_status_history` | `field_task_id` | Links timeline event to field task |
| `escalations` | `field_task_id` | Field-origin escalation reference |
| `escalations` | `origin` | FIELD / OFFICER / SYSTEM |

**No existing columns modified. No data deleted.**

---

## 4. Field Task Lifecycle

```
ASSIGNED
    |
ACCEPTED      <- also: CANNOT_RESOLVE, NEEDS_ESCALATION from any state
    |
ARRIVED
    |
IN_PROGRESS
    |
WORK_COMPLETED
    |
RESOLUTION_SUBMITTED  (terminal — field side)
```

Alternative terminal states:
- `CANNOT_RESOLVE` — from ASSIGNED, ACCEPTED, or ARRIVED
- `NEEDS_ESCALATION` — from any non-terminal state

Transitions validated **server-side** in `FieldTask.js → isValidTransition()`.

---

## 5. API Reference

### Field Staff APIs

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/field/dashboard` | FIELD_STAFF | Dashboard counts + lists |
| GET | `/api/field/tasks` | FIELD_STAFF | List tasks (filterable) |
| GET | `/api/field/tasks/:id` | FIELD_STAFF, OFFICER+ | Task detail |
| GET | `/api/field/tasks/:id/history` | FIELD_STAFF, OFFICER+ | Status history |
| GET | `/api/field/tasks/:id/evidence` | FIELD_STAFF, OFFICER+ | Evidence list |
| POST | `/api/field/tasks/:id/accept` | FIELD_STAFF (owner) | Accept task |
| POST | `/api/field/tasks/:id/arrive` | FIELD_STAFF (owner) | Mark arrived |
| POST | `/api/field/tasks/:id/start` | FIELD_STAFF (owner) | Start work |
| POST | `/api/field/tasks/:id/notes` | FIELD_STAFF (owner) | Add notes |
| POST | `/api/field/tasks/:id/complete` | FIELD_STAFF (owner) | Mark complete |
| POST | `/api/field/tasks/:id/evidence` | FIELD_STAFF (owner) | Upload evidence |
| POST | `/api/field/tasks/:id/submit-resolution` | FIELD_STAFF (owner) | Submit resolution |
| POST | `/api/field/tasks/:id/cannot-resolve` | FIELD_STAFF (owner) | Cannot resolve |
| POST | `/api/field/tasks/:id/escalate` | FIELD_STAFF (owner) | Escalate |

### Officer APIs (extends M3)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/officer/complaints/:id/assign-field-staff` | OFFICER+ | Create field task |
| GET | `/api/officer/complaints/:id/field-tasks` | OFFICER+ | List field tasks |
| POST | `/api/officer/tasks/:id/verify-resolution` | OFFICER+ | Approve/reject |

---

## 6. Evidence Upload Security

| Category | Allowed Types | Max Size |
|---|---|---|
| BEFORE_PHOTO | JPG, PNG, WebP | 10 MB |
| AFTER_PHOTO | JPG, PNG, WebP | 10 MB |
| FIELD_DOCUMENT | PDF, DOC, DOCX, TXT | 10 MB |
| FIELD_NOTES | TXT, PDF | 10 MB |

- Filenames randomized server-side (crypto.randomBytes)
- MIME type + extension validated server-side
- Ownership checked before every upload

---

## 7. Complaint Status Mapping

| Field Task Status | Complaint Status Set To |
|---|---|
| ACCEPTED | ASSIGNED |
| ARRIVED | FIELD_VERIFICATION |
| IN_PROGRESS | IN_PROGRESS |
| WORK_COMPLETED | IN_PROGRESS |
| RESOLUTION_SUBMITTED | RESOLUTION_SUBMITTED |
| CANNOT_RESOLVE | UNDER_REVIEW |
| NEEDS_ESCALATION | ESCALATED |

Officer approves -> complaint: CITIZEN_VERIFICATION
Officer rejects -> field task: IN_PROGRESS, complaint: IN_PROGRESS

---

## 8. Frontend File Map

```
frontend/src/
+-- types/fieldTask.types.ts           TypeScript types
+-- services/fieldTaskService.ts       API client
+-- hooks/useFieldTasks.ts             React hooks
+-- components/field/
|   +-- FieldTaskStatusBadge.tsx       Status badge
|   +-- FieldTaskCard.tsx              Task card
|   +-- FieldTaskTimeline.tsx          Status history
|   +-- EvidenceUploader.tsx           Drag-drop uploader
|   +-- FieldActionModals.tsx          All 8 action modals
|   +-- OfficerFieldView.tsx           M3 officer extension
|   +-- fieldUtils.ts                  Utilities/helpers
+-- pages/field/
    +-- FieldDashboardPage.tsx         Dashboard
    +-- FieldTaskListPage.tsx          Task list
    +-- FieldTaskDetailPage.tsx        Task detail + actions
    +-- FieldRoutes.tsx                Route definitions
```

---

## 9. Integration Instructions

### Router (add to M1 App.tsx)
```tsx
import FieldRoutes from './pages/field/FieldRoutes';

<Route path="/field/*" element={
  <ProtectedRoute allowedRoles={['FIELD_STAFF']}>
    <FieldRoutes />
  </ProtectedRoute>
} />
```

### Officer Detail Page (add to M3 ComplaintDetailPage)
```tsx
import { OfficerFieldView } from '../../components/field/OfficerFieldView';

<OfficerFieldView complaintId={complaint.id} />
```

### Backend (add to M1 app.js / server.js)
```js
const fieldRoutes = require('./routes/fieldTaskRoutes');
app.use('/api', fieldRoutes);
```

---

## 10. Migration Commands

```bash
# Run migration
psql -U postgres -d nagar_connect -f database/migrations/004_field_tasks.sql

# Optional: seed demo data
psql -U postgres -d nagar_connect -f database/seed/004_seed_field_data.sql
```

---

## 11. Test Suite

```bash
npm test -- tests/member4/fieldTask.test.js
```

Covers: assignment, dashboard, task list, IDOR protection, full lifecycle, officer verification, invalid transitions, cannot-resolve, evidence security, escalation, M1/M2/M3 regression.

---

## 12. Git Handoff

```bash
git checkout -b feature/member-4-field
git add .
git commit -m "feat: implement field operations and resolution (Member 4)"
git push origin feature/member-4-field
# PR: feature/member-4-field -> develop
```

---

## 13. Notes for Member 5 (RAG)

- `field_tasks` table available for complaint context enrichment
- `complaint_status_history` (source='FIELD') for field activity timeline
- `complaint_evidence` (evidence_category='BEFORE_PHOTO'/'AFTER_PHOTO') for evidence context
- Field staff SOP documents should use: `visibility='FIELD_STAFF'`, `document_type='FIELD_SOP'`

---

*Member 4 - Field Operations & Resolution - Complete*
*"Your Voice. Our Responsibility. A Better Nagar."*
