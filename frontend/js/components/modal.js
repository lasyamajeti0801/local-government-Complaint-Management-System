// ============================================================
// NAGAR CONNECT - MODAL DIALOG COMPONENT
// ============================================================

window.modal = {
  open({ title, contentHtml, footerHtml = '', onOpen = null, onClose = null, size = 'default' }) {
    this.close(); // Close any currently open modal

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';

    const maxW = size === 'large' ? '800px' : (size === 'small' ? '420px' : '580px');

    overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: ${maxW};" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" aria-label="Close dialog" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body" id="modal-body-container">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    overlay.onclick = (e) => {
      if (e.target === overlay) this.close();
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    this._onCloseCallback = onClose;

    if (typeof onOpen === 'function') {
      setTimeout(() => onOpen(overlay), 20);
    }
  },

  close() {
    const overlay = document.getElementById('active-modal-overlay');
    if (overlay) {
      if (typeof this._onCloseCallback === 'function') {
        this._onCloseCallback();
      }
      overlay.remove();
    }
  }
};
