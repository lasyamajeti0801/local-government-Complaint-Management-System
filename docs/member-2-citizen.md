# MEMBER 2 HANDOFF DOCUMENTATION
## Citizen Grievance Redressal Portal
**Platform:** 🏛️ NAGAR CONNECT  
**Author:** Member 2 (Citizen Portal Lead)  

---

### 1. Citizen Portal Capabilities
- **Citizen Dashboard**: Real-time overview of citizen complaints (Total, Active, Resolved, Action Pending).
- **Lodge New Grievance**: Wizard supporting category selection, department routing, detailed description, landmark, ward number, priority, and photographic attachment preview.
- **Realistic Complaint Number Generation**: Auto-generates sequential IDs formatted as `NGC-YYYY-XXXXXX` (e.g. `NGC-2026-000101`).
- **Reusable Timeline**: Establishes `window.renderComplaintTimeline(history, status)` for tracking grievance milestones across the lifecycle.
- **Feedback & Reopen**: Enables citizens to rate completed repairs (1-5 stars) or reopen tickets if the problem recurs.

### 2. Database Schema Extensions
- `complaint_categories`: Municipal categories linked to parent departments with default priorities and statutory SLA hours.
- `complaints`: Core grievance entity storing status, priorities, GPS location, and resolution summaries.
- `complaint_status_history`: Complete state transition audit trail.
- `complaint_feedback`: Citizen satisfaction ratings and reopening reasons.
- `complaint_evidence`: File attachments and before/after photos.

### 3. API Endpoints
- `GET /api/citizen/departments`: List of municipal departments.
- `GET /api/citizen/categories`: List of categories by department.
- `GET /api/citizen/complaints`: Citizen's personal grievances.
- `POST /api/citizen/complaints`: Register new grievance.
- `GET /api/citizen/complaints/:id`: Get full grievance detail & timeline.
- `POST /api/citizen/complaints/:id/feedback`: Submit rating or reopen ticket.
