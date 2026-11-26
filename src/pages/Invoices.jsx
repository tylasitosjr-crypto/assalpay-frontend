import React, { useState, useRef } from 'react';
import { useGrispella } from '../context/GrispellaContext';

const STATUS_COLORS = {
  'PAYÉ': '#27ae60',
  'PARTIEL': '#f39c12',
  'NON PAYÉ': '#e74c3c',
  'ANNULÉ': '#95a5a6',
};

export default function Invoices() {
  const { state, dispatch, formatFDJ } = useGrispella();
  const { invoices = [], customers = [], currentUser } = state || {};
  const printRef = useRef();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selected, setSelected] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  const filteredInvoices = invoices
    .filter(inv => {
      const customer = customers.find(c => c.id === inv.customerId);
      const name = customer?.name || '';
      const matchSearch = inv.id.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || inv.status === filterStatus;
      const matchDate = !filterDate || inv.date.startsWith(filterDate);
      return matchSearch && matchStatus && matchDate;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleVoid = (inv) => {
    if (!window.confirm(`Annuler la facture ${inv.id} ? Cette action est irréversible.`)) return;
    dispatch({ type: 'VOID_INVOICE', payload: { invoiceId: inv.id, userId: currentUser.id } });
    setSelected(null);
  };

  const totalAmount = filteredInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = filteredInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalCredit = filteredInvoices.reduce((s, i) => s + ((i.total || 0) - (i.paidAmount || 0)), 0);

  return (
    <div className="grispella-page">
      <div className="page-header">
        <h1>📋 Factures</h1>
        <div className="page-header-stats">
          <span className="stat-pill">Total: <strong>{formatFDJ(totalAmount)}</strong></span>
          <span className="stat-pill green">Encaissé: <strong>{formatFDJ(totalPaid)}</strong></span>
          <span className="stat-pill red">Crédit: <strong>{formatFDJ(totalCredit)}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="grispella-card filters-row">
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Rechercher par N° facture ou client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 2 }}
        />
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="PAYÉ">PAYÉ</option>
          <option value="PARTIEL">PARTIEL</option>
          <option value="NON PAYÉ">NON PAYÉ</option>
          <option value="ANNULÉ">ANNULÉ</option>
        </select>
        <input
          type="month"
          className="form-input"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterStatus(''); setFilterDate(''); }}>
          Réinitialiser
        </button>
      </div>

      {/* Table */}
      <div className="grispella-card" style={{ padding: 0 }}>
        <table className="grispella-table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Date</th>
              <th>Client</th>
              <th>Dépôt</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Payé</th>
              <th>Reste</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Aucune facture trouvée</td></tr>
            )}
            {filteredInvoices.map(inv => {
              const customer = customers.find(c => c.id === inv.customerId);
              const reste = (inv.total || 0) - (inv.paidAmount || 0);
              return (
                <tr key={inv.id} className={selected?.id === inv.id ? 'row-selected' : ''} onClick={() => setSelected(inv)}>
                  <td><code style={{ fontSize: '0.8rem' }}>{inv.id}</code></td>
                  <td>{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                  <td>{customer?.name || '—'}</td>
                  <td><span className="badge-depot">{inv.depotId}</span></td>
                  <td>{inv.items?.length || 0} art.</td>
                  <td><strong>{formatFDJ(inv.total)}</strong></td>
                  <td style={{ color: '#27ae60' }}>{formatFDJ(inv.paidAmount || 0)}</td>
                  <td style={{ color: reste > 0 ? '#e74c3c' : '#27ae60' }}>{formatFDJ(reste)}</td>
                  <td>
                    <span className="status-tag" style={{ background: STATUS_COLORS[inv.status] || '#ccc', color: '#fff' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setSelected(inv); setShowPrint(true); }}>🖨️</button>
                      {inv.status !== 'ANNULÉ' && (currentUser.role === 'admin' || currentUser.role === 'caisse') && (
                        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleVoid(inv); }}>✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selected && !showPrint && (
        <div className="detail-modal-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>Facture {selected.id}</h2>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="detail-section">
              <div className="detail-grid">
                <div><label>Client</label><p>{customers.find(c => c.id === selected.customerId)?.name}</p></div>
                <div><label>Date</label><p>{new Date(selected.date).toLocaleDateString('fr-FR')}</p></div>
                <div><label>Dépôt</label><p>{selected.depotId}</p></div>
                <div><label>Statut</label>
                  <p><span className="status-tag" style={{ background: STATUS_COLORS[selected.status], color: '#fff' }}>{selected.status}</span></p>
                </div>
              </div>
            </div>
            <table className="grispella-table" style={{ marginTop: 12 }}>
              <thead>
                <tr><th>Produit</th><th>Unité</th><th>Qté</th><th>P.U.</th><th>Total</th></tr>
              </thead>
              <tbody>
                {(selected.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.productName}</td>
                    <td>{item.unit}</td>
                    <td>{item.quantity}</td>
                    <td>{formatFDJ(item.unitPrice)}</td>
                    <td>{formatFDJ(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="detail-totals">
              <div className="total-row"><span>Sous-total</span><span>{formatFDJ(selected.total)}</span></div>
              {selected.discount > 0 && <div className="total-row"><span>Remise</span><span>-{formatFDJ(selected.discount)}</span></div>}
              <div className="total-row total-final"><span>Total</span><span>{formatFDJ(selected.total)}</span></div>
              <div className="total-row"><span>Payé</span><span style={{ color: '#27ae60' }}>{formatFDJ(selected.paidAmount || 0)}</span></div>
              <div className="total-row"><span>Reste à payer</span><span style={{ color: '#e74c3c' }}>{formatFDJ((selected.total || 0) - (selected.paidAmount || 0))}</span></div>
            </div>
            {selected.payments && selected.payments.length > 0 && (
              <div className="detail-section">
                <h4>Règlements</h4>
                {selected.payments.map((p, i) => (
                  <div key={i} className="payment-line">{p.method}: {formatFDJ(p.amount)}</div>
                ))}
              </div>
            )}
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => setShowPrint(true)}>🖨️ Imprimer</button>
              {selected.status !== 'ANNULÉ' && (currentUser.role === 'admin' || currentUser.role === 'caisse') && (
                <button className="btn btn-danger" onClick={() => handleVoid(selected)}>Annuler la facture</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrint && selected && (
        <div className="print-modal-overlay">
          <div className="print-modal-content">
            <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimer</button>
              <button className="btn btn-secondary" onClick={() => setShowPrint(false)}>Fermer</button>
            </div>
            <div className="printable-a4-invoice" ref={printRef}>
              <div className="invoice-header">
                <div className="company-info">
                  <h2>GRISPELLA GENERAL TRADING SARL</h2>
                  <p>Djibouti | Tél: +253 77 00 00 00</p>
                </div>
                <div className="invoice-meta">
                  <h3>FACTURE</h3>
                  <p>N° {selected.id}</p>
                  <p>Date: {new Date(selected.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="invoice-parties">
                <div>
                  <strong>Vendeur:</strong>
                  <p>GRISPELLA GENERAL TRADING SARL</p>
                  <p>Djibouti</p>
                </div>
                <div>
                  <strong>Client:</strong>
                  <p>{customers.find(c => c.id === selected.customerId)?.name}</p>
                  <p>{customers.find(c => c.id === selected.customerId)?.phone}</p>
                </div>
              </div>
              <table className="invoice-table">
                <thead>
                  <tr><th>Désignation</th><th>Unité</th><th>Qté</th><th>Prix Unit.</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {(selected.items || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.productName}</td>
                      <td>{item.unit}</td>
                      <td>{item.quantity}</td>
                      <td>{formatFDJ(item.unitPrice)}</td>
                      <td>{formatFDJ(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4}><strong>TOTAL</strong></td><td><strong>{formatFDJ(selected.total)}</strong></td></tr>
                  <tr><td colSpan={4}>Montant payé</td><td style={{ color: 'green' }}>{formatFDJ(selected.paidAmount || 0)}</td></tr>
                  <tr><td colSpan={4}>Reste à payer</td><td style={{ color: 'red' }}>{formatFDJ((selected.total || 0) - (selected.paidAmount || 0))}</td></tr>
                </tfoot>
              </table>
              <div className="invoice-signatures">
                <div className="sig-block"><p>Signature vendeur</p><div className="sig-line"></div></div>
                <div className="sig-block"><p>Signature client</p><div className="sig-line"></div></div>
              </div>
              <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: '#666' }}>
                Statut: <strong>{selected.status}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
