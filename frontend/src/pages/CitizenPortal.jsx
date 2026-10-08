import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Search, Filter, Eye, Star, AlertTriangle, CheckCircle2, Clock, MapPin, Image, MessageSquare, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Timeline } from '../components/Timeline';
import { Modal } from '../components/Modal';

export const CitizenPortal = ({ user, language }) => {
  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState({ total: 0, openCount: 0, resolvedCount: 0, pendingVerification: 0 });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    category_id: '',
    location_address: '',
    landmark: '',
    ward_number: user?.ward_number || 'Ward 42 (Jubilee Hills)',
    priority: 'MEDIUM',
    evidence_photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600'
  });

  // Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [newComment, setNewComment] = useState('');

  const loadComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await api.getComplaints({ search, status: statusFilter });
      setComplaints(data.complaints || []);
      setMeta(data.meta || {});
    } catch (err) {
      console.error('Error loading citizen complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const deptRes = await api.getDepartments();
      setDepartments(deptRes.departments || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadComplaints();
    loadMetadata();
  }, [statusFilter]);

  const handleDeptChange = async (deptId) => {
    setFormData(prev => ({ ...prev, department_id: deptId, category_id: '' }));
    if (deptId) {
      const catRes = await api.getCategories(deptId);
      setCategories(catRes.categories || []);
    } else {
      setCategories([]);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createComplaint(formData);
      setIsCreateOpen(false);
      setFormData({
        title: '',
        description: '',
        department_id: '',
        category_id: '',
        location_address: '',
        landmark: '',
        ward_number: user?.ward_number || 'Ward 42 (Jubilee Hills)',
        priority: 'MEDIUM',
        evidence_photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600'
      });
      loadComplaints();
    } catch (err) {
      alert(`Error submitting grievance: ${err.message}`);
    }
  };

  const handleViewDetails = async (cmpId) => {
    setSelectedComplaint(cmpId);
    setIsDetailLoading(true);
    try {
      const data = await api.getComplaintById(cmpId);
      setDetailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSubmitFeedback = async (reopen = false) => {
    if (!detailData?.complaint?.id) return;
    try {
      await api.submitFeedback(detailData.complaint.id, {
        rating,
        comments: feedbackComment,
        reopen_requested: reopen
      });
      alert(reopen ? 'Complaint reopened for further review.' : 'Thank you for your valuable feedback!');
      handleViewDetails(detailData.complaint.id);
      loadComplaints();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !detailData?.complaint?.id) return;
    try {
      await api.addComment(detailData.complaint.id, newComment, false);
      setNewComment('');
      handleViewDetails(detailData.complaint.id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
            🏛️ Citizen Grievance Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Lodge, track, and verify civic complaints with guaranteed statutory SLA timelines.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <PlusCircle size={18} />
          <span>Lodge New Grievance</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">My Total Grievances</span>
          <span className="kpi-value">{meta.total}</span>
          <span className="kpi-subtext">Registered under your account</span>
        </div>
        <div className="kpi-card teal">
          <span className="kpi-label">Active / In Progress</span>
          <span className="kpi-value">{meta.openCount}</span>
          <span className="kpi-subtext">Field crew deployed</span>
        </div>
        <div className="kpi-card green">
          <span className="kpi-label">Resolved & Closed</span>
          <span className="kpi-value">{meta.resolvedCount}</span>
          <span className="kpi-subtext">Successfully rectified</span>
        </div>
        <div className="kpi-card amber">
          <span className="kpi-label">Pending Verification</span>
          <span className="kpi-value">{meta.pendingVerification}</span>
          <span className="kpi-subtext">Awaiting your rating</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Complaint ID (e.g. NGC-2026-000001) or Title..."
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadComplaints()}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLUTION_SUBMITTED">Resolution Submitted</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={loadComplaints}>
            <Filter size={16} />
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Title & Category</th>
              <th>Department</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading municipal grievance records...
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    No grievances found matching the current filters.
                  </div>
                </td>
              </tr>
            ) : (
              complaints.map(cmp => (
                <tr key={cmp.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-primary)' }}>
                      {cmp.complaint_id}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cmp.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{cmp.category_name}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{cmp.department_name}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{cmp.location_address}</div>
                    {cmp.landmark && <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Near {cmp.landmark}</div>}
                  </td>
                  <td>
                    <PriorityBadge priority={cmp.priority} />
                  </td>
                  <td>
                    <StatusBadge status={cmp.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {cmp.sla_deadline ? new Date(cmp.sla_deadline).toLocaleDateString('en-IN') : '24 Hours'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleViewDetails(cmp.id)}
                    >
                      <Eye size={14} />
                      <span>Track</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE COMPLAINT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Lodge New Municipal Grievance"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>Submit Grievance</button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Grievance Title *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Major drinking water pipe leakage near main junction"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Municipal Department *</label>
              <select
                className="form-control"
                required
                value={formData.department_id}
                onChange={(e) => handleDeptChange(e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                disabled={!formData.department_id}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (SLA: {c.standard_sla_hours}h)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-control"
              required
              placeholder="Provide exact details of the civic issue, affected houses/streets, and duration..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Location Address / Colony *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="House / Plot number, Street name, Colony"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nearest Landmark</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Opposite Metro Pillar 128"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-control"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low (Routine Civic Maintenance)</option>
                <option value="MEDIUM">Medium (Standard Priority)</option>
                <option value="HIGH">High (Major Public Inconvenience)</option>
                <option value="CRITICAL">Critical (Immediate Hazard / Life Threat)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Spot Evidence Photo URL</label>
              <input
                type="text"
                className="form-control"
                value={formData.evidence_photo_url}
                onChange={(e) => setFormData({ ...formData, evidence_photo_url: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* COMPLAINT DETAILS & TIMELINE TRACKING MODAL */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => { setSelectedComplaint(null); setDetailData(null); }}
        title={detailData ? `Grievance Tracking: ${detailData.complaint.complaint_id}` : 'Loading...'}
      >
        {isDetailLoading || !detailData ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading grievance lifecycle timeline...</div>
        ) : (
          <div>
            {/* Header info */}
            <div style={{
              background: 'var(--bg-surface-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {detailData.complaint.title}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {detailData.complaint.department_name} • {detailData.complaint.category_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                  📍 {detailData.complaint.location_address} {detailData.complaint.landmark ? `(Near ${detailData.complaint.landmark})` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
                <StatusBadge status={detailData.complaint.status} />
                <PriorityBadge priority={detailData.complaint.priority} />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.3rem' }}>
                Citizen Description
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                {detailData.complaint.description}
              </p>
            </div>

            {/* 9-Stage Progress Timeline */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.6rem' }}>
                Statutory Lifecycle Stepper & Milestone Audit
              </div>
              <Timeline
                currentStatus={detailData.complaint.status}
                history={detailData.timeline}
              />
            </div>

            {/* Evidence Gallery */}
            {detailData.evidence && detailData.evidence.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.6rem' }}>
                  Photographic Evidence & Site Verification
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {detailData.evidence.map((ev, i) => (
                    <div key={i} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <img src={ev.file_url} alt="Evidence" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                      <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>
                        <strong>{ev.evidence_type}</strong>: {ev.caption}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Citizen Feedback Section */}
            {['RESOLVED', 'CLOSED', 'RESOLUTION_SUBMITTED', 'CITIZEN_VERIFICATION'].includes(detailData.complaint.status) && (
              <div style={{
                background: 'var(--civic-teal-light)',
                border: '1px solid var(--civic-teal)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--civic-teal)', marginBottom: '0.5rem' }}>
                  ⭐ Citizen Satisfaction Feedback & Verification
                </h5>

                {detailData.feedback ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={16} fill={star <= detailData.feedback.rating ? '#eab308' : 'none'} color="#eab308" />
                      ))}
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: '0.4rem' }}>
                        {detailData.feedback.rating} / 5 Stars
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      "{detailData.feedback.comments}"
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rate Resolution:</span>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={22}
                          fill={star <= rating ? '#eab308' : 'none'}
                          color="#eab308"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setRating(star)}
                        />
                      ))}
                    </div>

                    <textarea
                      className="form-control"
                      placeholder="Was the problem resolved to your satisfaction? Enter comments..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      style={{ marginBottom: '0.75rem', minHeight: '60px' }}
                    />

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button className="btn btn-teal btn-sm" onClick={() => handleSubmitFeedback(false)}>
                        <CheckCircle2 size={14} />
                        <span>Accept & Close Complaint</span>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleSubmitFeedback(true)}>
                        <AlertTriangle size={14} />
                        <span>Reopen Complaint (Work Incomplete)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Public Discussion */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.6rem' }}>
                Citizen Updates & Discussion
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Post an inquiry or update regarding this complaint..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleAddComment}>
                  Post
                </button>
              </div>

              {detailData.comments && detailData.comments.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-app)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gov-primary)' }}>
                    <span>{c.author_name} ({c.author_role})</span>
                    <span style={{ color: 'var(--text-subtle)', fontWeight: 500 }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {c.comment_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
