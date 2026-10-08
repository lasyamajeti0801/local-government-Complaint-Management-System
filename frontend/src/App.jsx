import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoRoleSwitcher } from './components/DemoRoleSwitcher';
import { RAGChatPanel } from './components/RAGChatPanel';

// Pages
import { CitizenPortal } from './pages/CitizenPortal';
import { OfficerPortal } from './pages/OfficerPortal';
import { FieldPortal } from './pages/FieldPortal';
import { KnowledgePortal } from './pages/KnowledgePortal';
import { AnalyticsPortal } from './pages/AnalyticsPortal';
import { AdminPortal } from './pages/AdminPortal';

export function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('nagar_theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('nagar_lang') || 'en');
  const [activeTab, setActiveTab] = useState('knowledge'); // Default to Member 5 Knowledge & RAG hub
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  // Initialize theme attribute on root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nagar_theme', theme);
  }, [theme]);

  // Initialize session: auto demo-login as Citizen or Knowledge Admin if no token
  useEffect(() => {
    const initSession = async () => {
      try {
        const token = localStorage.getItem('nagar_token');
        if (token) {
          const profileRes = await api.getProfile();
          if (profileRes.user) {
            setUser(profileRes.user);
            return;
          }
        }
        // Auto sign in as Knowledge Admin (Member 5) by default
        await handleSwitchRole('KNOWLEDGE_ADMIN');
      } catch (err) {
        console.warn('Session init fallback:', err.message);
        await handleSwitchRole('CITIZEN');
      }
    };
    initSession();
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleToggleLanguage = () => {
    const newLang = language === 'en' ? 'te' : 'en';
    setLanguage(newLang);
    localStorage.setItem('nagar_lang', newLang);
  };

  const handleSwitchRole = async (roleName) => {
    setIsLoadingRole(true);
    try {
      const res = await api.demoLogin(roleName);
      localStorage.setItem('nagar_token', res.token);
      setUser(res.user);

      // Auto route to appropriate portal on switch
      if (roleName === 'CITIZEN') setActiveTab('citizen');
      else if (roleName === 'OFFICER') setActiveTab('officer');
      else if (roleName === 'FIELD_STAFF') setActiveTab('field');
      else if (roleName === 'KNOWLEDGE_ADMIN') setActiveTab('knowledge');
      else if (roleName === 'COMMISSIONER' || roleName === 'MUNICIPAL_ADMIN') setActiveTab('analytics');
      else if (roleName === 'SUPER_ADMIN') setActiveTab('admin');
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsLoadingRole(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nagar_token');
    handleSwitchRole('CITIZEN');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Official Government Navbar */}
      <Navbar
        user={user}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onLogout={handleLogout}
      />

      {/* Persistent 1-Click Demo Role Switcher */}
      <DemoRoleSwitcher
        currentRole={user?.role || 'CITIZEN'}
        onSwitchRole={handleSwitchRole}
        isLoading={isLoadingRole}
      />

      {/* Main Layout Container */}
      <div className="app-container" style={{ flex: 1 }}>
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={user?.role || 'CITIZEN'}
        />

        {/* Main View Area */}
        <main className="app-main">
          {activeTab === 'citizen' && <CitizenPortal user={user} language={language} />}
          {activeTab === 'officer' && <OfficerPortal user={user} />}
          {activeTab === 'field' && <FieldPortal user={user} />}
          {activeTab === 'knowledge' && <KnowledgePortal user={user} />}
          {activeTab === 'analytics' && <AnalyticsPortal />}
          {activeTab === 'admin' && <AdminPortal />}
        </main>
      </div>

      {/* Universal Embedded RAG Assistant (Member 5 Core Widget across all portals) */}
      <RAGChatPanel
        userRole={user?.role || 'CITIZEN'}
        department={user?.department_id}
      />
    </div>
  );
}

export default App;
