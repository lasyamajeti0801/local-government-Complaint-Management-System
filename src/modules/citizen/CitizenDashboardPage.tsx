import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FilePlus2,
  FileText,
  ImagePlus,
  MapPin,
  MessageCircle,
  Plus,
  RotateCw,
  Search,
  Send,
  ShieldCheck,
  Star,
  TriangleAlert,
  Video,
  X,
} from 'lucide-react';
import type { Complaint, ComplaintEvidence, ComplaintPriority, ComplaintStatus } from '../complaints/types';
import { citizenService } from './citizenService';
import {
  canReopen,
  getComplaintProgress,
  isOpenStatus,
  isPendingStatus,
  isResolvedStatus,
  STATUS_LABELS,
  validateCitizenComplaint,
  type CitizenComplaintInput,
} from './citizenRules';
import './citizen.css';

type ComplaintFilter = 'ALL' | 'OPEN' | 'PENDING' | 'RESOLVED';

interface FormValues {
  title: string;
  description: string;
  category: string;
  location: string;
  landmark: string;
  ward: string;
  priority: ComplaintPriority;
  contactName: string;
  contactPhone: string;
}

const emptyForm: FormValues = {
  title: '',
  description: '',
  category: '',
  location: '',
  landmark: '',
  ward: '',
  priority: 'MEDIUM',
  contactName: 'Meera Iyer',
  contactPhone: '9000000001',
};

function dateLabel(value: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(value));
}

function relativeDate(value: string): string {
  const hours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min ago`;
  if (hours < 24) return `${Math.floor(hours)} hr ago`;
  if (hours < 48) return 'Yesterday';
  return dateLabel(value, { day: 'numeric', month: 'short' });
}

function priorityLabel(priority: ComplaintPriority): string {
  return priority === 'URGENT' ? 'Urgent' : `${priority[0]}${priority.slice(1).toLowerCase()}`;
}

function IconMark({ icon }: { icon: Complaint['categoryIcon'] }) {
  const mark = {
    water: <span aria-hidden="true">◉</span>,
    roads: <span aria-hidden="true">▱</span>,
    waste: <span aria-hidden="true">♻</span>,
    lighting: <span aria-hidden="true">✳</span>,
    drainage: <span aria-hidden="true">≋</span>,
    other: <FileText size={16} />,
  }[icon];
  return <span className={`citizen-category-mark citizen-category-mark--${icon}`}>{mark}</span>;
}

function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return <span className={`citizen-priority citizen-priority--${priority.toLowerCase()}`}><i />{priorityLabel(priority)}</span>;
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`citizen-status citizen-status--${status.toLowerCase()}`}><i />{STATUS_LABELS[status]}</span>;
}

function makeInput(values: FormValues, evidence: ComplaintEvidence[]): CitizenComplaintInput {
  return {
    ...values,
    evidence,
  };
}

export function CitizenDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeFilter, setActiveFilter] = useState<ComplaintFilter>('ALL');
  const [search, setSearch] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const citizen = citizenService.getCurrentCitizen();

  function refresh() {
    setLoading(true);
    setLoadError('');
    try {
      setComplaints(citizenService.getMyComplaints());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load your complaints.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nagar-connect-citizen-count', { detail: complaints.length }));
  }, [complaints.length]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        if (createOpen) setCreateOpen(false);
        else if (notificationOpen) setNotificationOpen(false);
        else setSelectedComplaintId(null);
      }
    }
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [createOpen, notificationOpen]);

  useEffect(() => {
    function handlePreviewAction(event: Event) {
      const action = (event as CustomEvent<'create' | 'complaints' | 'open' | 'pending' | 'resolved'>).detail;
      if (action === 'create') setCreateOpen(true);
      if (action === 'complaints') {
        setActiveFilter('ALL');
        document.getElementById('citizen-complaints-title')?.scrollIntoView({ behavior: 'smooth' });
      }
      if (action === 'open') {
        setActiveFilter('OPEN');
        document.getElementById('citizen-complaints-title')?.scrollIntoView({ behavior: 'smooth' });
      }
      if (action === 'pending') {
        setActiveFilter('PENDING');
        document.getElementById('citizen-complaints-title')?.scrollIntoView({ behavior: 'smooth' });
      }
      if (action === 'resolved') {
        setActiveFilter('RESOLVED');
        document.getElementById('citizen-complaints-title')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    window.addEventListener('nagar-connect-citizen-action', handlePreviewAction);
    return () => window.removeEventListener('nagar-connect-citizen-action', handlePreviewAction);
  }, []);

  const selectedComplaint = complaints.find((item) => item.id === selectedComplaintId) ?? null;
  const openCount = complaints.filter((item) => isOpenStatus(item.status)).length;
  const pendingCount = complaints.filter((item) => isPendingStatus(item.status)).length;
  const resolvedCount = complaints.filter((item) => isResolvedStatus(item.status)).length;
  const recentUpdates = useMemo(() => complaints
    .flatMap((complaint) => complaint.timeline
      .filter((event) => event.title !== 'Complaint submitted')
      .map((event) => ({ complaint, event })))
    .sort((a, b) => new Date(b.event.createdAt).getTime() - new Date(a.event.createdAt).getTime())
    .slice(0, 4), [complaints]);
  const notifications = useMemo(() => complaints
    .flatMap((complaint) => complaint.timeline
      .filter((event) => event.title !== 'Complaint submitted')
      .map((event) => ({ complaint, event })))
    .sort((a, b) => new Date(b.event.createdAt).getTime() - new Date(a.event.createdAt).getTime())
    .slice(0, 6), [complaints]);
  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();
    return complaints
      .filter((complaint) => {
        const matchesFilter = activeFilter === 'ALL'
          || (activeFilter === 'OPEN' && isOpenStatus(complaint.status))
          || (activeFilter === 'PENDING' && isPendingStatus(complaint.status))
          || (activeFilter === 'RESOLVED' && isResolvedStatus(complaint.status));
        const matchesSearch = !query || [
          complaint.complaintNumber,
          complaint.title,
          complaint.category,
          complaint.location,
          complaint.ward,
        ].some((value) => value.toLowerCase().includes(query));
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => newestFirst
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activeFilter, complaints, newestFirst, search]);

  function setFormValue<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFormError('');
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const next = [...files];
    for (const file of incoming) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setFileError('Only image and video files are supported.');
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        setFileError(`${file.name} exceeds the 25 MB per-file limit.`);
        continue;
      }
      if (next.length >= 4) {
        setFileError('Attach up to 4 photos or videos.');
        break;
      }
      if (next.some((selected) => selected.name === file.name && selected.size === file.size)) continue;
      next.push(file);
      setFileError('');
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function evidenceMetadata(): ComplaintEvidence[] {
    return files.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }));
  }

  function submitComplaint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = makeInput(form, evidenceMetadata());
    const validation = validateCitizenComplaint(input);
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormBusy(true);
    setFormError('');
    try {
      const complaint = citizenService.createComplaint(input);
      setComplaints(citizenService.getMyComplaints());
      setActiveFilter('ALL');
      setSearch('');
      setCreateOpen(false);
      setForm(emptyForm);
      setFiles([]);
      setSelectedComplaintId(complaint.id);
      setToast(`Complaint ${complaint.complaintNumber} submitted successfully.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Your complaint could not be submitted. Please try again.');
    } finally {
      setFormBusy(false);
    }
  }

  function submitFeedback(complaint: Complaint) {
    setFeedbackError('');
    if (rating < 1) {
      setFeedbackError('Choose a star rating before submitting feedback.');
      return;
    }
    try {
      setComplaints(citizenService.submitFeedback(complaint.id, rating, feedbackComment));
      setRating(0);
      setFeedbackComment('');
      setToast('Thank you for sharing your feedback.');
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'Feedback could not be saved.');
    }
  }

  function reopen(complaint: Complaint) {
    const accepted = window.confirm(`Reopen ${complaint.complaintNumber}? The department will review this case again.`);
    if (!accepted) return;
    try {
      setComplaints(citizenService.reopenComplaint(complaint.id));
      setFeedbackError('');
      setToast(`${complaint.complaintNumber} has been reopened.`);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'This complaint could not be reopened.');
    }
  }

  return (
    <section className="citizen-page" aria-labelledby="citizen-heading">
      <div className="citizen-welcome">
        <div>
          <div className="citizen-eyebrow"><span /> YOUR CITY, YOUR VOICE <span /></div>
          <h1 id="citizen-heading">Good morning, {citizen.name.split(' ')[0]} <span>✳</span></h1>
          <p>Stay informed and help us make your neighborhood better.</p>
        </div>
        <div className="citizen-welcome-actions">
          <button className={`citizen-notification-button ${notificationOpen ? 'open' : ''}`} aria-label="Open complaint notifications" aria-expanded={notificationOpen} onClick={() => setNotificationOpen((value) => !value)}>
            <Bell size={17} />{notifications.length > 0 && <i />}
          </button>
          <button className="citizen-primary-button" onClick={() => { setCreateOpen(true); setNotificationOpen(false); }}><Plus size={16} />New complaint</button>
          {notificationOpen && <div className="citizen-notification-panel">
            <div className="citizen-notification-heading"><div><strong>Recent updates</strong><small>Updates to your complaints</small></div><button aria-label="Close notifications" onClick={() => setNotificationOpen(false)}><X size={15} /></button></div>
            {notifications.length ? notifications.map(({ complaint, event }) => (
              <button className="citizen-notification-item" key={`${complaint.id}-${event.id}`} onClick={() => { setSelectedComplaintId(complaint.id); setNotificationOpen(false); }}>
                <span><CheckCircle2 size={15} /></span><div><strong>{event.title}</strong><small>{complaint.complaintNumber} · {relativeDate(event.createdAt)}</small></div>
              </button>
            )) : <div className="citizen-notification-empty">New updates to your complaints will appear here.</div>}
          </div>}
        </div>
      </div>

      <div className="citizen-metrics">
        <article className="citizen-metric"><div><span>My complaints</span><i className="metric-icon blue"><FileText size={16} /></i></div><strong>{String(complaints.length).padStart(2, '0')}</strong><small>All reports submitted</small></article>
        <article className="citizen-metric"><div><span>Open complaints</span><i className="metric-icon violet"><Clock3 size={16} /></i></div><strong>{String(openCount).padStart(2, '0')}</strong><small>Being reviewed or worked on</small></article>
        <article className="citizen-metric"><div><span>Pending review</span><i className="metric-icon amber"><TriangleAlert size={16} /></i></div><strong>{String(pendingCount).padStart(2, '0')}</strong><small>Awaiting department action</small></article>
        <article className="citizen-metric"><div><span>Resolved</span><i className="metric-icon green"><CheckCircle2 size={16} /></i></div><strong>{String(resolvedCount).padStart(2, '0')}</strong><small>Completed by the city</small></article>
      </div>

      <div className="citizen-content-grid">
        <section className="citizen-complaints-card" aria-labelledby="citizen-complaints-title">
          <div className="citizen-card-heading">
            <div><div className="citizen-section-eyebrow"><span /> CITIZEN PORTAL</div><h2 id="citizen-complaints-title">My complaints <span>{complaints.length}</span></h2><p>Track every report you have shared with your city.</p></div>
            <button className="citizen-refresh" onClick={refresh} disabled={loading}><RotateCw size={14} className={loading ? 'citizen-spin' : ''} /><span>Refresh</span></button>
          </div>

          <div className="citizen-queue-toolbar">
            <div className="citizen-tabs" role="tablist" aria-label="Filter my complaints">
              {([
                ['ALL', 'All', complaints.length],
                ['OPEN', 'Open', openCount],
                ['PENDING', 'Pending', pendingCount],
                ['RESOLVED', 'Resolved', resolvedCount],
              ] as const).map(([key, label, count]) => (
                <button key={key} role="tab" aria-selected={activeFilter === key} className={activeFilter === key ? 'active' : ''} onClick={() => setActiveFilter(key)}>
                  {label}<span>{String(count).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
            <div className="citizen-tools">
              <label className="citizen-search"><Search size={14} /><input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search complaints..." aria-label="Search your complaints" /><kbd>⌘ K</kbd></label>
              <button className="citizen-sort" onClick={() => setNewestFirst((value) => !value)} aria-label={`Sort ${newestFirst ? 'oldest' : 'newest'} first`}>
                {newestFirst ? <ArrowDownWideNarrow size={14} /> : <ArrowUpWideNarrow size={14} />}<span>{newestFirst ? 'Newest' : 'Oldest'}</span><ChevronDown size={12} />
              </button>
            </div>
          </div>

          {loadError && <div className="citizen-error" role="alert"><TriangleAlert size={16} /><span>{loadError}</span><button onClick={refresh}>Try again</button></div>}
          {loading ? <div className="citizen-loading" role="status"><span />Loading your complaints…</div> : (
            <>
              <div className="citizen-table-wrap">
                <table className="citizen-table">
                  <thead><tr><th>COMPLAINT</th><th>CATEGORY</th><th>LOCATION</th><th>PRIORITY</th><th>STATUS</th><th>UPDATED</th><th /></tr></thead>
                  <tbody>
                    {filteredComplaints.map((complaint) => {
                      const latest = complaint.timeline[complaint.timeline.length - 1];
                      return <tr key={complaint.id} onClick={() => { setSelectedComplaintId(complaint.id); setRating(complaint.feedback?.rating ?? 0); setFeedbackComment(complaint.feedback?.comment ?? ''); setFeedbackError(''); }}>
                        <td><div className="citizen-complaint-cell"><IconMark icon={complaint.categoryIcon} /><div><strong>{complaint.title}</strong><small>{complaint.complaintNumber}</small></div></div></td>
                        <td>{complaint.category}</td><td><span className="citizen-location"><MapPin size={12} />{complaint.location}<small>{complaint.ward}</small></span></td>
                        <td><PriorityBadge priority={complaint.priority} /></td><td><StatusBadge status={complaint.status} /></td>
                        <td><span className="citizen-updated">{relativeDate(latest?.createdAt ?? complaint.createdAt)}</span></td>
                        <td><button className="citizen-row-open" aria-label={`Track ${complaint.complaintNumber}`} onClick={(event) => { event.stopPropagation(); setSelectedComplaintId(complaint.id); setRating(complaint.feedback?.rating ?? 0); setFeedbackComment(complaint.feedback?.comment ?? ''); setFeedbackError(''); }}><ChevronRight size={16} /></button></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
                {!filteredComplaints.length && <div className="citizen-empty"><Search size={23} /><strong>No complaints found</strong><span>{complaints.length ? 'Try a different search or filter.' : 'When you report an issue, it will appear here.'}</span>{complaints.length > 0 && <button onClick={() => { setSearch(''); setActiveFilter('ALL'); }}>Clear filters</button>}</div>}
              </div>
              <div className="citizen-table-footer"><span>Showing {filteredComplaints.length} of {complaints.length} complaints</span><button onClick={() => { setCreateOpen(true); setFormError(''); }}><Plus size={13} />Report an issue</button></div>
            </>
          )}
        </section>

        <aside className="citizen-updates-card">
          <div className="citizen-updates-heading"><span className="citizen-updates-icon"><MessageCircle size={15} /></span><div><h2>Recent updates</h2><p>Your complaint activity</p></div><span className="citizen-live-dot" /></div>
          {recentUpdates.length ? <div className="citizen-updates-list">{recentUpdates.map(({ complaint, event }) => (
            <button key={`${complaint.id}-${event.id}`} onClick={() => { setSelectedComplaintId(complaint.id); setRating(complaint.feedback?.rating ?? 0); setFeedbackComment(complaint.feedback?.comment ?? ''); }}>
              <span className="citizen-update-marker"><Check size={12} /></span><span className="citizen-update-copy"><strong>{event.title}</strong><small>{complaint.title}</small><time>{relativeDate(event.createdAt)}</time></span>
            </button>
          ))}</div> : <div className="citizen-updates-empty">No updates yet. We’ll let you know when a department reviews your report.</div>}
          <div className="citizen-help-card"><span><ShieldCheck size={16} /></span><div><strong>Your reports matter</strong><p>Every complaint is sent to the responsible city department for review.</p></div></div>
          <button className="citizen-help-link" onClick={() => setToast('For urgent safety risks, contact your local emergency services.') }><CircleHelp size={14} />How the process works<ChevronRight size={14} /></button>
        </aside>
      </div>
      <footer className="citizen-page-footer"><span>© 2026 Nagar Connect</span><span><i />Citizen portal preview</span><span>Your voice. Our responsibility.</span></footer>

      {createOpen && <div className="citizen-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !formBusy) setCreateOpen(false); }}>
        <section className="citizen-create-modal" role="dialog" aria-modal="true" aria-labelledby="citizen-create-title">
          <header><div><small>REPORT A CITY ISSUE</small><h2 id="citizen-create-title">Let’s make it better.</h2><p>Tell us what needs attention and we’ll get it to the right team.</p></div><button aria-label="Close complaint form" disabled={formBusy} onClick={() => setCreateOpen(false)}><X size={18} /></button></header>
          <form onSubmit={submitComplaint} noValidate>
            <div className="citizen-form-grid">
              <label className="citizen-field full"><span>What’s the issue? <i>*</i></span><input maxLength={120} value={form.title} onChange={(event) => setFormValue('title', event.target.value)} placeholder="A short, clear title" autoFocus /><small>{form.title.length}/120 characters</small></label>
              <label className="citizen-field full"><span>Describe what happened <i>*</i></span><textarea rows={4} maxLength={2000} value={form.description} onChange={(event) => setFormValue('description', event.target.value)} placeholder="Share details that will help the department understand and resolve the issue." /><small>{form.description.length}/2,000 characters</small></label>
              <label className="citizen-field"><span>Category <i>*</i></span><select value={form.category} onChange={(event) => setFormValue('category', event.target.value)}><option value="">Choose a category</option>{citizenService.getCategories().map((category) => <option value={category.name} key={category.name}>{category.name}</option>)}</select></label>
              <label className="citizen-field"><span>Priority</span><select value={form.priority} onChange={(event) => setFormValue('priority', event.target.value as ComplaintPriority)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
              <label className="citizen-field"><span>Location <i>*</i></span><input maxLength={180} value={form.location} onChange={(event) => setFormValue('location', event.target.value)} placeholder="Street, neighborhood or address" /></label>
              <label className="citizen-field"><span>Ward</span><input maxLength={40} value={form.ward} onChange={(event) => setFormValue('ward', event.target.value)} placeholder="e.g. Ward 12" /></label>
              <label className="citizen-field full"><span>Nearby landmark</span><input maxLength={120} value={form.landmark} onChange={(event) => setFormValue('landmark', event.target.value)} placeholder="A nearby shop, building or junction" /></label>
              <div className="citizen-field full"><span>Photos or video <small>Optional · Up to 4 files · 25 MB each</small></span>
                <button type="button" className="citizen-upload" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFiles(event.dataTransfer.files); }}>
                  <span><ImagePlus size={17} /></span><strong>Add photos or video</strong><small>Choose files or drag them here</small><input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(event) => handleFiles(event.target.files)} />
                </button>
                {files.length > 0 && <ul className="citizen-file-list">{files.map((file, index) => <li key={`${file.name}-${file.size}`}><span>{file.type.startsWith('video/') ? <Video size={14} /> : <ImagePlus size={14} />}{file.name}<small>{(file.size / (1024 * 1024)).toFixed(1)} MB</small></span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))}><X size={14} /></button></li>)}</ul>}
                {fileError && <small className="citizen-field-error">{fileError}</small>}
              </div>
              <div className="citizen-contact-heading full"><span className="citizen-contact-icon"><MessageCircle size={14} /></span><div><strong>How can the department reach you?</strong><small>Your contact details are shared only with the responsible municipal team.</small></div></div>
              <label className="citizen-field"><span>Contact name <i>*</i></span><input maxLength={80} value={form.contactName} onChange={(event) => setFormValue('contactName', event.target.value)} /></label>
              <label className="citizen-field"><span>Mobile number <i>*</i></span><input type="tel" maxLength={16} value={form.contactPhone} onChange={(event) => setFormValue('contactPhone', event.target.value)} placeholder="10-digit mobile number" /></label>
            </div>
            {formError && <p className="citizen-form-error" role="alert"><TriangleAlert size={14} />{formError}</p>}
            <footer><small><ShieldCheck size={13} />Your report is linked to your citizen account.</small><div><button type="button" className="citizen-cancel-button" disabled={formBusy} onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="citizen-submit-button" disabled={formBusy}>{formBusy ? <span className="citizen-button-spinner" /> : <Send size={14} />}{formBusy ? 'Submitting…' : 'Submit complaint'}</button></div></footer>
          </form>
        </section>
      </div>}

      {selectedComplaint && <><button className="citizen-drawer-backdrop" aria-label="Close complaint tracking" onClick={() => setSelectedComplaintId(null)} />
        <aside className="citizen-drawer" role="dialog" aria-modal="true" aria-labelledby="citizen-drawer-title">
          <header className="citizen-drawer-header"><div><small>COMPLAINT TRACKING</small><strong>{selectedComplaint.complaintNumber}</strong></div><button aria-label="Close complaint details" onClick={() => setSelectedComplaintId(null)}><X size={18} /></button></header>
          <div className="citizen-drawer-content">
            <div className="citizen-drawer-title"><div><h2 id="citizen-drawer-title">{selectedComplaint.title}</h2><p>Submitted {dateLabel(selectedComplaint.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
            <div className="citizen-detail-badges"><PriorityBadge priority={selectedComplaint.priority} /><StatusBadge status={selectedComplaint.status} /></div>
            {['REJECTED', 'ESCALATED', 'CANNOT_RESOLVE', 'NEEDS_ESCALATION'].includes(selectedComplaint.status) && <div className="citizen-status-message"><TriangleAlert size={15} /><span>This case needs additional department attention. Updates will appear in your timeline.</span></div>}
            <section className="citizen-detail-section"><h3>Complaint journey</h3><div className="citizen-progress">
              {getComplaintProgress(selectedComplaint.status).map((step, index, all) => <div className={`citizen-progress-step ${step.state}`} key={step.status}>
                <div className="citizen-progress-rail"><span>{step.state === 'complete' ? <Check size={10} /> : index + 1}</span>{index < all.length - 1 && <i />}</div>
                <div className="citizen-progress-copy"><strong>{step.label}</strong>{step.state === 'current' && <small>Current status</small>}</div>
              </div>)}
            </div></section>
            <section className="citizen-detail-section"><h3>Report details</h3><p className="citizen-detail-description">{selectedComplaint.description}</p><div className="citizen-detail-meta">
              <div><small>Category</small><strong>{selectedComplaint.category}</strong></div><div><small>Responsible department</small><strong>{selectedComplaint.department}</strong></div>
              <div><small>Location</small><strong>{selectedComplaint.location}</strong></div><div><small>Ward</small><strong>{selectedComplaint.ward || 'Not provided'}</strong></div>
              {selectedComplaint.landmark && <div className="full"><small>Nearby landmark</small><strong>{selectedComplaint.landmark}</strong></div>}
              <div><small>Contact</small><strong>{selectedComplaint.citizenPhone ?? citizen.phone}</strong></div>
              <div><small>Submitted</small><strong>{dateLabel(selectedComplaint.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
            </div></section>
            <section className="citizen-detail-section"><h3>Photos & video <span>{selectedComplaint.evidence?.length ?? 0}</span></h3>
              {(selectedComplaint.evidence?.length ?? 0) > 0 ? <ul className="citizen-evidence-list">{selectedComplaint.evidence?.map((evidence) => <li key={evidence.id}><span>{evidence.mimeType.startsWith('video/') ? <Video size={15} /> : <ImagePlus size={15} />}</span><div><strong>{evidence.fileName}</strong><small>{(evidence.size / (1024 * 1024)).toFixed(1)} MB · {relativeDate(evidence.uploadedAt)}</small></div></li>)}</ul>
                : <p className="citizen-no-evidence">No photos or video attached to this report.</p>}
            </section>
            <section className="citizen-detail-section"><h3>Updates & timeline</h3><div className="citizen-timeline">{selectedComplaint.timeline.map((event, index) => <div className="citizen-timeline-item" key={event.id}>
              <div className="citizen-timeline-rail"><span className={index === selectedComplaint.timeline.length - 1 ? 'latest' : ''}>{index === selectedComplaint.timeline.length - 1 ? <Check size={10} /> : null}</span><i /></div>
              <div><strong>{event.title}</strong>{event.detail && <small>{event.detail}</small>}<time>{dateLabel(event.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</time></div>
            </div>)}</div></section>
            {canReopen(selectedComplaint.status) && <section className="citizen-detail-section citizen-feedback-section"><h3>Your feedback</h3>
              {selectedComplaint.feedback ? <div className="citizen-existing-feedback"><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < selectedComplaint.feedback!.rating ? 'currentColor' : 'none'} />)}</span><p>{selectedComplaint.feedback.comment || 'Thank you for your rating.'}</p><small>Shared {relativeDate(selectedComplaint.feedback.createdAt)}</small></div> : <>
                <p>How was the city’s response to this complaint?</p>
                <div className="citizen-rating" role="group" aria-label="Rate the city response">{[1, 2, 3, 4, 5].map((value) => <button key={value} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`} aria-pressed={rating === value} onClick={() => { setRating(value); setFeedbackError(''); }}><Star size={20} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div>
                <label className="citizen-feedback-input"><span>Comment <small>Optional</small></span><textarea rows={2} maxLength={1000} value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="Share a little more about your experience…" /></label>
                {feedbackError && <small className="citizen-field-error">{feedbackError}</small>}
                <button className="citizen-feedback-submit" onClick={() => submitFeedback(selectedComplaint)}>Submit feedback</button>
              </>}
            </section>}
            {canReopen(selectedComplaint.status) && <button className="citizen-reopen-button" onClick={() => reopen(selectedComplaint)}><RotateCw size={14} />Reopen this complaint</button>}
          </div>
        </aside></>}

      {toast && <div className="citizen-toast" role="status"><span><Check size={13} /></span>{toast}</div>}
    </section>
  );
}
