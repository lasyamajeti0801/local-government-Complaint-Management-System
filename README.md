# 🏛️ NAGAR CONNECT
### Local Government Complaint Management & Centralized RAG Intelligence Platform
> *“Your Voice. Our Responsibility. A Better Nagar.”*

---

## 📌 Project Overview
**Nagar Connect** is a production-style municipal e-governance platform designed for local urban bodies (Municipal Corporations / Nagar Palikas). It manages the entire lifecycle of citizen grievances—from lodging and SLA-monitored department triage to on-ground field execution, photographic evidence verification, and citizen feedback.

At the core of the platform is a **Centralized, Role-Aware RAG (Retrieval-Augmented Generation) Knowledge Intelligence Engine** that grounds all civic inquiries in statutory municipal documents with zero hallucination and strict citation provenance.

---

## 🔄 Sequential 7-Member Development Dependency Chain

This project follows a strict sequential engineering discipline where every member builds upon and extends the previous member's foundation:

```
 MEMBER 1: Foundation + Authentication + Database + Design System
     ↓
 MEMBER 2: Citizen Complaint Management (Portal, NGC IDs, Timeline)
     ↓
 MEMBER 3: Department Officer Management (Queue, SLAs, Field Assignment)
     ↓
 MEMBER 4: Field Operations & Resolution (Mobile Portal, Evidence, Notes)
     ↓
 [ACTIVE] MEMBER 5: Centralized RAG / Knowledge Intelligence Engine
     ↓
 MEMBER 6: Analytics & Municipal Intelligence (Charts, Trends, Civic Intel)
     ↓
 MEMBER 7: Final Integration + Security + Testing + Deployment
```

---

## 🏛️ Authentic Municipal E-Governance Design System

The platform is designed to feel like genuine Indian Municipal Corporation software:
- **Primary Color:** Government Blue (`#1B365D`)
- **Accent Color:** Civic Municipal Teal (`#0E8A78`)
- **National Touch:** Sovereign Tricolor header accent bar (`#FF9933`, `#FFFFFF`, `#138808`) and national motto *सत्यमेव जयते*
- **Status Indicators:** Amber for warnings/SLAs, Red for critical/overdue violations, Green for verified resolutions
- **Theme Support:** Default crisp Light mode + complete Dark mode
- **Accessibility:** High-contrast WCAG 2.1 compliance, responsive layouts, mobile-first field views

---

## 🧠 Centralized RAG Architecture (Member 5)

Member 5 provides the universal knowledge engine consumed across all dashboards:

```
                            CENTRAL RAG PIPELINE
                            
   Municipal Documents (PDF, DOCX, TXT, MD)
              ↓
   Text Extraction (pdf-parse / mammoth)
              ↓
   Text Cleaning & Semantic Normalization
              ↓
   Section- & Page-Aware Chunking (Overlap Windows)
              ↓
   128-Dimensional Dense Semantic Embeddings + TF-IDF
              ↓
   Vector Database (In-Memory + SQLite Persistent Index)
              ↓
   Hybrid Search (Cosine Similarity + Okapi BM25)
              ↓
   Role-Based Permission Filter (Citizen / Officer / Field / Admin)
              ↓
   Multi-Feature Reranking Engine
              ↓
   Context Assembly & Strict Grounding Synthesizer
              ↓
   Verifiable Citations (Document Title, Section, Page, Match %)
```

### Role-Aware Knowledge Access Control
- **Citizen:** Access restricted strictly to `PUBLIC` documents (e.g. *Citizen Grievance Redressal Charter*, *Waste Segregation Bylaws*).
- **Officer:** Access to `PUBLIC` and `INTERNAL_OFFICER` documents (e.g. *Water Supply Pipeline Rectification SOP*, *Street Lighting SLA Manual*).
- **Field Staff:** Access to `PUBLIC` and `FIELD_STAFF` documents (e.g. *Pothole Repair & Field Safety SOP*).
- **Municipal Admin / Commissioner:** Access across all municipal tiers including `ADMIN_ONLY` (e.g. *Emergency Civic Contingency Protocol*).

> **Strict Refusal Rule:** If no authorized document contains grounded facts answering an inquiry, the engine strictly outputs:  
> *"I could not find this information in the authorized municipal knowledge base."*  
> It never fabricates citations.

### Zero Paid API Dependency
Built with a multi-tiered provider abstraction (`LLMProvider`):
1. **`LocalProvider`:** Built-in semantic synthesizer requiring **zero API keys**.
2. **`DemoProvider`:** Diagnostic test provider with retrieval telemetry.
3. **`ExternalProvider`:** Pluggable cloud bridge (OpenAI, Gemini, Ollama) if `.env` keys are configured.

---

## 🗄️ Centralized Database Schema

Single SQLite database engine with 22 relational tables (`database/schema/schema.sql`):
- `users`, `roles`, `permissions`, `departments`
- `complaints`, `complaint_categories`, `complaint_status_history`
- `complaint_assignments`, `complaint_comments`, `complaint_evidence`, `complaint_feedback`
- `field_tasks`, `sla_rules`, `escalations`
- `documents`, `document_chunks`, `document_versions`
- `rag_queries`, `rag_responses`
- `notifications`, `audit_logs`, `municipal_notices`, `system_settings`

---

## 👥 Fictional Demo Accounts

Use the **Quick Role Switcher** dropdown in the navbar or these credentials:

| Role | Name | Email | Password | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | Priya Sharma | `citizen@nagarconnect.gov.in` | `Citizen@123` | Resident |
| **Officer (Water)** | Er. Rajesh Verma | `officer.water@nagarconnect.gov.in` | `Officer@123` | Water Supply |
| **Officer (Sanitation)** | Dr. Anita Deshmukh | `officer.sanitation@nagarconnect.gov.in` | `Officer@123` | Sanitation |
| **Field Staff** | Ramesh Kumar | `field.ramesh@nagarconnect.gov.in` | `Field@123` | Roads & Infra |
| **Knowledge Admin** | Vikramaditya Sengupta | `knowledge.admin@nagarconnect.gov.in` | `Know@123` | Central HQ |
| **Municipal Admin** | Sunil Kulkarni | `admin@nagarconnect.gov.in` | `Admin@123` | Administration |
| **Commissioner** | Dr. M. Sundaram, IAS | `commissioner@nagarconnect.gov.in` | `Comm@123` | Executive |
| **Super Admin** | System Security Master | `superadmin@nagarconnect.gov.in` | `Super@123` | CISO Office |

---

## 🚀 Quick Start & Installation

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Seed Database & Ingest Municipal Documents into RAG
```bash
npm run seed
```
*Seeds all demo accounts, sample complaints, and automatically extracts, chunks, vectorizes, and indexes the 6 municipal reference documents into the Vector Store.*

### 3. Run the Automated RAG Test Suite
```bash
npm test
```
*Executes all 5 automated tests validating SLA retrieval, role boundary isolation, and zero-hallucination refusal.*

### 4. Start the Application (Backend + Frontend)
```bash
npm run dev
```
- **Backend API:** `http://localhost:5000`
- **Frontend Portal:** `http://localhost:3000`

---

## 📡 REST API Reference Summary

### Centralized RAG & Documents
- `POST /api/rag/query`: Submit inquiry with role context; returns grounded answer & citations.
- `GET /api/rag/stats`: VectorStore chunk count, vector dimensions, and latency telemetry.
- `POST /api/documents/upload`: Ingest new PDF, DOCX, TXT, MD document with metadata.
- `GET /api/documents`: List accessible documents filtered by role visibility.
- `GET /api/documents/:id/chunks`: Inspect chunk-by-chunk tokenization and page numbers.
- `DELETE /api/documents/:id`: Remove document and de-index from VectorStore.

### Citizen Complaints
- `POST /api/complaints`: Register grievance (generates sequential `NGC-2026-XXXXXX` ID).
- `GET /api/complaints`: Filter complaints by status, priority, or citizen ID.
- `GET /api/complaints/:id`: Get full complaint details, auditable timeline, and evidence.
- `POST /api/complaints/:id/feedback`: Submit 1-5 star rating or request ticket reopening.

### Officer & Field Operations
- `GET /api/officer/queue`: Officer queue with real-time SLA countdown and overdue flags.
- `POST /api/officer/complaints/:id/assign`: Assign complaint to field staff (creates field task).
- `POST /api/officer/complaints/:id/approve`: Approve field resolution and sign off ticket.
- `GET /api/field/tasks`: Ground tasks for field technicians.
- `PATCH /api/field/tasks/:id/state`: Update state (`ASSIGNED` → `ARRIVED` → `IN_PROGRESS` → `RESOLUTION_SUBMITTED`).
- `POST /api/field/tasks/:id/evidence`: Upload photographic proof.

---

## 📋 Documentation Sitemap
- [docs/member-1-foundation.md](docs/member-1-foundation.md)
- [docs/member-2-citizen.md](docs/member-2-citizen.md)
- [docs/member-3-officer.md](docs/member-3-officer.md)
- [docs/member-4-field.md](docs/member-4-field.md)
- [docs/member-5-rag.md](docs/member-5-rag.md) *(Member 5 Handoff & Architecture)*
