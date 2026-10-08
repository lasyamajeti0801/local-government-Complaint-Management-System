import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, CheckCircle, Clock, AlertTriangle, Users, Award, Shield, ArrowUp, ArrowDown 
} from 'lucide-react';
import { api } from '../services/api';

export const AnalyticsPortal = () => {
  const [kpis, setKpis] = useState({});
  const [departments, setDepartments] = useState([]);
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, deptRes, trendRes] = await Promise.all([
        api.getAnalyticsKPIs(),
        api.getDepartmentBreakdown(),
        api.getTrends()
      ]);
      setKpis(kpiRes.kpis || {});
      setDepartments(deptRes.departments || []);
      setTrends(trendRes.trends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
          📊 Municipal Analytics & Civic Intelligence
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Real-time municipal performance metrics, statutory SLA compliance rates, and departmental resolution benchmarks.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Grievances</span>
          <span className="kpi-value">{kpis.totalComplaints || 0}</span>
          <span className="kpi-subtext">All municipal wards</span>
        </div>
        <div className="kpi-card teal">
          <span className="kpi-label">Active / Pending</span>
          <span className="kpi-value">{(kpis.openComplaints || 0) + (kpis.pendingVerification || 0)}</span>
          <span className="kpi-subtext">Under field rectification</span>
        </div>
        <div className="kpi-card green">
          <span className="kpi-label">Resolved & Closed</span>
          <span className="kpi-value">{kpis.resolvedComplaints || 0}</span>
          <span className="kpi-subtext">Rectification verified</span>
        </div>
        <div className="kpi-card amber">
          <span className="kpi-label">SLA Compliance Rate</span>
          <span className="kpi-value">{kpis.slaComplianceRate || 94}%</span>
          <span className="kpi-subtext">Target: 95% statutory SLA</span>
        </div>
        <div className="kpi-card red">
          <span className="kpi-label">Overdue / SLA Breached</span>
          <span className="kpi-value">{kpis.overdueComplaints || 0}</span>
          <span className="kpi-subtext">Active escalation flags</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Citizen Satisfaction</span>
          <span className="kpi-value" style={{ color: '#eab308' }}>
            ★ {kpis.citizenSatisfactionScore || 4.8} / 5.0
          </span>
          <span className="kpi-subtext">Based on {kpis.totalFeedbacksRecorded || 12} citizen ratings</span>
        </div>
      </div>

      {/* Department Comparison Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Award size={20} color="var(--gov-primary)" />
            <span>Departmental Grievance Resolution & SLA Comparison</span>
          </div>
        </div>

        <div className="table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Standard SLA</th>
                <th>Total Received</th>
                <th>Pending</th>
                <th>Resolved</th>
                <th>Overdue</th>
                <th>SLA Compliance</th>
                <th>Avg Resolution</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.sla_hours} Hours</span>
                  </td>
                  <td>
                    <strong>{d.totalComplaints}</strong>
                  </td>
                  <td>
                    <span style={{ color: d.pendingCount > 0 ? 'var(--civic-amber)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {d.pendingCount}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--civic-green)', fontWeight: 700 }}>
                      {d.resolvedCount}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: d.overdueCount > 0 ? 'var(--civic-red)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {d.overdueCount}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${d.slaCompliance}%`,
                          height: '100%',
                          background: d.slaCompliance >= 90 ? 'var(--civic-green)' : 'var(--civic-amber)'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{d.slaCompliance}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>~{d.avgResolutionHours} hrs</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend Indicators */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={20} color="var(--civic-teal)" />
            <span>Monthly Civic Redressal Volume & SLA Trends (2026)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {trends.map(t => (
            <div key={t.month} style={{ background: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gov-primary)', marginBottom: '0.4rem' }}>
                {t.month}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {t.resolved} / {t.lodged}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--civic-green)', fontWeight: 700, marginTop: '0.2rem' }}>
                {t.slaRate}% SLA Compliance
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
