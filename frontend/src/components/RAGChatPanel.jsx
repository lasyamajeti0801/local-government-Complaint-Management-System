import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, X, BookOpen, ShieldCheck, ChevronDown, ChevronUp, Sparkles, AlertCircle, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export const RAGChatPanel = ({ userRole = 'CITIZEN', department = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  // Suggested prompt starter chips based on active role
  const getPromptSuggestions = () => {
    switch (userRole) {
      case 'OFFICER':
        return [
          'What are the SOP steps for drinking water pipeline bursts?',
          'What is the rule on manual scavenging in manholes?',
          'What is the statutory SLA for deep dangerous potholes?'
        ];
      case 'FIELD_STAFF':
        return [
          'What PPE is mandatory for street light electrical maintenance?',
          'What are the traffic cone safety distances for road work?',
          'How should bio-hazardous waste be handled in sanitation?'
        ];
      case 'MUNICIPAL_ADMIN':
      case 'COMMISSIONER':
      case 'SUPER_ADMIN':
        return [
          'What are the financial sanction spending limits for Zonal Commissioner?',
          'What are the disciplinary penalties for chronic SLA default?',
          'What is the SLA compensation rate payable to citizens?'
        ];
      case 'CITIZEN':
      default:
        return [
          'What is the SLA resolution time for water pipeline burst?',
          'What are the spot fines for illegal construction debris dumping?',
          'How do I segregate domestic hazardous waste?'
        ];
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      // Initial welcome message based on persona
      const roleName = userRole.replace('_', ' ');
      setMessages([
        {
          sender: 'assistant',
          text: `Namaste! I am the **Nagar Connect Municipal Knowledge & RAG Assistant**. I can answer statutory questions, SOPs, SLA timelines, and civic bylaws directly from our official municipal knowledge base.`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [userRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryToSubmit) => {
    const text = (queryToSubmit || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.queryRAG(text, department);
      
      const assistantMessage = {
        sender: 'assistant',
        text: response.answer || 'I could not find this information in the authorized municipal knowledge base.',
        sources: response.sources || [],
        metadata: response.metadata || {},
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ Knowledge retrieval error: ${err.message}`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSourceExpand = (msgIdx, srcIdx) => {
    const key = `${msgIdx}_${srcIdx}`;
    setExpandedSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="rag-floating-trigger"
          onClick={() => setIsOpen(true)}
          title="Open Municipal RAG Knowledge Assistant"
        >
          <Bot size={20} />
          <span>Ask Nagar AI ({userRole})</span>
          <span style={{
            background: 'rgba(255,255,255,0.25)',
            padding: '0.1rem 0.4rem',
            borderRadius: '10px',
            fontSize: '0.7rem'
          }}>
            RAG 2026
          </span>
        </button>
      )}

      {/* Floating RAG Assistant Panel */}
      {isOpen && (
        <div className="rag-panel">
          {/* Header */}
          <div className="rag-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.1 }}>Nagar Knowledge AI</h4>
                <div style={{ fontSize: '0.7rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={12} /> Role: <strong>{userRole}</strong> (RBAC Active)
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => setMessages([])}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.2rem' }}
                title="Clear Chat"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Starter Suggestions */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto'
          }}>
            {getPromptSuggestions().map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Sparkles size={10} color="var(--gov-primary)" />
                {prompt.length > 36 ? `${prompt.substring(0, 36)}...` : prompt}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="rag-chat-messages">
            {messages.map((msg, mIdx) => (
              <div key={mIdx} className={`rag-message ${msg.sender}`}>
                <div className="rag-bubble">
                  {/* Markdown formatted text output */}
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                  {/* Citations Box */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="rag-citations-box">
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        marginBottom: '0.2rem'
                      }}>
                        <BookOpen size={12} color="var(--civic-teal)" />
                        VERIFIED MUNICIPAL CITATIONS ({msg.sources.length}):
                      </div>

                      {msg.sources.map((src, sIdx) => {
                        const isExpanded = expandedSources[`${mIdx}_${sIdx}`];
                        return (
                          <div key={sIdx} className="rag-citation-card">
                            <div
                              className="rag-citation-title"
                              onClick={() => toggleSourceExpand(mIdx, sIdx)}
                              style={{ cursor: 'pointer' }}
                            >
                              <span>
                                📄 {src.documentTitle} ({src.section || 'General'}, Pg {src.page})
                              </span>
                              <span style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                padding: '0.05rem 0.35rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}>
                                {src.relevanceScore}
                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </span>
                            </div>
                            {isExpanded && (
                              <div className="rag-citation-snippet">
                                "{src.snippet}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-subtle)',
                    marginTop: '0.35rem',
                    textAlign: 'right'
                  }}>
                    {msg.timestamp}
                    {msg.metadata?.executionTimeMs && ` • ${msg.metadata.executionTimeMs}ms`}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="rag-message assistant">
                <div className="rag-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid var(--gov-primary-border)',
                    borderTopColor: 'var(--gov-primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Searching 128-dim vector space & filtering RBAC permissions...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            className="rag-chat-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder={`Ask municipal knowledge (${userRole})...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              style={{ fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !inputValue.trim()}
              style={{ padding: '0.5rem 0.9rem' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
