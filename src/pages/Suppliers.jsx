import React from 'react';
import { useGrispella } from '../context/GrispellaContext';

export default function Suppliers() {
  const { state, formatFDJ } = useGrispella();
  const { suppliers = [], receipts = [] } = state;

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>🏢 Fournisseurs</h1>
        <div className="page-header-stats">
          <span className="stat-pill">Total: <strong>{suppliers.length}</strong></span>
        </div>
      </div>

      <div className="grispella-card" style={{ padding: 0 }}>
        <table className="grispella-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Adresse</th>
              <th>NIF</th>
              <th>Nbre réceptions</th>
              <th>Total acheté</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Aucun fournisseur</td></tr>
            )}
            {suppliers.map(s => {
              const supplierReceipts = receipts.filter(r => r.supplierId === s.id && r.status === 'VALIDÉ');
              const totalPurchased = supplierReceipts.reduce((sum, r) => sum + (r.totalCost || 0), 0);
              return (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.contact || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.address || '—'}</td>
                  <td><code>{s.nif || '—'}</code></td>
                  <td>{supplierReceipts.length}</td>
                  <td><strong>{formatFDJ(totalPurchased)}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
