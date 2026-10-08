import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle,
  MapPin,
  Clock,
  Camera,
  Send,
  AlertTriangle,
  Play,
  CheckCheck
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Modal,
  PriorityBadge,
  LoadingSkeleton,
  EmptyState
} from '../components/common/UIComponents';
import { useLanguage } from '../context/LanguageContext';

export function FieldStaffPortal({ currentUser }) {
  const { t, lang } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resolution Modal State
  const [activeTaskForResolution, setActiveTaskForResolution] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidenceCaption, setEvidenceCaption] = useState(lang === 'te' ? 'పూర్తయిన తారు పనుల ఫోటో సాక్ష్యం.' : 'Completed on-ground asphalt compaction.');
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch('/api/field/tasks', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load field tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateState = async (taskId, nextState, notes = '') => {
    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch(`/api/field/tasks/${taskId}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ state: nextState, notes })
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('State transition failed: ' + err.message);
    }
  };

  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!activeTaskForResolution) return;

    setIsSubmittingRes(true);
    try {
      const token = localStorage.getItem('nagar_token');

      // 1. Attach Evidence
      await fetch(`/api/field/tasks/${activeTaskForResolution.id}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          evidence_type: 'AFTER_WORK',
          file_name: 'work_completed_evidence.jpg',
          caption: evidenceCaption
        })
      });

      // 2. Advance State to RESOLUTION_SUBMITTED
      const res = await fetch(`/api/field/tasks/${activeTaskForResolution.id}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          state: 'RESOLUTION_SUBMITTED',
          notes: resolutionNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(lang === 'te' ? 'సాక్ష్యాలు మరియు పరిష్కార నివేదిక విజయవంతంగా సమర్పించబడింది!' : 'Resolution & Photographic Evidence successfully submitted for Officer Verification!');
        setActiveTaskForResolution(null);
        setResolutionNotes('');
        fetchTasks();
      }
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setIsSubmittingRes(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-gov)' }}>
            {t('fieldTitle')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {t('fieldSub')}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon-box">
            <Wrench size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.todayTasks : tasks.length}</div>
            <div className="metric-label">{t('assignedWorkload')}</div>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-icon-box">
            <Clock size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.pending : 0}</div>
            <div className="metric-label">{t('awaitingAcceptance')}</div>
          </div>
        </div>

        <div className="metric-card teal">
          <div className="metric-icon-box">
            <Play size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.inProgress : 0}</div>
            <div className="metric-label">{t('onSiteProgress')}</div>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon-box">
            <CheckCheck size={22} />
          </div>
          <div>
            <div className="metric-value">{metrics ? metrics.completed : 0}</div>
            <div className="metric-label">{t('resolutionSubmitted')}</div>
          </div>
        </div>
      </div>

      {/* Task List Cards (Mobile-first layout) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title={lang === 'te' ? 'కేటాయించిన పనులు ఏవీ లేవు' : 'No field tasks assigned'}
            message={lang === 'te' ? 'మీరు అన్ని పనులను పూర్తి చేశారు! కొత్త పనులు ఇక్కడ కనిపిస్తాయి.' : 'You are fully up to date! New departmental work assignments will appear here automatically.'}
          />
        ) : (
          tasks.map(task => {
            const isCompleted = ['WORK_COMPLETED', 'RESOLUTION_SUBMITTED'].includes(task.state);

            return (
              <Card key={task.id} style={{ borderLeft: `5px solid ${isCompleted ? 'var(--gov-green)' : 'var(--civic-teal)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary-gov)' }}>{task.tracking_id}</span>
                      <PriorityBadge priority={task.priority} />
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        backgroundColor: isCompleted ? 'var(--gov-green-light)' : 'var(--civic-teal-light)',
                        color: isCompleted ? 'var(--gov-green)' : 'var(--civic-teal)'
                      }}>
                        {task.state.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', marginTop: 6, color: 'var(--text-primary)' }}>
                      {task.task_title || task.complaint_title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      <MapPin size={14} color="var(--civic-teal)" />
                      {task.location_address} {task.landmark ? `(Near ${task.landmark})` : ''} • {task.ward_number}
                    </div>

                    {task.assignment_instructions && (
                      <div style={{
                        backgroundColor: 'var(--bg-surface-alt)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: 10,
                        fontSize: '0.825rem',
                        borderLeft: '3px solid var(--primary-gov)'
                      }}>
                        <strong>{t('officerInstructions')}:</strong> {task.assignment_instructions}
                      </div>
                    )}
                  </div>

                  {/* SLA Remaining */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: task.is_overdue ? 'var(--gov-red)' : 'var(--text-secondary)' }}>
                      {task.is_overdue ? `⚠️ ${t('overdueWarning')}` : `${task.remaining_hours}h ${t('remainingHours')}`}
                    </div>
                  </div>
                </div>

                {/* Workflow Action Bar */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-light)',
                  flexWrap: 'wrap'
                }}>
                  {task.state === 'ASSIGNED' && (
                    <Button variant="primary" size="sm" onClick={() => handleUpdateState(task.id, 'ACCEPTED', 'Field crew acknowledged and accepted task.')}>
                      {t('btnAcceptTask')}
                    </Button>
                  )}

                  {task.state === 'ACCEPTED' && (
                    <Button variant="teal" size="sm" onClick={() => handleUpdateState(task.id, 'ARRIVED', 'Crew arrived at work location.')}>
                      <MapPin size={14} /> {t('btnMarkArrived')}
                    </Button>
                  )}

                  {task.state === 'ARRIVED' && (
                    <Button variant="teal" size="sm" onClick={() => handleUpdateState(task.id, 'IN_PROGRESS', 'Site cordoned, safety cones deployed, work underway.')}>
                      <Play size={14} /> {t('btnStartExecution')}
                    </Button>
                  )}

                  {task.state === 'IN_PROGRESS' && (
                    <Button variant="primary" size="sm" onClick={() => setActiveTaskForResolution(task)}>
                      <Camera size={14} /> {t('btnSubmitResolution')}
                    </Button>
                  )}

                  {task.state === 'RESOLUTION_SUBMITTED' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--gov-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={16} /> {lang === 'te' ? 'అధికారి ధృవీకరణ కోసం వేచి ఉంది' : 'Awaiting Nodal Officer Verification & Sign-off'}
                    </span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Resolution Submission Modal */}
      <Modal
        isOpen={Boolean(activeTaskForResolution)}
        onClose={() => setActiveTaskForResolution(null)}
        title={activeTaskForResolution ? `${t('btnSubmitResolution')}: ${activeTaskForResolution.tracking_id}` : ''}
        maxWidth="600px"
      >
        <form onSubmit={handleResolutionSubmit}>
          <div style={{ padding: 10, backgroundColor: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: '0.85rem' }}>
            <div><strong>{activeTaskForResolution?.complaint_title}</strong></div>
            <div>{activeTaskForResolution?.location_address}</div>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'te' ? 'సాక్ష్యం రకం' : 'Evidence Type'}</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ padding: '6px 12px', background: 'var(--gov-green-light)', color: 'var(--gov-green)', fontWeight: 700, borderRadius: 4 }}>
                📸 {lang === 'te' ? 'పని పూర్తయిన ఫోటో సాక్ష్యం' : 'Post-Repair Photographic Evidence'}
              </span>
            </div>
          </div>

          <Input
            label={lang === 'te' ? 'ఫోటో వివరణ / శీర్షిక' : 'Photo Caption / Proof Summary'}
            value={evidenceCaption}
            onChange={e => setEvidenceCaption(e.target.value)}
            placeholder="e.g. Cold-mix bitumen leveled with vibratory compactor and road opened to traffic."
            required
          />

          <div className="form-group">
            <label className="form-label">{lang === 'te' ? 'క్షేత్రస్థాయి పని వివరాలు & ఉపయోగించిన సామాగ్రి' : 'Field Execution Notes & Material Consumption'}</label>
            <textarea
              className="form-textarea"
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="Detail work performed, material utilized (e.g. 5 bags cold-mix, 10L tack emulsion), and safety steps taken."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={() => setActiveTaskForResolution(null)}>
              {t('btnCancel')}
            </Button>
            <Button type="submit" variant="teal" disabled={isSubmittingRes}>
              <Send size={14} /> {isSubmittingRes ? 'Submitting...' : t('btnSubmitResolution')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
