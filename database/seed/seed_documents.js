const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { run, query } = require('../db');
const { extractText } = require('../../rag/ingestion/textExtractor');
const { createChunks } = require('../../rag/ingestion/chunker');
const { defaultVectorizer } = require('../../rag/embeddings/vectorizer');
const { vectorStore } = require('../../rag/retrieval/vectorStore');

async function seedDocuments() {
  console.log('📚 Starting Municipal RAG Knowledge Base Seeding...');

  const docsToSeed = [
    {
      id: 'doc_adm_charter',
      title: 'Nagar Palika Citizen Grievance Redressal Charter 2026',
      filename: 'Nagar_Palika_Citizen_Grievance_Redressal_Charter_2026.md',
      dept: 'DEPT_ADMIN',
      docType: 'CITIZEN_CHARTER',
      version: '2026.1',
      effectiveDate: '2026-01-01',
      language: 'en',
      visibility: 'PUBLIC',
      uploadedBy: 'usr_admin'
    },
    {
      id: 'doc_san_bylaws',
      title: 'Solid Waste Management and Sanitation Bylaws 2026',
      filename: 'Solid_Waste_Management_and_Sanitation_Bylaws_2026.md',
      dept: 'DEPT_SANITATION',
      docType: 'BYLAW',
      version: '2026.1',
      effectiveDate: '2026-01-15',
      language: 'en',
      visibility: 'PUBLIC',
      uploadedBy: 'usr_knowledge_admin'
    },
    {
      id: 'doc_wtr_sop',
      title: 'Water Supply Pipeline Maintenance and Leakage Rectification SOP',
      filename: 'Water_Supply_Pipeline_Maintenance_and_Leakage_SOP.md',
      dept: 'DEPT_WATER',
      docType: 'SOP',
      version: '2026.2',
      effectiveDate: '2026-02-01',
      language: 'en',
      visibility: 'INTERNAL_OFFICER',
      uploadedBy: 'usr_officer_water'
    },
    {
      id: 'doc_lgt_manual',
      title: 'Street Lighting Infrastructure SLA and Inspection Manual',
      filename: 'Street_Lighting_Infrastructure_SLA_and_Inspection_Manual.md',
      dept: 'DEPT_LIGHTING',
      docType: 'SLA_POLICY',
      version: '2026.1',
      effectiveDate: '2026-02-10',
      language: 'en',
      visibility: 'INTERNAL_OFFICER',
      uploadedBy: 'usr_knowledge_admin'
    },
    {
      id: 'doc_rds_sop',
      title: 'Pothole Repair, Cold-Mix Asphalt & Monsoon Field Safety SOP',
      filename: 'Pothole_Repair_Cold_Mix_and_Monsoon_Field_Safety_SOP.md',
      dept: 'DEPT_ROADS',
      docType: 'FIELD_SOP',
      version: '2026.1',
      effectiveDate: '2026-02-20',
      language: 'en',
      visibility: 'FIELD_STAFF',
      uploadedBy: 'usr_knowledge_admin'
    },
    {
      id: 'doc_adm_contingency',
      title: 'Emergency Civic Contingency and Executive Escalation Protocol',
      filename: 'Emergency_Civic_Contingency_and_Escalation_Protocol.md',
      dept: 'DEPT_ADMIN',
      docType: 'CIRCULAR',
      version: '2026.3',
      effectiveDate: '2026-03-01',
      language: 'en',
      visibility: 'ADMIN_ONLY',
      uploadedBy: 'usr_commissioner'
    }
  ];

  for (const docMeta of docsToSeed) {
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'documents', docMeta.filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const stats = fs.statSync(filePath);
    const fileExt = path.extname(filePath).replace('.', '').toUpperCase();

    // 1. Text extraction
    const extraction = await extractText(filePath, fileExt);

    // 2. Insert into documents table
    await run(`
      INSERT OR REPLACE INTO documents (
        id, title, original_filename, file_path, file_type, file_size_bytes,
        department_id, document_type, version, effective_date, language,
        uploaded_by_user_id, page_count, visibility, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      docMeta.id,
      docMeta.title,
      docMeta.filename,
      filePath,
      fileExt,
      stats.size,
      docMeta.dept,
      docMeta.docType,
      docMeta.version,
      docMeta.effectiveDate,
      docMeta.language,
      docMeta.uploadedBy,
      extraction.pageCount,
      docMeta.visibility,
      'ACTIVE'
    ]);

    // 3. Chunking
    const chunks = createChunks(extraction.pages, {
      document_id: docMeta.id,
      department_id: docMeta.dept,
      visibility: docMeta.visibility,
      document_type: docMeta.docType,
      title: docMeta.title,
      version: docMeta.version,
      effective_date: docMeta.effectiveDate,
      language: docMeta.language
    });

    console.log(`📄 Ingested "${docMeta.title}": ${extraction.pageCount} pages, ${chunks.length} chunks generated.`);

    // 4. Compute embeddings and save to document_chunks
    for (const chk of chunks) {
      const embedding = defaultVectorizer.embed(chk.content);
      chk.embedding = embedding;

      await run(`
        INSERT OR REPLACE INTO document_chunks (
          id, document_id, chunk_index, section_title, page_number,
          content, token_count, visibility, department_id, embedding_json, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        chk.id,
        chk.document_id,
        chk.chunk_index,
        chk.section_title,
        chk.page_number,
        chk.content,
        chk.token_count,
        chk.visibility,
        chk.department_id,
        JSON.stringify(embedding),
        JSON.stringify(chk.metadata)
      ]);
    }
  }

  // Refresh vector store
  await vectorStore.initialize();
  const vsStats = vectorStore.getStats();
  console.log(`✨ RAG VectorStore successfully initialized with ${vsStats.totalChunks} chunks across ${vsStats.totalDocuments} municipal documents!`);
}

if (require.main === module) {
  seedDocuments().catch(err => {
    console.error('Document seeding failed:', err);
    process.exit(1);
  });
}

module.exports = { seedDocuments };
