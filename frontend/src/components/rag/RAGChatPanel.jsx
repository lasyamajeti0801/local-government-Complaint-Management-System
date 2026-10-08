import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, ExternalLink, X, Shield, AlertCircle, Check, Copy } from 'lucide-react';
import { Button } from '../common/UIComponents';
import { useLanguage } from '../../context/LanguageContext';

export function RAGChatPanel({ currentUser, isFloating = false, onClose }) {
  const { t, lang } = useLanguage();

  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: t('assistantWelcome'),
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const userRole = (currentUser?.role_name || currentUser?.role_id || 'CITIZEN').replace('ROLE_', '');

  // Update welcome message if language switches
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'msg_welcome') {
        return [{ ...prev[0], text: t('assistantWelcome') }];
      }
      return prev;
    });
  }, [lang]);

  // Persona title based on caller's role
  const getAssistantTitle = () => {
    switch (userRole) {
      case 'CITIZEN': return t('assistantCitizenTitle');
      case 'OFFICER': return t('assistantOfficerTitle');
      case 'FIELD_STAFF': return t('assistantFieldTitle');
      case 'KNOWLEDGE_ADMIN': return t('assistantKnowledgeTitle');
      case 'MUNICIPAL_ADMIN':
      case 'COMMISSIONER': return t('assistantAdminTitle');
      default: return t('askAssistant');
    }
  };

  // Sample prompt pills customized to role and language
  const samplePromptsEn = {
    CITIZEN: [
      'What is the SLA timeline for repairing a road pothole?',
      'How to segregate household waste under 2026 bylaws?',
      'What is the procedure if my complaint is not resolved in time?'
    ],
    OFFICER: [
      'What is the sluice valve isolation protocol during water pipe bursts?',
      'What are the CCMS lux standards for major arterial roads?',
      'What is the statutory SLA for restoring streetlight circuits?'
    ],
    FIELD_STAFF: [
      'How far should safety cones be placed before pothole repair?',
      'What are the mandatory PPE requirements for road patch work?',
      'What are the edge cutting specifications for cold-mix asphalt?'
    ],
    KNOWLEDGE_ADMIN: [
      'What are the emergency fund sanction powers for the Municipal Commissioner?',
      'Explain the compounding penalty structure for commercial littering',
      'What is the minimum residual chlorine standard post pipe repair?'
    ],
    MUNICIPAL_ADMIN: [
      'What are the emergency fund sanction powers for the Municipal Commissioner?',
      'What are the escalation review deadlines for unresolved grievances?',
      'What are the inter-agency coordination protocols during monsoon floods?'
    ]
  };

  const samplePromptsTe = {
    CITIZEN: [
      'రోడ్డు గుంతల మరమ్మతులకు SLA గడువు ఎంత?',
      '2026 నిబంధనల ప్రకారం ఇంటి వ్యర్థాలను ఎలా వేరు చేయాలి?',
      'సమస్య నిర్ణీత గడువులో పరిష్కారం కాకపోతే ఏమి చేయాలి?'
    ],
    OFFICER: [
      'పైపు పగిలినప్పుడు వాల్వ్ ఐసోలేషన్ ప్రోటోకాల్ ఏమిటి?',
      'ప్రధాన రహదారుల కోసం CCMS లక్స్ ప్రమాణాలు ఏమిటి?',
      'స్ట్రీట్‌లైట్ లైన్లు పునరుద్ధరించడానికి చట్టబద్ధమైన SLA ఎంత?'
    ],
    FIELD_STAFF: [
      'రోడ్డు పనులకు ముందు ట్రాఫిక్ కోన్‌లను ఎంత దూరంలో ఉంచాలి?',
      'రోడ్డు ప్యాచ్ వర్క్ కోసం తప్పనిసరి PPE అవసరాలు ఏమిటి?',
      'కోల్డ్-మిక్స్ తారు కోసం ఎడ్జ్ కటింగ్ నిబంధనలు ఏమిటి?'
    ],
    KNOWLEDGE_ADMIN: [
      'వరదల సమయంలో మునిసిపల్ కమిషనర్ అత్యవసర నిధుల అధికారాలు ఏమిటి?',
      'వాణిజ్య వ్యర్థాల బహిరంగ డంపింగ్‌పై జరిమానాల నిర్మాణం ఏమిటి?',
      'పైపు మరమ్మతు తర్వాత అవశేష క్లోరిన్ ప్రమాణం ఎంత ఉండాలి?'
    ],
    MUNICIPAL_ADMIN: [
      'మునిసిపల్ కమిషనర్ అత్యవసర నిధుల పరిమితులు ఏమిటి?',
      'పరిష్కారం కాని ఫిర్యాదుల ఎస్కలేషన్ గడువులు ఏమిటి?',
      'వరద అత్యవసర పరిస్థితుల్లో వివిధ విభాగాల సమన్వయ ప్రోటోకాల్స్ ఏమిటి?'
    ]
  };

  const promptSet = lang === 'te' ? samplePromptsTe : samplePromptsEn;
  const activePills = promptSet[userRole] || promptSet.CITIZEN;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText = inputQuery) => {
    const q = (queryText || '').trim();
    if (!q || isLoading) return;

    const userMessageId = `usr_${Date.now()}`;
    const newMsg = {
      id: userMessageId,
      sender: 'user',
      text: q
    };

    setMessages(prev => [...prev, newMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('nagar_token');
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: q,
          assistant_context: userRole,
          department_id: currentUser?.department_id || null,
          provider: 'local'
        })
      });

      const data = await response.json();

      let answerText = data.answer || t('refusalNotice');
      if (data.was_fallback_refusal) {
        answerText = t('refusalNotice');
      }

      setMessages(prev => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: answerText,
          sources: data.sources || [],
          refused: data.was_fallback_refusal,
          provider: data.provider,
          latency: data.latency_ms
        }
      ]);
    } catch (err) {
      console.error('RAG client query failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: t('refusalNotice'),
          sources: [],
          refused: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rag-panel">
      {/* Header */}
      <div className="rag-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--civic-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: 0.2 }}>
              {getAssistantTitle()}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE80' }} />
              {t('activeRole')}: {userRole} | Central RAG
            </div>
          </div>
        </div>
        {isFloating && onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Suggested Prompts Banner */}
      <div style={{ padding: '8px 14px', backgroundColor: 'var(--bg-surface-alt)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
          {t('suggestedInquiries')}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {activePills.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              style={{
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
                padding: '3px 8px',
                borderRadius: 12,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-gov)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message History */}
      <div className="rag-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`rag-message ${msg.sender}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>
                {msg.sender === 'user' ? (lang === 'te' ? 'మీరు' : 'YOU') : (lang === 'te' ? 'నగర్ కనెక్ట్ AI' : 'NAGAR CONNECT AI')}
              </span>
              {msg.sender === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  title="Copy answer"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {copiedId === msg.id ? <Check size={14} color="var(--gov-green)" /> : <Copy size={14} />}
                </button>
              )}
            </div>

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.875rem' }}>
              {msg.text}
            </div>

            {/* Citations Box */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="rag-citation-box">
                <div className="rag-citation-header">
                  <BookOpen size={14} />
                  <span>{t('citationsHeader')} ({msg.sources.length}):</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {msg.sources.map((src, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', background: 'var(--bg-surface-alt)', borderRadius: 3 }}>
                      <div>
                        <strong>{src.document}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {src.section} | {lang === 'te' ? 'పేజీ' : 'Page'} {src.page}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        backgroundColor: 'var(--civic-teal-light)',
                        color: 'var(--civic-teal)'
                      }}>
                        {Math.round((src.relevance || 0.85) * 100)}% Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {msg.latency && (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
                {lang === 'te' ? 'శోధన సమయం' : 'Retrieved in'} {msg.latency} ms via {msg.provider || 'LocalProvider'}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="rag-message assistant" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--civic-teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              {lang === 'te' ? 'నాలెడ్జ్ బేస్ శోధించబడుతోంది & సమాధానం సిద్ధం చేయబడుతోంది...' : 'Searching municipal knowledge base & synthesizing verified citations...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            type="text"
            className="form-input"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder={`${getAssistantTitle()}...`}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <Button type="submit" variant="teal" disabled={isLoading || !inputQuery.trim()}>
            <Send size={16} />
          </Button>
        </form>
        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
          {t('groundedNote')}
        </div>
      </div>
    </div>
  );
}
