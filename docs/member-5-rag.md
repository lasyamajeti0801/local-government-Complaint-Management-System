# Member 5 Handoff Documentation: Centralized RAG & Knowledge Intelligence

**Branch:** `feature/member-5-rag`  
**System:** Nagar Connect Municipal E-Governance Platform  
**Owner:** Member 5 (RAG Lead / Knowledge Engineering)  
**Version:** 1.5.0  

---

## 1. Executive Summary & Architecture Overview

Member 5 has successfully built the **Centralized RAG (Retrieval-Augmented Generation) & Knowledge Intelligence Engine** for Nagar Connect. This engine serves as the single source of truth for all municipal bylaws, standard operating procedures (SOPs), service level agreement (SLA) policies, safety manuals, and administrative circulars.

All current and future dashboards (Citizen, Officer, Field, Municipal Admin, Civic Analytics, Super Admin) consume this centralized RAG infrastructure via standardized REST APIs without needing separate vector databases.

```
                           NAGAR CONNECT CENTRAL RAG PIPELINE
                           
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Municipal Docs  │ ----> │ Text Extraction │ ----> │  Text Cleaning  │
│ (PDF/DOCX/MD)   │       │ (pdf-parse/mam) │       │ & Normalization │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Dense Embeddings│ <---- │  Metadata Tag   │ <---- │ Semantic Chunk  │
│ (128-D Unit)    │       │ (Dept/Role/SLA) │       │ (Overlap Window)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Vector Database │ ----> │  Hybrid Search  │ ----> │ Role Permission │
│ (Memory+SQLite) │       │  (Cosine+BM25)  │       │  Access Filter  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Verifiable      │ <---- │ Grounded Neural │ <---- │ Context Rerank  │
│ Citations + Ans │       │ Synthesis (LLM) │       │ & Assembly      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 2. Ingestion & Document Processing Pipeline

The ingestion pipeline (`rag/ingestion/`) converts multi-format municipal documents into search-optimized semantic units:

1. **Text Extraction (`rag/ingestion/textExtractor.js`):**
   - **PDF:** Extracted using `pdf-parse` with form-feed page boundary detection.
   - **DOCX:** Extracted using `mammoth` with structured text extraction.
   - **TXT / MD:** Extracted preserving section headers and markdown lists.
2. **Text Cleaning (`rag/ingestion/textCleaner.js`):**
   - Strips non-printing characters, normalizes line breaks, and cleans extraneous spaces while preserving legal section markers (`SECTION`, `ARTICLE`, `CLAUSE`).
3. **Semantic Chunking (`rag/ingestion/chunker.js`):**
   - Splits text into ~1000 character chunks with a 200-character overlap window.
   - Preserves section titles and page numbers for exact legal citation.
   - Attaches comprehensive metadata to every chunk: `document_id`, `chunk_index`, `section_title`, `page_number`, `visibility`, `department_id`, and `token_count`.

---

## 3. Embeddings & Mathematical Vector Engine

To eliminate mandatory paid cloud dependencies while ensuring mathematical rigor, Member 5 implemented a **128-Dimensional Semantic Vectorizer** (`rag/embeddings/vectorizer.js`):

- **Feature Hashing & Lexical Projection:** Maps unigram and bigram tokens into a 128-dimensional dense vector space.
- **Domain Vocabulary Weighting:** Boosts civic domain keywords (`pothole`, `leakage`, `sanitation`, `sla`, `desilting`, `compaction`, `penalty`, `grievance`) to guarantee domain precision.
- **L2 Unit Normalization:** Projects every vector onto the unit hypersphere:
  $$\vec{u} = \frac{\vec{v}}{\|\vec{v}\|_2} = \frac{\vec{v}}{\sqrt{\sum_{i=1}^{128} v_i^2}}$$
- **Cosine Similarity (`rag/embeddings/similarity.js`):**
  $$\text{Cosine}(\vec{q}, \vec{d}) = \vec{q} \cdot \vec{d} = \sum_{i=1}^{128} q_i \cdot d_i$$
- **Okapi BM25 Scoring:** Computes exact keyword frequency and inverse document frequency (IDF) for hybrid retrieval.

---

## 4. Role-Aware Permission Filtering

Strict information isolation is enforced at the retrieval layer (`rag/retrieval/permissionFilter.js`). Unauthorized documents are stripped before relevance ranking or prompt assembly:

| User Role | Permitted Visibility Scopes | Inaccessible Documents |
| :--- | :--- | :--- |
| **CITIZEN** | `PUBLIC` | Internal Officer SOPs, Field Guides, Admin Directives |
| **OFFICER** | `PUBLIC`, `INTERNAL_OFFICER` | Admin-only executive contingency directives |
| **FIELD_STAFF** | `PUBLIC`, `FIELD_STAFF` | Internal administrative circulars, confidential SLAs |
| **MUNICIPAL_ADMIN** | `PUBLIC`, `INTERNAL_OFFICER`, `FIELD_STAFF`, `ADMIN_ONLY` | Confidential audit logs |
| **COMMISSIONER** | All Scopes (`PUBLIC`, `INTERNAL_OFFICER`, `FIELD_STAFF`, `ADMIN_ONLY`, `CONFIDENTIAL`) | None (Universal Executive Access) |
| **KNOWLEDGE_ADMIN**| All Scopes (Knowledge Curator Access) | None |
| **SUPER_ADMIN** | Universal Access | None |

> **Strict Refusal Rule:** If an unauthorized user queries a restricted document (e.g. Citizen asking about Admin Emergency Sanction Limits), the engine returns:  
> *"I could not find this information in the authorized municipal knowledge base."*  
> Zero hallucinated or unauthorized sources are leaked.

---

## 5. Provider Abstraction (`LLMProvider`)

Per requirement #14, the RAG engine operates with zero paid API keys out-of-the-box:

```
LLMProvider (rag/generation/provider.js)
├── LocalProvider      (rag/generation/localProvider.js)   <- Active Default
├── ExternalProvider   (rag/generation/externalProvider.js) <- Optional Cloud/Ollama
└── DemoProvider       (rag/generation/demoProvider.js)     <- Diagnostic Telemetry
```

- **`LocalProvider`:** Extracts grounded factual statements from top-ranked chunks, validates keyword coverage to prevent false-positive matching, and formats an authoritative e-governance answer with citations.
- **`ExternalProvider`:** Pluggable bridge to OpenAI / Gemini / Claude / Ollama if `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `OLLAMA_HOST` are present.

---

## 6. Verifiable Citation Format

Every authorized RAG response strictly returns:
```json
{
  "success": true,
  "answer": "According to the authorized Nagar Palika Citizen Grievance Redressal Charter 2026 (SECTION 2: STATUTORY SERVICE LEVEL AGREEMENT (SLA) TIMELINES, Page 3):\n\n• Severe Road Pothole / Crater: 48 hours for temporary cold-mix patch...",
  "sources": [
    {
      "document_id": "doc_adm_charter",
      "document": "Nagar Palika Citizen Grievance Redressal Charter 2026",
      "document_type": "CITIZEN_CHARTER",
      "version": "2026.1",
      "section": "SECTION 2: STATUTORY SERVICE LEVEL AGREEMENT (SLA) TIMELINES",
      "page": 3,
      "relevance": 0.89
    }
  ],
  "confidence": 0.89,
  "was_fallback_refusal": false,
  "provider": "LocalProvider",
  "latency_ms": 14
}
```

---

## 7. RAG REST API Reference

### 7.1 Submit RAG Query
- **Endpoint:** `POST /api/rag/query`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>` (Optional)
- **Body:**
  ```json
  {
    "query": "What is the SLA timeline for resolving a severe road pothole?",
    "assistant_context": "CITIZEN_SERVICE",
    "provider": "local",
    "top_k": 4
  }
  ```

### 7.2 Ingest Municipal Document
- **Endpoint:** `POST /api/documents/upload`
- **Method:** `multipart/form-data`
- **Fields:** `file`, `title`, `department_id`, `document_type`, `version`, `visibility`, `effective_date`

### 7.3 List Documents (Role-Filtered)
- **Endpoint:** `GET /api/documents?department_id=DEPT_WATER&visibility=PUBLIC`

### 7.4 Document Chunks Inspector
- **Endpoint:** `GET /api/documents/:id/chunks`

### 7.5 Delete Document & De-index
- **Endpoint:** `DELETE /api/documents/:id`

### 7.6 Telemetry & Stats
- **Endpoint:** `GET /api/rag/stats`

---

## 8. Integration Instructions for Member 6 (Analytics & Municipal Intelligence)

Member 6 can build the **Civic Analytics Assistant** directly on top of this completed engine:

1. **Call `POST /api/rag/query` directly from your analytics controllers.**  
   Pass `assistant_context: "MUNICIPAL_INTEL"` or `"CIVIC_ANALYTICS"`.
2. **Do NOT create another vector database.**  
   Reuse `rag/retrieval/vectorStore.js` and `rag/generation/generator.js`.
3. **Distinguish Database Analytics from Document Knowledge:**
   - For quantitative charts (e.g. total complaints by department, SLA compliance %), query SQLite tables (`complaints`, `departments`, `sla_rules`).
   - For civic policies, regulations, and departmental recommendations, query the Central RAG API.
   - You can combine both in your Analytics Assistant: summarize database complaint spikes and cite the corresponding Municipal SOP or Bylaw via RAG!
