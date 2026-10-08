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
