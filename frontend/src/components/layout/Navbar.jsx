import React, { useState } from 'react';
import { Landmark, Sun, Moon, User, Bell, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function Navbar({ currentUser, onSwitchRole, theme, onToggleTheme }) {
  const { lang, toggleLang, t } = useLanguage();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const demoAccounts = [
    { role: 'CITIZEN', name: 'Priya Sharma (Citizen)', email: 'citizen@nagarconnect.gov.in', dept: 'Resident' },
    { role: 'OFFICER', name: 'Er. Rajesh Verma (Officer)', email: 'officer.water@nagarconnect.gov.in', dept: 'Water Supply' },
    { role: 'OFFICER', name: 'Dr. Anita Deshmukh (Officer)', email: 'officer.sanitation@nagarconnect.gov.in', dept: 'Sanitation' },
    { role: 'FIELD_STAFF', name: 'Ramesh Kumar (Field Crew)', email: 'field.ramesh@nagarconnect.gov.in', dept: 'Roads & Infra' },
    { role: 'KNOWLEDGE_ADMIN', name: 'V. Sengupta (RAG Admin)', email: 'knowledge.admin@nagarconnect.gov.in', dept: 'Knowledge Base' },
    { role: 'MUNICIPAL_ADMIN', name: 'Sunil Kulkarni (Addl. Comm)', email: 'admin@nagarconnect.gov.in', dept: 'Administration' },
    { role: 'COMMISSIONER', name: 'Dr. M. Sundaram, IAS', email: 'commissioner@nagarconnect.gov.in', dept: 'Executive' },
    { role: 'SUPER_ADMIN', name: 'System Security Master', email: 'superadmin@nagarconnect.gov.in', dept: 'Cyber Security' }
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)' }}>
      {/* 1. Tricolor Bar */}
      <div className="gov-tricolor-bar" />

      {/* 2. Official Municipal Top Banner */}
      <div className="gov-top-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('govTitle')}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span className="motto">{t('motto')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 2 }}>
            {t('ragOnline')}
          </span>

          {/* Active Multilingual Toggle Button */}
          <button
            onClick={toggleLang}
            title={lang === 'en' ? 'తెలుగులోకి మార్చండి' : 'Switch to English'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--civic-teal)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#FFFFFF',
              padding: '3px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'var(--transition)'
            }}
          >
            <Globe size={13} />
            <span>{t('switchLang')}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Navigation Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo and Seal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-gov)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--civic-teal)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Landmark size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-gov)', letterSpacing: '-0.3px', margin: 0 }}>
                {t('appTitle')}
              </h1>
              <span style={{
                fontSize: '0.65rem',
                backgroundColor: 'var(--civic-teal-light)',
                color: 'var(--civic-teal)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid var(--civic-teal)'
              }}>
                RAG v1.5 ({lang.toUpperCase()})
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {t('appTagline')}
            </p>
          </div>
        </div>

        {/* Right Tools & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Rapid Demo Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-gov)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {(currentUser?.full_name || 'U').charAt(0)}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{currentUser?.full_name || 'Guest User'}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--civic-teal)', fontWeight: 600 }}>
                  {currentUser?.role_name?.replace(/_/g, ' ') || 'CITIZEN'}
                </div>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Dropdown Menu */}
            {showRoleDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                width: 290,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                padding: 6
              }}>
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {t('quickRoleSwitcher')}
                </div>
                {demoAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSwitchRole(acc.email, 'Citizen@123');
                      setShowRoleDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      background: currentUser?.email === acc.email ? 'var(--primary-gov-light)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 2
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{acc.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.dept}</div>
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: 3,
                      backgroundColor: 'var(--bg-surface-alt)',
                      color: 'var(--primary-gov)',
                      fontWeight: 700
                    }}>
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
