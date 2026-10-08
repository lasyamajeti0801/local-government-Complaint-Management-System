import React from 'react';
import { 
  FileText, Shield, Wrench, Brain, BarChart3, Settings, PlusCircle, ListOrdered, CheckSquare, Info 
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab, userRole = 'CITIZEN' }) => {
  const role = (userRole || 'CITIZEN').toUpperCase();

  const navItems = [
    {
      id: 'citizen',
      label: 'Citizen Portal',
      icon: FileText,
      badge: 'M2',
      roles: ['CITIZEN', 'SUPER_ADMIN', 'MUNICIPAL_ADMIN']
    },
    {
      id: 'officer',
      label: 'Officer Queue & SLA',
      icon: Shield,
      badge: 'M3',
      roles: ['OFFICER', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN']
    },
    {
      id: 'field',
      label: 'Field Operations',
      icon: Wrench,
      badge: 'M4',
      roles: ['FIELD_STAFF', 'OFFICER', 'SUPER_ADMIN']
    },
    {
      id: 'knowledge',
      label: 'Knowledge & RAG Hub',
      icon: Brain,
      badge: 'M5 CORE',
      highlight: true,
      roles: ['CITIZEN', 'OFFICER', 'FIELD_STAFF', 'MUNICIPAL_ADMIN', 'COMMISSIONER', 'KNOWLEDGE_ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'analytics',
      label: 'Civic Intelligence',
      icon: BarChart3,
      badge: 'M6',
      roles: ['MUNICIPAL_ADMIN', 'COMMISSIONER', 'SUPER_ADMIN', 'OFFICER']
    },
    {
      id: 'admin',
      label: 'Super Administration',
      icon: Settings,
      badge: 'M7',
      roles: ['MUNICIPAL_ADMIN', 'COMMISSIONER', 'KNOWLEDGE_ADMIN', 'SUPER_ADMIN']
    }
  ];

  const visibleItems = navItems.filter(item => 
    role === 'SUPER_ADMIN' || item.roles.includes(role)
  );

  return (
    <aside className="app-sidebar">
      <div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: 'var(--text-subtle)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0 0.75rem',
          marginBottom: '0.65rem'
        }}>
          Municipal Portals
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                <Icon size={18} color={item.highlight && !isActive ? 'var(--civic-purple)' : undefined} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    background: item.highlight ? 'var(--civic-purple-light)' : 'var(--bg-surface)',
                    color: item.highlight ? 'var(--civic-purple)' : 'var(--text-subtle)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* RAG Status Footer Card */}
      <div style={{
        background: 'var(--gov-primary-light)',
        border: '1px solid var(--gov-primary-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.85rem',
        marginTop: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <Brain size={16} color="var(--gov-primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gov-primary)' }}>
            RAG Intelligence
          </span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
          Centralized 128-dim Hybrid vector index active with RBAC filtering.
        </p>
      </div>
    </aside>
  );
};
