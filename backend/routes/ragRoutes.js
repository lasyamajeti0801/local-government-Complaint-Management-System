/**
 * Nagar Connect - Central RAG & Knowledge Intelligence Routes (Member 5 Core)
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query: dbQuery, get: dbGet, run: dbRun } = require('../../database/db');
const { optionalAuth, authenticateToken, requireRole } = require('../middleware/auth');
const { ragPipeline } = require('../../rag');
const { logAudit } = require('../middleware/audit');

// Configure Multer for document uploads
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'DOC-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.docx', '.doc', '.txt', '.md', '.json', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Supported formats: PDF, DOCX, TXT, MD, JSON`));
    }
  }
});

// POST /api/rag/query - Universal RAG Assistant Query Endpoint for ALL Portals
router.post('/query', optionalAuth, async (req, res) => {
  try {
    const { queryText, departmentFilter, topK = 4 } = req.body;

    if (!queryText || queryText.trim().length === 0) {
      return res.status(400).json({ error: 'Query text is required.' });
    }

    const userRole = req.user?.role || 'CITIZEN';
    const userId = req.user?.id || null;

    const ragResult = await ragPipeline.queryRAG({
      queryText: queryText.trim(),
      userRole,
      userId,
      departmentFilter: departmentFilter || null,
      topK: parseInt(topK, 10) || 4
    });

    res.json(ragResult);
  } catch (err) {
    console.error('RAG Query Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rag/stats - Telemetry & Index Health
router.get('/stats', async (req, res) => {
  try {
    const stats = await ragPipeline.getStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rag/recent-queries - Query audit history
router.get('/recent-queries', authenticateToken, async (req, res) => {
  try {
    const queries = await dbQuery(`
      SELECT q.*, u.name as user_name
      FROM rag_queries q
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
      LIMIT 25
    `);
    res.json({ queries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents - List all knowledge base documents
router.get('/documents', optionalAuth, async (req, res) => {
  try {
    const { search, department, document_type } = req.query;
    let sql = 'SELECT * FROM documents WHERE status != "ARCHIVED"';
    const params = [];

    if (department && department !== 'ALL') {
      sql += ' AND (department = ? OR department = "ALL" OR department = "All Departments")';
      params.push(department);
    }

    if (document_type) {
      sql += ' AND document_type = ?';
      params.push(document_type);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR document_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const docs = await dbQuery(sql, params);
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id - Single document metadata and versions
router.get('/documents/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await dbGet('SELECT * FROM documents WHERE id = ? OR document_id = ?', [id, id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const versions = await dbQuery('SELECT * FROM document_versions WHERE document_id = ? ORDER BY created_at DESC', [doc.id]);
    const chunkStats = await dbGet('SELECT COUNT(*) as chunkCount, SUM(token_count) as totalTokens FROM document_chunks WHERE document_id = ?', [doc.id]);

    res.json({
      document: doc,
      versions,
      chunkCount: chunkStats?.chunkCount || 0,
      totalTokens: chunkStats?.totalTokens || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/chunks - Inspect chunks & vector embeddings
router.get('/documents/:id/chunks', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await dbGet('SELECT * FROM documents WHERE id = ? OR document_id = ?', [id, id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const chunks = await dbQuery(`
      SELECT id, chunk_id, document_id, chunk_index, content, token_count, page_number, section, visibility
      FROM document_chunks
      WHERE document_id = ?
      ORDER BY chunk_index ASC
    `, [doc.id]);

    res.json({ document: doc, chunks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/upload - Upload & Ingest New Document into RAG
router.post('/documents/upload', authenticateToken, requireRole(['KNOWLEDGE_ADMIN', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN']), upload.single('file'), async (req, res) => {
  try {
    const {
      title,
      department = 'General Administration',
      document_type = 'SOP',
      version = '1.0',
      effective_date = new Date().toISOString().split('T')[0],
      language = 'English',
      visibility = 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
      raw_content
    } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Document title is required.' });
    }

    const file = req.file;
    if (!file && (!raw_content || raw_content.trim().length === 0)) {
      return res.status(400).json({ error: 'Please upload a document file or provide raw text content.' });
    }

    const countRes = await dbGet('SELECT COUNT(*) as count FROM documents');
    const docSeq = (countRes?.count || 0) + 1;
    const documentCode = `DOC-GHMC-2026-${String(docSeq).padStart(3, '0')}`;
    const docId = `DOC_${Date.now()}`;

    const ingestResult = await ragPipeline.ingestDocument({
      id: docId,
      document_id: documentCode,
      title: title.trim(),
      department,
      document_type,
      version,
      effective_date,
      language,
      uploaded_by: req.user.id,
      visibility,
      file_path: file ? file.path : null,
      file_type: file ? path.extname(file.originalname).replace('.', '') : 'txt',
      file_size: file ? file.size : Buffer.byteLength(raw_content || '', 'utf8'),
      raw_text: raw_content || null
    });

    await logAudit(req.user.id, req.user.role, 'DOCUMENT_UPLOAD_INGEST', 'DOCUMENT', docId, {
      title,
      code: documentCode,
      chunks: ingestResult.totalChunks
    }, req.ip);

    res.status(201).json({
      message: `Document "${title}" ingested and indexed into RAG pipeline successfully!`,
      document: ingestResult
    });
  } catch (err) {
    console.error('Document upload ingestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id - Delete document & chunks
router.delete('/documents/:id', authenticateToken, requireRole(['KNOWLEDGE_ADMIN', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await dbGet('SELECT * FROM documents WHERE id = ? OR document_id = ?', [id, id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await ragPipeline.deleteDocument(doc.id);
    await logAudit(req.user.id, req.user.role, 'DOCUMENT_DELETE', 'DOCUMENT', doc.id, { title: doc.title }, req.ip);

    res.json({ message: `Document "${doc.title}" deleted from knowledge base.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rag/reindex - Force full rebuild of vector store
router.post('/reindex', authenticateToken, requireRole(['KNOWLEDGE_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const totalChunks = await ragPipeline.indexAllDatabaseDocuments();
    res.json({ message: 'RAG Vector Index rebuilt successfully', totalChunks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
