import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, ChevronDown, ChevronRight, CircleHelp, FilePlus2, Home, Menu, MessageCircle, X } from 'lucide-react';
import { CitizenDashboardPage } from './modules/citizen/CitizenDashboardPage';
import './citizen-preview.css';

type CitizenAction = 'create' | 'complaints' | 'open' | 'pending' | 'resolved';

function CitizenPreview() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Overview');
  const [complaintCount, setComplaintCount] = useState(3);

  function navigate(label: string, action: CitizenAction) {
    setActiveItem(label);
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent('nagar-connect-citizen-action', { detail: action }));
  }

  useEffect(() => {
    function updateCount(event: Event) {
      setComplaintCount((event as CustomEvent<number>).detail);
    }
    window.addEventListener('nagar-connect-citizen-count', updateCount);
    return () => window.removeEventListener('nagar-connect-citizen-count', updateCount);
  }, []);

  return (
    <div className="citizen-preview">
      {menuOpen && <button className="citizen-preview-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`citizen-preview-sidebar ${menuOpen ? 'open' : ''}`}>
        <a className="citizen-preview-brand" href="#overview" onClick={() => setActiveItem('Overview')}>
          <span className="citizen-preview-brand-mark"><Home size={20} /></span>
          <span><strong>Nagar<span>Connect</span></strong><small>CITIZEN PORTAL</small></span>
        </a>
        <div className="citizen-preview-workspace-label">MY CITY</div>
        <nav aria-label="Citizen portal navigation">
          <button className={`citizen-preview-nav ${activeItem === 'Overview' ? 'active' : ''}`} onClick={() => { setActiveItem('Overview'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Home size={17} />Overview</button>
          <button className={`citizen-preview-nav ${activeItem === 'My complaints' ? 'active' : ''}`} onClick={() => navigate('My complaints', 'complaints')}><MessageCircle size={17} />My complaints<span>{complaintCount}</span></button>
          <button className={`citizen-preview-nav ${activeItem === 'Open reports' ? 'active' : ''}`} onClick={() => navigate('Open reports', 'open')}><Bell size={17} />Open reports<i /></button>
          <button className="citizen-preview-nav" onClick={() => navigate('Report an issue', 'create')}><FilePlus2 size={17} />Report an issue<ChevronRight size={14} /></button>
        </nav>
        <div className="citizen-preview-sidebar-card">
          <div><MessageCircle size={16} /></div><strong>A better city, together</strong>
          <p>Your local knowledge helps the right team act faster.</p>
          <button onClick={() => navigate('Report an issue', 'create')}>Share an issue <ChevronRight size={13} /></button>
        </div>
        <div className="citizen-preview-sidebar-bottom">
          <button className="citizen-preview-help"><CircleHelp size={16} />Help & guidance</button>
          <div className="citizen-preview-user"><span>MI</span><div><strong>Meera Iyer</strong><small>Verified citizen</small></div><button aria-label="Profile options"><ChevronDown size={14} /></button></div>
        </div>
      </aside>
      <main className="citizen-preview-main">
        <header className="citizen-preview-topbar">
          <button className="citizen-preview-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          <div className="citizen-preview-breadcrumb"><span>My city</span><i>/</i><strong>{activeItem}</strong></div>
          <div className="citizen-preview-top-actions">
            <span>Welcome to your citizen portal</span><span className="citizen-preview-user-avatar">MI</span><ChevronDown size={13} />
          </div>
        </header>
        <CitizenDashboardPage />
      </main>
    </div>
  );
}

createRoot(document.getElementById('citizen-preview-root')!).render(<CitizenPreview />);
