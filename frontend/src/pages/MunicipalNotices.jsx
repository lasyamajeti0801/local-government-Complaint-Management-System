import React, { useState, useEffect } from 'react';
import { Bell, FileText, AlertTriangle, Calendar, Building2, CheckCircle } from 'lucide-react';
import { Card, LoadingSkeleton, EmptyState } from '../components/common/UIComponents';

export function MunicipalNotices() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-gov)' }}>
          OFFICIAL MUNICIPAL NOTICES & PUBLIC GAZETTES
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
          Statutory circulars, civic directives, and monsoon contingency advisories issued by Municipal Administration.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No active public notices"
          message="All recent gazettes and circulars are up to date."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notices.map(notice => (
            <Card key={notice.id} style={{ borderLeft: '4px solid var(--primary-gov)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: notice.priority === 'HIGH' ? 'var(--gov-red-light)' : 'var(--primary-gov-light)',
                    color: notice.priority === 'HIGH' ? 'var(--gov-red)' : 'var(--primary-gov)'
                  }}>
                    {notice.priority} PRIORITY
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {notice.department_name || 'General Municipal Administration'}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} />
                  {new Date(notice.published_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '10px 0 6px' }}>
                {notice.title}
              </h4>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {notice.content}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
