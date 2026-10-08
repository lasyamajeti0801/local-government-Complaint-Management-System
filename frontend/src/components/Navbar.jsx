import React from 'react';
import { 
  Building2, Moon, Sun, Globe, Bell, LogOut, ShieldCheck, User 
} from 'lucide-react';

export const Navbar = ({ 
  user, 
  theme, 
  onToggleTheme, 
  language, 
  onToggleLanguage, 
  onLogout 
}) => {
  return (
    <header className="gov-header">
      {/* Indian National Tricolor Civic Accent Ribbon */}
      <div className="gov-top-ribbon"></div>

      <div className="gov-header-inner">
        {/* Brand */}
        <div className="gov-brand">
          <div className="gov-emblem">
            🏛️
          </div>
          <div className="gov-brand-text">
            <h1>
              <span>NAGAR CONNECT</span>
              <span style={{
                fontSize: '0.65rem',
                background: 'var(--gov-primary-light)',
                color: 'var(--gov-primary)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                border: '1px solid var(--gov-primary-border)',
                fontWeight: 700
              }}>
                GHMC E-GOV
              </span>
            </h1>
            <p>
              {language === 'te' 
                ? 'మీ గళం. మా బాధ్యత. మెరుగైన నగరం.' 
                : 'Your Voice. Our Responsibility. A Better Nagar.'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Selector */}
          <button
            onClick={onToggleLanguage}
            className="btn btn-secondary btn-sm"
            title="Toggle Language (English / Telugu)"
            style={{ fontWeight: 700 }}
          >
            <Globe size={14} />
            <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary btn-sm"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* User Profile Badge */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'var(--bg-surface-subtle)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--gov-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {user.name ? user.name.charAt(0) : 'U'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {user.role} {user.ward_number ? `• ${user.ward_number}` : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
