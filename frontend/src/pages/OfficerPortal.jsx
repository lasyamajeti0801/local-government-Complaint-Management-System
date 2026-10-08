import React, { useState, useEffect } from 'react';
import { 
  Shield, UserCheck, AlertTriangle, Clock, CheckCircle2, Search, Filter, ArrowUpRight, FileText, Send 
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Modal } from '../components/Modal';

export const OfficerPortal = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [fieldStaff, setFieldStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Assignment Modal
  const [assignModalData, setAssignModalData] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Resolution Approval Modal
  const [approvalModalData, setApprovalModalData] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Escalation Modal
  const [escalateModalData, setEscalateModalData] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOfficerQueue({
        status: statusFilter,
        priority: priorityFilter,
        overdueOnly
      });
      setComplaints(data.complaints || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Error loading officer queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await api.getFieldStaffList();
      setFieldStaff(res.fieldStaff || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadQueue();
    loadStaff();
  }, [statusFilter, priorityFilter, overdueOnly]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalData || !selectedStaffId) return;

    try {
      await api.assignComplaint(assignModalData.id, selectedStaffId, assignNotes, assignModalData.priority);
      alert('Grievance successfully assigned to field staff!');
      setAssignModalData(null);
      setAssignNotes('');
      loadQueue();
    } catch (err) {
      alert(`Assignment error: ${err.message}`);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approvalModalData) return;

    try {
      await api.approveResolution(approvalModalData.id, approvalRemarks);
      alert('Field resolution verified and approved. Grievance marked as RESOLVED.');
      setApprovalModalData(null);
      setApprovalRemarks('');
      loadQueue();
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalateModalData || !escalateReason) return;

    try {
      await api.escalateComplaint(escalateModalData.id, escalateReason, 'COMMISSIONER');
      alert('Complaint escalated to Municipal Commissioner.');
      setEscalateModalData(null);
      setEscalateReason('');
      loadQueue();
    } catch (err) {
      alert(`Escalation error: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
            🛡️ Department Officer Queue & SLA Monitor
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Review, prioritize, dispatch field units, and verify resolution compliance under statutory SLAs.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Department Queue</span>
          <span className="kpi-value">{stats.total || 0}</span>
          <span className="kpi-subtext">Total active grievances</span>
        </div>
        <div className="kpi-card amber">
          <span className="kpi-label">New / Unassigned</span>
          <span className="kpi-value">{stats.newUnassigned || 0}</span>
          <span className="kpi-subtext">Requires field dispatch</span>
        </div>
        <div className="kpi-card teal">
          <span className="kpi-label">Pending Verification</span>
          <span className="kpi-value">{stats.pendingVerification || 0}</span>
          <span className="kpi-subtext">Field work submitted</span>
        </div>
        <div className="kpi-card red">
          <span className="kpi-label">SLA Breached / Overdue</span>
          <span className="kpi-value">{stats.overdueCount || 0}</span>
          <span className="kpi-subtext">Subject to penalty</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '180px' }}>
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLUTION_SUBMITTED">Resolution Submitted</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select className="form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
            />
            <span>Show Overdue Only 🚨</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Citizen & Location</th>
              <th>Category & Description</th>
              <th>Priority</th>
              <th>SLA Status</th>
              <th>Status</th>
              <th>Assigned Field Staff</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading officer grievance queue...</td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  No complaints found in this queue.
                </td>
              </tr>
            ) : (
              complaints.map(cmp => (
                <tr key={cmp.id} style={{ background: cmp.isOverdue ? 'var(--civic-red-light)' : undefined }}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-primary)' }}>
                      {cmp.complaint_id}
                    </strong>
                    {cmp.is_escalated === 1 && (
                      <div style={{ color: 'var(--civic-red)', fontSize: '0.7rem', fontWeight: 800 }}>
                        ⚠️ ESCALATED
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{cmp.citizen_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>📍 {cmp.location_address}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cmp.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cmp.category_name}</div>
                  </td>
                  <td>
                    <PriorityBadge priority={cmp.priority} />
                  </td>
                  <td>
                    {cmp.isOverdue ? (
                      <span style={{ color: 'var(--civic-red)', fontWeight: 800, fontSize: '0.75rem' }}>
                        🚨 BREACHED ({Math.abs(cmp.remainingHours)}h late)
                      </span>
                    ) : (
                      <span style={{ color: cmp.remainingHours < 6 ? 'var(--civic-amber)' : 'var(--civic-green)', fontWeight: 700, fontSize: '0.75rem' }}>
                        ⏳ {cmp.remainingHours}h remaining
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={cmp.status} />
                  </td>
                  <td>
                    {cmp.assigned_staff_name ? (
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gov-primary)' }}>
                        👷 {cmp.assigned_staff_name}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)', fontStyle: 'italic' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'nowrap' }}>
                      {/* Assign button */}
                      {['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED'].includes(cmp.status) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setAssignModalData(cmp);
                            setSelectedStaffId(fieldStaff[0]?.id || '');
                          }}
                          title="Assign to Field Staff"
                        >
                          <UserCheck size={13} />
                          <span>{cmp.status === 'ASSIGNED' ? 'Reassign' : 'Assign'}</span>
                        </button>
                      )}

                      {/* Verify Resolution button */}
                      {cmp.status === 'RESOLUTION_SUBMITTED' && (
                        <button
                          className="btn btn-teal btn-sm"
                          onClick={() => setApprovalModalData(cmp)}
                          title="Verify and Approve Field Resolution"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve</span>
                        </button>
                      )}

                      {/* Escalate button */}
                      {cmp.is_escalated !== 1 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEscalateModalData(cmp)}
                          title="Escalate to Commissioner"
                        >
                          <ArrowUpRight size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGNMENT MODAL */}
      <Modal
        isOpen={!!assignModalData}
        onClose={() => setAssignModalData(null)}
        title={assignModalData ? `Dispatch Field Staff: ${assignModalData.complaint_id}` : ''}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAssignModalData(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssignSubmit}>Confirm Dispatch</button>
          </>
        }
      >
        <form onSubmit={handleAssignSubmit}>
          <div style={{ marginBottom: '1rem', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <strong>{assignModalData?.title}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {assignModalData?.location_address}</div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Field Unit Lead *</label>
            <select
              className="form-control"
              required
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            >
              {fieldStaff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.phone}) - {s.ward_number || 'Zone Fleet'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Operational Dispatch Notes</label>
            <textarea
              className="form-control"
              placeholder="e.g. Bring 300mm collar joint and dewatering pump. Inspect sluice valve upstream."
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* APPROVAL MODAL */}
      <Modal
        isOpen={!!approvalModalData}
        onClose={() => setApprovalModalData(null)}
        title={approvalModalData ? `Verify Resolution: ${approvalModalData.complaint_id}` : ''}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setApprovalModalData(null)}>Cancel</button>
            <button className="btn btn-teal" onClick={handleApproveSubmit}>Approve & Mark RESOLVED</button>
          </>
        }
      >
        <form onSubmit={handleApproveSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem' }}>
              Field team reported work completed. Approving will update status to <strong>RESOLVED</strong> and notify the citizen for verification.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Officer Verification Remarks *</label>
            <textarea
              className="form-control"
              required
              placeholder="e.g. Inspected uploaded after-repair photo. Pressure restored and road trench backfilled."
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* ESCALATION MODAL */}
      <Modal
        isOpen={!!escalateModalData}
        onClose={() => setEscalateModalData(null)}
        title={`Escalate Grievance: ${escalateModalData?.complaint_id}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEscalateModalData(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleEscalateSubmit}>Confirm Escalation</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Reason for Administrative Escalation *</label>
          <textarea
            className="form-control"
            required
            placeholder="e.g. Major inter-departmental gas line hindrance requiring Zonal Commissioner sanction."
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
