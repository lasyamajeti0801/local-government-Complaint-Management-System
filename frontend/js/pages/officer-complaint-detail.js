// ============================================================
// NAGAR CONNECT - OFFICER COMPLAINT ACTION CENTER (Member 3)
// ============================================================

window.renderOfficerComplaintDetailPage = async function(container, complaintId) {
  if (!complaintId) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">No Complaint Selected</div>
        <div class="empty-state-desc">Please choose a grievance from the queue.</div>
        <a href="#officer-queue" class="btn btn-primary">Go to Complaint Queue</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#officer-dashboard">Officer Dashboard</a>
      <span class="breadcrumb-separator">/</span>
      <a href="#officer-queue">Complaint Queue</a>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active" id="detail-breadcrumb-id">Loading...</span>
    </nav>

    <div id="detail-page-content" style="padding: 2rem; text-align: center;" class="text-muted">
      Fetching grievance record from municipal registry...
    </div>
  `;

  try {
    const res = await window.api.get(`/officer/complaints/${complaintId}`);
    const c = res.data;

    const breadcrumbId = container.querySelector('#detail-breadcrumb-id');
    if (breadcrumbId) breadcrumbId.textContent = c.complaint_number;

    const sla = c.sla_metrics || {};
    let slaPillClass = 'sla-on-track';
    if (sla.slaStatus === 'OVERDUE') slaPillClass = 'sla-overdue';
    else if (sla.slaStatus === 'APPROACHING_DEADLINE') slaPillClass = 'sla-approaching';

    const formatDate = (iso) => {
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) { return iso; }
    };

    const contentEl = container.querySelector('#detail-page-content');
    contentEl.className = '';
    contentEl.style.padding = '0';
    contentEl.style.textAlign = 'left';

    contentEl.innerHTML = `
      <!-- Top Title & Badge Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); font-family: monospace;">
              ${c.complaint_number}
            </h1>
            <span class="badge badge-status-${c.status}">${c.status.replace(/_/g, ' ')}</span>
            <span class="badge badge-priority-${c.priority}">${c.priority} Priority</span>
            ${c.is_escalated ? `
              <span class="badge badge-priority-CRITICAL" style="background: #7e22ce; color: #fff;">
                🚨 Escalated (${c.escalation_level})
              </span>
            ` : ''}
          </div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-top: 0.35rem;">
            ${c.title}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
            Lodged on ${formatDate(c.created_at)} by <strong>${c.citizen_name}</strong> • Ward: ${c.ward_number || 'Zone 1'}
          </div>
        </div>

        <!-- SLA Monitoring Box -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 0.75rem 1.15rem; text-align: right; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.2rem;">
            SLA Resolution Clock
          </div>
          <div class="sla-pill ${slaPillClass}" style="font-size: 0.85rem; padding: 0.3rem 0.75rem;">
            ${sla.slaStatus === 'OVERDUE' ? '⚠️ ' : (sla.slaStatus === 'APPROACHING_DEADLINE' ? '⏳ ' : '✓ ')}
            ${sla.formattedRemaining}
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">
            Deadline: ${formatDate(c.sla_deadline)}
          </div>
        </div>
      </div>

      <!-- Main Detail Layout Grid: Details on Left (2/3), Action Center on Right (1/3) -->
      <div class="detail-layout-grid">
        
        <!-- Left Column: Grievance Details, Evidence, Shared Timeline, Comments -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Grievance Description & Location Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📍 Citizen Statement & Incident Location</div>
            </div>
            <div class="card-body">
              <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); margin-bottom: 1.25rem;">
                ${c.description}
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 0.825rem;">
                <div>
                  <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700;">Location Address</div>
                  <div style="font-weight: 600; color: var(--text-primary); margin-top: 0.15rem;">${c.location_address}</div>
                  ${c.landmark ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">Landmark: ${c.landmark}</div>` : ''}
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700;">Department & Citizen Contact</div>
                  <div style="font-weight: 600; color: var(--text-primary); margin-top: 0.15rem;">${c.department_name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">Phone: ${c.citizen_phone || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Assignment Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">👷 Field Task Allocations</div>
              ${c.assignments && c.assignments.length > 0 ? `
                <span class="badge badge-status-${c.assignments[0].status}">${c.assignments[0].status}</span>
              ` : '<span class="badge badge-priority-LOW">No Assignment</span>'}
            </div>
            <div class="card-body">
              ${c.assignments && c.assignments.length > 0 ? `
                <div>
                  ${c.assignments.map(a => `
                    <div style="padding: 0.85rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 0.6rem; background: ${a.status === 'REASSIGNED' ? 'var(--bg-secondary)' : 'var(--bg-card)'};">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <strong>${a.assigned_to_name}</strong> (${a.assigned_to_designation || 'Field Staff'})
                          <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">📞 ${a.assigned_to_phone || ''}</span>
                        </div>
                        <span class="badge ${a.status === 'REASSIGNED' ? 'badge-priority-LOW' : 'badge-status-ASSIGNED'}">${a.status}</span>
                      </div>
                      ${a.instructions ? `
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.4rem; padding-left: 0.5rem; border-left: 2px solid var(--gov-blue-500);">
                          Instructions: ${a.instructions}
                        </div>
                      ` : ''}
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
                        Assigned on ${formatDate(a.created_at)} by ${a.assigned_by_name}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
                  No field staff assigned yet. Use the Action Center on the right to dispatch a technician.
                </div>
              `}
            </div>
          </div>

          <!-- REUSABLE SHARED COMPLAINT TIMELINE (Member 2 & 3 Contract) -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🕒 Official Municipal Status Timeline</div>
              <span class="badge badge-priority-LOW">Audit Trail</span>
            </div>
            <div class="card-body">
              ${window.renderComplaintTimeline(c.timeline, c.status)}
            </div>
          </div>

          <!-- Internal Department Notes & Citizen Queries -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">💬 Department Notes & Communications</div>
              <button class="btn btn-secondary btn-sm" onclick="window.openAddNoteModal('${c.id}')">
                + Add Note
              </button>
            </div>
            <div class="card-body">
              ${c.comments && c.comments.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  ${c.comments.map(cm => `
                    <div style="padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); background: ${cm.is_internal ? 'var(--gov-blue-50)' : 'var(--bg-card)'};">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                        <div>
                          <strong>${cm.author_name}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">(${cm.author_role})</span>
                          ${cm.is_internal ? '<span class="badge badge-priority-LOW" style="margin-left: 0.4rem;">🔒 Internal Note</span>' : '<span class="badge badge-priority-MEDIUM" style="margin-left: 0.4rem;">Public Communication</span>'}
                        </div>
                        <span style="font-size: 0.72rem; color: var(--text-muted);">${formatDate(cm.created_at)}</span>
                      </div>
                      <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.4;">
                        ${cm.message}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">
                  No internal notes recorded. Use "+ Add Note" to log staff coordination.
                </div>
              `}
            </div>
          </div>

        </div>

        <!-- Right Column: Officer Action Hub (All Member 3 Actions) -->
        <div>
          <div class="action-menu-card">
            <div class="action-menu-title">
              ${window.i18n.t('actionCenterTitle')}
            </div>
            
            <div class="action-buttons-stack">
              <!-- 1. Review & Accept -->
              ${c.status === 'SUBMITTED' ? `
                <button class="btn btn-success w-full" onclick="window.actionReviewAccept('${c.id}')">
                  ${window.i18n.t('reviewAccept')}
                </button>
              ` : ''}

              <!-- 2. Assign Field Staff -->
              <button class="btn btn-primary w-full" onclick="window.actionAssignStaff('${c.id}')">
                ${window.i18n.t('assignFieldStaff')}
              </button>

              <!-- 3. Reassign Staff -->
              ${c.assignments && c.assignments.length > 0 ? `
                <button class="btn btn-secondary w-full" onclick="window.actionReassignStaff('${c.id}')">
                  ${window.i18n.t('reassign')}
                </button>
              ` : ''}

              <!-- 4. Change Priority & Recalculate SLA -->
              <button class="btn btn-secondary w-full" onclick="window.actionChangePriority('${c.id}', '${c.priority}')">
                ${window.i18n.t('changePriority')}
              </button>

              <!-- 5. Add Internal Note -->
              <button class="btn btn-secondary w-full" onclick="window.openAddNoteModal('${c.id}')">
                ${window.i18n.t('addInternalNote')}
              </button>

              <!-- 6. Request Info from Citizen -->
              <button class="btn btn-secondary w-full" onclick="window.openRequestInfoModal('${c.id}')">
                ${window.i18n.t('requestCitizenInfo')}
              </button>

              <!-- 7. Escalate Complaint -->
              ${!c.is_escalated ? `
                <button class="btn btn-warning w-full" onclick="window.actionEscalate('${c.id}')">
                  ${window.i18n.t('escalateCase')}
                </button>
              ` : ''}

              <!-- 8. Approve Resolution -->
              ${['RESOLUTION_SUBMITTED', 'IN_PROGRESS', 'ASSIGNED'].includes(c.status) ? `
                <button class="btn btn-success w-full" onclick="window.actionApproveResolution('${c.id}')">
                  ${window.i18n.t('approveResolution')}
                </button>
              ` : ''}

              <!-- 9. Reject Grievance -->
              ${!['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status) ? `
                <button class="btn btn-danger w-full" onclick="window.actionRejectGrievance('${c.id}')">
                  ${window.i18n.t('rejectGrievance')}
                </button>
              ` : ''}

              <!-- 10. Close Ticket -->
              ${c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFICATION' ? `
                <button class="btn btn-secondary w-full" onclick="window.actionCloseGrievance('${c.id}')">
                  ${window.i18n.t('closeTicket')}
                </button>
              ` : ''}
            </div>

            <!-- Department Jurisdiction Reminder -->
            <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
              Logged as Officer: <strong>${user ? user.name : 'Officer'}</strong><br />
              All actions are immutably logged into the municipal audit trail.
            </div>
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load Grievance</div>
        <div class="empty-state-desc">${err.message}</div>
        <a href="#officer-queue" class="btn btn-primary">Return to Complaint Queue</a>
      </div>
    `;
  }
};

// ------------------------------------------------------------
// OFFICER INTERACTIVE MODAL ACTIONS (Member 3 Core)
// ------------------------------------------------------------

// Action 1: Review & Accept
window.actionReviewAccept = async function(complaintId) {
  try {
    await window.api.post(`/officer/complaints/${complaintId}/status`, {
      status: 'UNDER_REVIEW',
      remarks: 'Department officer reviewed grievance details and verified jurisdictional validity.'
    });
    window.toast.success('Grievance marked as UNDER REVIEW.');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error(err.message);
  }
};

// Action 2: Assign Field Staff
window.actionAssignStaff = async function(complaintId) {
  try {
    const staffRes = await window.api.get('/officer/field-staff');
    const staffList = staffRes.data || [];

    window.modal.open({
      title: '👷 Assign Department Field Personnel',
      contentHtml: `
        <div class="form-group">
          <label class="form-label">Select Field Technician <span class="required">*</span></label>
          <select id="assign-staff-id" class="form-select" required>
            <option value="">-- Choose Field Personnel --</option>
            ${staffList.map(s => `
              <option value="${s.id}">${s.name} (${s.designation || 'Technician'}) - ${s.active_tasks_count || 0} active tasks</option>
            `).join('')}
          </select>
          <div class="form-hint">Technicians with lower active tasks are recommended for prompt resolution.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Assignment Type</label>
          <select id="assign-type" class="form-select">
            <option value="FIELD_WORK">Physical Field Repair / Work Order</option>
            <option value="VERIFICATION">Site Inspection & Verification</option>
            <option value="SUPERVISION">Technical Supervision</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Target Completion Window</label>
          <select id="assign-deadline" class="form-select">
            <option value="12">12 Hours (Emergency)</option>
            <option value="24" selected>24 Hours (Standard)</option>
            <option value="48">48 Hours</option>
            <option value="72">72 Hours</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Operational Work Instructions <span class="required">*</span></label>
          <textarea id="assign-instructions" class="form-textarea" placeholder="Detail specific tasks, materials required, and safety protocols..." required>Inspect location, repair underlying civic failure, and upload photographic resolution evidence.</textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="window.submitAssignStaff('${complaintId}')">Dispatch Technician</button>
      `
    });
  } catch (err) {
    window.toast.error('Failed to load field personnel: ' + err.message);
  }
};

window.submitAssignStaff = async function(complaintId) {
  const fieldStaffId = document.getElementById('assign-staff-id').value;
  const assignmentType = document.getElementById('assign-type').value;
  const deadlineHours = document.getElementById('assign-deadline').value;
  const instructions = document.getElementById('assign-instructions').value;

  if (!fieldStaffId) {
    window.toast.warning('Please select a field personnel.');
    return;
  }

  try {
    await window.api.post(`/officer/complaints/${complaintId}/assign`, {
      fieldStaffId,
      assignmentType,
      deadlineHours,
      instructions
    });
    window.modal.close();
    window.toast.success('Field staff assigned and dispatched.');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error('Assignment failed: ' + err.message);
  }
};

// Action 3: Reassign Field Staff
window.actionReassignStaff = async function(complaintId) {
  try {
    const staffRes = await window.api.get('/officer/field-staff');
    const staffList = staffRes.data || [];

    window.modal.open({
      title: '🔄 Reassign Field Technician',
      contentHtml: `
        <div class="form-group">
          <label class="form-label">Select Replacement Technician <span class="required">*</span></label>
          <select id="reassign-staff-id" class="form-select" required>
            <option value="">-- Choose New Technician --</option>
            ${staffList.map(s => `
              <option value="${s.id}">${s.name} (${s.designation || 'Technician'}) - ${s.active_tasks_count || 0} active tasks</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Official Reason for Reassignment <span class="required">*</span></label>
          <select id="reassign-reason-select" class="form-select">
            <option value="Staff engaged in emergency breakdown">Staff engaged in emergency breakdown</option>
            <option value="Workload balancing">Workload balancing</option>
            <option value="Technical specialization required">Technical specialization required</option>
            <option value="Staff unavailable or on medical leave">Staff unavailable or on medical leave</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Updated Instructions</label>
          <textarea id="reassign-instructions" class="form-textarea" placeholder="Provide context to new technician...">Take over grievance resolution from previous crew and execute immediate remedial works.</textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="window.submitReassignStaff('${complaintId}')">Confirm Reassignment</button>
      `
    });
  } catch (err) {
    window.toast.error('Failed to load field personnel: ' + err.message);
  }
};

window.submitReassignStaff = async function(complaintId) {
  const newFieldStaffId = document.getElementById('reassign-staff-id').value;
  const reason = document.getElementById('reassign-reason-select').value;
  const instructions = document.getElementById('reassign-instructions').value;

  if (!newFieldStaffId) {
    window.toast.warning('Please select a replacement technician.');
    return;
  }

  try {
    await window.api.post(`/officer/complaints/${complaintId}/reassign`, {
      newFieldStaffId,
      reason,
      instructions
    });
    window.modal.close();
    window.toast.success('Grievance reassigned to new technician.');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error('Reassignment failed: ' + err.message);
  }
};

// Action 4: Change Priority & Recalculate SLA
window.actionChangePriority = function(complaintId, currentPriority) {
  window.modal.open({
    title: '⚡ Modify Priority & Recalculate SLA',
    contentHtml: `
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        Changing priority immediately recalculates the legal SLA deadline according to municipal policy.
      </div>

      <div class="form-group">
        <label class="form-label">New Priority Level <span class="required">*</span></label>
        <select id="change-priority-val" class="form-select">
          <option value="CRITICAL" ${currentPriority === 'CRITICAL' ? 'selected' : ''}>CRITICAL (12 Hours SLA)</option>
          <option value="HIGH" ${currentPriority === 'HIGH' ? 'selected' : ''}>HIGH (24 Hours SLA)</option>
          <option value="MEDIUM" ${currentPriority === 'MEDIUM' ? 'selected' : ''}>MEDIUM (72 Hours SLA)</option>
          <option value="LOW" ${currentPriority === 'LOW' ? 'selected' : ''}>LOW (120 Hours SLA)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Officer Justification <span class="required">*</span></label>
        <textarea id="change-priority-reason" class="form-textarea" placeholder="Explain reason for priority revision..." required>On-site inspection revealed severe public impact requiring priority adjustment.</textarea>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="window.submitChangePriority('${complaintId}')">Update Priority</button>
    `
  });
};

window.submitChangePriority = async function(complaintId) {
  const priority = document.getElementById('change-priority-val').value;
  const reason = document.getElementById('change-priority-reason').value;

  try {
    await window.api.post(`/officer/complaints/${complaintId}/priority`, { priority, reason });
    window.modal.close();
    window.toast.success(`Priority updated to ${priority} and SLA recalculated.`);
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error('Failed to change priority: ' + err.message);
  }
};

// Action 5: Add Internal Note
window.openAddNoteModal = function(complaintId) {
  window.modal.open({
    title: '🔒 Add Department Internal Note',
    contentHtml: `
      <div class="form-group">
        <label class="form-label">Internal Department Note (Staff Only)</label>
        <textarea id="note-message" class="form-textarea" placeholder="Internal communication between officers and field personnel (hidden from citizen)..." required></textarea>
        <div class="form-hint">🔒 This note will only be visible to department officers and staff.</div>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="window.submitAddNote('${complaintId}', 1)">Save Internal Note</button>
    `
  });
};

// Action 6: Request Information from Citizen
window.openRequestInfoModal = function(complaintId) {
  window.modal.open({
    title: '✉️ Send Query / Request Information from Citizen',
    contentHtml: `
      <div class="form-group">
        <label class="form-label">Message to Citizen</label>
        <textarea id="query-message" class="form-textarea" placeholder="Ask for landmark clarification, specific door number, or convenient inspection time..." required>Dear Citizen, please provide additional landmark details or confirm if inspection can be carried out today.</textarea>
        <div class="form-hint">📢 This query will appear on the citizen's complaint timeline and trigger an SMS/portal notification.</div>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="window.submitAddNote('${complaintId}', 0)">Send to Citizen</button>
    `
  });
};

window.submitAddNote = async function(complaintId, isInternal) {
  const el = document.getElementById(isInternal ? 'note-message' : 'query-message');
  const message = el ? el.value.trim() : '';

  if (!message) {
    window.toast.warning('Message cannot be empty.');
    return;
  }

  try {
    await window.api.post(`/officer/complaints/${complaintId}/notes`, {
      message,
      commentType: isInternal ? 'INTERNAL_NOTE' : 'CITIZEN_COMMUNICATION',
      isInternal
    });
    window.modal.close();
    window.toast.success(isInternal ? 'Internal note added.' : 'Message sent to citizen.');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error('Failed to add note: ' + err.message);
  }
};

// Action 7: Escalate Complaint
window.actionEscalate = function(complaintId) {
  window.modal.open({
    title: '🚨 Escalate Grievance to Higher Authority',
    contentHtml: `
      <div style="font-size: 0.85rem; color: var(--crimson-600); margin-bottom: 1rem; font-weight: 600;">
        ⚠️ Escalations notify the Assistant Commissioner and Municipal Commissioner immediately.
      </div>

      <div class="form-group">
        <label class="form-label">Escalation Level <span class="required">*</span></label>
        <select id="esc-level" class="form-select">
          <option value="L1_OFFICER">Level 1 - Executive Engineer / Assistant Commissioner</option>
          <option value="L2_COMMISSIONER">Level 2 - Additional Municipal Commissioner</option>
          <option value="L3_ADMIN">Level 3 - Municipal Commissioner & District Magistrate</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Escalation Reason <span class="required">*</span></label>
        <select id="esc-reason" class="form-select">
          <option value="SLA_BREACH">SLA Breach / Persistent Delay</option>
          <option value="PUBLIC_SAFETY">Imminent Hazard to Public Safety</option>
          <option value="RESOURCE_SHORTAGE">Specialized Heavy Machinery / Budget Required</option>
          <option value="TECHNICAL_COMPLEXITY">Inter-departmental Coordination Required</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Officer Notes & Recommendations</label>
        <textarea id="esc-notes" class="form-textarea" placeholder="Detail reason for escalation and requested administrative assistance..."></textarea>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
      <button class="btn btn-danger" onclick="window.submitEscalate('${complaintId}')">Execute Escalation</button>
    `
  });
};

window.submitEscalate = async function(complaintId) {
  const escalationLevel = document.getElementById('esc-level').value;
  const reason = document.getElementById('esc-reason').value;
  const notes = document.getElementById('esc-notes').value;

  try {
    await window.api.post(`/officer/complaints/${complaintId}/escalate`, {
      escalationLevel,
      reason,
      notes
    });
    window.modal.close();
    window.toast.success('Complaint successfully escalated to higher authority.');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error('Escalation failed: ' + err.message);
  }
};

// Action 8: Approve Resolution
window.actionApproveResolution = function(complaintId) {
  window.modal.open({
    title: '✅ Approve Field Resolution',
    contentHtml: `
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        Confirm that field maintenance work has been inspected and satisfies municipal engineering quality standards.
      </div>

      <div class="form-group">
        <label class="form-label">Officer Verification Remarks <span class="required">*</span></label>
        <textarea id="approve-remarks" class="form-textarea" placeholder="Summarize inspection results..." required>On-site inspection completed. Civil / engineering works verified satisfactory and compliant with municipal quality norms.</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Next Workflow Step</label>
        <select id="approve-direct-close" class="form-select">
          <option value="false">Move to Citizen Verification & Rating (Recommended)</option>
          <option value="true">Directly Mark Resolved & Closed</option>
        </select>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
      <button class="btn btn-success" onclick="window.submitApproveResolution('${complaintId}')">Approve Resolution</button>
    `
  });
};

window.submitApproveResolution = async function(complaintId) {
  const remarks = document.getElementById('approve-remarks').value;
  const directClose = document.getElementById('approve-direct-close').value === 'true';

  try {
    await window.api.post(`/officer/complaints/${complaintId}/approve`, {
      remarks,
      directClose
    });
    window.modal.close();
    window.toast.success('Resolution verified and approved!');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error('Approval failed: ' + err.message);
  }
};

// Action 9: Reject Grievance
window.actionRejectGrievance = function(complaintId) {
  window.modal.open({
    title: '✕ Reject Grievance',
    contentHtml: `
      <div style="font-size: 0.85rem; color: var(--crimson-600); margin-bottom: 1rem;">
        Rejecting a grievance requires formal administrative grounds recorded in the public register.
      </div>

      <div class="form-group">
        <label class="form-label">Rejection Reason <span class="required">*</span></label>
        <select id="reject-reason-select" class="form-select">
          <option value="Outside Municipal Corporation Limits">Outside Municipal Corporation Limits</option>
          <option value="Private Property Dispute (Civil Court Jurisdiction)">Private Property Dispute (Civil Court Jurisdiction)</option>
          <option value="Duplicate Grievance Entry">Duplicate Grievance Entry</option>
          <option value="Incomplete or Untraceable Address">Incomplete or Untraceable Address</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Detailed Official Remarks <span class="required">*</span></label>
        <textarea id="reject-remarks" class="form-textarea" placeholder="Detail reason for rejection..." required></textarea>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
      <button class="btn btn-danger" onclick="window.submitRejectGrievance('${complaintId}')">Confirm Rejection</button>
    `
  });
};

window.submitRejectGrievance = async function(complaintId) {
  const reason = document.getElementById('reject-reason-select').value;
  const notes = document.getElementById('reject-remarks').value.trim();
  const remarks = `${reason}. ${notes}`;

  try {
    await window.api.post(`/officer/complaints/${complaintId}/status`, {
      status: 'REJECTED',
      remarks
    });
    window.modal.close();
    window.toast.info('Grievance marked as REJECTED.');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error('Failed to reject grievance: ' + err.message);
  }
};

// Action 10: Close Grievance
window.actionCloseGrievance = async function(complaintId) {
  try {
    await window.api.post(`/officer/complaints/${complaintId}/status`, {
      status: 'CLOSED',
      remarks: 'Formally closed in municipal records following satisfaction and resolution approval.'
    });
    window.toast.success('Grievance formally closed in records.');
    window.renderOfficerComplaintDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error(err.message);
  }
};
