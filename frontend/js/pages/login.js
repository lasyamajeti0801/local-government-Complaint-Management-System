// ============================================================
// NAGAR CONNECT - LOGIN PAGE (With 1-Click Demo Profiles)
// ============================================================

window.renderLoginPage = function(container) {
  container.innerHTML = `
    <div style="max-width: 900px; margin: 2rem auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 2rem; align-items: start;">
      
      <!-- Left Column: Official Authentication Card -->
      <div class="card" style="box-shadow: var(--shadow-lg);">
        <div class="card-header" style="background: linear-gradient(135deg, var(--gov-blue-800), var(--gov-blue-900)); color: white; padding: 1.5rem;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--saffron-500); font-weight: 700;">
              Government e-Governance Single Sign-On
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 800; margin-top: 0.2rem;">
              🏛️ Nagar Connect Login
            </h2>
            <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.25rem;">
              Authorized access for Citizens, Department Officers & Staff
            </div>
          </div>
        </div>

        <div class="card-body" style="padding: 1.75rem;">
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Official Email Address <span class="required">*</span></label>
              <input type="email" id="login-email" class="form-control" placeholder="e.g. officer.water@nagarconnect.gov.in" required value="officer.water@nagarconnect.gov.in" />
              <div class="form-hint">Use your registered municipal email ID.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Password <span class="required">*</span></label>
              <input type="password" id="login-password" class="form-control" placeholder="••••••••" required value="Officer@123" />
            </div>

            <div style="margin: 1.5rem 0 1rem;">
              <button type="submit" class="btn btn-primary btn-lg w-full" id="btn-submit-login">
                🔐 Sign In to Portal
              </button>
            </div>
          </form>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 1.25rem; font-size: 0.78rem; color: var(--text-muted); text-align: center;">
            🔒 Protected by 256-bit State e-Governance Encryption. Unauthorized access is punishable under IT Act, 2000.
          </div>
        </div>
      </div>

      <!-- Right Column: 1-Click Demo Profiles (Essential for Reviewers!) -->
      <div class="card" style="border-top: 4px solid var(--gov-blue-600);">
        <div class="card-header">
          <div class="card-title">
            ⚡ Quick Demo Accounts
          </div>
          <span class="badge badge-priority-LOW">Click to Log In</span>
        </div>

        <div class="card-body" style="padding: 1.25rem;">
          <div style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Click any municipal persona below to immediately log in and inspect their portal views:
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <!-- Officer: Water Supply (Member 3 Primary Role) -->
            <button class="btn btn-secondary w-full" style="justify-content: flex-start; padding: 0.75rem 1rem; border-left: 4px solid var(--gov-blue-700);" onclick="window.loginDemo('OFFICER_WATER')">
              <div style="text-align: left; width: 100%;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--gov-blue-800);">💧 Rajesh Varma, EE (Water Supply)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Role: <strong>OFFICER</strong> • Manage queue, review, assign field staff, SLA</div>
              </div>
            </button>

            <!-- Officer: Sanitation -->
            <button class="btn btn-secondary w-full" style="justify-content: flex-start; padding: 0.75rem 1rem; border-left: 4px solid var(--civic-teal-700);" onclick="window.loginDemo('OFFICER_SANITATION')">
              <div style="text-align: left; width: 100%;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--civic-teal-700);">🧹 Meera Joshi, CHO (Sanitation)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Role: <strong>OFFICER</strong> • Public health & garbage grievances</div>
              </div>
            </button>

            <!-- Officer: Roads -->
            <button class="btn btn-secondary w-full" style="justify-content: flex-start; padding: 0.75rem 1rem; border-left: 4px solid var(--saffron-600);" onclick="window.loginDemo('OFFICER_ROADS')">
              <div style="text-align: left; width: 100%;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--saffron-600);">🛣️ K. Venkatesh, EE (Roads & Infra)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Role: <strong>OFFICER</strong> • Potholes, medians & footpath repairs</div>
              </div>
            </button>

            <!-- Citizen: Anita Rao -->
            <button class="btn btn-secondary w-full" style="justify-content: flex-start; padding: 0.75rem 1rem; border-left: 4px solid var(--emerald-600);" onclick="window.loginDemo('CITIZEN')">
              <div style="text-align: left; width: 100%;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--emerald-700);">👤 Anita Rao (Resident, Ward 14)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Role: <strong>CITIZEN</strong> • Lodge grievance, track timeline, give feedback</div>
              </div>
            </button>

            <!-- Field Staff: Ramesh Kumar -->
            <button class="btn btn-secondary w-full" style="justify-content: flex-start; padding: 0.75rem 1rem; border-left: 4px solid #64748b;" onclick="window.loginDemo('FIELD_WATER')">
              <div style="text-align: left; width: 100%;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">👷 Ramesh Kumar (Water Lineman)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Role: <strong>FIELD_STAFF</strong> • View assigned tasks, field updates</div>
              </div>
            </button>

            <!-- Commissioner -->
            <button class="btn btn-secondary w-full" style="justify-content: flex-start; padding: 0.75rem 1rem; border-left: 4px solid #9333ea;" onclick="window.loginDemo('COMMISSIONER')">
              <div style="text-align: left; width: 100%;">
                <div style="font-weight: 700; font-size: 0.85rem; color: #7e22ce;">⭐ Dr. S. R. Krishnan, IAS (Commissioner)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Role: <strong>COMMISSIONER</strong> • Executive civic oversight & escalations</div>
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Attach submit handler
  const form = container.querySelector('#login-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = container.querySelector('#login-email').value;
      const password = container.querySelector('#login-password').value;
      const submitBtn = container.querySelector('#btn-submit-login');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying credentials...';
        await window.auth.login(email, password);
        window.toast.success('Logged in successfully!');
      } catch (err) {
        window.toast.error(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = '🔐 Sign In to Portal';
      }
    };
  }
};

window.loginDemo = async function(roleKey) {
  try {
    await window.auth.quickLogin(roleKey);
    window.toast.success(`Logged in as ${window.auth.DEMO_ACCOUNTS[roleKey].name}`);
  } catch (err) {
    window.toast.error(err.message);
  }
};
