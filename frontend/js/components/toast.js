// ============================================================
// NAGAR CONNECT - TOAST NOTIFICATION COMPONENT
// ============================================================

window.toast = {
  show(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toastEl.innerHTML = `
      <div style="font-size: 1.1rem; font-weight: bold; width: 20px;">${icons[type] || 'ℹ'}</div>
      <div style="flex: 1; font-size: 0.85rem; line-height: 1.35;">${message}</div>
      <button style="background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1rem;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toastEl);

    setTimeout(() => {
      if (toastEl.parentElement) {
        toastEl.style.transition = 'opacity 0.3s, transform 0.3s';
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateY(10px)';
        setTimeout(() => toastEl.remove(), 300);
      }
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 6000); },
  warning(msg) { this.show(msg, 'warning', 5000); },
  info(msg) { this.show(msg, 'info'); }
};
