// ============================================================
// NAGAR CONNECT - CITIZEN COMPLAINT DETAIL & FEEDBACK (Member 2)
// ============================================================

window.renderCitizenDetailPage = async function(container, complaintId) {
  if (!complaintId) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">No Complaint Selected</div>
        <a href="#citizen-dashboard" class="btn btn-primary">Go to My Grievances</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#citizen-dashboard">My Grievances</a>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active" id="cit-detail-breadcrumb">Grievance Detail</span>
    </nav>

    <div id="cit-detail-loading" style="padding: 2rem; text-align: center;" class="text-muted">
      Loading grievance status from municipal portal...
    </div>
    <div id="cit-detail-content" class="hidden"></div>
  `;

  try {
    const res = await window.api.get(`/citizen/complaints/${complaintId}`);
    const c = res.data;

    container.querySelector('#cit-detail-loading').remove();
    const contentEl = container.querySelector('#cit-detail-content');
    contentEl.classList.remove('hidden');

    container.querySelector('#cit-detail-breadcrumb').textContent = c.complaint_number;

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

    contentEl.innerHTML = `
      <!-- Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); font-family: monospace;">
              ${c.complaint_number}
            </h1>
            <span class="badge badge-status-${c.status}">${c.status.replace(/_/g, ' ')}</span>
            <span class="badge badge-priority-${c.priority}">${c.priority} Priority</span>
          </div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-top: 0.35rem;">
            ${c.title}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
            Department: <strong>${c.department_name}</strong> • ${c.category_name}
          </div>
        </div>

        <!-- SLA Card -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 0.75rem 1.15rem; text-align: right;">
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
            SLA Resolution Clock
          </div>
          <div class="sla-pill ${slaPillClass}" style="margin-top: 0.2rem;">
            ${sla.formattedRemaining}
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
        <!-- Left Column: Location, Timeline, Resolution -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Grievance Statement -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📍 Registered Incident Details</div>
            </div>
            <div class="card-body">
              <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); margin-bottom: 1rem;">
                ${c.description}
              </div>
              <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 0.825rem;">
                <div><strong>Location:</strong> ${c.location_address}</div>
                ${c.landmark ? `<div><strong>Landmark:</strong> ${c.landmark}</div>` : ''}
                <div><strong>Ward:</strong> ${c.ward_number || 'Zone 1'}</div>
              </div>
            </div>
          </div>

          <!-- Official Timeline (Reused Component) -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🕒 Grievance Progress & Audit Timeline</div>
            </div>
            <div class="card-body">
              ${window.renderComplaintTimeline(c.timeline, c.status)}
            </div>
          </div>

        </div>

        <!-- Right Column: Resolution & Feedback Rating -->
        <div>
          <!-- Resolution & Citizen Feedback Card -->
          <div class="card" style="position: sticky; top: 80px;">
            <div class="card-header">
              <div class="card-title">⭐ Grievance Feedback</div>
            </div>
            <div class="card-body">
              ${c.status === 'CITIZEN_VERIFICATION' || c.status === 'RESOLVED' || c.status === 'CLOSED' ? `
                <div style="margin-bottom: 1.25rem;">
                  <div style="font-weight: 700; color: var(--emerald-700); margin-bottom: 0.4rem;">
                    ✓ Work Completed by Municipality
                  </div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-md);">
                    ${c.resolution_summary || 'The assigned department maintenance squad has completed site repairs.'}
                  </div>
                </div>

                ${c.feedback ? `
                  <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                    <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">
                      Your Submitted Rating: ${'★'.repeat(c.feedback.rating)}${'☆'.repeat(5 - c.feedback.rating)}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem;">
                      "${c.feedback.comment || 'Verified and confirmed.'}"
                    </div>
                  </div>
                ` : `
                  <!-- Rating Form -->
                  <form id="citizen-feedback-form">
                    <div class="form-group">
                      <label class="form-label">Rate Quality of Municipal Work</label>
                      <div class="star-rating" id="star-selector">
                        <span class="star selected" data-val="1">★</span>
                        <span class="star selected" data-val="2">★</span>
                        <span class="star selected" data-val="3">★</span>
                        <span class="star selected" data-val="4">★</span>
                        <span class="star selected" data-val="5">★</span>
                      </div>
                      <input type="hidden" id="rating-val" value="5" />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Citizen Comments</label>
                      <textarea id="feedback-comment" class="form-textarea" placeholder="Share your experience with Nagar Municipal Corporation..." required>The issue was satisfactorily resolved by the municipal team.</textarea>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                      <button type="submit" class="btn btn-success w-full" id="btn-submit-rating">
                        ✓ Accept Resolution & Close
                      </button>
                      <button type="button" class="btn btn-danger w-full" onclick="window.citizenReopenComplaint('${c.id}')">
                        ⚠️ Unsatisfied? Reopen Grievance
                      </button>
                    </div>
                  </form>
                `}
              ` : `
                <div style="text-align: center; padding: 1.5rem 0.5rem; color: var(--text-muted); font-size: 0.85rem;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚙️</div>
                  <div>Grievance is currently <strong>${c.status.replace(/_/g, ' ')}</strong>.</div>
                  <div style="margin-top: 0.35rem; font-size: 0.75rem;">
                    Once department work is completed, you can inspect the site and submit your satisfaction rating here.
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>

      </div>
    `;

    // Attach feedback star click handlers
    const starSelector = contentEl.querySelector('#star-selector');
    if (starSelector) {
      const stars = starSelector.querySelectorAll('.star');
      const ratingInput = contentEl.querySelector('#rating-val');
      stars.forEach(s => {
        s.onclick = () => {
          const val = parseInt(s.getAttribute('data-val'));
          ratingInput.value = val;
          stars.forEach(other => {
            const oVal = parseInt(other.getAttribute('data-val'));
            if (oVal <= val) other.classList.add('selected');
            else other.classList.remove('selected');
          });
        };
      });

      const feedbackForm = contentEl.querySelector('#citizen-feedback-form');
      feedbackForm.onsubmit = async (e) => {
        e.preventDefault();
        const rating = parseInt(ratingInput.value);
        const comment = contentEl.querySelector('#feedback-comment').value.trim();

        try {
          await window.api.post(`/citizen/complaints/${c.id}/feedback`, {
            rating,
            comment,
            reopen: false
          });
          window.toast.success('Thank you for rating municipal service! Ticket formally closed.');
          window.renderCitizenDetailPage(container, complaintId);
        } catch (err) {
          window.toast.error(err.message);
        }
      };
    }
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to Load Grievance</div>
        <div class="empty-state-desc">${err.message}</div>
        <a href="#citizen-dashboard" class="btn btn-primary">Back to Grievances</a>
      </div>
    `;
  }
};

window.citizenReopenComplaint = function(complaintId) {
  window.modal.open({
    title: '⚠️ Reopen Grievance',
    contentHtml: `
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        If the civic issue was not fixed or the problem recurred, explain why and request re-inspection:
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Reopening <span class="required">*</span></label>
        <textarea id="reopen-reason-text" class="form-textarea" placeholder="Detail why the resolution was unsatisfactory..." required>Water pipeline leak persists at the same spot after pressure was restored.</textarea>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" onclick="window.modal.close()">Cancel</button>
      <button class="btn btn-danger" onclick="window.submitReopenComplaint('${complaintId}')">Reopen Grievance</button>
    `
  });
};

window.submitReopenComplaint = async function(complaintId) {
  const reason = document.getElementById('reopen-reason-text').value.trim();
  if (!reason) {
    window.toast.warning('Please enter a reason for reopening.');
    return;
  }

  try {
    await window.api.post(`/citizen/complaints/${complaintId}/feedback`, {
      rating: 1,
      comment: 'Reopened by citizen: ' + reason,
      reopen: true,
      reopen_reason: reason
    });
    window.modal.close();
    window.toast.warning('Grievance has been reopened and escalated to department officer.');
    window.renderCitizenDetailPage(document.getElementById('main-content'), complaintId);
  } catch (err) {
    window.toast.error(err.message);
  }
};
