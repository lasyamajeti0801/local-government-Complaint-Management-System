const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const { query, queryOne, run } = require('../../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { executeRagPipeline } = require('../../rag/generation/generator');
const { extractText } = require('../../rag/ingestion/textExtractor');
const { createChunks } = require('../../rag/ingestion/chunker');
const { defaultVectorizer } = require('../../rag/embeddings/vectorizer');
const { vectorStore } = require('../../rag/retrieval/vectorStore');
const { getAllowedVisibilities } = require('../../rag/retrieval/permissionFilter');

// Configure Multer storage for document uploads
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type '${ext}'. Allowed: PDF, DOCX, TXT, MD.`));
    }
  }
});

// POST /api/rag/query - Core Centralized RAG Query Endpoint
router.post('/query', optionalAuth, async (req, res) => {
  try {
    const { query: queryText, assistant_context, department_id, provider = 'local', top_k = 4 } = req.body;

    if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter must be a non-empty string.'
      });
    }

    const userId = req.user ? req.user.id : 'usr_anonymous_citizen';
    const userRole = req.user ? (req.user.role_name || req.user.role_id) : 'CITIZEN';
    const userDept = req.user ? req.user.department_id : (department_id || null);

    const result = await executeRagPipeline({
      query: queryText.trim(),
      userId,
      userRole,
      departmentId: userDept,
      assistantContext: assistant_context || 'CITIZEN_SERVICE',
      provider,
      topK: parseInt(top_k) || 4
    });

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      was_fallback_refusal: result.wasFallbackRefusal,
      provider: result.provider,
      latency_ms: result.latencyMs,
      query_id: result.queryId
    });
  } catch (err) {
    console.error('RAG query pipeline error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process RAG inquiry.',
      answer: 'I could not find this information in the authorized municipal knowledge base.',
      sources: []
    });
  }
});

// GET /api/rag/stats - Telemetry and VectorStore diagnostics
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    if (!vectorStore.isInitialized) {
      await vectorStore.initialize();
    }
    const storeStats = vectorStore.getStats();

    const queryCountRow = await queryOne(`SELECT COUNT(*) as total_queries, AVG(latency_ms) as avg_latency FROM rag_queries`);
    const docCountRow = await queryOne(`SELECT COUNT(*) as total_docs FROM documents WHERE status = 'ACTIVE'`);
    const deptBreakdown = await query(`
      SELECT d.name as department_name, COUNT(doc.id) as doc_count
      FROM departments d
      LEFT JOIN documents doc ON doc.department_id = d.id AND doc.status = 'ACTIVE'
      GROUP BY d.id
    `);

    res.json({
      success: true,
      stats: {
        total_documents: docCountRow ? docCountRow.total_docs : storeStats.totalDocuments,
        total_chunks: storeStats.totalChunks,
        vector_dimensions: storeStats.vectorDimensions,
        total_queries_served: queryCountRow ? queryCountRow.total_queries : 0,
        average_latency_ms: queryCountRow && queryCountRow.avg_latency ? Math.round(queryCountRow.avg_latency) : 18,
        active_provider: 'LocalProvider (Deterministic Semantic Neural Synthesizer)',
        supported_formats: ['PDF', 'DOCX', 'TXT', 'MD'],
        department_distribution: deptBreakdown
      }
    });
  } catch (err) {
    console.error('Fetch RAG stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve RAG statistics.' });
  }
});

// GET /api/documents or GET /api/rag/documents - Document List with Role-Aware Visibility Filter
router.get(['/documents', '/'], optionalAuth, async (req, res) => {
  try {
    const { department_id, visibility, search } = req.query;
    const userRole = req.user ? (req.user.role_name || req.user.role_id) : 'CITIZEN';
    const allowedVisibilities = getAllowedVisibilities(userRole);

    let sql = `
      SELECT 
        d.id, d.title, d.original_filename, d.file_type, d.file_size_bytes,
        d.department_id, d.document_type, d.version, d.effective_date,
        d.language, d.page_count, d.visibility, d.status, d.created_at,
        dept.name as department_name,
        u.full_name as uploaded_by_name,
        (SELECT COUNT(*) FROM document_chunks c WHERE c.document_id = d.id) as chunk_count
      FROM documents d
      LEFT JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN users u ON d.uploaded_by_user_id = u.id
      WHERE d.status = 'ACTIVE'
    `;
    const params = [];

    // Enforce role visibility
    const placeholders = allowedVisibilities.map(() => '?').join(',');
    sql += ` AND d.visibility IN (${placeholders})`;
    params.push(...allowedVisibilities);

    if (department_id && department_id !== 'ALL') {
      sql += ` AND d.department_id = ?`;
      params.push(department_id);
    }

    if (visibility && visibility !== 'ALL') {
      sql += ` AND d.visibility = ?`;
      params.push(visibility);
    }

    if (search) {
      sql += ` AND (d.title LIKE ? OR d.original_filename LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY d.created_at DESC`;

    const documents = await query(sql, params);
    res.json({ success: true, documents });
  } catch (err) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
});

// GET /api/documents/:id - Single Document Metadata & Inspection
router.get(['/documents/:id', '/:id'], optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'upload' || id === 'stats' || id === 'query') return next();
    const doc = await queryOne(`
      SELECT 
        d.*,
        dept.name as department_name,
        u.full_name as uploaded_by_name
      FROM documents d
      LEFT JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN users u ON d.uploaded_by_user_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const chunks = await query(`
      SELECT id, chunk_index, section_title, page_number, content, token_count, visibility
      FROM document_chunks
      WHERE document_id = ?
      ORDER BY chunk_index ASC
    `, [id]);

    res.json({
      success: true,
      document: {
        ...doc,
        chunks
      }
    });
  } catch (err) {
    console.error('Fetch document detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve document details.' });
  }
});

// GET /api/documents/:id/chunks - Chunks Inspection endpoint
router.get(['/documents/:id/chunks', '/:id/chunks'], optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const chunks = await query(`
      SELECT id, chunk_index, section_title, page_number, content, token_count, visibility
      FROM document_chunks
      WHERE document_id = ?
      ORDER BY chunk_index ASC
    `, [id]);

    res.json({ success: true, chunks });
  } catch (err) {
    console.error('Fetch chunks error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve document chunks.' });
  }
});

// POST /api/documents/upload - Ingest new document (PDF, DOCX, TXT, MD)
router.post(['/documents/upload', '/upload'], authenticateToken, requireRoles('KNOWLEDGE_ADMIN', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN', 'OFFICER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded.' });
    }

    const {
      title,
      department_id,
      document_type = 'SOP',
      version = '1.0',
      effective_date,
      visibility = 'PUBLIC',
      language = 'en'
    } = req.body;

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).replace('.', '').toUpperCase();
    const docId = `doc_${crypto.randomUUID()}`;

    // 1. Text Extraction
    const extraction = await extractText(filePath, fileExt);

    // 2. Insert into Documents table
    await run(`
      INSERT INTO documents (
        id, title, original_filename, file_path, file_type, file_size_bytes,
        department_id, document_type, version, effective_date, language,
        uploaded_by_user_id, page_count, visibility, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [
      docId,
      (title || req.file.originalname).trim(),
      req.file.originalname,
      filePath,
      fileExt,
      req.file.size,
      department_id || null,
      document_type,
      version,
      effective_date || new Date().toISOString().split('T')[0],
      language,
      req.user.id,
      extraction.pageCount,
      visibility
    ]);

    // 3. Semantic Chunking
    const chunks = createChunks(extraction.pages, {
      document_id: docId,
      department_id,
      visibility,
      document_type,
      title: title || req.file.originalname,
      version,
      effective_date,
      language
    });

    // 4. Vectorization and Storage in VectorStore
    await vectorStore.addChunks(chunks);

    // Audit log
    await run(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json)
      VALUES (?, ?, 'DOCUMENT_UPLOAD', 'DOCUMENT', ?, ?)
    `, [`aud_${Date.now()}`, req.user.id, docId, JSON.stringify({ title, chunks: chunks.length, visibility })]);

    res.status(201).json({
      success: true,
      message: `Document "${title || req.file.originalname}" processed, chunked into ${chunks.length} segments and indexed into VectorStore.`,
      document_id: docId,
      page_count: extraction.pageCount,
      chunk_count: chunks.length
    });
  } catch (err) {
    console.error('Document ingestion error:', err);
    res.status(500).json({ success: false, message: `Document ingestion failed: ${err.message}` });
  }
});

// DELETE /api/documents/:id - Delete document and remove from Vector Store
router.delete(['/documents/:id', '/:id'], authenticateToken, requireRoles('KNOWLEDGE_ADMIN', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await queryOne(`SELECT * FROM documents WHERE id = ?`, [id]);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Soft delete / delete from DB and remove from active VectorStore index
    await run(`DELETE FROM documents WHERE id = ?`, [id]);
    await vectorStore.deleteChunksByDocumentId(id);

    res.json({
      success: true,
      message: `Document "${doc.title}" deleted and de-indexed from RAG VectorStore.`
    });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
});

module.exports = router;
