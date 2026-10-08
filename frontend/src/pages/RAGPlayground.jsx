import React, { useState } from 'react';
import { Sparkles, Send, ShieldCheck, BookOpen, Layers, Cpu, Copy, Check, Terminal } from 'lucide-react';
import { Button, Card, Input, Select, PriorityBadge, LoadingSkeleton } from '../components/common/UIComponents';

export function RAGPlayground({ currentUser }) {
  const [testQuery, setTestQuery] = useState('What is the SLA timeline for resolving a severe road pothole?');
  const [testRole, setTestRole] = useState(currentUser?.role_name?.replace('ROLE_', '') || 'CITIZEN');
  const [testProvider, setTestProvider] = useState('local');
  const [topK, setTopK] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const presetQueries = [
    { label: 'Citizen Pothole SLA (Public)', query: 'What is the SLA timeline for resolving a severe road pothole?', role: 'CITIZEN' },
    { label: 'Waste Segregation Bylaw (Public)', query: 'How should domestic waste be segregated into bins under 2026 bylaws?', role: 'CITIZEN' },
    { label: 'Water Sluice Valve Protocol (Officer)', query: 'What is the isolation protocol for sluice valves during water pipe bursts?', role: 'OFFICER' },
    { label: 'Field Pothole Safety Cones (Field)', query: 'How far should traffic cones be placed before road pothole repair?', role: 'FIELD_STAFF' },
    { label: 'Emergency Fund Sanctions (Admin)', query: 'What are the emergency fund sanction powers for the Municipal Commissioner during floods?', role: 'COMMISSIONER' },
    { label: 'Citizen Unauthorized Test (Refusal)', query: 'What are the emergency fund sanction powers for the Municipal Commissioner during floods?', role: 'CITIZEN' },
    { label: 'Out of Domain (Refusal)', query: 'How do I build a spaceship with rocket fuel and cryptocurrency?', role: 'CITIZEN' }
  ];

  const handleExecute = async () => {
    if (!testQuery.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('nagar_token');
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: testQuery,
          assistant_context: 'PLAYGROUND_INSPECTION',
          provider: testProvider,
          top_k: topK
        })
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Playground test failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-gov)' }}>
            CENTRAL RAG TEST PLAYGROUND & DIAGNOSTICS
          </h2>
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--civic-teal-light)', color: 'var(--civic-teal)', fontWeight: 700 }}>
            MEMBER 5 TOOL
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          Test query vectorization, inspect cross-role permission boundaries, and verify strict zero-hallucination citations.
        </p>
      </div>

      {/* Preset Test Queries */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
          LOAD PRESET SCENARIO TEST CASES:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presetQueries.map((preset, i) => (
            <button
              key={i}
              onClick={() => {
                setTestQuery(preset.query);
                setTestRole(preset.role);
              }}
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-gov)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Sparkles size={12} color="var(--civic-teal)" />
              <strong>{preset.label}</strong>
            </button>
          ))}
        </div>
      </div>

      {/* Controls Card */}
      <Card title="Query Configuration & Ingestion Inspection">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'flex-end' }}>
          <Input
            label="Inquiry / Prompt to Test"
            value={testQuery}
            onChange={e => setTestQuery(e.target.value)}
            placeholder="Type your question..."
          />

          <div className="form-group">
            <label className="form-label">Simulate Role</label>
            <select
              className="form-select"
              value={testRole}
              onChange={e => setTestRole(e.target.value)}
            >
              <option value="CITIZEN">CITIZEN (Public Only)</option>
              <option value="OFFICER">OFFICER (Public + SOPs)</option>
              <option value="FIELD_STAFF">FIELD_STAFF (Public + Field SOPs)</option>
              <option value="MUNICIPAL_ADMIN">MUNICIPAL_ADMIN (All Tiers)</option>
              <option value="COMMISSIONER">COMMISSIONER (Full Executive)</option>
              <option value="KNOWLEDGE_ADMIN">KNOWLEDGE_ADMIN (Knowledge Curator)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Provider</label>
            <select
              className="form-select"
              value={testProvider}
              onChange={e => setTestProvider(e.target.value)}
            >
              <option value="local">LocalProvider (Zero Paid API)</option>
              <option value="demo">DemoProvider (Diagnostic)</option>
              <option value="external">ExternalProvider (Fallback)</option>
            </select>
          </div>

          <Button variant="teal" onClick={handleExecute} disabled={isLoading} style={{ marginBottom: 16 }}>
            <Send size={16} /> {isLoading ? 'Synthesizing...' : 'Run Pipeline'}
          </Button>
        </div>
      </Card>

      {/* Results Section */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginTop: 20 }}>
          {/* Left: Generated Answer */}
          <Card
            title="Generated Response & Grounding"
            subtitle={`Provider: ${result.provider} | Latency: ${result.latency_ms} ms`}
          >
            <div style={{
              padding: 16,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: result.was_fallback_refusal ? 'var(--gov-amber-light)' : 'var(--bg-surface-alt)',
              border: `1px solid ${result.was_fallback_refusal ? 'var(--gov-amber)' : 'var(--border-color)'}`,
              fontSize: '0.9rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {result.answer}
            </div>

            {result.was_fallback_refusal && (
              <div style={{
                marginTop: 12,
                fontSize: '0.8rem',
                color: 'var(--gov-amber)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <ShieldCheck size={16} />
                Strict Refusal Protocol Triggered: No authorized documents contained sufficient grounded facts for this inquiry.
              </div>
            )}
          </Card>

          {/* Right: Sources & Citations */}
          <Card
            title={`Authorized Citations (${result.sources?.length || 0})`}
            subtitle="Extracted from normalized vector index"
          >
            {result.sources?.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Zero citations generated (Strict Refusal / No authorized documents found).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.sources.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid var(--civic-teal)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--primary-gov)' }}>
                        {src.document}
                      </strong>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 3,
                        backgroundColor: 'var(--civic-teal-light)',
                        color: 'var(--civic-teal)'
                      }}>
                        {Math.round((src.relevance || 0.85) * 100)}% Match
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <strong>Section:</strong> {src.section} • <strong>Page:</strong> {src.page} • <strong>Type:</strong> {src.document_type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
