import React from 'react';
import { 
  User, Shield, Wrench, Building2, Award, Brain, Settings, Check 
} from 'lucide-react';

const DEMO_ROLES = [
  { role: 'CITIZEN', label: 'Citizen', icon: User, desc: 'Ananya Sharma' },
  { role: 'OFFICER', label: 'Officer (Water)', icon: Shield, desc: 'Rajesh Varma AE' },
  { role: 'FIELD_STAFF', label: 'Field Lead', icon: Wrench, desc: 'Ramesh Kumar' },
  { role: 'MUNICIPAL_ADMIN', label: 'Zonal Admin', icon: Building2, desc: 'Srinivas Rao' },
  { role: 'COMMISSIONER', label: 'Commissioner', icon: Award, desc: 'Dr. Venkatesh IAS' },
  { role: 'KNOWLEDGE_ADMIN', label: 'Knowledge / RAG Admin', icon: Brain, desc: 'Pooja Hegde (Member 5)' },
  { role: 'SUPER_ADMIN', label: 'Super Admin', icon: Settings, desc: 'State Admin' }
];

export const DemoRoleSwitcher = ({ currentRole, onSwitchRole, isLoading }) => {
  return (
    <div className="demo-role-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontWeight: 800, color: 'var(--gov-primary)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
          🏛️ DEMO ROLE SWITCHER:
        </span>
      </div>

      <div className="demo-role-pills">
        {DEMO_ROLES.map(({ role, label, icon: Icon, desc }) => {
          const isActive = currentRole === role;
          return (
            <button
              key={role}
              className={`role-pill ${isActive ? 'active' : ''}`}
              onClick={() => !isActive && !isLoading && onSwitchRole(role)}
              disabled={isLoading}
              title={`Switch session to ${label} (${desc})`}
            >
              <Icon size={13} />
              <span>{label}</span>
              {isActive && <Check size={12} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
