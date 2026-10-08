import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle, Navigation, Camera, AlertOctagon, Clock, MapPin, Send, Play, Check 
} from 'lucide-react';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { Modal } from '../components/Modal';

export const FieldPortal = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Resolution modal
  const [resolutionModalTask, setResolutionModalTask] = useState(null);
  const [beforePhoto, setBeforePhoto] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600');
  const [afterPhoto, setAfterPhoto] = useState('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600');
  const [resolutionDesc, setResolutionDesc] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFieldTasks();
      setTasks(data.tasks || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleStateTransition = async (taskId, nextState, notes = '') => {
    try {
      await api.updateFieldTaskState(taskId, nextState, notes);
      loadTasks();
    } catch (err) {
      alert(`Error updating task: ${err.message}`);
    }
  };

  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionModalTask) return;

    try {
      await api.submitFieldResolution(resolutionModalTask.id, {
        before_photo_url: beforePhoto,
        after_photo_url: afterPhoto,
        resolution_description: resolutionDesc,
        field_notes: fieldNotes
      });
      alert('Field resolution and photographic evidence submitted successfully!');
      setResolutionModalTask(null);
      setResolutionDesc('');
      loadTasks();
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
          👷 Field Staff Mobile Task Command
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Execute on-ground civic repairs, navigate to spots, update status milestones, and submit photo evidence.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Assigned Tasks</span>
          <span className="kpi-value">{stats.total || 0}</span>
          <span className="kpi-subtext">Active work queue</span>
        </div>
        <div className="kpi-card teal">
          <span className="kpi-label">Today's Active</span>
          <span className="kpi-value">{stats.todayTasks || 0}</span>
          <span className="kpi-subtext">In progress / Arrived</span>
        </div>
        <div className="kpi-card red">
          <span className="kpi-label">High / Critical</span>
          <span className="kpi-value">{stats.highPriority || 0}</span>
          <span className="kpi-subtext">Immediate action required</span>
        </div>
        <div className="kpi-card green">
          <span className="kpi-label">Completed Work</span>
          <span className="kpi-value">{stats.completed || 0}</span>
          <span className="kpi-subtext">Sent for officer signoff</span>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading field task assignments...</div>
        ) : tasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No field tasks assigned at this moment. You are all caught up!</p>
          </div>
        ) : (
          tasks.map(task => {
            const state = task.task_state;
            const isCompleted = state === 'WORK_COMPLETED' || state === 'RESOLUTION_SUBMITTED';

            return (
              <div key={task.id} className="card" style={{ borderLeft: `5px solid ${isCompleted ? 'var(--civic-green)' : 'var(--gov-primary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-primary)', fontSize: '1.05rem' }}>
                        {task.complaint_id}
                      </strong>
                      <PriorityBadge priority={task.priority} />
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-surface-subtle)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-default)'
                      }}>
                        ⚙️ {state}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      {task.complaint_title}
                    </h3>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'right' }}>
                    Assigned by: <strong>{task.assigned_by_officer_name}</strong>
                  </div>
                </div>

                {/* Location Box */}
                <div style={{
                  background: 'var(--bg-app)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <MapPin size={16} color="var(--civic-red)" />
                    <span><strong>Location:</strong> {task.location_address} {task.landmark ? `(Landmark: ${task.landmark})` : ''}</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Citizen: <strong>{task.citizen_name}</strong> ({task.citizen_phone})
                  </div>
                </div>

                {/* Officer Notes if any */}
                {task.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                    💬 Dispatch Instructions: "{task.notes}"
                  </div>
                )}

                {/* State Progression Stepper Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {state === 'ASSIGNED' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStateTransition(task.id, 'ACCEPTED', 'Task accepted by field lead')}>
                        <Check size={14} />
                        <span>1. Accept Task</span>
                      </button>
                    )}

                    {state === 'ACCEPTED' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStateTransition(task.id, 'ARRIVED', 'Team arrived at physical location')}>
                        <Navigation size={14} />
                        <span>2. Mark Arrived on Site</span>
                      </button>
                    )}

                    {state === 'ARRIVED' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStateTransition(task.id, 'IN_PROGRESS', 'Ground excavation / repair commenced')}>
                        <Play size={14} />
                        <span>3. Start Ground Work</span>
                      </button>
                    )}

                    {state === 'IN_PROGRESS' && (
                      <button className="btn btn-teal btn-sm" onClick={() => setResolutionModalTask(task)}>
                        <Camera size={14} />
                        <span>4. Upload Evidence & Complete Work</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--civic-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={16} /> Work Completed & Evidence Submitted
                      </span>
                    )}
                  </div>

                  {!isCompleted && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const reason = prompt('Enter reason why this issue cannot be resolved on-ground:');
                        if (reason) handleStateTransition(task.id, 'CANNOT_RESOLVE', reason);
                      }}
                      style={{ color: 'var(--civic-red)' }}
                    >
                      <AlertOctagon size={13} />
                      <span>Cannot Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RESOLUTION EVIDENCE MODAL */}
      <Modal
        isOpen={!!resolutionModalTask}
        onClose={() => setResolutionModalTask(null)}
        title={resolutionModalTask ? `Submit Resolution: ${resolutionModalTask.complaint_id}` : ''}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setResolutionModalTask(null)}>Cancel</button>
            <button className="btn btn-teal" onClick={handleResolutionSubmit}>Submit for Officer Verification</button>
          </>
        }
      >
        <form onSubmit={handleResolutionSubmit}>
          <div className="form-group">
            <label className="form-label">Work Completed Description *</label>
            <textarea
              className="form-control"
              required
              placeholder="e.g. Replaced 300mm cracked pipeline with new DI K-9 grade pipe. Pressurized line, sealed joints with rubber gaskets, and backfilled trench."
              value={resolutionDesc}
              onChange={(e) => setResolutionDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Before-Repair Site Photo URL</label>
              <input
                type="text"
                className="form-control"
                value={beforePhoto}
                onChange={(e) => setBeforePhoto(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">After-Repair Site Photo URL</label>
              <input
                type="text"
                className="form-control"
                value={afterPhoto}
                onChange={(e) => setAfterPhoto(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Field Remarks / Equipment Used</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Deployed Excavator AP-28-EX-12. 4 crew members on site."
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
