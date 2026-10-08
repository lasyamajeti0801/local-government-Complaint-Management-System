import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  Clock,
  Send,
  Eye,
  ArrowUpRight,
  ShieldAlert,
  FileCheck
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

export function OfficerPortal({ currentUser }) {
  const { t, lang } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Approve Resolution Modal
  const [approvingComplaint, setApprovingComplaint] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    fetchQueue();
    fetchStaff();
  }, [statusFilter, priorityFilter, overdueOnly]);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('nagar_token');
      let url = `/api/officer/queue?status=${statusFilter}&priority=${priorityFilter}&overdue_only=${overdueOnly}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue || []);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch officer queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch('/api/users/staff', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
        if (data.staff.length > 0 && !selectedStaffId) {
          setSelectedStaffId(data.staff[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load field staff:', err);
    }
  };

  const handleAction = async (complaintId, actionType, payload = {}) => {
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/officer/complaints/${complaintId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: actionType, ...payload })
      });
      const data = await res.json();
      if (data.success) {
        fetchQueue();
        if (selectedComplaint) setSelectedComplaint(null);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Action failed: ' + err.message);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const effectiveStaffId = selectedStaffId || (staffList.length > 0 ? staffList[0].id : '');
    if (!assigningComplaint || !effectiveStaffId) return;

    setIsAssigning(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/officer/complaints/${assigningComplaint.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          field_staff_id: effectiveStaffId,
          instructions: assignInstructions
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setAssigningComplaint(null);
        setAssignInstructions('');
        fetchQueue();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Assignment error: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approvingComplaint) return;

    setIsApproving(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/officer/complaints/${approvingComplaint.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          resolution_summary: approvalNotes || 'On-ground work verified and accepted by Department Officer.'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setApprovingComplaint(null);
        setApprovalNotes('');
        fetchQueue();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Approval error: ' + err.message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-gov)' }}>
            {t('officerTitle')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {t('officerSub')}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon-box">
            <ClipboardList size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.total : queue.length}</div>
            <div className="metric-label">{t('queueWorkload')}</div>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-icon-box">
            <Clock size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.newComplaints : 0}</div>
            <div className="metric-label">{t('awaitingAssignment')}</div>
          </div>
        </div>

        <div className="metric-card teal">
          <div className="metric-icon-box">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.inProgress : 0}</div>
            <div className="metric-label">{t('fieldActive')}</div>
          </div>
        </div>

        <div className="metric-card red">
          <div className="metric-icon-box">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.overdueCount : 0}</div>
            <div className="metric-label">{t('slaBreached')}</div>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <Card title={t('officerQueueTitle')}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t('allStatuses')}</option>
            <option value="SUBMITTED">New (Submitted)</option>
            <option value="ASSIGNED">Assigned to Field</option>
            <option value="IN_PROGRESS">Field In Progress</option>
            <option value="RESOLUTION_SUBMITTED">Resolution Submitted</option>
          </select>

          <select
            className="form-select"
            style={{ width: 160 }}
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', marginLeft: 'auto' }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
            />
            <span style={{ color: 'var(--gov-red)', fontWeight: 600 }}>{t('showOverdueOnly')}</span>
          </label>
        </div>

        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : queue.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title={lang === 'te' ? 'క్యూలో పనులు ఏవీ లేవు' : 'Queue clear!'}
            message={lang === 'te' ? 'ఎంచుకున్న ఫిల్టర్‌కు సరిపోయే పెండింగ్ ఫిర్యాదులు ఏవీ లేవు.' : 'No pending grievances require officer action for the selected criteria.'}
          />
        ) : (
          <div className="table-container">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>{t('colTrackingId')}</th>
                  <th>{t('colCitizen')}</th>
                  <th>{t('colLocation')}</th>
                  <th>{t('colPriority')}</th>
                  <th>{t('colSlaRemaining')}</th>
                  <th>{t('colStatusCrew')}</th>
                  <th style={{ textAlign: 'right' }}>{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-gov)' }}>{item.tracking_id}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {lang === 'te' ? 'పౌరుడు' : 'Citizen'}: {item.citizen_name} ({item.citizen_phone || 'N/A'})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{item.location_address}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{item.ward_number}</div>
                    </td>
                    <td>
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: item.is_overdue ? 700 : 500,
                        color: item.is_overdue ? 'var(--gov-red)' : 'var(--text-primary)'
                      }}>
                        {item.is_overdue ? `⚠️ ${t('overdueWarning')}` : `${item.remaining_hours}h ${t('remainingHours')}`}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                      {item.assigned_staff_name && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--civic-teal)', marginTop: 2 }}>
                          {lang === 'te' ? 'సిబ్బంది' : 'Crew'}: {item.assigned_staff_name}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {item.status === 'SUBMITTED' && (
                          <Button variant="teal" size="sm" onClick={() => setAssigningComplaint(item)}>
                            <UserCheck size={14} /> {t('btnAssignStaff')}
                          </Button>
                        )}

                        {item.status === 'RESOLUTION_SUBMITTED' && (
                          <Button variant="primary" size="sm" onClick={() => setApprovingComplaint(item)}>
                            <FileCheck size={14} /> {t('btnSignOff')}
                          </Button>
                        )}

                        {item.status !== 'SUBMITTED' && item.status !== 'RESOLUTION_SUBMITTED' && (
                          <Button variant="secondary" size="sm" onClick={() => setAssigningComplaint(item)}>
                            {t('btnReassign')}
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          title="Escalate issue"
                          onClick={() => handleAction(item.id, 'ESCALATE', { escalation_reason: 'Officer expedited to Commissioner review' })}
                        >
                          <ArrowUpRight size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assign Field Staff Modal */}
      <Modal
        isOpen={Boolean(assigningComplaint)}
        onClose={() => setAssigningComplaint(null)}
        title={assigningComplaint ? `${t('btnAssignStaff')}: ${assigningComplaint.tracking_id}` : ''}
        maxWidth="580px"
      >
        <form onSubmit={handleAssignSubmit}>
          <div style={{ marginBottom: 14, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>{assigningComplaint?.title}</strong><br />
            {assigningComplaint?.location_address}
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'te' ? 'ఫీల్డ్ టెక్నీషియన్‌ను ఎంచుకోండి' : 'Select Field Technician'}</label>
            <select
              className="form-select"
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              required
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.designation || 'Field Engineer'}) - {s.ward_number || 'Zone 1'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('officerInstructions')}</label>
            <textarea
              className="form-textarea"
              value={assignInstructions}
              onChange={e => setAssignInstructions(e.target.value)}
              placeholder="e.g. Deploy asphalt cold-mix. Place safety cones 30m ahead."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={() => setAssigningComplaint(null)}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="teal" disabled={isAssigning}>
              {isAssigning ? 'Assigning...' : t('btnAssignStaff')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve Resolution Modal */}
      <Modal
        isOpen={Boolean(approvingComplaint)}
        onClose={() => setApprovingComplaint(null)}
        title={approvingComplaint ? `${t('btnSignOff')}: ${approvingComplaint.tracking_id}` : ''}
        maxWidth="600px"
      >
        <form onSubmit={handleApproveSubmit}>
          <div style={{ padding: 12, backgroundColor: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.85rem' }}>
            <div><strong>{approvingComplaint?.title}</strong></div>
            <div>{lang === 'te' ? 'కేటాయించిన సిబ్బంది:' : 'Assigned Crew:'} {approvingComplaint?.assigned_staff_name || 'Ground Staff'}</div>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'te' ? 'అధికారి ఆమోద వ్యాఖ్యలు' : 'Officer Verification Summary & Sign-off Notes'}</label>
            <textarea
              className="form-textarea"
              value={approvalNotes}
              onChange={e => setApprovalNotes(e.target.value)}
              placeholder="e.g. Inspected site photograph and post-repair quality. Road opened to vehicular traffic. Approved."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={() => setApprovingComplaint(null)}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isApproving}>
              {isApproving ? 'Signing off...' : t('btnSignOff')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
