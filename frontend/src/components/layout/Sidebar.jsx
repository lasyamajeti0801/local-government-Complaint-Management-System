import React from 'react';
import {
  BookOpen,
  FileText,
  ClipboardList,
  Wrench,
  BarChart3,
  Shield,
  Bell,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function Sidebar({ currentTab, onSelectTab, currentUser }) {
  const { t } = useLanguage();
  const userRole = (currentUser?.role_name || currentUser?.role_id || 'CITIZEN').replace('ROLE_', '');

  const navItems = [
    {
      id: 'rag-portal',
      label: t('navRag'),
      subtext: t('navRagSub'),
      icon: BookOpen,
      badge: 'Active RAG',
      badgeColor: 'var(--civic-teal)',
      roles: ['ALL']
    },
    {
      id: 'citizen-portal',
      label: t('navCitizen'),
      subtext: t('navCitizenSub'),
      icon: FileText,
      roles: ['CITIZEN', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN', 'KNOWLEDGE_ADMIN']
    },
    {
      id: 'officer-queue',
      label: t('navOfficer'),
      subtext: t('navOfficerSub'),
      icon: ClipboardList,
      roles: ['OFFICER', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN']
    },
    {
      id: 'field-ops',
      label: t('navField'),
      subtext: t('navFieldSub'),
      icon: Wrench,
      roles: ['FIELD_STAFF', 'OFFICER', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'municipal-notices',
      label: t('navNotices'),
      subtext: t('navNoticesSub'),
      icon: Bell,
      roles: ['ALL']
    },
    {
      id: 'rag-playground',
      label: t('navPlayground'),
      subtext: t('navPlaygroundSub'),
      icon: Sparkles,
      roles: ['KNOWLEDGE_ADMIN', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN', 'OFFICER']
    }
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      flexShrink: 0
    }} className="sidebar">
      {/* Sequence Stage Tag */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: 'var(--primary-gov-light)',
        border: '1px solid rgba(27, 54, 93, 0.2)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 16
      }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--primary-gov)', fontWeight: 700, letterSpacing: 0.5 }}>
          {t('sequentialPhase')}
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-gov)' }}>
          {t('phaseName')}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          M1 → M2 → M3 → M4 → <strong style={{ color: 'var(--civic-teal)' }}>M5</strong>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {navItems.map(item => {
          const isAllowed = item.roles.includes('ALL') || item.roles.includes(userRole) || userRole === 'SUPER_ADMIN';
          if (!isAllowed) return null;

          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary-gov)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition)'
              }}
            >
              <Icon size={18} style={{ color: isActive ? '#FFFFFF' : 'var(--primary-gov)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.675rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                  {item.subtext}
                </div>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.625rem',
                  padding: '1px 6px',
                  borderRadius: 3,
                  backgroundColor: item.badgeColor,
                  color: '#fff',
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footnote */}
      <div style={{
        paddingTop: 16,
        borderTop: '1px solid var(--border-light)',
        fontSize: '0.725rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--gov-green)' }} />
          <span>{t('vectorIndexActive')}</span>
        </div>
        <div>Nagar Connect v1.5.0</div>
        <div>{t('noPaidApi')}</div>
      </div>
    </aside>
  );
}
