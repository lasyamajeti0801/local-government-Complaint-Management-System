// ============================================================
// NAGAR CONNECT - CITIZEN GRIEVANCE LODGING (Member 2 Foundation)
// ============================================================

window.renderCitizenCreatePage = async function(container) {
  const user = window.auth.getUser();

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#citizen-dashboard">My Grievances</a>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">Lodge New Grievance</span>
    </nav>

    <div class="card complaint-form-card" style="box-shadow: var(--shadow-md);">
      <div class="card-header" style="background: var(--bg-secondary); border-bottom: 2px solid var(--gov-blue-600);">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
            ✍️ Public Grievance Registration Form
          </h2>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
            Municipal Corporation of Nagar • Statutory Citizen Charter
          </div>
        </div>
      </div>

      <div class="card-body">
        <form id="complaint-submission-form">
          <!-- Step 1: Department & Category Selection -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="form-dept">Target Municipal Department <span class="required">*</span></label>
              <select id="form-dept" class="form-select" required>
                <option value="">-- Choose Municipal Department --</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="form-cat">Grievance Category <span class="required">*</span></label>
              <select id="form-cat" class="form-select" required disabled>
                <option value="">-- Select Department First --</option>
              </select>
            </div>
          </div>

          <!-- Step 2: Title & Detailed Description -->
          <div class="form-group">
            <label class="form-label" for="form-title">Grievance Subject / Title <span class="required">*</span></label>
            <input type="text" id="form-title" class="form-control" placeholder="e.g. Broken water supply pipeline flooding main road" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="form-desc">Detailed Description of Problem <span class="required">*</span></label>
            <textarea id="form-desc" class="form-textarea" placeholder="Please describe the civic issue, duration of problem, and public impact..." required></textarea>
          </div>

          <!-- Step 3: Location, Landmark & Ward -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="form-location">Incident Address / Colony / Street <span class="required">*</span></label>
              <input type="text" id="form-location" class="form-control" placeholder="e.g. House #14, Main Road, Gandhi Nagar" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="form-landmark">Prominent Landmark</label>
              <input type="text" id="form-landmark" class="form-control" placeholder="e.g. Opposite State Bank ATM, near Community Park" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="form-ward">Municipal Ward Number</label>
              <input type="text" id="form-ward" class="form-control" placeholder="e.g. Ward 14" value="${user ? user.ward_number || 'Ward 14' : 'Ward 14'}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="form-priority">Citizen Priority Assessment</label>
              <select id="form-priority" class="form-select">
                <option value="CRITICAL">CRITICAL - Severe Hazard / Flooding / Electrocution</option>
                <option value="HIGH">HIGH - Serious Civic Disruption / Contamination</option>
                <option value="MEDIUM" selected>MEDIUM - Standard Civic Maintenance</option>
                <option value="LOW">LOW - Non-Urgent Inspection</option>
              </select>
            </div>
          </div>

          <!-- Step 4: Photo / Video Attachment Simulation -->
          <div class="form-group">
            <label class="form-label">Evidence Photos / Video (Optional)</label>
            <div class="file-dropzone" id="file-drop-area">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
              <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Click or Drag & Drop Photos Here</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Supports JPG, PNG up to 10MB</div>
              <div id="file-selected-name" style="font-weight: 700; color: var(--emerald-600); margin-top: 0.5rem;"></div>
            </div>
            <input type="file" id="file-input" style="display: none;" accept="image/*,video/*" />
          </div>

          <!-- Submit Buttons -->
          <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
            <a href="#citizen-dashboard" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-complaint">
              📤 Register Municipal Grievance
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Fetch departments and categories
  try {
    const deptRes = await window.api.get('/citizen/departments');
    const departments = deptRes.data || [];
    const deptSelect = container.querySelector('#form-dept');
    const catSelect = container.querySelector('#form-cat');

    departments.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.name} (${d.code})`;
      deptSelect.appendChild(opt);
    });

    deptSelect.onchange = async () => {
      const deptId = deptSelect.value;
      if (!deptId) {
        catSelect.innerHTML = '<option value="">-- Select Department First --</option>';
        catSelect.disabled = true;
        return;
      }

      catSelect.disabled = false;
      catSelect.innerHTML = '<option value="">Loading categories...</option>';

      try {
        const catRes = await window.api.get('/citizen/categories', { department_id: deptId });
        const cats = catRes.data || [];
        catSelect.innerHTML = '<option value="">-- Choose Category --</option>';
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.name} (${c.default_priority} - ${c.default_sla_hours}h SLA)`;
          catSelect.appendChild(opt);
        });
      } catch (e) {
        catSelect.innerHTML = '<option value="">Failed to load categories</option>';
      }
    };
  } catch (err) {
    window.toast.error('Failed to load department metadata.');
  }

  // File Dropzone Interaction
  const dropArea = container.querySelector('#file-drop-area');
  const fileInput = container.querySelector('#file-input');
  const fileNameDisplay = container.querySelector('#file-selected-name');

  dropArea.onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
      fileNameDisplay.textContent = `Attached: ${e.target.files[0].name} (${Math.round(e.target.files[0].size / 1024)} KB)`;
    }
  };

  // Form submission handler
  const form = container.querySelector('#complaint-submission-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = container.querySelector('#btn-submit-complaint');

    const data = {
      department_id: container.querySelector('#form-dept').value,
      category_id: container.querySelector('#form-cat').value,
      title: container.querySelector('#form-title').value.trim(),
      description: container.querySelector('#form-desc').value.trim(),
      location_address: container.querySelector('#form-location').value.trim(),
      landmark: container.querySelector('#form-landmark').value.trim(),
      ward_number: container.querySelector('#form-ward').value.trim(),
      priority: container.querySelector('#form-priority').value
    };

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering grievance...';
      const res = await window.api.post('/citizen/complaints', data);
      window.toast.success(`Complaint registered successfully! ID: ${res.data.complaint_number}`);
      window.location.hash = `#citizen-detail?id=${res.data.id}`;
    } catch (err) {
      window.toast.error(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = '📤 Register Municipal Grievance';
    }
  };
};
