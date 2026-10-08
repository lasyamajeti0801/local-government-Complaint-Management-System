import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
  RotateCcw,
  MapPin,
  Calendar,
  Layers,
  Send
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  SearchBar,
  StatusBadge,
  PriorityBadge,
  Timeline,
  LoadingSkeleton,
  EmptyState
} from '../components/common/UIComponents';
import { useLanguage } from '../context/LanguageContext';

export function CitizenPortal({ currentUser }) {
  const { t, lang } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState(null);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reopenRequested, setReopenRequested] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchMetadata();
  }, [statusFilter, searchQuery]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('nagar_token');
      let url = `/api/complaints?citizen_id=${currentUser?.id || ''}&status=${statusFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories || []);
        if (catData.categories.length > 0 && !categoryId) {
          setCategoryId(catData.categories[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleOpenDetail = async (id) => {
    setIsLoadingDetail(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/complaints/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setSelectedComplaint(data.complaint);
      }
    } catch (err) {
      alert('Failed to load complaint details: ' + err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const effectiveCategoryId = categoryId || (categories.length > 0 ? categories[0].id : '');
    if (!title || !description || !locationAddress || !effectiveCategoryId) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          description,
          category_id: effectiveCategoryId,
          location_address: locationAddress,
          landmark,
          priority
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreateSuccessMsg(`${lang === 'te' ? 'ఫిర్యాదు విజయవంతంగా నమోదైంది. ట్రాకింగ్ ఐడీ' : 'Grievance registered successfully with Tracking ID'}: ${data.tracking_id}`);
        setTimeout(() => {
          setShowCreateModal(false);
          setTitle('');
          setDescription('');
          setLocationAddress('');
          setLandmark('');
          setCreateSuccessMsg(null);
          fetchComplaints();
        }, 1500);
      } else {
        alert(data.message || 'Failed to lodge complaint.');
      }
    } catch (err) {
      alert('Error creating complaint: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmittingFeedback(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/complaints/${selectedComplaint.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
          is_satisfied: feedbackRating >= 3 ? 1 : 0,
          reopen_requested: reopenRequested ? 1 : 0,
          reopen_reason: reopenReason
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        handleOpenDetail(selectedComplaint.id);
        fetchComplaints();
      }
    } catch (err) {
      alert('Feedback submission error: ' + err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const openCount = complaints.filter(c => !['RESOLVED', 'CLOSED'].includes(c.status)).length;
  const inProgressCount = complaints.filter(c => ['ASSIGNED', 'IN_PROGRESS', 'FIELD_VERIFICATION'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  return (
    <div>
      {/* Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-gov)' }}>
            {t('citizenTitle')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {t('citizenSub')}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <PlusCircle size={16} /> {t('lodgeComplaintBtn')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon-box">
            <FileText size={22} />
          </div>
          <div>
            <div className="metric-value">{complaints.length}</div>
            <div className="metric-label">{t('myComplaints')}</div>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-icon-box">
            <Clock size={22} />
          </div>
          <div>
            <div className="metric-value">{openCount}</div>
            <div className="metric-label">{t('openInReview')}</div>
          </div>
        </div>

        <div className="metric-card teal">
          <div className="metric-icon-box">
            <Layers size={22} />
          </div>
          <div>
            <div className="metric-value">{inProgressCount}</div>
            <div className="metric-label">{t('fieldProgress')}</div>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon-box">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="metric-value">{resolvedCount}</div>
            <div className="metric-label">{t('resolvedVerified')}</div>
          </div>
        </div>
      </div>

      {/* Complaints List Card */}
      <Card title={t('recordsTitle')}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('searchComplaintsPlaceholder')}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t('allStatuses')}</option>
            <option value="SUBMITTED">{lang === 'te' ? 'సమర్పించబడింది' : 'Submitted'}</option>
            <option value="UNDER_REVIEW">{lang === 'te' ? 'పరిశీలనలో ఉంది' : 'Under Review'}</option>
            <option value="ASSIGNED">{lang === 'te' ? 'కేటాయించబడింది' : 'Assigned'}</option>
            <option value="IN_PROGRESS">{lang === 'te' ? 'పురోగతిలో ఉంది' : 'In Progress'}</option>
            <option value="RESOLUTION_SUBMITTED">{lang === 'te' ? 'పరిష్కారం సమర్పించబడింది' : 'Resolution Submitted'}</option>
            <option value="RESOLVED">{lang === 'te' ? 'పరిష్కరించబడింది' : 'Resolved'}</option>
          </select>
        </div>

        {/* Complaints Table */}
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={lang === 'te' ? 'ఫిర్యాదులు ఏవీ లేవు' : 'No grievances lodged'}
            message={lang === 'te' ? 'ఎంచుకున్న ఫిల్టర్‌కు సరిపోయే ఫిర్యాదులు ఏవీ లేవు.' : 'You have no active or historical civic complaints matching the selected filter.'}
            action={
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <PlusCircle size={16} /> {t('lodgeComplaintBtn')}
              </Button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>{t('colTrackingId')}</th>
                  <th>{t('colTitleLocation')}</th>
                  <th>{t('colCategoryDept')}</th>
                  <th>{t('colPriority')}</th>
                  <th>{t('colStatus')}</th>
                  <th>{t('colSlaDeadline')}</th>
                  <th style={{ textAlign: 'right' }}>{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(cp => (
                  <tr key={cp.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-gov)', letterSpacing: 0.5 }}>
                        {cp.tracking_id}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cp.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} />
                        {cp.location_address} {cp.landmark ? `(Near ${cp.landmark})` : ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{cp.category_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{cp.department_name}</div>
                    </td>
                    <td>
                      <PriorityBadge priority={cp.priority} />
                    </td>
                    <td>
                      <StatusBadge status={cp.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: cp.is_overdue ? 'var(--gov-red)' : 'var(--text-primary)', fontWeight: cp.is_overdue ? 700 : 400 }}>
                        {new Date(cp.sla_deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: cp.is_overdue ? 'var(--gov-red)' : 'var(--text-muted)' }}>
                        {cp.is_overdue ? `⚠️ ${t('overdueWarning')}` : `${cp.remaining_hours}h ${t('remainingHours')}`}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => handleOpenDetail(cp.id)}>
                        <Eye size={14} /> {t('btnViewDetails')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Complaint Detail & Lifecycle Timeline Modal */}
      <Modal
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `${t('colTrackingId')}: ${selectedComplaint.tracking_id}` : ''}
        maxWidth="750px"
      >
        {selectedComplaint && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{selectedComplaint.title}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {t('lblCategory')}: <strong>{selectedComplaint.category_name}</strong> | {lang === 'te' ? 'విభాగం' : 'Department'}: <strong>{selectedComplaint.department_name}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <PriorityBadge priority={selectedComplaint.priority} />
                <StatusBadge status={selectedComplaint.status} />
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-surface-alt)',
              padding: 12,
              borderRadius: 'var(--radius-sm)',
              marginBottom: 16,
              fontSize: '0.85rem'
            }}>
              <p><strong>{t('lblDescription')}:</strong> {selectedComplaint.description}</p>
              <p style={{ marginTop: 6 }}>
                <strong>{t('lblAddress')}:</strong> {selectedComplaint.location_address} {selectedComplaint.landmark ? `• Landmark: ${selectedComplaint.landmark}` : ''} • {selectedComplaint.ward_number}
              </p>
            </div>

            {/* Resolution Summary (If available) */}
            {selectedComplaint.resolution_summary && (
              <div style={{
                backgroundColor: 'var(--gov-green-light)',
                borderLeft: '4px solid var(--gov-green)',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 700, color: 'var(--gov-green)', fontSize: '0.85rem' }}>
                  {lang === 'te' ? 'అధికారిక పరిష్కార నివేదిక:' : 'OFFICIAL RESOLUTION REPORT:'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#14532D', marginTop: 4 }}>
                  {selectedComplaint.resolution_summary}
                </div>
              </div>
            )}

            {/* Auditable Lifecycle Timeline */}
            <h5 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, color: 'var(--primary-gov)' }}>
              {lang === 'te' ? 'ఫిర్యాదు పురోగతి కాలక్రమం (టైమ్‌లైన్)' : 'Auditable Complaint Lifecycle Timeline'}
            </h5>
            <Timeline items={selectedComplaint.timeline || []} />

            {/* Citizen Feedback Form (For Resolved Complaints) */}
            {['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
              <div style={{
                marginTop: 24,
                borderTop: '1px solid var(--border-color)',
                paddingTop: 16
              }}>
                <h5 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, color: 'var(--civic-teal)' }}>
                  {lang === 'te' ? 'పౌర సంతృప్తి ఫీడ్‌బ్యాక్ & ధృవీకరణ' : 'Citizen Satisfaction Feedback & Verification'}
                </h5>

                {selectedComplaint.feedback ? (
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div>
                      <strong>{lang === 'te' ? 'మీ రేటింగ్:' : 'Your Rating:'}</strong> {'★'.repeat(selectedComplaint.feedback.rating)}{'☆'.repeat(5 - selectedComplaint.feedback.rating)}
                    </div>
                    {selectedComplaint.feedback.comment && (
                      <div style={{ marginTop: 4 }}><em>"{selectedComplaint.feedback.comment}"</em></div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lang === 'te' ? 'రేటింగ్ ఇవ్వండి:' : 'Rate Resolution:'}</span>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            color: star <= feedbackRating ? '#F59E0B' : '#CBD5E1'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <Input
                      label={lang === 'te' ? 'మీ అభిప్రాయం / వ్యాఖ్యలు' : 'Citizen Comments / Review'}
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder={lang === 'te' ? 'సమస్య సంతృప్తికరంగా పరిష్కరించబడిందా?' : 'Was the issue resolved to your satisfaction?'}
                    />

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={reopenRequested}
                          onChange={e => setReopenRequested(e.target.checked)}
                        />
                        <span style={{ color: 'var(--gov-red)', fontWeight: 600 }}>
                          {lang === 'te' ? 'పని పూర్తి కాలేదు (మళ్లీ ప్రారంభించి ఉన్నతాధికారులకు పంపండి)' : 'Work incomplete / Not resolved (Request Reopen & Executive Escalation)'}
                        </span>
                      </label>
                    </div>

                    {reopenRequested && (
                      <Input
                        label={lang === 'te' ? 'మళ్లీ తెరవడానికి కారణం' : 'Reason for Reopening'}
                        value={reopenReason}
                        onChange={e => setReopenReason(e.target.value)}
                        placeholder="State why the resolution is deficient..."
                        required
                      />
                    )}

                    <Button type="submit" variant="teal" disabled={isSubmittingFeedback}>
                      <Send size={14} /> {lang === 'te' ? 'ఫీడ్‌బ్యాక్ సమర్పించండి' : 'Submit Feedback'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Complaint Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('modalLodgeTitle')}
        maxWidth="650px"
      >
        <form onSubmit={handleCreateSubmit}>
          <Input
            label={t('lblTitle')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Hazardous deep road pothole opposite Subhash Chowk"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">{t('lblCategory')}</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.department_name})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('lblPriority')}</label>
              <select
                className="form-select"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <Input
            label={t('lblAddress')}
            value={locationAddress}
            onChange={e => setLocationAddress(e.target.value)}
            placeholder="Street name, colony, sector, or house number"
            required
          />

          <Input
            label={t('lblLandmark')}
            value={landmark}
            onChange={e => setLandmark(e.target.value)}
            placeholder="Near temple, school, ATM, or water tank"
          />

          <div className="form-group">
            <label className="form-label">{t('lblDescription')}</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the problem..."
              required
            />
          </div>

          {createSuccessMsg && (
            <div style={{
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              marginBottom: 12,
              fontSize: '0.85rem',
              backgroundColor: 'var(--gov-green-light)',
              color: 'var(--gov-green)',
              fontWeight: 600
            }}>
              {createSuccessMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : t('btnRegister')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
