import React from 'react';
import { Search, Filter, AlertCircle, CheckCircle, Clock, FileText, ChevronRight, X } from 'lucide-react';

// 1. BUTTON
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variantClass = variant === 'teal' ? 'btn-teal' :
                       variant === 'secondary' ? 'btn-secondary' :
                       variant === 'danger' ? 'btn-danger' : 'btn-primary';
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

// 2. INPUT
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${className}`} {...props} />
      {error && <span style={{ color: 'var(--gov-red)', fontSize: '0.75rem', marginTop: 4 }}>{error}</span>}
    </div>
  );
}

// 3. SELECT
export function Select({ label, options = [], className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={`form-select ${className}`} {...props}>
        {options.map((opt, i) => (
          <option key={i} value={opt.value !== undefined ? opt.value : opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// 4. CARD
export function Card({ title, subtitle, action, children, className = '', style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-desc">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// 5. STATUS BADGE
export function StatusBadge({ status }) {
  const normalized = (status || 'SUBMITTED').toUpperCase();
  let badgeClass = 'badge-submitted';
  let label = normalized.replace(/_/g, ' ');

  switch (normalized) {
    case 'SUBMITTED': badgeClass = 'badge-submitted'; break;
    case 'UNDER_REVIEW': badgeClass = 'badge-under-review'; break;
    case 'ASSIGNED': badgeClass = 'badge-assigned'; break;
    case 'FIELD_VERIFICATION':
    case 'IN_PROGRESS': badgeClass = 'badge-in-progress'; break;
    case 'WORK_COMPLETED':
    case 'RESOLUTION_SUBMITTED': badgeClass = 'badge-resolution-submitted'; break;
    case 'RESOLVED':
    case 'CLOSED': badgeClass = 'badge-resolved'; break;
    case 'REJECTED': badgeClass = 'badge-rejected'; break;
    default: badgeClass = 'badge-submitted';
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
}

// 6. PRIORITY BADGE
export function PriorityBadge({ priority }) {
  const p = (priority || 'MEDIUM').toUpperCase();
  const cls = p === 'CRITICAL' ? 'priority-critical' :
              p === 'HIGH' ? 'priority-high' :
              p === 'LOW' ? 'priority-low' : 'priority-medium';
  return <span className={`badge ${cls}`}>{p}</span>;
}

// 7. VISIBILITY BADGE
export function VisibilityBadge({ visibility }) {
  const v = (visibility || 'PUBLIC').toUpperCase();
  const cls = v === 'PUBLIC' ? 'badge-public' :
              v === 'INTERNAL_OFFICER' ? 'badge-officer' :
              v === 'FIELD_STAFF' ? 'badge-field' : 'badge-admin';
  return <span className={`badge ${cls}`}>{v.replace(/_/g, ' ')}</span>;
}

// 8. SEARCH BAR
export function SearchBar({ value, onChange, placeholder = 'Search by ID, keyword or ward...', onSearch }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      <Search size={18} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
      <input
        type="text"
        className="form-input"
        style={{ paddingLeft: 38 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch && onSearch()}
        placeholder={placeholder}
      />
    </div>
  );
}

// 9. MODAL
export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '650px' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// 10. DRAWER
export function Drawer({ isOpen, onClose, title, children, width = '550px' }) {
  if (!isOpen) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// 11. TIMELINE
export function Timeline({ items = [] }) {
  if (items.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No status history recorded yet.</div>;
  }
  return (
    <div className="timeline-list">
      {items.map((item, idx) => (
        <div key={idx} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-header">
            <StatusBadge status={item.to_status} />
            <span className="timeline-time">
              {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          {item.remarks && <div className="timeline-remarks">{item.remarks}</div>}
          {item.changed_by_name && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Updated by: {item.changed_by_name} ({item.role_name || 'System'})
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 12. EMPTY STATE
export function EmptyState({ icon: Icon = FileText, title = 'No records found', message = 'No data available matching your filter criteria.', action }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <Icon size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
      <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>{title}</h4>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 16px' }}>{message}</p>
      {action}
    </div>
  );
}

// 13. LOADING SKELETON
export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 48, background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
}
