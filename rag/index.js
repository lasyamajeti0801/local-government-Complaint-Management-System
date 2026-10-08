/**
 * Nagar Connect RAG - Central Orchestrator
 * Full pipeline: Ingestion -> Chunking -> Embeddings -> Vector Store -> Hybrid Retrieval -> Reranking -> LLM Generation -> Verifiable Citations
 */
const { extractTextFromFile } = require('./ingestion/extractor');
const { cleanText } = require('./ingestion/cleaner');
const { chunkDocument } = require('./chunking/chunker');
const { generateEmbedding } = require('./embeddings/embedder');
const { vectorStore } = require('./retrieval/vectorStore');
const { rerankCandidates } = require('./reranking/reranker');
const { generateAnswer } = require('./generation/generator');
const { query: dbQuery, run: dbRun } = require('../database/db');

class RAGPipeline {
  constructor() {
    this.vectorStore = vectorStore;
  }

  /**
   * Initialize RAG system by syncing database documents and vector index
   */
  async initialize() {
    console.log('🔄 Initializing Nagar Connect Central RAG Pipeline...');
    
    // Check if chunks already exist in DB
    const chunkCountRes = await dbQuery('SELECT COUNT(*) as count FROM document_chunks');
    const dbChunkCount = chunkCountRes[0]?.count || 0;

    if (dbChunkCount === 0) {
      console.log('⚡ No chunks found in DB. Ingesting seeded documents into RAG vector index...');
      await this.indexAllDatabaseDocuments();
    } else {
      await this.vectorStore.initialize();
    }

    console.log('✅ Nagar Connect RAG Pipeline Ready & Operational! 🏛️');
  }

  /**
   * Process and index all active documents in SQLite into the Vector Store
   */
  async indexAllDatabaseDocuments() {
    const docs = await dbQuery("SELECT * FROM documents WHERE status != 'ARCHIVED'");
    let totalIndexedChunks = 0;

    for (const doc of docs) {
      try {
        let content = '';
        if (doc.file_path && require('fs').existsSync(doc.file_path)) {
          const extracted = await extractTextFromFile(doc.file_path, doc.file_type);
          content = extracted.text;
        } else {
          // If no physical file on disk, generate rich municipal document content from title & metadata
          content = this.generateSampleMunicipalDocContent(doc);
        }

        const chunks = chunkDocument({
          document_id: doc.id,
          title: doc.title,
          department: doc.department,
          document_type: doc.document_type,
          version: doc.version,
          visibility: doc.visibility,
          content
        });

        // Insert chunks into DB with embeddings
        for (const chk of chunks) {
          const embedding = generateEmbedding(chk.content);
          await dbRun(
            `INSERT OR REPLACE INTO document_chunks (
              id, chunk_id, document_id, chunk_index, content, token_count,
              page_number, section, visibility, embedding_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              chk.chunk_id,
              chk.chunk_id,
              doc.id,
              chk.chunk_index,
              chk.content,
              chk.token_count,
              chk.page_number,
              chk.section,
              chk.visibility,
              JSON.stringify(embedding)
            ]
          );
        }

        // Update document status
        await dbRun(
          "UPDATE documents SET status = 'INDEXED', total_chunks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [chunks.length, doc.id]
        );

        totalIndexedChunks += chunks.length;
      } catch (err) {
        console.error(`❌ Error indexing doc ${doc.id}:`, err.message);
        await dbRun("UPDATE documents SET status = 'FAILED' WHERE id = ?", [doc.id]);
      }
    }

    await this.vectorStore.initialize();
    return totalIndexedChunks;
  }

  /**
   * Ingest a newly uploaded document
   */
  async ingestDocument(docParams) {
    const {
      id,
      document_id,
      title,
      department,
      document_type,
      version = '1.0',
      effective_date = new Date().toISOString().split('T')[0],
      language = 'English',
      uploaded_by,
      visibility = 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
      file_path = null,
      file_type = 'txt',
      file_size = 0,
      raw_text = null
    } = docParams;

    let content = raw_text || '';
    if (file_path && require('fs').existsSync(file_path)) {
      const extracted = await extractTextFromFile(file_path, file_type);
      content = extracted.text;
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Document content is empty or could not be extracted.');
    }

    // 1. Create document record in DB
    await dbRun(
      `INSERT INTO documents (
        id, document_id, title, department, document_type, version, effective_date,
        language, uploaded_by, file_path, file_type, file_size, visibility, status, total_chunks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSING', 0)`,
      [
        id,
        document_id,
        title,
        department,
        document_type,
        version,
        effective_date,
        language,
        uploaded_by,
        file_path,
        file_type,
        file_size,
        visibility
      ]
    );

    // 2. Chunk document
    const chunks = chunkDocument({
      document_id: id,
      title,
      department,
      document_type,
      version,
      visibility,
      content
    });

    // 3. Generate embeddings and save chunks
    const enrichedChunks = [];
    for (const chk of chunks) {
      const embedding = generateEmbedding(chk.content);
      await dbRun(
        `INSERT INTO document_chunks (
          id, chunk_id, document_id, chunk_index, content, token_count,
          page_number, section, visibility, embedding_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          chk.chunk_id,
          chk.chunk_id,
          id,
          chk.chunk_index,
          chk.content,
          chk.token_count,
          chk.page_number,
          chk.section,
          chk.visibility,
          JSON.stringify(embedding)
        ]
      );

      enrichedChunks.push({
        id: chk.chunk_id,
        ...chk,
        embedding
      });
    }

    // 4. Update document status
    await dbRun(
      "UPDATE documents SET status = 'INDEXED', total_chunks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [chunks.length, id]
    );

    // 5. Add to in-memory vector store
    await this.vectorStore.addChunks(enrichedChunks);

    return {
      documentId: id,
      documentCode: document_id,
      title,
      totalChunks: chunks.length,
      status: 'INDEXED'
    };
  }

  /**
   * Query the Central RAG Pipeline with strict RBAC permission filtering
   */
  async queryRAG(params) {
    const {
      queryText,
      userRole = 'CITIZEN',
      userId = null,
      departmentFilter = null,
      topK = 4
    } = params;

    const startTime = Date.now();

    // Step 1: Hybrid Search (Dense Cosine Similarity + Sparse BM25) with RBAC filtering
    const candidates = await this.vectorStore.hybridSearch(queryText, {
      userRole,
      departmentFilter,
      topK: topK * 2
    });

    // Step 2: Cross-score Reranking & Reciprocal Rank Fusion (RRF)
    const rerankedChunks = rerankCandidates(candidates, queryText, { topK });

    // Step 3: Grounded Answer & Verifiable Citation Generation
    const result = await generateAnswer(queryText, rerankedChunks, { userRole });

    const executionTimeMs = Date.now() - startTime;
    result.metadata.executionTimeMs = executionTimeMs;

    // Step 4: Audit and persist query history
    try {
      let validUserId = null;
      if (userId) {
        const userExists = await dbQuery('SELECT id FROM users WHERE id = ?', [userId]);
        if (userExists.length > 0) validUserId = userId;
      }

      const queryId = `QRY_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await dbRun(
        `INSERT INTO rag_queries (id, user_id, user_role, query_text, department_filter, response_text, execution_time_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [queryId, validUserId, userRole, queryText, departmentFilter || 'ALL', result.answer, executionTimeMs]
      );

      for (const src of result.sources) {
        await dbRun(
          `INSERT INTO rag_responses (id, query_id, chunk_id, relevance_score, citation_text, page_number, section)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `RES_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            queryId,
            src.chunkId,
            src.relevanceNumeric,
            src.documentTitle,
            src.page,
            src.section
          ]
        );
      }
    } catch (auditErr) {
      console.warn('⚠️ Could not log RAG query audit:', auditErr.message);
    }

    return result;
  }

  /**
   * Delete document and its chunks
   */
  async deleteDocument(documentId) {
    await dbRun('DELETE FROM document_chunks WHERE document_id = ?', [documentId]);
    await dbRun('DELETE FROM document_versions WHERE document_id = ?', [documentId]);
    await dbRun('DELETE FROM documents WHERE id = ?', [documentId]);
    this.vectorStore.removeDocumentChunks(documentId);
    return { success: true, deletedId: documentId };
  }

  /**
   * Return real-time RAG operational statistics
   */
  async getStats() {
    const docStats = await dbQuery(`
      SELECT 
        COUNT(*) as totalDocs,
        SUM(CASE WHEN status = 'INDEXED' THEN 1 ELSE 0 END) as indexedDocs,
        SUM(total_chunks) as totalChunks
      FROM documents
    `);

    const queryStats = await dbQuery(`
      SELECT 
        COUNT(*) as totalQueries,
        AVG(execution_time_ms) as avgLatencyMs
      FROM rag_queries
    `);

    return {
      totalDocuments: docStats[0]?.totalDocs || 0,
      indexedDocuments: docStats[0]?.indexedDocs || 0,
      totalChunks: this.vectorStore.chunks.length || docStats[0]?.totalChunks || 0,
      totalQueriesAnswered: queryStats[0]?.totalQueries || 0,
      averageLatencyMs: Math.round(queryStats[0]?.avgLatencyMs || 120),
      vectorDimension: 128,
      hybridSearchEnabled: true,
      rbacFilteringActive: true,
      activeLLMProvider: process.env.RAG_LLM_PROVIDER || 'LOCAL_GROUNDED'
    };
  }

  /**
   * Fallback content generator for seeded documents if no physical file was uploaded
   */
  generateSampleMunicipalDocContent(doc) {
    if (doc.id === 'DOC_001') {
      return `MUNICIPAL CITIZEN CHARTER & CITIZEN GRIEVANCE REDRESSAL SLA GUIDELINES 2026
CHAPTER 1: CITIZEN RIGHTS AND STATUTORY GUARANTEES
1.1 Right to Civic Service: Every resident citizen has the legal right to basic civic amenities including safe drinking water, unhindered roads, functional street lighting, and clean sanitary surroundings under the Public Services Guarantee Act.
1.2 Statutory SLA Timelines:
- Drinking Water Main Line Burst: Repaired within 24 hours. Immediate valve cutoff within 2 hours.
- Contaminated Water Supply: Addressed within 12 hours with mandatory lab test of tap water.
- Garbage Clearance & Overflowing Bins: Mandatory clearance within 12 hours.
- Dead Animal Removal: High emergency response within 6 hours.
- Dangerous Road Potholes: Temporary filling within 24 hours; permanent mastic asphalt restoration within 48 to 72 hours.
- Non-Functional Street Lights: Repaired within 24 hours on main roads and 48 hours in residential colonies.
- Exposed Live Electrical Wires on Lamp Poles: Zero tolerance emergency response within 4 hours.
- Stormwater Drain Overflow / Waterlogging: Dewatering pumps deployed within 2 hours; desilting within 12-36 hours.
1.3 Compensation for Delay: Rs. 50 per day of delay payable to citizen if resolution exceeds SLA without force majeure justification.`;
    }
    if (doc.id === 'DOC_002') {
      return `DEPARTMENT OF WATER SUPPLY & SEWERAGE - STANDARD OPERATING PROCEDURES (SOP-WTR-2026)
SECTION A: PIPELINE BURST INSPECTION & VALVE ISOLATION
A.1 Emergency Response Protocol:
1. Assistant Engineer (AE) must acknowledge HIGH/CRITICAL complaints within 15 minutes.
2. Line Inspector must dispatch Valve Operator to isolate upstream sluice valve within 30 minutes.
3. Geo-coordinate check: Check GIS layer for gas lines, power cables, or fiber optics prior to mechanical excavation.
A.2 Trench Safety & Pipe Specifications:
- For trenches deeper than 1.5 meters, safety trench shoring boxes must be installed to prevent wall collapse.
- Replacement pipeline joints must use standard DI (Ductile Iron) K-9 grade pipes with EPDM rubber gaskets conforming to IS:8329.
SECTION B: SEWAGE OVERFLOW & MANHOLE DESILTING PROTOCOLS
B.1 Prohibition of Manual Scavenging: Under the Prohibition of Employment as Manual Scavengers Act, human entry into manholes without breathing apparatus and robotic super-sucker machines is strictly illegal.
B.2 Mechanical Desilting: Deploy High-Velocity Jetting Machine (minimum 120 bar pressure) and Vacuum Suction Grabber.`;
    }
    if (doc.id === 'DOC_003') {
      return `MUNICIPAL OCCUPATIONAL HEALTH & SAFETY GUIDELINES (FIELD-SAFETY-2026)
MODULE 1: MANDATORY PERSONAL PROTECTIVE EQUIPMENT (PPE) BY TASK TYPE
1.1 Street Lighting & Electrical Work:
- Arc-flash rated dielectric safety helmet (IS 2925 certified).
- 11kV electrical insulating rubber gloves conforming to IEC 60903 Class 2.
- Electrical hazard (EH) rated steel-toe safety boots with vulcanized rubber soles.
- Always implement Lockout/Tagout (LOTO) at feeder pillar box before starting line maintenance.
1.2 Sanitation & Waste Handling:
- Heavy-duty puncture-resistant nitrile / Kevlar coated gloves to guard against glass and biomedical sharps.
- N95 particulate respirators or carbon filter half-face masks when handling decomposing solid waste.
- High-visibility fluorescent lime-yellow safety jackets with 3M retro-reflective tape.
1.3 Road Work & Heavy Machinery Operations:
- Traffic cone cordoning: Place retro-reflective safety cones at 50m, 30m, and 10m before work zone.
- Flashing amber beacon light mounted on municipal repair vehicle roof.`;
    }
    if (doc.id === 'DOC_004') {
      return `MUNICIPAL SOLID WASTE MANAGEMENT & LITTERING BYLAWS 2026
SECTION 4: MANDATORY 3-WAY SOURCE SEGREGATION
4.1 Waste Categorization Rules: All domestic and commercial units must segregate solid waste into:
1. Wet Waste (Green Bin): Vegetable peels, food leftovers, organic biodegradable matter.
2. Dry Waste (Blue Bin): Paper, cardboard, plastics, milk pouches, glass bottles, metal cans.
3. Domestic Hazardous Waste (Red Bin): Sanitary pads, diapers, expired medicines, batteries, mosquito repellent mats.
SECTION 5: SCHEDULE OF CIVIC FINES AND PENALTIES
5.1 Spot Fines:
- Second-time unsegregated waste handover: Fine of Rs. 200 for residential households; Rs. 1,000 for commercial shops.
- Open littering or spitting in public places: Spot fine of Rs. 500.
- Illegal dumping of Construction & Demolition (C&D) debris: Fine of Rs. 10,000 for first offense plus towing cost.
- Open burning of dry leaves or plastic waste: Fine of Rs. 5,000 per incident under NGT guidelines.`;
    }
    return `MUNICIPAL INTERNAL GOVERNANCE & ADMINISTRATIVE POLICIES 2026
SECTION 2: FINANCIAL SANCTION DELEGATION LIMITS
2.1 Emergency Civic Repair Spending Caps:
- Assistant Engineer (AE): Up to Rs. 25,000 per emergency repair job without prior quotation, capped at Rs. 1,00,000 monthly.
- Executive Engineer (EE): Up to Rs. 2,50,000 per civil contract with single-source quotation for urgent floods.
- Superintending Engineer (SE): Up to Rs. 10,00,000 under Zonal Development Fund.
- Zonal Commissioner (ZC): Up to Rs. 50,00,000 with e-tender waiver during declared emergencies.
- Municipal Commissioner: Full sanction power up to Rs. 5,00,00,000.`;
  }
}

const ragPipeline = new RAGPipeline();

module.exports = {
  ragPipeline
};
