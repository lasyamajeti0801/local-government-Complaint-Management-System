import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Upload,
  Search,
  Filter,
  FileText,
  Eye,
  Trash2,
  Layers,
  Cpu,
  Clock
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  Drawer,
  SearchBar,
  VisibilityBadge,
  LoadingSkeleton,
  EmptyState
} from '../components/common/UIComponents';
import { RAGChatPanel } from '../components/rag/RAGChatPanel';
import { useLanguage } from '../context/LanguageContext';

export function KnowledgePortal({ currentUser }) {
  const { t, lang } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState('ALL');

  // Modals & Drawers
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocForChunks, setSelectedDocForChunks] = useState(null);
  const [docChunks, setDocChunks] = useState([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDept, setUploadDept] = useState('DEPT_ADMIN');
  const [uploadDocType, setUploadDocType] = useState('SOP');
  const [uploadVersion, setUploadVersion] = useState('2026.1');
  const [uploadVisibility, setUploadVisibility] = useState('PUBLIC');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  const userRole = (currentUser?.role_name || currentUser?.role_id || 'CITIZEN').replace('ROLE_', '');
  const canUpload = ['KNOWLEDGE_ADMIN', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN', 'OFFICER'].includes(userRole);

  useEffect(() => {
    fetchData();
  }, [selectedDept, selectedVisibility, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Fetch Stats
      const statsRes = await fetch('/api/rag/stats', { headers });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // 2. Fetch Departments
      const deptRes = await fetch('/api/departments', { headers });
      const deptData = await deptRes.json();
      if (deptData.success) setDepartments(deptData.departments || []);

      // 3. Fetch Documents
      let url = `/api/documents?department_id=${selectedDept}&visibility=${selectedVisibility}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const docRes = await fetch(url, { headers });
      const docData = await docRes.json();
      if (docData.success) setDocuments(docData.documents || []);
    } catch (err) {
      console.error('Error loading knowledge portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectChunks = async (doc) => {
    setSelectedDocForChunks(doc);
    setIsLoadingChunks(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/documents/${doc.id}/chunks`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setDocChunks(data.chunks || []);
      }
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const handleDeleteDocument = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete and de-index "${title}" from the RAG knowledge base?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a document file to upload (PDF, DOCX, TXT, MD).');
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle || uploadFile.name);
    formData.append('department_id', uploadDept);
    formData.append('document_type', uploadDocType);
    formData.append('version', uploadVersion);
    formData.append('visibility', uploadVisibility);

    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadFeedback({ type: 'success', text: data.message });
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setUploadTitle('');
          setUploadFeedback(null);
          fetchData();
        }, 1200);
      } else {
        setUploadFeedback({ type: 'error', text: data.message });
      }
    } catch (err) {
      setUploadFeedback({ type: 'error', text: 'Upload failed: ' + err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {/* Page Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-gov)' }}>
              {t('knowledgeTitle')}
            </h2>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--civic-teal-light)', color: 'var(--civic-teal)', fontWeight: 700 }}>
              MEMBER 5 ENGINE
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {t('knowledgeSub')}
          </p>
        </div>

        {canUpload && (
          <Button variant="teal" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> {t('ingestDocBtn')}
          </Button>
        )}
      </div>

      {/* RAG Telemetry Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon-box">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="metric-value">{stats ? stats.total_documents : '--'}</div>
            <div className="metric-label">{t('metricDocs')}</div>
          </div>
        </div>

        <div className="metric-card teal">
          <div className="metric-icon-box">
            <Layers size={22} />
          </div>
          <div>
            <div className="metric-value">{stats ? stats.total_chunks : '--'}</div>
            <div className="metric-label">{t('metricChunks')}</div>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-icon-box">
            <Cpu size={22} />
          </div>
          <div>
            <div className="metric-value">{stats ? `${stats.vector_dimensions}-D` : '128-D'}</div>
            <div className="metric-label">{t('metricVector')}</div>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon-box">
            <Clock size={22} />
          </div>
          <div>
            <div className="metric-value">{stats ? `${stats.average_latency_ms} ms` : '<20 ms'}</div>
            <div className="metric-label">{t('metricLatency')}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Document Inventory (Left) and Live RAG Assistant (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Left Column: Document Inventory */}
        <Card
          title={t('repoTitle')}
          subtitle={t('repoSub')}
        >
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('searchDocsPlaceholder')}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 170 }}
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="ALL">{t('allDepts')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 150 }}
              value={selectedVisibility}
              onChange={e => setSelectedVisibility(e.target.value)}
            >
              <option value="ALL">{t('allVisibilities')}</option>
              <option value="PUBLIC">Public</option>
              <option value="INTERNAL_OFFICER">Internal Officer</option>
              <option value="FIELD_STAFF">Field Staff</option>
              <option value="ADMIN_ONLY">Admin Only</option>
            </select>
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : documents.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t('noDocsFound')}
              message=""
            />
          ) : (
            <div className="table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>{t('colTitle')}</th>
                    <th>{t('colTypeDept')}</th>
                    <th>{t('colVisibility')}</th>
                    <th>{t('colPagesChunks')}</th>
                    <th style={{ textAlign: 'right' }}>{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          File: {doc.original_filename} ({doc.file_type}) • v{doc.version}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{doc.document_type}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {doc.department_name || 'General Municipal'}
                        </div>
                      </td>
                      <td>
                        <VisibilityBadge visibility={doc.visibility} />
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>{doc.page_count} {lang === 'te' ? 'పేజీలు' : 'Pages'}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--civic-teal)', fontWeight: 600 }}>
                          {doc.chunk_count} {lang === 'te' ? 'భాగాలు' : 'Chunks'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            title="Inspect Chunks and Vectors"
                            onClick={() => handleInspectChunks(doc)}
                          >
                            <Eye size={14} /> {t('btnChunks')}
                          </Button>
                          {canUpload && (
                            <Button
                              variant="danger"
                              size="sm"
                              title="Delete from RAG"
                              onClick={() => handleDeleteDocument(doc.id, doc.title)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right Column: Live Interactive RAG Assistant */}
        <div style={{ height: '720px' }}>
          <RAGChatPanel currentUser={currentUser} />
        </div>
      </div>

      {/* Chunks Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedDocForChunks)}
        onClose={() => setSelectedDocForChunks(null)}
        title={`Semantic Chunks: ${selectedDocForChunks?.title || ''}`}
        width="620px"
      >
        {selectedDocForChunks && (
          <div>
            <div style={{
              padding: 12,
              backgroundColor: 'var(--bg-surface-alt)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 16,
              fontSize: '0.8rem'
            }}>
              <div><strong>Document ID:</strong> {selectedDocForChunks.id}</div>
              <div><strong>Format:</strong> {selectedDocForChunks.file_type} | <strong>Visibility:</strong> {selectedDocForChunks.visibility}</div>
              <div><strong>Pages:</strong> {selectedDocForChunks.page_count} | <strong>Total Chunks:</strong> {docChunks.length}</div>
            </div>

            {isLoadingChunks ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {docChunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 12,
                      backgroundColor: 'var(--bg-surface)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border-light)',
                      paddingBottom: 6,
                      marginBottom: 8,
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--civic-teal)' }}>
                        Chunk #{chunk.chunk_index + 1} • Page {chunk.page_number}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        ~{chunk.token_count} tokens
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                      Section: {chunk.section_title || 'General'}
                    </div>

                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: 'var(--bg-surface-alt)',
                      padding: 8,
                      borderRadius: 3
                    }}>
                      {chunk.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={t('ingestDocBtn')}
        maxWidth="600px"
      >
        <form onSubmit={handleUploadSubmit}>
          <div className="form-group">
            <label className="form-label">{lang === 'te' ? 'పత్రం ఫైల్‌ను ఎంచుకోండి (PDF, DOCX, TXT, MD)' : 'Select Document File (PDF, DOCX, TXT, MD)'}</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="form-input"
              onChange={e => {
                const file = e.target.files[0];
                setUploadFile(file);
                if (file && !uploadTitle) {
                  setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                }
              }}
              required
            />
          </div>

          <Input
            label={t('colTitle')}
            value={uploadTitle}
            onChange={e => setUploadTitle(e.target.value)}
            placeholder="e.g. Standard Operating Procedure for Monsoon Desilting"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">{lang === 'te' ? 'విభాగం' : 'Department'}</label>
              <select
                className="form-select"
                value={uploadDept}
                onChange={e => setUploadDept(e.target.value)}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{lang === 'te' ? 'పత్రం రకం' : 'Document Type'}</label>
              <select
                className="form-select"
                value={uploadDocType}
                onChange={e => setUploadDocType(e.target.value)}
              >
                <option value="SOP">Standard Operating Procedure (SOP)</option>
                <option value="BYLAW">Municipal Bylaw</option>
                <option value="SLA_POLICY">SLA Policy</option>
                <option value="CITIZEN_CHARTER">Citizen Charter</option>
                <option value="FIELD_SOP">Field SOP & Safety</option>
                <option value="CIRCULAR">Administrative Circular</option>
                <option value="MANUAL">Engineering Manual</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label={lang === 'te' ? 'వెర్షన్' : 'Version'}
              value={uploadVersion}
              onChange={e => setUploadVersion(e.target.value)}
              placeholder="e.g. 2026.1"
            />

            <div className="form-group">
              <label className="form-label">{t('colVisibility')}</label>
              <select
                className="form-select"
                value={uploadVisibility}
                onChange={e => setUploadVisibility(e.target.value)}
              >
                <option value="PUBLIC">PUBLIC (All Citizens & Officers)</option>
                <option value="INTERNAL_OFFICER">INTERNAL_OFFICER (Officers & Admins)</option>
                <option value="FIELD_STAFF">FIELD_STAFF (Field Engineers & Ground Crew)</option>
                <option value="ADMIN_ONLY">ADMIN_ONLY (Commissioners & Directors)</option>
              </select>
            </div>
          </div>

          {uploadFeedback && (
            <div style={{
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              marginBottom: 12,
              fontSize: '0.85rem',
              backgroundColor: uploadFeedback.type === 'success' ? 'var(--gov-green-light)' : 'var(--gov-red-light)',
              color: uploadFeedback.type === 'success' ? 'var(--gov-green)' : 'var(--gov-red)'
            }}>
              {uploadFeedback.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)} disabled={isUploading}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="teal" disabled={isUploading}>
              {isUploading ? (lang === 'te' ? 'ఇండెక్స్ చేయబడుతోంది...' : 'Extracting & Indexing...') : (lang === 'te' ? 'అప్‌లోడ్ చేయండి' : 'Upload & Ingest')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
