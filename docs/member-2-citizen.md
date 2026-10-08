<<<<<<< HEAD
# Member 2 Handoff Documentation: Citizen Complaint Management

**Branch:** `feature/member-2-citizen`  
**System:** Nagar Connect Municipal E-Governance Platform  
**Version:** 1.2.0  

---

## 1. Responsibilities Completed
- **Citizen Portal UI:** Interactive portal in `frontend/src/pages/CitizenPortal.jsx`.
- **Sequential Tracking ID Generator:** Automated generator creating IDs formatted as `NGC-YYYY-XXXXXX` (e.g. `NGC-2026-000001`).
- **Full Complaint Lifecycle Management:**
  $$\text{SUBMITTED} \rightarrow \text{UNDER REVIEW} \rightarrow \text{ASSIGNED} \rightarrow \text{FIELD VERIFICATION} \rightarrow \text{IN PROGRESS} \rightarrow \text{RESOLUTION SUBMITTED} \rightarrow \text{RESOLVED} \rightarrow \text{CLOSED}$$
- **Auditable Status Timeline:** Persisted in `complaint_status_history` and rendered using the shared `Timeline` component.
- **Citizen Feedback & Reopen Engine:** Citizen satisfaction ratings (1 to 5 stars), written review notes, and reopen escalation trigger.
- **SLA Calculation:** Automated deadline computation based on department and category defaults.

---

## 2. Complaint API Reference
- `POST /api/complaints`: Create complaint with Title, Description, Category ID, Location, Landmark, Priority.
- `GET /api/complaints`: List complaints with filters (`status`, `priority`, `citizen_id`, `search`).
- `GET /api/complaints/:id`: Get full complaint details, auditable timeline, evidence photos, and feedback.
- `POST /api/complaints/:id/feedback`: Record citizen satisfaction score and optional reopen request.

---

## 3. Integration Guidelines for Member 3 (Officer Portal)
- Member 3 directly retrieves these complaints via `GET /api/officer/queue`.
- Re-use the existing `complaint_status_history` table for recording officer status transitions.
- Do NOT create a duplicate timeline component; reuse `<Timeline items={complaint.timeline} />`.
=======
# Nagar Connect — Member 2 Citizen Complaint Management

## Scope and current integration boundary

The Member 2 deliverable is the Citizen Complaint Management module. It covers the citizen dashboard, complaint creation and tracking, notifications/recent updates, evidence selection, citizen feedback, and reopening eligible resolved complaints. It does not create authentication, the application shell, department officer actions, or a second production complaint table.

The checked-out repository contains the Member 1 foundation handoff document, but does not contain the documented `src/main.tsx`, React app/router, `AuthContext`, shared component library, backend, Prisma schema, or complaint API. Therefore this implementation is isolated under `src/modules/citizen/`, with a standalone preview entry. It deliberately does not replace the normal application entrypoint.

The citizen and officer previews share one browser-local complaint record under `nagar-connect-officer-demo-v1` through `src/modules/complaints/complaintRepository.ts`. Submissions in the citizen preview appear in the officer preview queue in the same browser. This is a preview/demo integration only—not an API, database, authentication, or security boundary. The current citizen identity is a fictional demo citizen and must be taken from the foundation auth context when mounted in the real application.

## Files

- `src/modules/complaints/types.ts` — shared preview complaint, status, priority, history, evidence, feedback and assignment types.
- `src/modules/complaints/complaintRepository.ts` — shared browser-preview complaint repository and migration of existing officer demo records.
- `src/modules/complaints/complaintConstants.ts` — shared preview storage key.
- `src/modules/citizen/CitizenDashboardPage.tsx` — citizen dashboard, complaint queue/detail tracker, submission form, recent updates, notifications and feedback.
- `src/modules/citizen/citizenService.ts` — citizen-scoped complaint create/list, feedback and reopen operations.
- `src/modules/citizen/citizenRules.ts` — status lifecycle, citizen filters, sequence generation and form validation.
- `src/modules/citizen/citizen.css` — isolated, responsive module styling.
- `citizen-preview.html`, `src/citizen-preview.tsx`, `src/citizen-preview.css`, `citizen-preview.config.ts` — temporary preview shell and independent build entrypoint.

The existing officer route and primary app entrypoint were not replaced.

## Preview and validation

From the repository root:

```sh
npx vite --config vite.config.ts
```

Open `http://localhost:5173/citizen-preview.html`. The preview starts as the fictional demo citizen, Meera Iyer. The standalone production build is:

```sh
npx tsc --noEmit -p tsconfig.json
npx vite build --config citizen-preview.config.ts
node --test tests/citizen-workflow.test.cjs
```

The citizen preview builds to `dist-citizen-preview/` so it does not clear/overwrite the existing officer preview's `dist/`. The root `npm run build` remains the Member 1 app build and currently cannot work in this partial checkout because its documented app source (`src/main.tsx`) is absent. The preview config intentionally builds only the citizen entry and does not hide or overwrite that missing foundation.

## Citizen routes when the foundation source is available

Mount these paths in the existing router; protect them with the existing authenticated `CITIZEN` role and wrap them in the existing `AppLayout`:

- `/citizen` — citizen overview (`CitizenDashboardPage`).
- `/citizen/complaints` — same page focused on the complaint list.
- `/citizen/complaints/:id` — selected complaint tracking detail using the shared complaint ID.
- `/citizen/new-complaint` — open the create-complaint form.

This source-only checkout has no router to register these routes in. Do not introduce another login or global layout to make the module appear integrated.

## Complaint lifecycle and data contract

Tracking displays the shared lifecycle:

`SUBMITTED → UNDER_REVIEW → ASSIGNED → FIELD_VERIFICATION → IN_PROGRESS → RESOLUTION_SUBMITTED → CITIZEN_VERIFICATION → RESOLVED → CLOSED`

The citizen UI also displays shared exception/reopen statuses (`REJECTED`, `ESCALATED`, `CANNOT_RESOLVE`, `NEEDS_ESCALATION`, `REOPENED`) and timeline entries; it does not invent a competing status history.

Complaint fields used or extended by the module:

- Existing complaint identity and content: `id`, `complaintNumber`, `citizenId`, `title`, `description`, `categoryId/category`, `departmentId/department`, `location`, `landmark`, `priority`, `status`, `createdAt`, and `slaDeadline`.
- Existing shared lifecycle and officer/field handoff: `assignedOfficerId`, `assignedFieldStaffId`, `complaint_status_history`, and the shared complaint timeline.
- Citizen evidence: `complaint_evidence` (demo metadata in the preview: file name, MIME type, size and upload date).
- Citizen satisfaction: `complaint_feedback` (rating and optional comment).

In the preview, `complaintNumber` is generated as `NGC-<year>-<six-digit sequence>`, and a priority-based demo SLA deadline is set at creation. On real integration, generate IDs and SLA deadlines on the backend to avoid race conditions and enforce canonical municipal rules.

## Proposed API integration

Use the Member 1 API client and the existing shared complaint entity; the following contract is a proposal until backend routes are present:

- `GET /api/complaints?mine=true` — authenticated citizen’s complaints and summary.
- `GET /api/complaints/:id` — citizen-owned details, shared status history and evidence metadata.
- `POST /api/complaints` — create a complaint in the shared `complaints` table; derive `citizenId` from authenticated identity on the server.
- `POST /api/complaints/:id/evidence` — upload approved photo/video evidence and persist in shared `complaint_evidence`.
- `POST /api/complaints/:id/feedback` — persist feedback in shared `complaint_feedback`.
- `POST /api/complaints/:id/reopen` — perform an authorized state transition and append to shared `complaint_status_history`.
- `GET /api/notifications` — use the existing notification system if the foundation provides it; otherwise derive updates from shared complaint status history.
- `GET /api/categories` and `GET /api/departments` — use the foundation’s existing category and department services rather than hardcoding the production catalog.

The backend must enforce complaint ownership, RBAC, allowed transitions, file-type/size limits, rate limits, and audit records. Browser-local demo state must never be used as an authorization decision.

## Field-staff / officer handoff

Citizen-created preview complaints are records in the same shared local preview array consumed by the officer preview, rather than a citizen-only record collection. For production, officer and future field modules should query the same `complaints` record and `complaint_status_history`; Member 3 must not create a parallel officer-complaint table.

## Limitations

- Selected evidence is stored as metadata in this browser preview; file bytes are not uploaded or persisted. Production must use the shared evidence API and secure storage.
- Preview identity is fixed to a fictional demo account. Production must use the Member 1 `AuthContext` and server-derived citizen identity.
- Complaint data and actions use `localStorage` only because this checkout has no complaint backend or database schema.
>>>>>>> 6e06128 (Add citizen complaint management)
