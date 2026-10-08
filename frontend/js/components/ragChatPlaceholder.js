// ============================================================
// NAGAR CONNECT - MUNICIPAL CIVIC INTELLIGENCE ASSISTANT
// Full Interactive Assistant & Member 5 Central RAG Ready
// ============================================================

window.renderRAGChatPanel = function() {
  const existing = document.getElementById('rag-assistant-widget');
  if (existing) return;

  const widget = document.createElement('div');
  widget.id = 'rag-assistant-widget';
  widget.style.position = 'fixed';
  widget.style.bottom = '1.5rem';
  widget.style.right = '1.5rem';
  widget.style.zIndex = '90';

  widget.innerHTML = `
    <!-- Floating Trigger Button -->
    <button id="btn-toggle-rag" style="background: var(--gov-blue-800); color: #fff; border: 2px solid var(--saffron-500); border-radius: var(--radius-full); padding: 0.65rem 1.15rem; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; box-shadow: var(--shadow-lg); transition: transform 0.2s;">
      🤖 <span>Municipal AI Assistant</span>
    </button>

    <!-- Collapsible Chat Window Container -->
    <div id="rag-chat-drawer" style="display: none; position: absolute; bottom: 50px; right: 0; width: 380px; height: 500px; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); flex-direction: column; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, var(--gov-blue-900), var(--gov-blue-800)); color: white; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 0.45rem; font-weight: 700; font-size: 0.9rem;">
          🏛️ <span>Nagar Civic Intelligence (AI)</span>
        </div>
        <button id="btn-close-rag" style="background: none; border: none; color: #cbd5e1; cursor: pointer; font-size: 1.2rem; line-height: 1;">&times;</button>
      </div>

      <!-- Messages Stream -->
      <div id="rag-messages-container" style="flex: 1; padding: 1rem; overflow-y: auto; font-size: 0.825rem; display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-primary);">
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
          <div style="font-weight: 700; color: var(--gov-blue-700); margin-bottom: 0.2rem;">🏛️ Welcome to Nagar Connect AI</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
            I can assist you with municipal bylaws, SLA deadlines, grievance procedures, and departmental contacts.
          </div>
        </div>

        <!-- Quick Question Chips -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;" id="rag-chips-container">
          <button class="rag-chip" style="font-size: 0.7rem; padding: 0.25rem 0.55rem; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-full); cursor: pointer; color: var(--gov-blue-800);">⏱️ What is the SLA deadline?</button>
          <button class="rag-chip" style="font-size: 0.7rem; padding: 0.25rem 0.55rem; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-full); cursor: pointer; color: var(--gov-blue-800);">💧 Report water leakage</button>
          <button class="rag-chip" style="font-size: 0.7rem; padding: 0.25rem 0.55rem; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-full); cursor: pointer; color: var(--gov-blue-800);">📞 Municipal Helpline</button>
          <button class="rag-chip" style="font-size: 0.7rem; padding: 0.25rem 0.55rem; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-full); cursor: pointer; color: var(--gov-blue-800);">🚨 How to escalate?</button>
        </div>
      </div>

      <!-- Input Form -->
      <form id="rag-chat-form" style="padding: 0.75rem; background: var(--bg-card); border-top: 1px solid var(--border-subtle); display: flex; gap: 0.5rem; align-items: center;">
        <input type="text" id="rag-input" placeholder="Ask about municipal policies or grievances..." class="form-control" style="font-size: 0.8rem; padding: 0.45rem 0.65rem;" autocomplete="off" required />
        <button type="submit" class="btn btn-primary btn-sm" id="btn-send-rag" style="padding: 0.45rem 0.85rem;">Send</button>
      </form>
    </div>
  `;

  document.body.appendChild(widget);

  const toggleBtn = widget.querySelector('#btn-toggle-rag');
  const closeBtn = widget.querySelector('#btn-close-rag');
  const drawer = widget.querySelector('#rag-chat-drawer');
  const chatForm = widget.querySelector('#rag-chat-form');
  const inputEl = widget.querySelector('#rag-input');
  const messagesEl = widget.querySelector('#rag-messages-container');

  toggleBtn.onclick = () => {
    const isVisible = drawer.style.display === 'flex';
    drawer.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) inputEl.focus();
  };

  closeBtn.onclick = () => {
    drawer.style.display = 'none';
  };

  // Add click listener to quick chips
  widget.querySelectorAll('.rag-chip').forEach(chip => {
    chip.onclick = () => {
      const text = chip.textContent.replace(/^[^a-zA-Z0-9]+/, '').trim();
      inputEl.value = text;
      handleSendMessage(text);
    };
  });

  chatForm.onsubmit = (e) => {
    e.preventDefault();
    const query = inputEl.value.trim();
    if (!query) return;
    inputEl.value = '';
    handleSendMessage(query);
  };

  function appendMessage(sender, text, isAi = false) {
    const msgDiv = document.createElement('div');
    msgDiv.style.maxWidth = '85%';
    msgDiv.style.alignSelf = isAi ? 'flex-start' : 'flex-end';
    msgDiv.style.padding = '0.65rem 0.85rem';
    msgDiv.style.borderRadius = isAi ? '0 var(--radius-lg) var(--radius-lg) var(--radius-lg)' : 'var(--radius-lg) 0 var(--radius-lg) var(--radius-lg)';
    msgDiv.style.background = isAi ? 'var(--bg-card)' : 'var(--gov-blue-700)';
    msgDiv.style.color = isAi ? 'var(--text-primary)' : '#ffffff';
    msgDiv.style.border = isAi ? '1px solid var(--border-subtle)' : 'none';
    msgDiv.style.boxShadow = 'var(--shadow-sm)';
    msgDiv.style.lineHeight = '1.4';
    msgDiv.innerHTML = text;
    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function handleSendMessage(query) {
    appendMessage('You', query, false);

    // Thinking indicator
    const thinkingDiv = document.createElement('div');
    thinkingDiv.style.alignSelf = 'flex-start';
    thinkingDiv.style.padding = '0.5rem 0.75rem';
    thinkingDiv.style.fontSize = '0.75rem';
    thinkingDiv.style.color = 'var(--text-muted)';
    thinkingDiv.innerHTML = '🤖 <em>Consulting municipal knowledge base...</em>';
    messagesEl.appendChild(thinkingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    setTimeout(() => {
      thinkingDiv.remove();
      const answer = generateCivicAnswer(query);
      appendMessage('AI', answer, true);
    }, 450);
  }

  function generateCivicAnswer(query) {
    const q = query.toLowerCase();

    if (q.includes('sla') || q.includes('time') || q.includes('deadline')) {
      return `⏱️ <strong>Statutory Municipal SLAs:</strong><br />
      • <strong>CRITICAL:</strong> 6 - 12 hours (Mainline leaks, open manholes, live wire hazards)<br />
      • <strong>HIGH:</strong> 24 - 48 hours (Contaminated water, main road potholes, garbage overflow)<br />
      • <strong>MEDIUM:</strong> 36 - 72 hours (Footpaths, broken streetlights)<br />
      • <strong>LOW:</strong> 72 - 120 hours (Meter inspections, tree trimming)`;
    }

    if (q.includes('water') || q.includes('leak') || q.includes('pipe')) {
      return `💧 <strong>Water Supply Grievances:</strong><br />
      Water supply issues are handled by the <strong>Water Supply & Sewerage Board</strong>. Severe leaks are designated as CRITICAL priority with an automatic 12-hour resolution window. Linemen and emergency repair squads are dispatched upon officer review.`;
    }

    if (q.includes('helpline') || q.includes('phone') || q.includes('contact') || q.includes('number')) {
      return `📞 <strong>Municipal Corporation Helplines:</strong><br />
      • <strong>Toll-Free Citizen Helpline:</strong> 1800-425-1982 (24x7)<br />
      • <strong>Emergency Control Room:</strong> 040-2345-6789<br />
      • <strong>Email:</strong> support@nagarconnect.gov.in`;
    }

    if (q.includes('escalat') || q.includes('breach') || q.includes('delay')) {
      return `🚨 <strong>Grievance Escalation Policy:</strong><br />
      When an assigned complaint exceeds 50% of its SLA timeline or is overdue, it can be escalated to:
      1. <strong>L1 Officer:</strong> Assistant Commissioner (Ward Level)<br />
      2. <strong>L2 Officer:</strong> Deputy Commissioner (Zonal Level)<br />
      3. <strong>Executive:</strong> Municipal Commissioner (City Level)`;
    }

    if (q.includes('lodge') || q.includes('file') || q.includes('create') || q.includes('register')) {
      return `✍️ <strong>How to Lodge a Grievance:</strong><br />
      1. Navigate to <a href="#citizen-create" style="color: var(--gov-blue-700); font-weight: bold;">Lodge New Grievance</a>.<br />
      2. Select target municipal department and category.<br />
      3. Enter address, landmark, and description.<br />
      4. Submit to immediately receive a unique tracking ID (e.g. <code>NGC-2026-XXXXXX</code>).`;
    }

    return `🏛️ <strong>Nagar Municipal Corporation:</strong><br />
    Nagar Connect is the official single-window municipal e-governance platform. All citizen grievances are time-bound under statutory SLA charter and tracked with tamper-evident audit logs. For assistance, use our 24x7 toll-free helpline: <strong>1800-425-1982</strong>.`;
  }
};
