import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { KnowledgePortal } from './pages/KnowledgePortal';
import { CitizenPortal } from './pages/CitizenPortal';
import { OfficerPortal } from './pages/OfficerPortal';
import { FieldStaffPortal } from './pages/FieldStaffPortal';
import { RAGPlayground } from './pages/RAGPlayground';
import { MunicipalNotices } from './pages/MunicipalNotices';
import { RAGChatPanel } from './components/rag/RAGChatPanel';
import { MessageSquareText, Bot } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t } = useLanguage();

  const [currentUser, setCurrentUser] = useState({
    id: 'usr_knowledge_admin',
    full_name: 'Vikramaditya Sengupta',
    email: 'knowledge.admin@nagarconnect.gov.in',
    role_name: 'KNOWLEDGE_ADMIN',
    department_id: 'DEPT_ADMIN',
    designation: 'Chief Knowledge Officer & RAG Lead',
    ward_number: 'Central Headquarters'
  });

  const [currentTab, setCurrentTab] = useState('rag-portal'); // Default to Member 5 Central RAG
  const [theme, setTheme] = useState('light');
  const [showFloatingRAG, setShowFloatingRAG] = useState(false);

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle rapid role switching for evaluation
  const handleSwitchRole = async (email, password = 'Citizen@123') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: email.includes('know') ? 'Know@123' : email.includes('admin') ? 'Admin@123' : email.includes('comm') ? 'Comm@123' : email.includes('field') ? 'Field@123' : email.includes('officer') ? 'Officer@123' : email.includes('super') ? 'Super@123' : 'Citizen@123' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('nagar_token', data.token);
        setCurrentUser(data.user);

        // Intelligently switch tab based on role
        if (data.user.role_name === 'CITIZEN') {
          setCurrentTab('citizen-portal');
        } else if (data.user.role_name === 'OFFICER') {
          setCurrentTab('officer-queue');
        } else if (data.user.role_name === 'FIELD_STAFF') {
          setCurrentTab('field-ops');
        } else {
          setCurrentTab('rag-portal');
        }
      } else {
        alert('Authentication switch failed: ' + data.message);
      }
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
      />

      {/* Main App Workspace */}
      <div className="main-content-area">
        <Navbar
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="page-body">
          {currentTab === 'rag-portal' && <KnowledgePortal currentUser={currentUser} />}
          {currentTab === 'citizen-portal' && <CitizenPortal currentUser={currentUser} />}
          {currentTab === 'officer-queue' && <OfficerPortal currentUser={currentUser} />}
          {currentTab === 'field-ops' && <FieldStaffPortal currentUser={currentUser} />}
          {currentTab === 'rag-playground' && <RAGPlayground currentUser={currentUser} />}
          {currentTab === 'municipal-notices' && <MunicipalNotices />}
        </main>
      </div>

      {/* Floating Universal RAG Assistant Launcher */}
      {currentTab !== 'rag-portal' && (
        <button
          className="rag-launcher-btn"
          onClick={() => setShowFloatingRAG(!showFloatingRAG)}
          title={t('askAssistant')}
        >
          <Bot size={20} />
          <span>{t('askAssistant')}</span>
        </button>
      )}

      {/* Floating RAG Modal Window */}
      {showFloatingRAG && (
        <div className="floating-rag-window">
          <RAGChatPanel
            currentUser={currentUser}
            isFloating={true}
            onClose={() => setShowFloatingRAG(false)}
          />
        </div>
      )}
    </div>
  );
}
