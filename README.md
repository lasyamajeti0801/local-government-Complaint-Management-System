# 🏛️ NAGAR CONNECT (నగర్ కనెక్ట్)
### Local Government Complaint Management & Centralized RAG Intelligence Platform
> *"Your Voice. Our Responsibility. A Better Nagar."*

[![Build Status](https://img.shields.io/badge/Build-Passing-10b981.svg)](#)
[![Tests](https://img.shields.io/badge/Tests-7%2F7%20Passed%20(100%25)-10b981.svg)](#)
[![RAG Pipeline](https://img.shields.io/badge/RAG%20Engine-128--dim%20Hybrid%20Dense%20Vector-7c3aed.svg)](#)
[![RBAC](https://img.shields.io/badge/RBAC-7%20Roles%20Active-1e3a8a.svg)](#)

---

## 1. Project Overview & Vision
**Nagar Connect** is a production-grade, full-stack municipal grievance redressal and civic intelligence platform built in the visual and operational style of modern Indian e-governance systems (e.g. GHMC, MeeSeva, CPGRAMS).

The platform coordinates the complete lifecycle of citizen grievances across municipal departments (Water Supply, Sanitation, Roads, Street Lighting, Stormwater Drainage, Public Health) while providing an authoritative **Centralized RAG (Retrieval-Augmented Generation)** knowledge intelligence system for citizens, field workers, and administrators.

---

## 2. 7-Member Sequential GitHub Development Chain

```
               🏛️ NAGAR CONNECT

                   MEMBER 1 [DONE]
        Foundation + Authentication + Database
                   │
                   ▼
                   MEMBER 2 [DONE]
          Citizen Complaints & Lifecycle
                   │
                   ▼
                   MEMBER 3 [DONE]
          Department Officer Management & SLA
                   │
                   ▼
                   MEMBER 4 [DONE]
          Field Staff Operations & Evidence
                   │
                   ▼
                   MEMBER 5 [ACTIVE / COMPLETE] 🧠
         Centralized RAG & Knowledge Intelligence
                   │
                   ▼
                   MEMBER 6 [READY FOR HANDOFF]
          Municipal Analytics & Intelligence
                   │
                   ▼
                   MEMBER 7
        Final Integration, Security & Deployment
```

---

## 3. Member 5 RAG Architecture & Pipeline

Member 5 implemented the **Central RAG Engine** in `/rag/` supporting all downstream portals:

```
[ Municipal Documents (PDF/DOCX/MD/TXT) ]
                   │
                   ▼
          1. Ingestion & Cleaner
                   │
                   ▼
       2. Semantic Window Chunking (120 words / 25 overlap)
                   │
                   ▼
  3. 128-dim Dense Vector Embeddings (Zero Paid API Required)
                   │
                   ▼
    4. SQLite Database & In-Memory VectorStore
                   │
                   ▼
5. Hybrid Retrieval (BM25 Keyword + Cosine Vector Similarity)
                   │
                   ▼
   6. Role-Based Access Control (RBAC) Permission Filter
                   │
                   ▼
    7. Reciprocal Rank Fusion (RRF) Reranking
                   │
                   ▼
   8. Grounded LLM Generation + Verifiable Citations
```

### Role-Aware RAG Matrix:
- **Citizen:** Municipal Citizen Charter, Statutory SLAs, Waste Segregation Bylaws, Public FAQs.
- **Department Officer:** Departmental Standard Operating Procedures (SOP), Water & Sewer Pipe specs, Escalation Rules.
- **Field Staff:** Occupational Safety & Health, 11kV Electrical PPE, Trench Shoring, Jetting Pressure limits.
- **Admin / Commissioner:** Municipal Governance Policies, Financial Sanction Caps, Disciplinary Rules.
- **Anti-Hallucination Guardrail:** Strict fallback: *"I could not find this information in the authorized municipal knowledge base."* Never fabricates facts or citations!

---

## 4. Demo Accounts & 1-Click Role Switcher

The application contains a persistent top bar enabling instant 1-click switching between all 7 demo accounts:

| Role | Demo Email | Password | Persona & Jurisdiction |
| :--- | :--- | :--- | :--- |
| **CITIZEN** | `citizen@nagarconnect.gov.in` | `Citizen@123` | Ananya Sharma (Ward 42, Jubilee Hills) |
| **OFFICER (WATER)** | `officer.water@nagarconnect.gov.in` | `Officer@123` | Rajesh Varma (Assistant Engineer, Zone 3) |
| **OFFICER (SANITATION)** | `officer.sanitation@nagarconnect.gov.in` | `Officer@123` | Kavita Reddy (Sanitary Inspector, Zone 2) |
| **FIELD_STAFF** | `field.ramesh@nagarconnect.gov.in` | `Field@123` | Ramesh Kumar (Field Lead, Water Maintenance) |
| **MUNICIPAL_ADMIN** | `admin@nagarconnect.gov.in` | `Admin@123` | Srinivas Rao (Zonal Administrator) |
| **COMMISSIONER** | `commissioner@nagarconnect.gov.in` | `Commissioner@123` | Dr. Venkatesh Murthy IAS (Municipal Commissioner) |
| **KNOWLEDGE_ADMIN** | `knowledge.admin@nagarconnect.gov.in` | `Knowledge@123` | Pooja Hegde (RAG & Knowledge AI Lead) |
| **SUPER_ADMIN** | `superadmin@nagarconnect.gov.in` | `Super@123` | State Municipal Data Centre Admin |

---

## 5. Technology Stack
- **Backend:** Node.js, Express, SQLite (`sqlite3` / relational schema), JSON Web Tokens (JWT), `bcryptjs`, `pdf-parse`, `mammoth`.
- **RAG Engine:** 128-dimensional dense vector space + BM25 sparse keyword analyzer, sliding window semantic chunker, pluggable `LocalProvider` / `ExternalProvider`.
- **Frontend:** React 18, Vite, Lucide Icons, Custom Indian Municipal E-Governance Design System (Vanilla CSS with CSS variables, light/dark themes, English/Telugu multilingual toggle).
- **Testing:** Comprehensive automated test suite (`tests/run-all-tests.js`).

---

## 6. Installation & Quick Start

### 1. Install Dependencies
```bash
npm install
npm --prefix frontend install
```

### 2. Run Automated Test Suite
```bash
npm test
```

### 3. Start Backend & RAG Server
```bash
npm start
```
The server will run on `http://localhost:5000` and automatically serve the built frontend, REST APIs, and Central RAG Engine.

---

## 7. Reusable API Endpoints

### Central RAG & Documents (Member 5 Core):
- `POST /api/rag/query` — Role-aware RAG query with grounded answer and citations.
- `POST /api/documents/upload` — Ingests PDF, DOCX, TXT, MD documents into vector index.
- `GET /api/documents` — Lists all indexed documents.
- `GET /api/documents/:id/chunks` — Inspects semantic chunks and dense vector embeddings.
- `DELETE /api/documents/:id` — Removes document and purges vector index.
- `GET /api/rag/stats` — Real-time telemetry and index health stats.

### Grievances & Workflows (Members 1-4):
- `POST /api/auth/login` & `POST /api/auth/demo-login` — JWT authentication & instant demo switcher.
- `GET /api/complaints` & `POST /api/complaints` — Citizen grievance creation and tracking.
- `POST /api/complaints/:id/feedback` — Citizen star rating and reopen flow.
- `GET /api/officer/queue` & `POST /api/officer/assign` — Officer complaint queue and field dispatch.
- `GET /api/field/tasks` & `POST /api/field/tasks/:id/submit-resolution` — Field staff task lifecycle and evidence upload.
- `GET /api/analytics/kpis` — Municipal performance indicators and SLA compliance rates.

---

## 8. Handoff to Member 6
Member 6 is ready to build **Analytics & Municipal Intelligence** on top of the working database and centralized RAG engine. Refer to `docs/member-5-rag.md` for integration details.
