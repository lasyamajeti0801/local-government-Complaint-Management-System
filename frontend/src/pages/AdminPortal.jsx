import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Bell, FileText, CheckCircle2, AlertCircle, PlusCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

export const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Notice form
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePrio, setNoticePrio] = useState('NORMAL');

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [uRes, aRes, nRes] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs(),
        api.getNotices()
      ]);
      setUsers(uRes.users || []);
      setAuditLogs(aRes.auditLogs || []);
      setNotices(nRes.notices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nagar_token')}`
        },
        body: JSON.stringify({ title: noticeTitle, content: noticeContent, priority: noticePrio })
      });
      alert('Municipal public notice published successfully!');
      setIsNoticeOpen(false);
      setNoticeTitle('');
      setNoticeContent('');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
            ⚙️ Super Administration & System Governance
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage municipal accounts, review chronological audit logs, and broadcast public civic bulletins.
          </p>
        </div>

        {activeTab === 'notices' && (
          <button className="btn btn-primary" onClick={() => setIsNoticeOpen(true)}>
            <PlusCircle size={16} />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={14} />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('audit')}
        >
          <Shield size={14} />
          <span>System Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'notices' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('notices')}
        >
          <Bell size={14} />
          <span>Municipal Notices ({notices.length})</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>User Name & Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Ward / Zone</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      background: 'var(--gov-primary-light)',
                      color: 'var(--gov-primary)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem' }}>{u.department_name || 'All Municipal Wards'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem' }}>{u.ward_number || 'HQ'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{u.phone || 'N/A'}</span>
                  </td>
                  <td>
                    <span className="badge badge-resolved">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor User</th>
                <th>Entity Type & ID</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(a => (
                <tr key={a.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    {new Date(a.created_at).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--gov-primary)' }}>{a.action}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem' }}>{a.user_name || a.user_id} ({a.user_role})</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      {a.entity_type} {a.entity_id ? `(${a.entity_id})` : ''}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {a.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: NOTICES */}
      {activeTab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notices.map(n => (
            <div key={n.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {n.title}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  Published: {new Date(n.published_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {n.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* PUBLISH NOTICE MODAL */}
      <Modal
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        title="Broadcast Official Municipal Notice"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsNoticeOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePublishNotice}>Publish Bulletin</button>
          </>
        }
      >
        <form onSubmit={handlePublishNotice}>
          <div className="form-group">
            <label className="form-label">Bulletin Title *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. 🚨 Pre-Monsoon Drainage Cleaning & Desilting Drive"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notice Message *</label>
            <textarea
              className="form-control"
              required
              placeholder="Enter public civic notification text for citizens..."
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              style={{ minHeight: '100px' }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
