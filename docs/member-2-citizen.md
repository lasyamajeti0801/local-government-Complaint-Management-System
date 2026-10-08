# 🏛️ MEMBER 2 HANDOFF DOCUMENTATION
## Citizen Grievance Management System

**Branch:** `feature/member-2-citizen`  
**System:** NAGAR CONNECT Municipal Complaint Management & RAG Platform

---

### 1. Responsibilities & Deliverables
1. **Citizen Portal** (`frontend/src/pages/CitizenPortal.jsx`):
   - Grievance registration with department & category pickers, location address, landmark, priority, and photographic evidence.
   - Sequential Complaint ID generation: `NGC-2026-000001` format.
2. **9-Stage Lifecycle Tracker & Timeline Component** (`frontend/src/components/Timeline.jsx`):
   - Stages: `SUBMITTED` -> `UNDER REVIEW` -> `ASSIGNED` -> `FIELD VERIFICATION` -> `IN PROGRESS` -> `RESOLUTION SUBMITTED` -> `CITIZEN VERIFICATION` -> `RESOLVED` -> `CLOSED`.
3. **Citizen Feedback & Reopen Engine**:
   - 1 to 5 star rating, feedback remarks, and 1-click reopen capability if dissatisfaction exists.
4. **Complaint API Endpoints** (`backend/routes/complaintRoutes.js`):
   - `GET /api/complaints`
   - `POST /api/complaints`
   - `GET /api/complaints/:id`
   - `POST /api/complaints/:id/feedback`
   - `POST /api/complaints/:id/comments`
