import React, { useState, useEffect } from 'react';
import { 
  Brain, UploadCloud, FileText, Search, Filter, Trash2, Eye, RefreshCw, ShieldCheck, Database, Layers, Sparkles, CheckCircle2, ChevronRight, Cpu 
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

export const KnowledgePortal = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocChunks, setSelectedDocChunks] = useState(null);
  const [chunkList, setChunkList] = useState([]);
  const [isChunkLoading, setIsChunkLoading] = useState(false);

  // Upload Form State
  const [uploadData, setUploadData] = useState({
    title: '',
    department: 'General Administration',
    document_type: 'SOP',
    version: '1.0',
    effective_date: new Date().toISOString().split('T')[0],
    language: 'English',
    visibility: 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
    raw_content: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Interactive RAG Tester
  const [testQuery, setTestQuery] = useState('');
  const [testRole, setTestRole] = useState(user?.role || 'CITIZEN');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDocuments({ search, department: deptFilter, document_type: typeFilter });
      setDocuments(data.documents || []);

      const statsRes = await api.getRAGStats();
      setStats(statsRes.stats || {});
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [deptFilter, typeFilter]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('department', uploadData.department);
      formData.append('document_type', uploadData.document_type);
      formData.append('version', uploadData.version);
      formData.append('effective_date', uploadData.effective_date);
      formData.append('language', uploadData.language);
      formData.append('visibility', uploadData.visibility);
      formData.append('raw_content', uploadData.raw_content);

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.uploadDocument(formData);
      alert('Document uploaded, chunked, and vector indexed successfully!');
      setIsUploadOpen(false);
      setUploadData({
        title: '',
        department: 'General Administration',
        document_type: 'SOP',
        version: '1.0',
        effective_date: new Date().toISOString().split('T')[0],
        language: 'English',
        visibility: 'CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN',
        raw_content: ''
      });
      setSelectedFile(null);
      loadDocuments();
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInspectChunks = async (doc) => {
    setSelectedDocChunks(doc);
    setIsChunkLoading(true);
    try {
      const res = await api.getDocumentChunks(doc.id);
      setChunkList(res.chunks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChunkLoading(false);
    }
  };

  const handleDeleteDocument = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" from the municipal knowledge base?`)) return;

    try {
      await api.deleteDocument(docId);
      loadDocuments();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleReindex = async () => {
    if (!window.confirm('Rebuild entire RAG Vector Store from database documents?')) return;
    try {
      const res = await api.rebuildRAGIndex();
      alert(`Re-indexing completed. Total active chunks in memory: ${res.totalChunks}`);
      loadDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRunRAGTest = async (e) => {
    e.preventDefault();
    if (!testQuery.trim() || isTesting) return;

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.queryRAG(testQuery.trim());
      setTestResult(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🧠 Centralized RAG & Knowledge Intelligence Hub</span>
            <span style={{ fontSize: '0.7rem', background: 'var(--civic-purple-light)', color: 'var(--civic-purple)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--civic-purple)' }}>
              MEMBER 5 CORE ENGINE
            </span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Authoritative municipal knowledge ingestion, 128-dim hybrid dense vector retrieval, RBAC permission filtering, and citation attribution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleReindex} title="Rebuild Vector Embeddings Index">
            <RefreshCw size={16} />
            <span>Re-Index Vectors</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
            <UploadCloud size={18} />
            <span>Ingest New Document</span>
          </button>
        </div>
      </div>

      {/* RAG Telemetry KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card purple">
          <span className="kpi-label">Knowledge Documents</span>
          <span className="kpi-value">{stats.totalDocuments || 0}</span>
          <span className="kpi-subtext">{stats.indexedDocuments || 0} Indexed & Active</span>
        </div>
        <div className="kpi-card teal">
          <span className="kpi-label">Vector Chunks in Store</span>
          <span className="kpi-value">{stats.totalChunks || 0}</span>
          <span className="kpi-subtext">{stats.vectorDimension || 128}-Dimensional Dense Vectors</span>
        </div>
        <div className="kpi-card green">
          <span className="kpi-label">Queries Answered</span>
          <span className="kpi-value">{stats.totalQueriesAnswered || 0}</span>
          <span className="kpi-subtext">Avg latency: {stats.averageLatencyMs || 8}ms</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Active RAG Engine</span>
          <span className="kpi-value" style={{ fontSize: '1.2rem', marginTop: '0.35rem' }}>
            Hybrid + RBAC
          </span>
          <span className="kpi-subtext">BM25 + Cosine Fusion (Zero Paid Key)</span>
        </div>
      </div>

      {/* Interactive RAG Engine Tester Sandbox */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-surface-subtle)', border: '1px solid var(--civic-purple-light)' }}>
        <div className="card-header">
          <div className="card-title">
            <Cpu size={20} color="var(--civic-purple)" />
            <span>Live Municipal RAG Query Playground & Citation Verifier</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            Tests end-to-end: Query → Vector Search → RBAC Filter → Rerank → LLM → Citations
          </span>
        </div>

        <form onSubmit={handleRunRAGTest}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Ask any statutory question (e.g. 'What is the SLA for pipeline bursts?' or 'What are the spot fines for illegal dumping?')"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isTesting || !testQuery.trim()}>
              <Sparkles size={16} />
              <span>{isTesting ? 'Retrieving...' : 'Run RAG Query'}</span>
            </button>
          </div>
        </form>

        {/* Test Result Display */}
        {testResult && (
          <div style={{
            marginTop: '1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gov-primary)' }}>
                Generated Answer ({testResult.metadata?.executionTimeMs}ms • {testResult.metadata?.provider})
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {testResult.sources?.length || 0} Authorized Citations
              </span>
            </div>

            <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-line', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              {testResult.answer}
            </p>

            {testResult.sources && testResult.sources.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                {testResult.sources.map((s, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-app)', borderLeft: '3px solid var(--civic-teal)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--gov-primary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📄 {s.documentTitle}</span>
                      <span style={{ color: 'var(--civic-teal)' }}>{s.relevanceScore}</span>
                    </div>
                    <div style={{ color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                      Section: {s.section} • Page {s.page}
                    </div>
                    <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      "{s.snippet}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search knowledge documents by title or document code..."
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select className="form-control" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              <option value="General Administration">General Administration</option>
              <option value="Water Supply">Water Supply & Sewerage</option>
              <option value="Sanitation">Sanitation & Solid Waste</option>
              <option value="All Departments">All Departments</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="Citizen Charter">Citizen Charter</option>
              <option value="SOP">SOP</option>
              <option value="Safety Manual">Safety Manual</option>
              <option value="Bylaw">Bylaw</option>
              <option value="Policy">Policy</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={loadDocuments}>
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Document Library Table */}
      <div className="table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Document Code</th>
              <th>Document Title & Type</th>
              <th>Department</th>
              <th>Version</th>
              <th>RBAC Visibility Scope</th>
              <th>Chunks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading municipal knowledge documents...</td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  No documents found matching the search criteria.
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-primary)' }}>
                      {doc.document_id}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{doc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Type: <strong>{doc.document_type}</strong></div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{doc.department}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>v{doc.version}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                      {doc.visibility.includes('CITIZEN') ? (
                        <span style={{ color: 'var(--civic-green)', fontWeight: 700 }}>🌍 Public / Citizen Accessible</span>
                      ) : (
                        <span style={{ color: 'var(--civic-amber)', fontWeight: 700 }}>🔒 Internal ({doc.visibility.split(',').slice(0, 2).join(', ')}...)</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      background: 'var(--gov-primary-light)',
                      color: 'var(--gov-primary)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      {doc.total_chunks || 0} Chunks
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-resolved">
                      <CheckCircle2 size={12} /> {doc.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleInspectChunks(doc)}
                        title="Inspect Chunks & Dense Vectors"
                      >
                        <Layers size={13} />
                        <span>Inspect</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        title="Delete Document"
                        style={{ color: 'var(--civic-red)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DOCUMENT INGESTION MODAL */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Ingest New Document into Municipal RAG Pipeline"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUploadSubmit} disabled={isUploading}>
              {isUploading ? 'Extracting, Chunking & Embedding...' : 'Start Ingestion Pipeline'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit}>
          <div className="form-group">
            <label className="form-label">Document Title *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Standard Operating Procedure for Street Light LED Replacement"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-control"
                value={uploadData.department}
                onChange={(e) => setUploadData({ ...uploadData, department: e.target.value })}
              >
                <option value="General Administration">General Administration</option>
                <option value="Water Supply & Sewerage">Water Supply & Sewerage</option>
                <option value="Sanitation & Solid Waste">Sanitation & Solid Waste</option>
                <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                <option value="Street Lighting & Electrical">Street Lighting & Electrical</option>
                <option value="All Departments">All Departments</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select
                className="form-control"
                value={uploadData.document_type}
                onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
              >
                <option value="SOP">Standard Operating Procedure (SOP)</option>
                <option value="Citizen Charter">Citizen Charter</option>
                <option value="Safety Manual">Safety Manual</option>
                <option value="Bylaw">Bylaw</option>
                <option value="Policy">Administrative Policy</option>
                <option value="FAQ">Public FAQ</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Document Version</label>
              <input
                type="text"
                className="form-control"
                placeholder="1.0"
                value={uploadData.version}
                onChange={(e) => setUploadData({ ...uploadData, version: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">RBAC Access Scope</label>
              <select
                className="form-control"
                value={uploadData.visibility}
                onChange={(e) => setUploadData({ ...uploadData, visibility: e.target.value })}
              >
                <option value="CITIZEN,OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN">
                  🌍 Public (Citizen, Officer, Field, Admin)
                </option>
                <option value="OFFICER,FIELD_STAFF,MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN">
                  🛡️ Internal Operations (Officer & Field Staff)
                </option>
                <option value="MUNICIPAL_ADMIN,COMMISSIONER,KNOWLEDGE_ADMIN,SUPER_ADMIN">
                  🔒 Confidential Admin (Admins & Commissioner Only)
                </option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Upload Document File (PDF, DOCX, TXT, MD)</label>
            <input
              type="file"
              className="form-control"
              accept=".pdf,.docx,.doc,.txt,.md,.json"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Or Paste Text / Markdown Content Directly</label>
            <textarea
              className="form-control"
              placeholder="Paste official municipal policy text, section clauses, and guidelines here..."
              value={uploadData.raw_content}
              onChange={(e) => setUploadData({ ...uploadData, raw_content: e.target.value })}
              style={{ minHeight: '120px' }}
            />
          </div>
        </form>
      </Modal>

      {/* CHUNK & VECTOR INSPECTOR MODAL */}
      <Modal
        isOpen={!!selectedDocChunks}
        onClose={() => { setSelectedDocChunks(null); setChunkList([]); }}
        title={selectedDocChunks ? `Semantic Chunk Inspector: ${selectedDocChunks.title}` : ''}
      >
        {isChunkLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading vector chunks from store...</div>
        ) : (
          <div>
            <div style={{
              background: 'var(--bg-surface-subtle)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Total Chunks Generated: {chunkList.length}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                Vector Model: 128-dim Normalized Dense
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '500px', overflowY: 'auto' }}>
              {chunkList.map((chk, idx) => (
                <div key={chk.id || idx} style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  background: 'var(--bg-surface)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--gov-primary)',
                    marginBottom: '0.35rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.3rem'
                  }}>
                    <span>Chunk #{chk.chunk_index} ({chk.chunk_id})</span>
                    <span>Section: {chk.section || 'General'} • Page {chk.page_number} • {chk.token_count} Tokens</span>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                    {chk.content}
                  </p>

                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>Visibility Scope: <code>{chk.visibility}</code></span>
                    <span>Vector: 128 float values indexed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
