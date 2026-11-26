import React from 'react';
import { useGrispella } from '../context/GrispellaContext';

export default function Audit() {
  const { state } = useGrispella();
  const { auditLogs = [] } = state;

  const sorted = [...auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const ACTION_COLORS = {
    SALE: '#27ae60', VOID_INVOICE: '#e74c3c', CREDIT_COLLECTED: '#3498db',
    RECEIPT_VALIDATED: '#8e44ad', STOCK_ADJUSTED: '#f39c12',
    SESSION_OPENED: '#1abc9c', SESSION_CLOSED: '#e67e22',
  };

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>🔍 Journal d'audit</h1>
        <div className="page-header-stats">
          <span className="stat-pill">{sorted.length} entrée(s)</span>
        </div>
      </div>

      <div className="grispella-card" style={{ padding: 0 }}>
        <table className="grispella-table">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Action</th>
              <th>Utilisateur</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Aucune entrée d'audit</td></tr>
            )}
            {sorted.map((log, i) => (
              <tr key={log.id || i}>
                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                    background: (ACTION_COLORS[log.action] || '#888') + '22',
                    color: ACTION_COLORS[log.action] || '#555',
                    border: `1px solid ${ACTION_COLORS[log.action] || '#888'}44`,
                  }}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>{log.userName || log.userId || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: '#555' }}>
                  {typeof log.details === 'object' ? (
                    <code style={{ fontSize: '0.75rem', background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>
                      {JSON.stringify(log.details)}
                    </code>
                  ) : log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
